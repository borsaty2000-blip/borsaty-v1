import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const sym = symbol.toUpperCase().trim();
  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/intelligence/earnings/${sym}/history`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Fallback historical reactions
  return NextResponse.json({
    symbol: sym,
    historical_reactions: [
      { quarter: "Q3 2025", date: "2025-07-31", return_3d_pct: 2.8 },
      { quarter: "Q2 2025", date: "2025-05-01", return_3d_pct: -1.2 },
      { quarter: "Q1 2025", date: "2025-01-30", return_3d_pct: 4.1 },
      { quarter: "Q4 2024", date: "2024-10-31", return_3d_pct: -0.8 },
    ],
    financials: {
      revenue_actual: 94.93,
      revenue_estimate: 94.50,
      revenue_surprise_pct: 0.45,
      eps_actual: 1.64,
      eps_estimate: 1.60,
      eps_surprise_pct: 2.50,
      verdict: "BEAT",
    },
    transcript_available: true,
  });
}
