import { NextResponse } from "next/server";
import { circuitBreaker, dlq, metricsCollector } from "@borsaty/db";
import { validateAdminAuth } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const auth = validateAdminAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "sahmk";
  const count = parseInt(searchParams.get("count") || "5", 10);

  const errors: string[] = [];

  for (let i = 1; i <= count; i++) {
    try {
      await circuitBreaker.execute(provider, async () => {
        throw new Error(`Simulated failure #${i} from test function instance on ${provider}`);
      });
    } catch (err: any) {
      errors.push(err.message);
      await metricsCollector.incFetchFailure(provider, "quote", "HTTP_500");
    }
  }

  // Push to DLQ
  await dlq.push(
    provider,
    "quote",
    { symbol: "2222", reason: "Simulated 5 failures test" },
    `Simulated ${count} failures trigger`
  );

  const stateInfo = await circuitBreaker.getState(provider);

  return NextResponse.json({
    success: true,
    provider,
    failures_simulated: count,
    circuit_state: stateInfo.state,
    failures_60s: stateInfo.failures_60s,
    retry_after_s: stateInfo.retry_after_s,
    message:
      stateInfo.state === "OPEN"
        ? `Circuit breaker for '${provider}' successfully tripped to OPEN.`
        : `Recorded failures, current state: ${stateInfo.state}`,
  });
}

// Support GET for simple browser-based testing
export async function GET(request: Request) {
  return POST(request);
}
