import { NextResponse } from "next/server";
import { getPythonServiceUrl } from "@/lib/config";
import { NewsResponseSchema } from "@/lib/schemas";

const CATEGORIES = new Set(["all", "egypt", "egx", "saudi", "tasi", "us", "crypto", "forex", "commodities"]);

function emptyResponse(category: string, error: string) {
  const market = category === "egypt" || category === "egx"
    ? "EGX"
    : category === "saudi" || category === "tasi"
      ? "TASI"
      : category.toUpperCase() === category && ["US", "EGX", "TASI"].includes(category)
        ? category
        : ["crypto", "forex", "commodities"].includes(category)
          ? category
          : "all";
  return {
    market,
    articles: [],
    count: 0,
    data_quality: {
      sources_fetched: [],
      sources_failed: [],
      last_updated: new Date().toISOString(),
      error,
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = (searchParams.get("category") || "all").trim();
  const normalizedCategory = category.toLowerCase();
  const rawLimit = Number(searchParams.get("limit") || 20);
  const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(100, rawLimit)) : 20;

  if (!CATEGORIES.has(normalizedCategory)) {
    return NextResponse.json({ error: "Unsupported news category" }, { status: 400 });
  }

  try {
    const query = new URLSearchParams({ category, limit: String(limit) });
    const response = await fetch(
      `${getPythonServiceUrl()}/news/market?${query.toString()}`,
      { signal: AbortSignal.timeout(20000), next: { revalidate: 900 } }
    );
    if (response.ok) {
      const parsed = NewsResponseSchema.safeParse(await response.json());
      if (parsed.success) {
        return NextResponse.json(parsed.data, {
          headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
        });
      }
      console.error("News market response failed schema validation", parsed.error.issues);
    } else {
      console.warn(`News market service returned HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn("News market service is unavailable", error);
  }

  return NextResponse.json(
    NewsResponseSchema.parse(emptyResponse(normalizedCategory, "News service temporarily unavailable")),
    { headers: { "Cache-Control": "no-store" } }
  );
}
