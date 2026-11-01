import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";

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

  const isDelayed = company.market === "EGX";
  const delayMinutes = isDelayed ? 15 : 0;
  const hasOrderBook = company.market === "TASI";

  return NextResponse.json({
    symbol: company.symbol,
    nameAr: company.nameAr,
    nameEn: company.nameEn,
    market: company.market,
    currency: company.currency,
    price: company.currentPrice,
    change: company.change,
    changePct: company.changePct,
    high52w: company.high52w,
    low52w: company.low52w,
    marketCap: company.marketCap,
    peRatio: company.peRatio,
    pbRatio: company.pbRatio,
    dividendYield: company.dividendYield,
    timestamp: new Date().toISOString(),
    dataQuality: {
      provider: company.market === "TASI" ? "SAHMK" : "Younit/EGX_NEWS",
      isRealtime: !isDelayed,
      isDelayed: isDelayed,
      delayMinutes: delayMinutes,
      hasOrderBook: hasOrderBook,
      orderBookProxyUsed: !hasOrderBook,
      warnings: isDelayed
        ? ["أسعار متأخرة 15 دقيقة وفق لوائح البورصة المصرية — غير صالحة للتداول الخاطف اللحظي"]
        : [],
      missingFields: !hasOrderBook ? ["Bid/Ask Depth L2"] : [],
      verifiedAt: new Date().toISOString(),
    },
  });
}
