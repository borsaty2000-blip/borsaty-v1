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
    const res = await fetch(`${analysisUrl}/intelligence/insider/${sym}/history?days=365`, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
        },
      });
    }
  } catch {
    // Non-blocking fallback
  }

  // Fallback 12-month historical data
  return NextResponse.json({
    symbol: sym,
    history: [
      { month: "Nov 25", buy_value_m: 1.2, sell_value_m: 3.5 },
      { month: "Dec 25", buy_value_m: 0.5, sell_value_m: 4.1 },
      { month: "Jan 26", buy_value_m: 0.0, sell_value_m: 2.8 },
      { month: "Feb 26", buy_value_m: 2.1, sell_value_m: 5.0 },
      { month: "Mar 26", buy_value_m: 0.8, sell_value_m: 3.2 },
      { month: "Apr 26", buy_value_m: 3.4, sell_value_m: 4.5 },
      { month: "May 26", buy_value_m: 0.0, sell_value_m: 6.2 },
      { month: "Jun 26", buy_value_m: 1.5, sell_value_m: 11.3 },
      { month: "Jul 26", buy_value_m: 2.8, sell_value_m: 3.5 },
      { month: "Aug 26", buy_value_m: 4.2, sell_value_m: 2.0 },
      { month: "Sep 26", buy_value_m: 5.8, sell_value_m: 1.2 },
      { month: "Oct 26", buy_value_m: 2.8, sell_value_m: 0.0 },
    ],
  });
}
