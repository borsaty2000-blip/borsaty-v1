import { NextResponse } from "next/server";
import { circuitBreaker, CircuitOpenError, sahmkClient, eodhdClient, younitClient, binanceClient } from "@borsaty/db";
import { validateAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const auth = validateAdminAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") || "sahmk";
  const symbol = searchParams.get("symbol") || (provider === "sahmk" ? "2222" : "COMI");

  let attemptedCall = false;

  try {
    const result = await circuitBreaker.execute(provider, async () => {
      attemptedCall = true; // Flag indicating if actual call was attempted
      if (provider === "sahmk") {
        return await sahmkClient.fetchQuote(symbol);
      } else if (provider === "eodhd") {
        return await eodhdClient.fetchQuote(symbol);
      } else if (provider === "binance") {
        return await binanceClient.fetchQuote(symbol);
      } else {
        return await younitClient.fetchQuote(symbol);
      }
    });

    return NextResponse.json({
      success: true,
      provider,
      circuit_state: "CLOSED",
      attempted_provider_call: true,
      result: result.result,
    });
  } catch (err: unknown) {
    const isCircuitOpen = err instanceof CircuitOpenError;
    const statusCode = isCircuitOpen ? 503 : 500;
    const errorMessage = err instanceof Error ? err.message : String(err);
    const retryAfter = isCircuitOpen ? (err as CircuitOpenError).retryAfterSeconds : undefined;

    return NextResponse.json(
      {
        success: false,
        provider,
        circuit_state: isCircuitOpen ? "OPEN" : "ERROR",
        attempted_provider_call: attemptedCall,
        error: errorMessage,
        retry_after_s: retryAfter,
        reason: isCircuitOpen ? "CIRCUIT_OPEN_FAST_FAIL" : "PROVIDER_CALL_FAILED",
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
