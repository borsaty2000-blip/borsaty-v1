import React from "react";
import type { Metadata } from "next";
import { findCompany, getStockCandles } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import StockDetailClientV2 from "@/components/StockDetailClientV2";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CandleDataPoint } from "@/components/charts/PriceChart";
import { getPythonServiceUrl } from "@/lib/config";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: StockPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const rawSymbol = resolvedParams.symbol.toUpperCase();
  const aliasMatch = resolveStockAlias(rawSymbol);
  const symbol = aliasMatch ? aliasMatch.symbol : rawSymbol;
  const company = await findCompany(symbol);

  const name = company?.nameAr || company?.nameEn || symbol;
  const market = company?.market || "EGX";

  return {
    title: `تحليل سهم ${name} (${symbol}) - قرار شراء/بيع وتوافق فني | Borsaty AI`,
    description: `تحليل فني وكمي مباشر لسهم ${name} في سوق ${market}. تفكيك موجات إليوت، نماذج الهارمونيك، مستويات الدخول، وقف الخسارة، ونسبة العائد للمخاطرة على بورصتي AI.`,
    openGraph: {
      title: `${symbol} - ${name} | Borsaty AI Quantitative Terminal`,
      description: `Institutional deterministic stock analysis, wave counts, and trade plans for ${symbol}.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `تحليل سهم ${symbol} | Borsaty AI`,
      description: `التحليل الكمي والفني لسهم ${name} على منصة بورصتي AI.`,
    },
  };
}

export default async function StockDetailPage({ params }: StockPageProps) {
  const resolvedParams = await params;
  const rawSymbol = resolvedParams.symbol.toUpperCase();

  const aliasMatch = resolveStockAlias(rawSymbol);
  const symbol = aliasMatch ? aliasMatch.symbol : rawSymbol;

  const company = await findCompany(symbol);

  if (!company) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#151d2e] rounded-2xl border border-rose-200 dark:border-rose-900/50 my-10 shadow-sm">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          عذراً، لم نتمكن من إيجاد السهم {rawSymbol}
        </h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">تأكد من كتابة رمز السهم أو اسمه بشكل صحيح</p>
        <Link
          href="/stock/COMI"
          className="inline-flex px-4 py-2 bg-black hover:bg-slate-900 text-white border border-slate-800 rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          الانتقال إلى COMI (البنك التجاري الدولي)
        </Link>
      </div>
    );
  }

  // Fetch live quote and candles with graceful fallback to DB
  const analysisUrl = getPythonServiceUrl();
  let currentPrice = company.currentPrice || 86.5;
  let change = company.change || 0;
  let changePct = company.changePct || 0;
  let rawCandles: CandleDataPoint[] = [];

  try {
    const [quoteRes, histRes] = await Promise.allSettled([
      fetch(`${analysisUrl}/quote/${company.symbol}?market=${company.market}`, {
        signal: AbortSignal.timeout(3000),
      }),
      fetch(`${analysisUrl}/history/${company.symbol}?market=${company.market}`, {
        signal: AbortSignal.timeout(3000),
      }),
    ]);

    if (quoteRes.status === "fulfilled" && quoteRes.value.ok) {
      const q = await quoteRes.value.json();
      if (typeof q.price === "number" && q.price > 0) {
        currentPrice = q.price;
        change = typeof q.change === "number" ? q.change : change;
        changePct = typeof q.change_pct === "number" ? q.change_pct : changePct;
      }
    }

    if (histRes.status === "fulfilled" && histRes.value.ok) {
      const h = await histRes.value.json();
      if (Array.isArray(h.candles) && h.candles.length >= 5) {
        rawCandles = h.candles;
      }
    }
  } catch {
    // Engine offline: use fallback
  }

  if (rawCandles.length === 0) {
    rawCandles = await getStockCandles(company.symbol);
  }

  const hasOrderBook = company.market === "TASI";

  const quote = {
    symbol: company.symbol,
    nameAr: company.nameAr,
    nameEn: company.nameEn,
    market: company.market,
    currency: company.currency,
    sector: company.sector,
    price: currentPrice,
    change: change,
    changePct: changePct,
    dataQuality: {
      provider: "Live Data Feed",
      isRealtime: true,
      isDelayed: false,
      delayMinutes: 0,
      hasOrderBook: hasOrderBook,
      orderBookProxyUsed: !hasOrderBook,
      warnings: [],
      missingFields: !hasOrderBook ? ["Bid/Ask Depth"] : [],
      verifiedAt: new Date().toISOString(),
    },
  };

  return (
    <ErrorBoundary
      fallbackTitleEn={`Unable to render analysis for ${company.symbol}`}
      fallbackTitleAr={`تعذر عرض تحليلات سهم ${company.nameAr || company.symbol}`}
    >
      <StockDetailClientV2
        company={company}
        quote={quote}
        candles={rawCandles}
      />
    </ErrorBoundary>
  );
}
