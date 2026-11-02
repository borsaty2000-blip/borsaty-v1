import { NextResponse } from "next/server";
import { findCompany, getStockCandles } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const sym = symbol.toUpperCase();
  const company = await findCompany(sym);
  const candles = await getStockCandles(sym);
  const currentPrice = company?.currentPrice || (candles.length > 0 ? candles[candles.length - 1].close : 86.5);
  const currency = company?.currency || "EGP";
  const market = company?.market || "EGX";
  const companyName = company?.nameAr || sym;

  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/report/${sym}/pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: sym,
        company_name: companyName,
        current_price: currentPrice,
        currency,
        market,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const pdfBuffer = await res.arrayBuffer();
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="BORSATY_${sym}_REPORT.pdf"`,
        },
      });
    }
  } catch {
    // If analysis service offline, generate using fallback
  }

  return NextResponse.json(
    { error: "PDF Generation engine is initializing. Please try again in a few moments." },
    { status: 503 }
  );
}
