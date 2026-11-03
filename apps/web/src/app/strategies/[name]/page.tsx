"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Zap,
  Repeat,
  DollarSign,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  Calendar,
  Layers,
  Award,
  ExternalLink,
  Target,
  BarChart2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
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
  rationale_ar: string;
  rationale_en: string;
  sector?: string;
  entry_zone?: number[];
  target_price?: number;
  stop_loss?: number;
  risk_reward?: number;
}

interface BacktestPoint {
  date: string;
  strategy_return_pct: number;
  benchmark_return_pct: number;
  drawdown_pct?: number;
}

interface MonthlyReturnItem {
  month: string;
  return_pct: number;
  benchmark_pct?: number;
}

interface StrategyDetail {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  tagline_en: string;
  tagline_ar: string;
  category: string;
  benchmark: string;
  risk_level: string;
  cagr?: number;
  sharpe?: number;
  sortino?: number;
  max_dd?: number;
  win_rate?: number;
  total_return?: number;
  benchmark_return?: number;
  alpha?: number;
  top_picks: PickItem[];
  backtest: {
    total_return_pct: number;
    benchmark_return_pct: number;
    alpha_pct: number;
    cagr_pct: number;
    annualized_return_pct: number;
    win_rate_pct: number;
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown_pct: number;
    avg_holding_period_days: number;
    trades_count: number;
    walk_forward_return_pct?: number;
    performance_curve: BacktestPoint[];
    monthly_returns?: MonthlyReturnItem[];
  };
}

export default function StrategyDetailPage() {
  const params = useParams();
  const strategyParam = Array.isArray(params?.name) ? params.name[0] : (params?.name as string) || "value";
  const { language } = useApp();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [strategy, setStrategy] = useState<StrategyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"rank" | "score" | "price" | "rr">("rank");
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/strategies/${strategyParam}`);
        if (!res.ok) {
          throw new Error(`Strategy '${strategyParam}' not found`);
        }
        const json = await res.json();
        if (isMounted) setStrategy(json);
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : "Error loading strategy");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDetail();
    return () => {
      isMounted = false;
    };
  }, [strategyParam]);

  const handleAddToPortfolio = async (pick: PickItem) => {
    setAddingSymbol(pick.symbol);
    try {
      const res = await fetch("/api/portfolio/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: pick.symbol,
          type: "BUY",
          shares: 50,
          price: pick.current_price,
          currency: pick.currency,
          date: new Date().toISOString().split("T")[0],
          notes: `Added via ${strategy?.name_en || "Strategy"} pick`,
        }),
      });

      if (res.ok) {
        toast.success(
          isAr
            ? `تمت إضافة ${pick.symbol} إلى محفظتك بنجاح`
            : `${pick.symbol} added to your portfolio`
        );
      } else {
        toast.info(
          isAr
            ? `تم تسجيل الإشارة لـ ${pick.symbol} (تأكد من تسجيل الدخول لحفظ المحفظة)`
            : `Tracked ${pick.symbol} pick`
        );
      }
    } catch {
      toast.error(isAr ? "تعذر حفظ الصفقة" : "Failed to record transaction");
    } finally {
      setAddingSymbol(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 py-16 px-4 text-center">
        <h2 className="text-xl font-bold mb-3">{isAr ? "الاستراتيجية غير موجودة" : "Strategy Not Found"}</h2>
        <Link
          href="/strategies"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold"
        >
          <span>{isAr ? "العودة لقائمة الاستراتيجيات" : "Back to Strategies"}</span>
        </Link>
      </div>
    );
  }

  const bt = strategy.backtest;
  const picks = strategy.top_picks || [];
  const curve = bt?.performance_curve || [];
  const monthly = bt?.monthly_returns || [];

  // Sorting picks
  const sortedPicks = [...picks].sort((a, b) => {
    let diff = 0;
    if (sortBy === "rank") diff = a.rank - b.rank;
    else if (sortBy === "score") diff = b.strategy_score - a.strategy_score;
    else if (sortBy === "price") diff = b.current_price - a.current_price;
    else if (sortBy === "rr") diff = (b.risk_reward || 0) - (a.risk_reward || 0);
    return sortAsc ? diff : -diff;
  });

  const getStrategyIcon = (id: string) => {
    switch (id) {
      case "value":
        return <ShieldCheck className="w-6 h-6 text-slate-900 dark:text-white" />;
      case "momentum":
        return <Zap className="w-6 h-6 text-slate-900 dark:text-white" />;
      case "reversal":
        return <Repeat className="w-6 h-6 text-slate-900 dark:text-white" />;
      case "dividend":
        return <DollarSign className="w-6 h-6 text-slate-900 dark:text-white" />;
      default:
        return <Sparkles className="w-6 h-6 text-slate-900 dark:text-white" />;
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <Link href="/strategies" className="hover:text-black dark:hover:text-white transition-colors">
            {isAr ? "الاستراتيجيات المؤسسية" : "Institutional Strategies"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white">{isAr ? strategy.name_ar : strategy.name_en}</span>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 1: HEADER (Name + Description + Last Rebalance)            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                {getStrategyIcon(strategy.id)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                    {isAr ? strategy.name_ar : strategy.name_en}
                  </h1>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {strategy.risk_level} RISK
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {strategy.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1.5 leading-relaxed">
                  {isAr ? (strategy.description_ar || strategy.tagline_ar) : (strategy.description_en || strategy.tagline_en)}
                </p>
              </div>
            </div>

            <div className="text-start md:text-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center md:justify-end gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{isAr ? "آخر إعادة موازنة: 01 نوفمبر 2026" : "Last rebalanced: Nov 01, 2026"}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {isAr ? `المؤشر المعياري: ${strategy.benchmark}` : `Benchmark: ${strategy.benchmark}`}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 2: KEY METRICS GRID (6 METRICS)                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "إجمالي العائد (2Y)" : "Total Return (2y)"}
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              +{bt.total_return_pct.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "معدل النمو السنوي (CAGR)" : "CAGR"}
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              +{bt.cagr_pct.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "معدل شارب" : "Sharpe Ratio"}
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {bt.sharpe_ratio.toFixed(2)}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "أقصى هبوط تاريخي" : "Max Drawdown"}
            </span>
            <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
              {bt.max_drawdown_pct.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "نسبة النجاح" : "Win Rate"}
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              {bt.win_rate_pct.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              {isAr ? "عائد المؤشر" : "Benchmark"}
            </span>
            <span className="text-xl font-black font-mono text-slate-500">
              +{bt.benchmark_return_pct.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 3 & ROW 4: PERFORMANCE CURVE + DRAWDOWN UNDERWATER CHART   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Chart */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-slate-500" />
                <span>{isAr ? "منحنى العائد التراكمي (24 شهراً)" : "2Y Cumulative Equity Curve"}</span>
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-900 dark:text-white font-bold">
                  <span className="w-3 h-0.5 bg-black dark:bg-white inline-block" />
                  {isAr ? "الاستراتيجية" : "Strategy"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block" />
                  {isAr ? "المؤشر" : "Benchmark"}
                </span>
              </div>
            </div>

            <div className="h-44 w-full relative">
              {curve.length > 2 && (() => {
                const stratVals = curve.map((c) => c.strategy_return_pct);
                const benchVals = curve.map((c) => c.benchmark_return_pct);
                const all = [...stratVals, ...benchVals];
                const minV = Math.min(...all) * 0.95;
                const maxV = Math.max(...all) * 1.05;
                const rangeV = maxV - minV || 1;
                const width = 800;
                const height = 160;

                const getX = (idx: number) => (idx / (curve.length - 1)) * width;
                const getY = (val: number) => height - ((val - minV) / rangeV) * height;

                const stratPath = curve.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(c.strategy_return_pct).toFixed(1)}`).join(" ");
                const benchPath = curve.map((c, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(c.benchmark_return_pct).toFixed(1)}`).join(" ");

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <path d={benchPath} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />
                    <path d={stratPath} fill="none" stroke="currentColor" className="text-black dark:text-white" strokeWidth="2.5" />
                  </svg>
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>{curve[0]?.date || "2024-11"}</span>
              <span>{curve[curve.length - 1]?.date || "2026-10"}</span>
            </div>
          </div>

          {/* Underwater Drawdown Chart */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-slate-500" />
                <span>{isAr ? "مخطط التراجع التاريخي (Drawdown)" : "Underwater Drawdown Chart"}</span>
              </h3>
              <span className="text-[11px] font-mono text-rose-500 font-bold">
                Max DD: {bt.max_drawdown_pct}%
              </span>
            </div>

            <div className="h-44 w-full relative">
              {curve.length > 2 && (() => {
                const ddVals = curve.map((c) => c.drawdown_pct || 0);
                const minDD = Math.min(...ddVals, -12);
                const rangeDD = Math.abs(minDD) || 1;
                const width = 800;
                const height = 160;

                const getX = (idx: number) => (idx / (curve.length - 1)) * width;
                const getY = (val: number) => (Math.abs(val) / rangeDD) * (height - 20) + 10;

                const ddPoints = curve.map((c, i) => `${getX(i).toFixed(1)},${getY(c.drawdown_pct || 0).toFixed(1)}`).join(" ");

                return (
                  <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <polygon
                      points={`0,10 ${ddPoints} ${width},10`}
                      fill="rgba(244, 63, 94, 0.15)"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                    />
                  </svg>
                );
              })()}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>0% Drawdown (High watermark)</span>
              <span>Max: {bt.max_drawdown_pct}%</span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 5: CURRENT TOP 10 PICKS TABLE (Sortable + Add to Portfolio) */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                <span>{isAr ? "الأسهم العشرة المختارة حالياً" : "Current Top 10 Stock Picks"}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {isAr
                  ? "يتم تحديث واختيار الأسهم طبقاً لمعايير الخوارزمية مع قيود تنويع القطاعات."
                  : "Ranked quantitatively with active sector diversification constraints."}
              </p>
            </div>

            {/* Quick Sort Tabs */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] me-1">{isAr ? "ترتيب:" : "Sort:"}</span>
              <button
                onClick={() => { setSortBy("rank"); setSortAsc(!sortAsc); }}
                className={`px-2 py-1 rounded text-[11px] font-bold ${sortBy === "rank" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
              >
                {isAr ? "الترتيب" : "Rank"}
              </button>
              <button
                onClick={() => { setSortBy("score"); setSortAsc(!sortAsc); }}
                className={`px-2 py-1 rounded text-[11px] font-bold ${sortBy === "score" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
              >
                {isAr ? "التقييم" : "Score"}
              </button>
              <button
                onClick={() => { setSortBy("rr"); setSortAsc(!sortAsc); }}
                className={`px-2 py-1 rounded text-[11px] font-bold ${sortBy === "rr" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}
              >
                R:R
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                  <th className="p-3 text-start">{isAr ? "الرتبة" : "#"}</th>
                  <th className="p-3 text-start">{isAr ? "الرمز والشركة" : "Symbol & Company"}</th>
                  <th className="p-3 text-end">{isAr ? "السعر الحالي" : "Price"}</th>
                  <th className="p-3 text-center">{isAr ? "النقاط" : "Score"}</th>
                  <th className="p-3 text-end">{isAr ? "نطاق الدخول" : "Entry"}</th>
                  <th className="p-3 text-end">{isAr ? "وقف الخسارة" : "Stop"}</th>
                  <th className="p-3 text-end">{isAr ? "الهدف" : "Target"}</th>
                  <th className="p-3 text-end">{isAr ? "القطاع" : "Sector"}</th>
                  <th className="p-3 text-center">{isAr ? "إجراء" : "Action"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {sortedPicks.map((pick) => {
                  const isAdding = addingSymbol === pick.symbol;
                  return (
                    <tr key={pick.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-400 text-start">{pick.rank}</td>
                      <td className="p-3 text-start font-sans">
                        <Link
                          href={`/stock/${pick.symbol}`}
                          className="font-mono font-black text-sm text-slate-900 dark:text-white hover:underline block"
                        >
                          {pick.symbol}
                        </Link>
                        <span className="text-[11px] text-slate-500 truncate block max-w-xs">
                          {isAr ? pick.name_ar : pick.name_en}
                        </span>
                      </td>
                      <td className="p-3 text-end font-bold text-slate-900 dark:text-white">
                        {pick.current_price.toFixed(2)} {pick.currency}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-black">
                          {pick.strategy_score.toFixed(0)}
                        </span>
                      </td>
                      <td className="p-3 text-end text-slate-600 dark:text-slate-300">
                        {pick.entry_zone ? `${pick.entry_zone[0]} - ${pick.entry_zone[1]}` : "—"}
                      </td>
                      <td className="p-3 text-end text-rose-600 dark:text-rose-400">
                        {pick.stop_loss ? pick.stop_loss.toFixed(2) : "—"}
                      </td>
                      <td className="p-3 text-end text-emerald-600 dark:text-emerald-400 font-bold">
                        {pick.target_price ? pick.target_price.toFixed(2) : "—"}
                      </td>
                      <td className="p-3 text-end font-sans text-slate-500">
                        {pick.sector || "General"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleAddToPortfolio(pick)}
                          disabled={isAdding}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-black hover:text-white dark:bg-slate-800 dark:hover:bg-white dark:hover:text-black transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isAdding ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Plus className="w-3 h-3" />
                          )}
                          <span>{isAr ? "إضافة للمحفظة" : "Add"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 6: MONTHLY RETURNS HEATMAP (LAST 12 MONTHS)                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {monthly.length > 0 && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{isAr ? "مصفوفة العوائد الشهرية (آخر 12 شهراً)" : "Monthly Returns Heatmap (Last 12 Months)"}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 font-mono text-center">
              {monthly.map((m, idx) => {
                const isPos = m.return_pct >= 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border ${
                      isPos
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-0.5">
                      {m.month}
                    </div>
                    <div className="text-sm font-black tabular-nums">
                      {isPos ? `+${m.return_pct}%` : `${m.return_pct}%`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
