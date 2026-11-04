import { NextResponse } from "next/server";
import { findCompany, redis } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";
import { getPythonServiceUrl } from "@/lib/config";

function get52WeekRange(price: number, high: unknown, low: unknown) {
  if (
    typeof high !== "number" ||
    typeof low !== "number" ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    high <= 0 ||
    low <= 0 ||
    low > high ||
    price > high * 1.05 ||
    price < low * 0.95
  ) {
    return null;
  }
  return { high52w: high, low52w: low };
}

async function getQuote(symbol: string) {
  const aliasMatch = resolveStockAlias(symbol);
  const lookupSymbol = aliasMatch ? aliasMatch.symbol : symbol;

  const company = await findCompany(lookupSymbol);
  if (!company) {
    return null;
  }

  const cacheKey = `quote:${lookupSymbol.toUpperCase()}`;
  let livePrice = company.currentPrice;
  let liveChange = company.change;
  let liveChangePct = company.changePct;
  let high52w: number | null = company.high52w;
  let low52w: number | null = company.low52w;
  let quoteSource = "db";
  let freshness: "LIVE" | "TODAY_CLOSE" | "DELAYED" = "TODAY_CLOSE";
  let priceTimestamp = new Date().toISOString();
  let isUnderMaintenance = false;

  // 1. Try Redis cache for quote
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      const cachedRange = get52WeekRange(parsed.price, parsed.high52w, parsed.low52w);
      if (cachedRange || parsed.rangeAvailable === false) {
        livePrice = parsed.price;
        liveChange = parsed.change;
        liveChangePct = parsed.changePct;
        high52w = cachedRange?.high52w ?? null;
        low52w = cachedRange?.low52w ?? null;
        quoteSource = parsed.source || "cache";
        freshness = parsed.freshness || "TODAY_CLOSE";
        priceTimestamp = parsed.priceTimestamp || priceTimestamp;
        isUnderMaintenance = Boolean(parsed.isUnderMaintenance);
      }
    }
  } catch {
    // Redis offline
  }

  // 2. Fetch live quote if not from cache
  if (quoteSource === "db") {
    try {
      const analysisUrl = getPythonServiceUrl();
      const res = await fetch(`${analysisUrl}/quote/${lookupSymbol}?market=${company.market}`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const qData = await res.json();
        if (typeof qData.price === "number" && qData.price > 0) {
          livePrice = qData.price;
          liveChange = typeof qData.change === "number" ? qData.change : liveChange;
          liveChangePct = typeof qData.change_pct === "number" ? qData.change_pct : liveChangePct;
          const providerRange = get52WeekRange(
            livePrice,
            qData.high_52w,
            qData.low_52w
          );
          high52w = providerRange?.high52w ?? null;
          low52w = providerRange?.low52w ?? null;
          quoteSource = qData.source || "live";
          freshness = (qData.freshness as "LIVE" | "TODAY_CLOSE" | "DELAYED") || "TODAY_CLOSE";
          priceTimestamp = qData.price_timestamp || priceTimestamp;
          isUnderMaintenance = Boolean(qData.is_under_maintenance);

          // Save to Redis (5 min TTL)
          await redis.set(
            cacheKey,
            JSON.stringify({
              price: livePrice,
              change: liveChange,
              changePct: liveChangePct,
              high52w,
              low52w,
              rangeAvailable: providerRange !== null,
              source: quoteSource,
              freshness,
              priceTimestamp,
              isUnderMaintenance,
            }),
            { ex: 300 }
          );
        }
      }
    } catch {
      // Live fetch timeout/offline: continue with fallback
    }
  }

  const hasOrderBook = company.market === "TASI";

  return {
    symbol: company.symbol,
    nameAr: company.nameAr,
    nameEn: company.nameEn,
    market: company.market,
    currency: company.currency,
    price: livePrice,
    change: liveChange,
    changePct: liveChangePct,
    freshness,
    priceTimestamp,
    isUnderMaintenance,
    high52w,
    low52w,
    marketCap: company.marketCap,
    peRatio: company.peRatio,
    pbRatio: company.pbRatio,
    dividendYield: company.dividendYield,
    timestamp: new Date().toISOString(),
    source: quoteSource,
    dataQuality: {
      provider: "Live Data Feed (TradingView / yfinance / EODHD)",
      isRealtime: freshness === "LIVE",
      isDelayed: freshness === "DELAYED",
      delayMinutes: freshness === "DELAYED" ? 15 : 0,
      hasOrderBook: hasOrderBook,
      orderBookProxyUsed: !hasOrderBook,
      warnings: isUnderMaintenance ? ["Price deviation audit active"] : [],
      missingFields: !hasOrderBook ? ["Bid/Ask Depth L2"] : [],
      verifiedAt: priceTimestamp,
    },
  };
}

const quoteCacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (symbolsParam !== null) {
    const symbols = symbolsParam.split(",").map((symbol) => symbol.trim()).filter(Boolean);
    if (symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one symbol is required" },
        { status: 400 }
      );
    }

    const quotes = await Promise.all(symbols.map(getQuote));
    if (quotes.some((quote) => quote === null)) {
      return NextResponse.json(
        { success: false, error: "Symbol not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quotes, { headers: quoteCacheHeaders });
  }

  const quote = await getQuote(searchParams.get("symbol") || "COMI");
  if (!quote) {
    return NextResponse.json(
      { success: false, error: "Symbol not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(quote, {
    headers: quoteCacheHeaders,
  });
}
