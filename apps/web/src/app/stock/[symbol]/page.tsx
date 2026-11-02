import React from "react";
import { findCompany, getStockCandles } from "@borsaty/db";
import { resolveStockAlias } from "@borsaty/shared";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import StockDetailClientV2 from "@/components/StockDetailClientV2";

interface StockPageProps {
  params: Promise<{ symbol: string }>;
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
          className="inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-sm"
        >
          الانتقال إلى COMI (البنك التجاري الدولي)
        </Link>
      </div>
    );
  }

  const rawCandles = await getStockCandles(company.symbol);
  const currentPrice = company.currentPrice || (rawCandles.length > 0 ? rawCandles[rawCandles.length - 1].close : 86.5);
  const isDelayed = company.market === "EGX";
  const hasOrderBook = company.market === "TASI";

  const quote = {
    symbol: company.symbol,
    nameAr: company.nameAr,
    nameEn: company.nameEn,
    market: company.market,
    currency: company.currency,
    sector: company.sector,
    price: currentPrice,
    change: company.change || 0,
    changePct: company.changePct || 0,
    dataQuality: {
      provider: company.market === "TASI" ? "SAHMK" : "Younit/EGX_NEWS",
      isRealtime: !isDelayed,
      isDelayed: isDelayed,
      delayMinutes: isDelayed ? 15 : 0,
      hasOrderBook: hasOrderBook,
      orderBookProxyUsed: !hasOrderBook,
      warnings: isDelayed ? ["بيانات EGX متأخرة 15 دقيقة"] : [],
      missingFields: !hasOrderBook ? ["Bid/Ask Depth"] : [],
      verifiedAt: new Date().toISOString(),
    },
  };

  return (
    <StockDetailClientV2
      company={company}
      quote={quote}
      candles={rawCandles}
    />
  );
}
