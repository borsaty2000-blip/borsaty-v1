import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";
import { FinancialsResponseSchema } from "@/lib/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "annual";
  const years = parseInt(searchParams.get("years") || "3", 10);

  const sym = symbol.toUpperCase().trim();
  const company = await findCompany(sym);
  const market = company?.market || (sym.length === 4 && /^\d+$/.test(sym) ? "TASI" : "US");

  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(
      `${analysisUrl}/fundamental/financials/${sym}?period=${period}&years=${years}&market=${market}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const parsed = FinancialsResponseSchema.safeParse(data);
      if (parsed.success) {
        return NextResponse.json(parsed.data, {
          headers: {
            "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        });
      }
    }
  } catch {
    // Engine offline or timed out: fall through to graceful empty state
  }

  // Strictly NO mock data. Return graceful "not available" state per specifications.
  const fallback = {
    symbol: sym,
    period: (period === "quarterly" ? "quarterly" : "annual") as "annual" | "quarterly",
    income_statement: [],
    balance_sheet: [],
    cash_flow: [],
    ratios: {},
    data_quality: {
      source: "none",
      confidence: "LOW",
      is_available: false,
      message: "Financial data not available for this stock",
    },
  };

  const parsedFallback = FinancialsResponseSchema.parse(fallback);
  return NextResponse.json(parsedFallback);
}
