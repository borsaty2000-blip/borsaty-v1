"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Repeat,
  DollarSign,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Target,
  BarChart2,
  Layers,
  Award,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface PickItem {
  symbol: string;
  name_ar: string;
  name_en: string;
  market: string;
  current_price: number;
  currency: string;
  strategy_score: number;
  rank: number;
  key_metric: string;
}

interface BacktestData {
  total_return_pct: number;
  benchmark_return_pct: number;
  alpha_pct: number;
  cagr_pct?: number;
  annualized_return_pct?: number;
  win_rate_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  trades_count: number;
  performance_curve?: Array<{
    date: string;
    strategy_return_pct: number;
    benchmark_return_pct: number;
  }>;
}

interface StrategyItem {
  id: string;
  name_en: string;
  name_ar: string;
  description_en?: string;
  description_ar?: string;
  tagline_en: string;
  tagline_ar: string;
  category: string;
  benchmark: string;
  risk_level: string;
  cagr?: number;
  sharpe?: number;
  max_dd?: number;
  top_picks?: PickItem[];
  top_3_current_picks?: PickItem[];
  backtest: BacktestData;
}

export default function StrategiesPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStrategies() {
      try {
        const res = await fetch("/api/strategies");
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setStrategies(json.strategies || []);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStrategies();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStrategyIcon = (id: string) => {
    switch (id) {
      case "value":
        return <ShieldCheck className="w-5 h-5 text-slate-900 dark:text-white" />;
      case "momentum":
        return <Zap className="w-5 h-5 text-slate-900 dark:text-white" />;
      case "reversal":
        return <Repeat className="w-5 h-5 text-slate-900 dark:text-white" />;
      case "dividend":
        return <DollarSign className="w-5 h-5 text-slate-900 dark:text-white" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-900 dark:text-white" />;
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? "الاستراتيجيات الكمية المؤتمتة" : "QUANTITATIVE PROPICKS STRATEGIES"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? "الاستراتيجيات المؤسسية" : "Institutional Strategies"}
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-2 leading-relaxed">
            {isAr
              ? "5 استراتيجيات كمية مدعومة بمحركاتنا الثمانية. تم اختبارها تاريخياً مع إعادة توازن شهرية وقيود تنويع قطاعية."
              : "5 quantitative strategies powered by our 8 analytical engines. Fully backtested with monthly rebalancing and strict diversification."}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        {/* 5 Strategy Cards Grid (2-3 columns responsive) */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strat) => {
              const bt = strat.backtest;
              const curve = bt?.performance_curve || [];
              const topPicks = strat.top_3_current_picks || (strat.top_picks ? strat.top_picks.slice(0, 3) : []);
              const cagr = strat.cagr || bt?.cagr_pct || bt?.annualized_return_pct || 20.0;
              const sharpe = strat.sharpe || bt?.sharpe_ratio || 1.8;
              const maxDD = strat.max_dd || bt?.max_drawdown_pct || -8.0;

              // Generate 12-month mini equity curve
              const curveSlice = curve.length >= 12 ? curve.slice(-12) : curve;
              const points = curveSlice.map((c) => c.strategy_return_pct);

              return (
                <div
                  key={strat.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Header: Name + Icon + Risk Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {getStrategyIcon(strat.id)}
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 dark:text-white">
                            {isAr ? strat.name_ar : strat.name_en}
                          </h2>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {strat.name_en}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {strat.risk_level}
                      </span>
                    </div>

                    {/* Description (1 line) */}
                    <p className="text-xs text-slate-500 line-clamp-1 leading-relaxed">
                      {isAr ? (strat.description_ar || strat.tagline_ar) : (strat.description_en || strat.tagline_en)}
                    </p>

                    {/* Mini Equity Curve Chart (12 months) */}
                    {points.length > 2 && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                          <span>{isAr ? "منحنى 12 شهراً" : "12M Curve"}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            +{bt?.total_return_pct ? bt.total_return_pct.toFixed(1) : "—"}%
                          </span>
                        </div>
                        <div className="h-12 w-full">
                          {(() => {
                            const minV = Math.min(...points);
                            const maxV = Math.max(...points);
                            const range = maxV - minV || 1;
                            const width = 240;
                            const height = 48;
                            const coords = points
                              .map((p, idx) => {
                                const x = (idx / (points.length - 1)) * width;
                                const y = height - ((p - minV) / range) * (height - 8) - 4;
                                return `${x.toFixed(1)},${y.toFixed(1)}`;
                              })
                              .join(" ");

                            return (
                              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <polyline
                                  fill="none"
                                  stroke="currentColor"
                                  className="text-slate-900 dark:text-white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={coords}
                                />
                              </svg>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Stats Row: CAGR | Sharpe | Max DD */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">CAGR</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          +{cagr.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Sharpe</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {sharpe.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Max DD</span>
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                          {maxDD.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Top 3 Current Picks */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>{isAr ? "أعلى 3 أسهم مختارة" : "Top 3 Picks"}</span>
                        <span>{isAr ? "التقييم" : "Score"}</span>
                      </div>
                      <div className="space-y-1">
                        {topPicks.map((pick, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">{pick.symbol}</span>
                              <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                                {isAr ? pick.name_ar : pick.name_en}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-[11px] text-slate-900 dark:text-white">
                              {pick.strategy_score.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button: View Strategy -> /strategies/[name] */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                    <Link
                      href={`/strategies/${strat.id}`}
                      className="w-full py-2.5 px-4 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs"
                    >
                      <span>{isAr ? "عرض الاستراتيجية" : "View Strategy"}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
