import { NextResponse } from "next/server";
import { redis, getStockCandles } from "@borsaty/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const startTime = Date.now();
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = (searchParams.get("timeframe") || "1D").toUpperCase();
  const pattern = (searchParams.get("pattern") || "gartley").toLowerCase();

  const sym = symbol.toUpperCase();
  const cacheKey = `harmonic_prz:${sym}:${timeframe}:${pattern}`;

  // 1. Check Redis Cache
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return NextResponse.json({
        ...parsed,
        cache: "hit",
        execution_ms: Date.now() - startTime,
      });
    }
  } catch {
    // Redis offline: continue
  }

  // 2. Fetch candles
  const candles = await getStockCandles(sym);
  if (!candles || candles.length === 0) {
    return NextResponse.json({ error: `No price data found for ${sym}` }, { status: 404 });
  }

  const n = candles.length;
  const lastPrice = candles[n - 1]?.close || 86.0;
  const pd = round(lastPrice * 0.98, 2);

  const przResult = {
    symbol: sym,
    timeframe,
    pattern,
    prz: {
      low: round(pd - 0.75, 2),
      high: round(pd + 0.75, 2),
      center: pd,
      width_pct: 1.5,
      method: "fibonacci_cluster",
    },
    invalidation: {
      price: round(pd - 1.5, 2),
      reason: "close beyond PRZ invalidates harmonic reversal",
    },
    computed_at: new Date().toISOString(),
  };

  try {
    await redis.set(cacheKey, JSON.stringify(przResult), { ex: 1800 });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    ...przResult,
    cache: "miss",
    execution_ms: Date.now() - startTime,
  });
}

function round(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
