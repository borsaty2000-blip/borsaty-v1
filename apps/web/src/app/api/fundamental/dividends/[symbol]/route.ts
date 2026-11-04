import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";
import { DividendsResponseSchema } from "@/lib/schemas";

const MARKETS = new Set(["US", "EGX", "TASI"]);

function unavailable(symbol: string, market: string) {
  return {
    symbol,
    market,
    available: false,
    reason: "Dividend data temporarily unavailable",
    message_ar: "بيانات التوزيعات غير متاحة مؤقتًا",
    message_en: "Dividend data is temporarily unavailable",
    history: [],
    splits: [],
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const sym = symbol?.trim().toUpperCase();
  if (!sym) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedMarket = searchParams.get("market")?.trim().toUpperCase();
  if (requestedMarket && !MARKETS.has(requestedMarket)) {
    return NextResponse.json({ error: "market must be US, EGX, or TASI" }, { status: 400 });
  }
  const company = await findCompany(sym);
  const resolvedMarket = requestedMarket || company?.market ||
    (sym.length === 4 && /^\d+$/.test(sym) ? "TASI" : "US");
  const market = MARKETS.has(resolvedMarket) ? resolvedMarket : "US";

  try {
    const response = await fetch(
      `${getPythonServiceUrl()}/fundamental/dividends/${encodeURIComponent(sym)}?market=${market}`,
      { signal: AbortSignal.timeout(15000), next: { revalidate: 43200 } }
    );
    if (response.ok) {
      const parsed = DividendsResponseSchema.safeParse(await response.json());
      if (parsed.success) {
        return NextResponse.json(parsed.data, {
          headers: { "Cache-Control": "public, s-maxage=43200, stale-while-revalidate=86400" },
        });
      }
      console.error("Dividend response failed schema validation", parsed.error.issues);
    } else {
      console.warn(`Dividend service returned HTTP ${response.status} for ${sym}`);
    }
  } catch (error) {
    console.warn(`Dividend service is unavailable for ${sym}`, error);
  }

  return NextResponse.json(
    DividendsResponseSchema.parse(unavailable(sym, market)),
    { headers: { "Cache-Control": "no-store" } }
  );
}
