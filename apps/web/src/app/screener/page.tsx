"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Filter,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DataWrapper } from "@/components/ui/DataWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ScreenerResponseSchema } from "@/lib/schemas";

interface ScreenerResult {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: string;
  sector?: string;
  close: number;
  close_change_pct_1d?: number;
  volume_ratio_20d?: number;
  RSI_14?: number;
  SMA_50?: number;
  SMA_200?: number;
  MACD_hist?: number;
  Supertrend?: string;
  pe_ratio?: number;
}

export default function ScreenerPage() {
  const { language, t } = useApp();
  const isAr = language === "ar";

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScreenerResult[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [interpretedDsl, setInterpretedDsl] = useState<any | null>(null);
  const [executionMs, setExecutionMs] = useState<number | null>(null);

  const sampleChips = [
    "الأسهم السعودية في القطاع البنكي",
    "أسهم مصرية بـ RSI تحت 30",
    "كريبتو بحجم تداول مرتفع",
    "أسهم فوق SMA200 وتحت SMA50",
  ];

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);
    setExplanation(null);
    setInterpretedDsl(null);

    try {
      const res = await fetch("/api/screener/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error("فشل تنفيذ الاستعلام، يرجى المحاولة مرة أخرى");
      }

      const rawData = await res.json();
      const parsed = ScreenerResponseSchema.safeParse(rawData);
      const data = parsed.success ? parsed.data : rawData;

      setResults(data.results || []);
      setExplanation(rawData.explanation || null);
      setInterpretedDsl(rawData.interpreted_dsl || null);
      setExecutionMs(data.execution_ms || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errors.fetchFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. Screener Header Banner */}
      <div className="p-8 md:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>NLU Natural Language Quantitative Screener</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {t("screener.title")}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 font-medium">
            {t("screener.subtitle")}
          </p>

          {/* Large Search Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="pt-3"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("screener.inputPlaceholder")}
                  className="w-full h-13 px-4 ps-11 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all shadow-inner font-medium"
                />
                <Search className="w-5 h-5 text-slate-400 absolute start-3.5 top-4 pointer-events-none" />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-13 px-6 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-sm shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>{loading ? t("common.loading") : t("screener.searchBtn")}</span>
              </button>
            </div>
          </form>

          {/* Example Quick Chips */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 me-2 block sm:inline mb-1.5 sm:mb-0">
              {isAr ? "أمثلة شائعة:" : "Quick Examples:"}
            </span>
            <div className="inline-flex flex-wrap gap-2">
              {sampleChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(chip);
                    handleSearch(chip);
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-700 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Results Section with DataWrapper & ErrorBoundary */}
      <ErrorBoundary fallbackTitleEn="Screener Results Error" fallbackTitleAr="تعذر عرض نتائج التصفية">
        <DataWrapper
          isLoading={loading}
          error={error}
          data={results}
          onRetry={() => handleSearch()}
          emptyState={
            results !== null && results.length === 0 ? (
              <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t("screener.emptyResults")}
                </h4>
              </div>
            ) : undefined
          }
        >
          {(stkList) => (
          <div className="space-y-4">
            {/* Interpreted Explanation Box */}
            {explanation && (
              <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-900 dark:text-cyan-300 flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    {t("screener.interpretedAs")} <b>{explanation}</b>
                  </span>
                </div>
                {executionMs && (
                  <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                    {executionMs}ms
                  </span>
                )}
              </div>
            )}

            {/* Results Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400">
                    <tr>
                      <th className="py-3 px-4 text-start">{t("screener.symbol")}</th>
                      <th className="py-3 px-4 text-start">{t("screener.company")}</th>
                      <th className="py-3 px-4 text-start">{t("screener.market")}</th>
                      <th className="py-3 px-4 text-end">{t("screener.price")}</th>
                      <th className="py-3 px-4 text-end">{t("screener.change")}</th>
                      <th className="py-3 px-4 text-end">RSI (14)</th>
                      <th className="py-3 px-4 text-end">SMA (200)</th>
                      <th className="py-3 px-4 text-center">{t("screener.action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {stkList.map((stk) => {
                      const pos = (stk.close_change_pct_1d || 0) >= 0;
                      return (
                        <tr
                          key={stk.symbol}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                          <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                            {stk.symbol}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                            {isAr ? stk.nameAr : stk.nameEn}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {stk.market}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-end font-bold tabular-nums text-slate-900 dark:text-white">
                            {stk.close.toFixed(2)}
                          </td>
                          <td
                            className={`py-3 px-4 text-end font-bold tabular-nums ${
                              pos
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {pos ? "+" : ""}
                            {(stk.close_change_pct_1d || 0).toFixed(2)}%
                          </td>
                          <td className="py-3 px-4 text-end tabular-nums font-mono">
                            {stk.RSI_14 ? stk.RSI_14.toFixed(1) : "—"}
                          </td>
                          <td className="py-3 px-4 text-end tabular-nums font-mono">
                            {stk.SMA_200 ? stk.SMA_200.toFixed(2) : "—"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link
                              href={`/stock/${stk.symbol}`}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                              <span>{isAr ? "تحليل" : "Analyze"}</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DataWrapper>
      </ErrorBoundary>
    </div>
  );
}
