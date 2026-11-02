import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";

export async function POST(request: Request) {
  const startTime = Date.now();
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/backtest/leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000), // leaderboard can be slow
    });

    if (res.ok) {
      const result = await res.json();
      return NextResponse.json({
        ...result,
        execution_ms: Date.now() - startTime,
      });
    }

    const errBody = await res.text();
    return NextResponse.json(
      { error: "Analysis engine error", detail: errBody },
      { status: res.status }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Analysis engine offline or timeout",
        detail: String(err),
        leaderboard: [],
      },
      { status: 503 }
    );
  }
}
