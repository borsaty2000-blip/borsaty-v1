import { NextResponse } from "next/server";
import { findInstrument } from "@borsaty/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const inst = await findInstrument(symbol);
  if (!inst) {
    return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
  }

  const historyStart = inst.historyStartDate || "2024-11-01T00:00:00.000Z";
  const historyAgeDays = Math.floor(
    (Date.now() - new Date(historyStart).getTime()) / (1000 * 60 * 60 * 24)
  );
  const hasLessThanOneYearHistory = historyAgeDays < 365;

  const dataQuality = {
    provider: inst.dataSources.primary,
    fallbackProvider: inst.dataSources.fallback,
    isRealtime: inst.market === "TASI" || inst.market === "US",
    isDelayed: inst.market === "EGX",
    delayMinutes: inst.market === "EGX" ? 15 : 0,
    historyStartDate: historyStart,
    historyAgeDays,
    hasLessThanOneYearHistory,
    warnings: [
      ...(inst.market === "EGX"
        ? ["أسعار متأخرة 15 دقيقة وفق لوائح البورصة المصرية"]
        : []),
      ...(hasLessThanOneYearHistory
        ? [`تاريخ التداول أقل من سنة واحدة (${historyAgeDays} يوماً) — تحليلات الفواصل الزمنية الطويلة قد تكون محدودة`]
        : []),
    ],
    verifiedAt: new Date().toISOString(),
  };

  return NextResponse.json({
    symbol: inst.symbol,
    providerSymbol: inst.providerSymbol,
    nameAr: inst.nameAr,
    nameEn: inst.nameEn,
    aliases: inst.aliases,
    market: inst.market,
    assetClass: inst.assetClass,
    currency: inst.currency,
    sector: inst.sector,
    industry: inst.industry,
    currentPrice: inst.currentPrice,
    historyStartDate: historyStart,
    isActive: inst.isActive,
    dataQuality,
  });
}
