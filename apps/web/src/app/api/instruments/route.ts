import { NextResponse } from "next/server";
import { getAllInstruments } from "@borsaty/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = searchParams.get("market") || undefined;
  const assetClass = searchParams.get("assetClass") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const instruments = await getAllInstruments({ market, assetClass, limit });

  return NextResponse.json({
    total: instruments.length,
    instruments: instruments.map((inst) => ({
      symbol: inst.symbol,
      providerSymbol: inst.providerSymbol,
      nameAr: inst.nameAr,
      nameEn: inst.nameEn,
      market: inst.market,
      assetClass: inst.assetClass,
      currency: inst.currency,
      currentPrice: inst.currentPrice,
      historyStartDate: inst.historyStartDate || "2024-11-01T00:00:00.000Z",
      isActive: inst.isActive,
    })),
  });
}
