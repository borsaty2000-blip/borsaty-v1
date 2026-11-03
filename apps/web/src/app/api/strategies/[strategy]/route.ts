import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ strategy: string }> }
) {
  const { strategy } = await params;
  if (!strategy) {
    return NextResponse.json({ error: "Strategy name required" }, { status: 400 });
  }

  const stratName = strategy.toLowerCase().trim();
  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/strategies/${stratName}`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Fallback to fetch from root /api/strategies
  try {
    const rootRes = await fetch(new URL("/api/strategies", request.url).toString());
    if (rootRes.ok) {
      const rootData = await rootRes.json();
      const match = (rootData.strategies || []).find(
        (s: { id: string }) => s.id === stratName || (stratName.startsWith(s.id))
      );
      if (match) {
        return NextResponse.json(match);
      }
    }
  } catch {
    // Fallback
  }

  return NextResponse.json(
    { error: `Strategy '${stratName}' not found` },
    { status: 404 }
  );
}
