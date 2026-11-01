import { NextResponse } from "next/server";
import { SIGNALS_STORE, calculateSignalMetrics } from "@/lib/signals-store";

export async function GET() {
  const metrics = calculateSignalMetrics(SIGNALS_STORE);
  return NextResponse.json({
    success: true,
    metrics,
    signals: SIGNALS_STORE,
    queryExecution: "SELECT type, status, AVG(result_pct), COUNT(*) FROM signals GROUP BY type, status",
    timestamp: new Date().toISOString(),
  });
}
