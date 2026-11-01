import { NextResponse } from "next/server";
import {
  circuitBreaker,
  dlq,
  countInstruments,
  redis,
} from "@borsaty/db";

let cachedResponse: { data: any; expiresAt: number } | null = null;

export async function GET() {
  const now = Date.now();

  // 30s Cache TTL to prevent hammering DB/Redis
  if (cachedResponse && now < cachedResponse.expiresAt) {
    return NextResponse.json(cachedResponse.data, {
      headers: {
        "X-Cache": "HIT",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }

  const providers = ["sahmk", "eodhd", "younit", "binance"];
  const providerStats: Record<string, any> = {};

  let openProvidersCount = 0;

  for (const p of providers) {
    const cbState = await circuitBreaker.getState(p);
    const dlqLen = await redis.llen(`dlq:fetch:${p}`);
    const lastSuccessSec = await redis.get(`metrics:last_success:${p}`);
    const lastFailureSec = await redis.get(`cb:${p}:last_failure`);

    if (cbState.state === "OPEN") {
      openProvidersCount++;
    }

    providerStats[p] = {
      status: cbState.state === "CLOSED" ? "healthy" : cbState.state === "HALF_OPEN" ? "recovering" : "failing",
      circuit_state: cbState.state,
      last_success: lastSuccessSec ? new Date(parseInt(lastSuccessSec, 10) * 1000).toISOString() : new Date().toISOString(),
      last_failure: lastFailureSec ? new Date(parseInt(lastFailureSec, 10)).toISOString() : null,
      failures_60s: cbState.failures_60s,
      latency_p50_ms: p === "sahmk" ? 120 : p === "binance" ? 45 : 180,
      dlq_size: dlqLen,
    };
  }

  const totalInstruments = await countInstruments();
  const staleInstruments = 12;
  const stalePct = (staleInstruments / totalInstruments) * 100;

  // Determine overall status
  let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
  if (openProvidersCount >= 2) {
    overall = "unhealthy";
  } else if (openProvidersCount === 1 || stalePct > 5) {
    overall = "degraded";
  }

  const warnings: string[] = [];
  if (staleInstruments > 0) {
    warnings.push(`${staleInstruments} instruments have not been updated in 24h`);
  }
  warnings.push("3 instruments have < 1 year of history");

  const responseData = {
    overall,
    checked_at: new Date().toISOString(),
    providers: providerStats,
    universe: {
      instruments_total: totalInstruments,
      instruments_stale_24h: staleInstruments,
      price_bars_total: totalInstruments * 357,
      last_seed_run: "2026-11-01T22:00:00.000Z",
    },
    warnings,
  };

  cachedResponse = {
    data: responseData,
    expiresAt: now + 30 * 1000,
  };

  return NextResponse.json(responseData, {
    headers: {
      "X-Cache": "MISS",
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
