import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  if (!symbol) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "ar";

  const sym = symbol.toUpperCase();
  const company = await findCompany(sym);
  const market = company?.market || (sym.length === 4 && /^\d+$/.test(sym) ? "TASI" : "US");
  const currency = company?.currency || (market === "EGX" ? "EGP" : market === "TASI" ? "SAR" : "USD");
  const companyName = lang === "en" 
    ? (company?.nameEn || company?.nameAr || sym)
    : (company?.nameAr || company?.nameEn || sym);

  const analysisUrl = getPythonServiceUrl();

  try {
    const res = await fetch(`${analysisUrl}/report/${sym}/pdf?lang=${encodeURIComponent(lang)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: sym,
        company_name: companyName,
        currency,
        market,
        lang,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const pdfBuffer = await res.arrayBuffer();
      return new Response(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="BORSATY_${sym}_REPORT_${lang.toUpperCase()}.pdf"`,
        },
      });
    }
    const error = await res.json().catch(() => null);
    return NextResponse.json(
      { error: error?.detail || error?.error || `PDF service returned ${res.status}.` },
      { status: res.status }
    );
  } catch (error) {
    console.error(`PDF generation failed for ${sym}:`, error);
    return NextResponse.json(
      { error: "PDF service is unavailable. Please try again later." },
      { status: 503 }
    );
  }
}
