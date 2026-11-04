import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";
import { NewsResponseSchema } from "@/lib/schemas";

const MARKETS = new Set(["EGX", "TASI", "US"]);

function emptyResponse(symbol: string, market: string) {
  return {
    market,
    symbol,
    articles: [],
    count: 0,
    data_quality: {
      sources_fetched: [],
      sources_failed: [],
      last_updated: new Date().toISOString(),
      error: "News service temporarily unavailable",
    },
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
    return NextResponse.json({ error: "market must be EGX, TASI, or US" }, { status: 400 });
  }
  const company = await findCompany(sym);
  const market = requestedMarket || company?.market ||
    (sym.length === 4 && /^\d+$/.test(sym) ? "TASI" : "US");
  const requestedLimit = Number(searchParams.get("limit") || 10);
  const limit = Number.isInteger(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 10;

  if (!MARKETS.has(market)) {
    return NextResponse.json({ error: "market must be EGX, TASI, or US" }, { status: 400 });
  }

  try {
    const query = new URLSearchParams({ market, limit: String(limit) });
    const response = await fetch(
      `${getPythonServiceUrl()}/news/${encodeURIComponent(sym)}?${query.toString()}`,
      { signal: AbortSignal.timeout(20000), next: { revalidate: 900 } }
    );
    if (response.ok) {
      const parsed = NewsResponseSchema.safeParse(await response.json());
      if (parsed.success) {
        return NextResponse.json(parsed.data, {
          headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
        });
      }
      console.error("Stock news response failed schema validation", parsed.error.issues);
    } else {
      console.warn(`Stock news service returned HTTP ${response.status} for ${sym}`);
    }
  } catch (error) {
    console.warn(`Stock news service is unavailable for ${sym}`, error);
  }

  return NextResponse.json(
    NewsResponseSchema.parse(emptyResponse(sym, market)),
    { headers: { "Cache-Control": "no-store" } }
  );
}
