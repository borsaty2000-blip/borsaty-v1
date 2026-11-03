import { NextResponse } from "next/server";
import { findCompany, redis } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol") || "COMI";

  const aliasMatch = resolveStockAlias(symbol);
  const lookupSymbol = aliasMatch ? aliasMatch.symbol : symbol;

  const company = await findCompany(lookupSymbol);
  if (!company) {
    return NextResponse.json(
      { success: false, error: "Symbol not found" },
      { status: 404 }
    );
  }

  const cacheKey = `quote:${lookupSymbol.toUpperCase()}`;
  let livePrice = company.currentPrice;
  let liveChange = company.change;
  let liveChangePct = company.changePct;
  let quoteSource = "db";
  let freshness: "LIVE" | "TODAY_CLOSE" | "DELAYED" = "TODAY_CLOSE";
  let priceTimestamp = new Date().toISOString();
  let isUnderMaintenance = false;

  // 1. Try Redis cache for quote
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      livePrice = parsed.price;
      liveChange = parsed.change;
      liveChangePct = parsed.changePct;
      quoteSource = parsed.source || "cache";
      freshness = parsed.freshness || "TODAY_CLOSE";
      priceTimestamp = parsed.priceTimestamp || priceTimestamp;
      isUnderMaintenance = Boolean(parsed.isUnderMaintenance);
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

  return NextResponse.json({
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
    high52w: company.high52w,
    low52w: company.low52w,
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
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
