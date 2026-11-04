import { notFound } from "next/navigation";
import { findCompany } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";
import StockReportClient from "@/components/stock/StockReportClient";
import { getPythonServiceUrl } from "@/lib/config";
import "./report.css";

interface StockReportPageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ download?: string; lang?: string }>;
}

export const dynamic = "force-dynamic";

export default async function StockReportPage({
  params,
  searchParams,
}: StockReportPageProps) {
  const [{ symbol: rawSymbol }, query] = await Promise.all([params, searchParams]);
  const requestedSymbol = rawSymbol.toUpperCase();
  const alias = resolveStockAlias(requestedSymbol);
  const symbol = alias?.symbol || requestedSymbol;
  const company = await findCompany(symbol);

  if (!company) notFound();

  let price = company.currentPrice || 0;
  let change = company.change || 0;
  let changePct = company.changePct || 0;
  let freshness: "LIVE" | "TODAY_CLOSE" | "DELAYED" = "TODAY_CLOSE";
  let priceTimestamp = new Date().toISOString();

  try {
    const response = await fetch(
      `${getPythonServiceUrl()}/quote/${company.symbol}?market=${encodeURIComponent(company.market)}`,
      { signal: AbortSignal.timeout(3000), cache: "no-store" }
    );
    if (response.ok) {
      const quote: unknown = await response.json();
      if (quote && typeof quote === "object") {
        const liveQuote = quote as Record<string, unknown>;
        if (typeof liveQuote.price === "number" && liveQuote.price > 0) {
          price = liveQuote.price;
          change = typeof liveQuote.change === "number" ? liveQuote.change : change;
          changePct = typeof liveQuote.change_pct === "number" ? liveQuote.change_pct : changePct;
          freshness =
            liveQuote.freshness === "LIVE" || liveQuote.freshness === "DELAYED"
              ? liveQuote.freshness
              : "TODAY_CLOSE";
          priceTimestamp =
            typeof liveQuote.price_timestamp === "string"
              ? liveQuote.price_timestamp
              : priceTimestamp;
        }
      }
    }
  } catch {
    // Keep the latest stored quote when the live quote service is unavailable.
  }

  return (
    <StockReportClient
      company={{
        symbol: company.symbol,
        nameEn: company.nameEn,
        nameAr: company.nameAr,
        market: company.market,
        currency: company.currency,
        sector: company.sector || "",
      }}
      quote={{ price, change, changePct, freshness, priceTimestamp }}
      initialLanguage={query.lang === "en" ? "en" : query.lang === "ar" ? "ar" : undefined}
      autoDownload={query.download === "1"}
    />
  );
}
