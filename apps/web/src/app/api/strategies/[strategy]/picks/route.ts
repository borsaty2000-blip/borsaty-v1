import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ strategy: string }> }
) {
  const { strategy } = await params;
  if (!strategy) {
    return NextResponse.json({ error: "Strategy required" }, { status: 400 });
  }

  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/strategies/${strategy}/picks`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Fetch from global list
  const allRes = await fetch(new URL("/api/strategies", request.url).toString());
  if (allRes.ok) {
    const allData = (await allRes.json()) as { strategies?: Array<{ id: string }> };
    const found = allData.strategies?.find((s) => s.id === strategy.toLowerCase());
    if (found) {
      return NextResponse.json(found);
    }
  }

  return NextResponse.json({ error: `Strategy ${strategy} not found` }, { status: 404 });
}
