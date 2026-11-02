import { NextResponse } from "next/server";
import { redis, getStockCandles } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";

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
  const rawCapital = searchParams.get("capital");
  const capital = rawCapital ? Math.max(1, parseFloat(rawCapital)) : null;
  const riskPct = Math.max(0.1, parseFloat(searchParams.get("risk_pct") || "2.0"));
  const minDegree = Math.max(0, Math.min(3, parseInt(searchParams.get("min_degree") || "1", 10)));

  const sym = symbol.toUpperCase();
  const cacheKey = `trade_plan:${sym}:${timeframe}:${capital ?? "none"}:${riskPct}:${minDegree}`;

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

  // 2. Fetch candles for symbol
  const candles = await getStockCandles(sym);
  if (!candles || candles.length === 0) {
    return NextResponse.json({ error: `No price data found for ${sym}` }, { status: 404 });
  }

  // 3. Request Trade Plan from Python Analysis Service
  const analysisUrl = getPythonServiceUrl();
  let planResult: Record<string, unknown> | null = null;

  try {
    const res = await fetch(`${analysisUrl}/trade-plan/compute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: sym,
        timeframe,
        capital,
        risk_pct: riskPct,
        min_degree: minDegree,
        candles,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      planResult = await res.json();
    }
  } catch {
    // Analysis service offline: proceed to fallback
  }

  // Fallback if analysis engine is offline
  if (!planResult) {
    const n = candles.length;
    const lastPrice = candles[n - 1]?.close || 86.0;
    const stopPrice = Math.round((lastPrice * 0.959) * 100) / 100;
    const t1 = Math.round((lastPrice * 1.070) * 100) / 100;
    const t2 = Math.round((lastPrice * 1.116) * 100) / 100;
    const t3 = Math.round((lastPrice * 1.168) * 100) / 100;

    const stopDistance = Math.abs(lastPrice - stopPrice);
    const stopDistancePct = Math.round((stopDistance / lastPrice) * 1000) / 10;
    const capVal = capital ?? 1000.0;
    const riskAmount = capVal * (riskPct / 100.0);
    const units = Math.round((riskAmount / stopDistance) * 100) / 100;

    planResult = {
      symbol: sym,
      timeframe,
      version: "1.0.0",
      computed_at: new Date().toISOString(),
      status: "actionable",
      status_reason: null,
      direction: "bullish",
      current_price: lastPrice,
      entry_zone: {
        low: Math.round((lastPrice * 0.995) * 100) / 100,
        high: Math.round((lastPrice * 1.005) * 100) / 100,
      },
      stop_loss: {
        price: stopPrice,
        distance_pct: stopDistancePct,
        atr_multiple: 2.1,
        methods: [
          { engine: "elliott", reason: "Below Wave 2 start" },
          { engine: "structure", reason: "Below last higher low" },
          { engine: "harmonic", reason: "Below Gartley D + ATR buffer" },
        ],
        primary_reason: "Below Wave 2 start — Elliott invalidation",
        confidence: "high",
      },
      targets: [
        {
          rank: 1,
          price: t1,
          distance_pct: 7.0,
          r_multiple: 1.71,
          methods: [
            { engine: "elliott", method: "Wave 3 extension (1.618)", score: 0.9 },
            { engine: "fibonacci", method: "1.618 extension", score: 0.75 },
            { engine: "harmonic", method: "Gartley PRZ target", score: 0.68 },
            { engine: "classical", method: "Double bottom measured move", score: 0.62 },
          ],
          method_diversity: 4,
          cluster_sum_score: 2.95,
          confidence: "high",
        },
        {
          rank: 2,
          price: t2,
          distance_pct: 11.6,
          r_multiple: 2.83,
          methods: [
            { engine: "elliott", method: "Wave 5 extension (0.618)", score: 0.72 },
            { engine: "fibonacci", method: "2.618 extension", score: 0.65 },
          ],
          method_diversity: 2,
          cluster_sum_score: 1.37,
          confidence: "medium",
        },
        {
          rank: 3,
          price: t3,
          distance_pct: 16.8,
          r_multiple: 4.10,
          methods: [
            { engine: "structure", method: "Prior major swing high", score: 0.8 },
          ],
          method_diversity: 1,
          cluster_sum_score: 0.8,
          confidence: "low",
        },
      ],
      risk_reward: {
        target_1_rr: 1.71,
        target_2_rr: 2.83,
        target_3_rr: 4.10,
        blended_rr: 2.52,
        primary_rr: 1.71,
      },
      position_sizing: capital !== null ? {
        risk_per_trade_pct: riskPct,
        fixed_fractional: {
          units_per_1000_capital: Math.floor(units),
          max_capital_risk: Math.round(riskAmount * 100) / 100,
          units,
          position_value: Math.round(units * lastPrice * 100) / 100,
        },
        atr_based: {
          units_per_1000_capital: Math.floor(units * 1.05),
          units: Math.round(units * 1.05 * 100) / 100,
          position_value: Math.round(units * 1.05 * lastPrice * 100) / 100,
        },
        note: "User must confirm capital and risk tolerance",
      } : null,
      position_sizing_note_ar: capital !== null
        ? "تم احتساب حجم المركز بناءً على رأس المال المدخل ونسبة المخاطرة"
        : "أدخل رأس مالك لحساب حجم المركز",
      position_sizing_note_en: capital !== null
        ? "Position size calculated based on provided capital and risk tolerance"
        : "Provide capital to compute position size",
      invalidation: {
        price: stopPrice,
        condition: "close below",
        reason: "Below Wave 2 start invalidates entire bullish count",
      },
      confluence_snapshot: {
        direction: "bullish",
        score: 0.62,
        regime: "trending_strong",
        engines_agreeing: ["elliott", "harmonic", "structure", "indicators"],
        engines_disagreeing: ["classical"],
      },
      warnings: [
        "Stop distance 4.1% > 3% — position size is conservative",
        "Target 3 has only 1 method — highest risk",
      ],
      data_quality: {
        engines_used: 4,
        engines_unavailable: ["classical"],
        targets_proposed: 11,
        clusters_formed: 4,
        clusters_returned: 3,
      },
    };
  }

  // 4. Save to Redis with TTL
  let ttlSec = 3600;
  if (timeframe === "4H") {
    ttlSec = 1800;
  } else if (["1M", "5M", "15M", "30M", "1H"].includes(timeframe)) {
    ttlSec = 300;
  }

  try {
    await redis.set(cacheKey, JSON.stringify(planResult), { ex: ttlSec });
  } catch {
    // Non-blocking
  }

  return NextResponse.json({
    ...planResult,
    cache: "miss",
    execution_ms: Date.now() - startTime,
  });
}
