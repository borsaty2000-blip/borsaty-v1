import { NextResponse } from "next/server";
import { findCompany } from "@borsaty/db";
import { getPythonServiceUrl } from "@/lib/config";
import { AnalystConsensusResponseSchema } from "@/lib/schemas";

const noCoverage = (symbol: string) => ({
  symbol,
  available: false,
  reason: "No analyst coverage",
  message_ar: "لا توجد تغطية من المحللين لهذا السهم",
  message_en: "No analyst coverage available for this stock",
});

const serviceUnavailable = (symbol: string) => ({
  symbol,
  available: false,
  reason: "Analyst data temporarily unavailable",
  message_ar: "بيانات المحللين غير متاحة مؤقتًا",
  message_en: "Analyst data is temporarily unavailable",
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const sym = symbol?.toUpperCase().trim();
  if (!sym) {
    return NextResponse.json({ error: "Symbol required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const requestedMarket = searchParams.get("market")?.trim().toUpperCase();
  if (requestedMarket && !["US", "EGX", "TASI"].includes(requestedMarket)) {
    return NextResponse.json({ error: "market must be US, EGX, or TASI" }, { status: 400 });
  }
  const company = await findCompany(sym);
  const market = requestedMarket || company?.market ||
    (sym.length === 4 && /^\d+$/.test(sym) ? "TASI" : "US");

  if (market !== "US") {
    const data = AnalystConsensusResponseSchema.parse(noCoverage(sym));
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
    });
  }

  try {
    const res = await fetch(
      `${getPythonServiceUrl()}/fundamental/analyst-consensus/${encodeURIComponent(sym)}?market=${market}`,
      { method: "GET", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(10000) }
    );
    if (res.ok) {
      const parsed = AnalystConsensusResponseSchema.safeParse(await res.json());
      if (parsed.success) {
        return NextResponse.json(parsed.data, {
          headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
        });
      }
    }
  } catch {
    // The unavailable response keeps provider failures separate from missing coverage.
  }

  return NextResponse.json(
    AnalystConsensusResponseSchema.parse(serviceUnavailable(sym)),
    { headers: { "Cache-Control": "no-store" } }
  );
}
