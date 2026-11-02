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
  const language = (searchParams.get("language") || "ar").toLowerCase();
  const warmupBars = parseInt(searchParams.get("warmup_bars") || "250", 10);
  const includeWF = searchParams.get("walk_forward") !== "false";

  const sym = symbol.toUpperCase();
  const cacheKey = `backtest:${sym}:${timeframe}:${warmupBars}`;

  // 1. Redis cache check (backtest is expensive — 1h TTL)
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
    return NextResponse.json(
      { error: `No price data found for ${sym}` },
      { status: 404 }
    );
  }

  // 3. Call Python backtest service
  const analysisUrl = process.env.ANALYSIS_ENGINE_URL || "http://localhost:8000";
  let backtestResult: unknown = null;

  try {
    const res = await fetch(`${analysisUrl}/backtest/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: sym,
        timeframe,
        candles,
        warmup_bars: warmupBars,
        language,
        include_walk_forward: includeWF,
        fast_mode: true,
      }),
      signal: AbortSignal.timeout(60_000), // backtest can take up to 60s
    });

    if (res.ok) {
      backtestResult = await res.json();
    } else {
      const errBody = await res.text();
      return NextResponse.json(
        { error: "Analysis engine error", detail: errBody },
        { status: res.status }
      );
    }
  } catch (err) {
    return NextResponse.json(
      {
        error: "Analysis engine offline or timeout",
        detail: String(err),
        symbol: sym,
        timeframe,
        data_quality: {
          status: "unavailable",
          message_ar: "محرك التحليل غير متاح حالياً",
          message_en: "Analysis engine unavailable",
        },
      },
      { status: 503 }
    );
  }

  // 4. Cache for 1 hour (backtests are expensive)
  try {
    await redis.set(cacheKey, JSON.stringify(backtestResult), { ex: 3600 });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    ...(backtestResult as Record<string, unknown>),
    cache: "miss",
    execution_ms: Date.now() - startTime,
  });
}
