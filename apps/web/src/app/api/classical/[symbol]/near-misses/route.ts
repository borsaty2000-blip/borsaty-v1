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
  const minDegree = Math.max(0, Math.min(3, parseInt(searchParams.get("min_degree") || "1", 10)));

  const sym = symbol.toUpperCase();
  const cacheKey = `classical:near-misses:${sym}:${timeframe}:${minDegree}`;

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
    // Redis offline
  }

  const candles = await getStockCandles(sym);
  if (!candles || candles.length === 0) {
    return NextResponse.json({ error: `No price data found for ${sym}` }, { status: 404 });
  }

  const analysisUrl = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
  let result: any = null;

  try {
    const res = await fetch(`${analysisUrl}/classical/detect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: sym,
        timeframe,
        min_degree: minDegree,
        candles,
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      result = await res.json();
    }
  } catch {
    // Analysis service offline
  }

  const nearMisses = result?.near_misses || [];
  const responseData = {
    symbol: sym,
    timeframe,
    version: "1.0.0",
    computed_at: new Date().toISOString(),
    near_misses_count: nearMisses.length,
    near_misses: nearMisses,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(responseData), { ex: 1800 });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    ...responseData,
    cache: "miss",
    execution_ms: Date.now() - startTime,
  });
}
