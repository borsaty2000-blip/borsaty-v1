"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Table,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ValidatedFairValue } from "@/lib/schemas";

interface FairValueCardProps {
  symbol: string;
  currency?: string;
  className?: string;
}

export default function FairValueCard({
  symbol,
  currency = "EGP",
  className = "",
}: FairValueCardProps) {
  const { language } = useApp();
  const isAr = language === "ar";
  const sym = symbol.toUpperCase();

  const [data, setData] = useState<ValidatedFairValue | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Collapsible panel states
  const [showModels, setShowModels] = useState<boolean>(false);
  const [showSensitivity, setShowSensitivity] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchFairValue() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fundamental/fair-value/${sym}`);
        if (!res.ok) {
          throw new Error(`Failed to load fair value for ${sym}`);
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error loading fair value data");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (sym) {
      fetchFairValue();
    }

    return () => {
      isMounted = false;
    };
  }, [sym]);

  if (loading) {
    return (
      <div className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs animate-pulse ${className}`}>
        <div className="h-14 bg-slate-200 dark:bg-slate-800 rounded-xl mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-48 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          <div className="lg:col-span-5 h-48 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Gracefully degrade if endpoint is unavailable
  }

  const {
    current_price: currentPrice,
    fair_value_range: range,
    margin_of_safety_pct: marginOfSafety,
    verdict,
    verdict_ar: verdictAr,
    confidence_level: confidenceLevel = "HIGH",
    models = {},
    sensitivity,
    peer_comparison: peerComp,
    historical_90d: history = [],
    data_quality: dataQuality,
  } = data;

  const low = range.low;
  const mid = range.mid;
  const high = range.high;

  // Banner background based on verdict
  const bannerBg =
    verdict === "UNDERVALUED"
      ? "bg-emerald-700 text-white"
      : verdict === "OVERVALUED"
      ? "bg-rose-700 text-white"
      : "bg-slate-800 text-white";

  // Bar calculations: establish minimum and maximum scale bounds
  const minBound = Math.min(low, currentPrice) * 0.90;
  const maxBound = Math.max(high, currentPrice) * 1.10;
  const totalSpan = maxBound - minBound;

  const getPercent = (val: number) => {
    const clamped = Math.max(minBound, Math.min(val, maxBound));
    return ((clamped - minBound) / totalSpan) * 100;
  };

  const lowPct = getPercent(low);
  const midPct = getPercent(mid);
  const highPct = getPercent(high);
  const curPct = getPercent(currentPrice);
  const bandWidth = Math.max(highPct - lowPct, 2);

  const modelKeys = [
    { key: "dcf", labelEn: "DCF Model (5y FCF)", labelAr: "نموذج التدفقات النقدية المخصومة (DCF)" },
    { key: "ddm", labelEn: "Dividend Discount (DDM)", labelAr: "نموذج خصم التوزيعات (DDM)" },
    { key: "pe_relative", labelEn: "Relative P/E Multiple", labelAr: "مضاعف الربحية القطاعي (P/E)" },
    { key: "pb_relative", labelEn: "Relative P/B Multiple", labelAr: "مضاعف القيمة الدفترية القطاعي (P/B)" },
    { key: "ev_ebitda", labelEn: "EV/EBITDA Multiple", labelAr: "مضاعف قيمة المنشأة للأرباح (EV/EBITDA)" },
    { key: "graham", labelEn: "Graham Number", labelAr: "رقم بنجامين غراهام الاستثماري" },
    { key: "peg", labelEn: "PEG Ratio Valuation", labelAr: "تقييم مضاعف النمو (PEG)" },
    { key: "reverse_dcf", labelEn: "Reverse DCF Implied", labelAr: "النمو الضمني للتدفقات (Reverse DCF)" },
    { key: "analyst", labelEn: "Analyst Consensus", labelAr: "متوسط توقعات بيوت الخبرة والمحللين" },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs transition-all ${className}`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 1: VERDICT BANNER (Full width)                            */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className={`px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${bannerBg}`}>
        <div>
          <div className="text-[11px] font-bold tracking-wider uppercase text-white/80">
            {isAr ? "محرك التقييم المؤسسي — 9 نماذج مالية" : "FAIR VALUE ORACLE — 9 VALUATION MODELS"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {isAr ? (verdictAr || verdict) : verdict}
            </span>
            <span className="text-xs text-white/80 font-medium">
              ({marginOfSafety > 0 ? `+${marginOfSafety}%` : `${marginOfSafety}%`}{" "}
              {marginOfSafety > 0
                ? isAr
                  ? "أعلى من السعر السوقي"
                  : "upside"
                : isAr
                ? "أقل من السعر السوقي"
                : "discount"}
              )
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-white/30 bg-black/15 text-white backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {confidenceLevel}{" "}
              {isAr ? "ثقة مؤسسية" : "CONFIDENCE"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 2 & ROW 3: BAR CHART (60%) + KEY METRICS (40%)             */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Horizontal Range Bar (60%) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>{isAr ? "النطاق السعري العادل المقدر" : "Estimated Fair Value Range"}</span>
              <span className="font-mono">
                {minBound.toFixed(1)} — {maxBound.toFixed(1)} {currency}
              </span>
            </div>

            {/* Visual Bar Container */}
            <div className="relative pt-6 pb-8">
              {/* Scale Track */}
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-visible">
                {/* Fair Value Range Band (Green gradient) */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/30 dark:bg-emerald-500/20 border-x border-emerald-500 rounded-sm"
                  style={{
                    left: isAr ? undefined : `${lowPct}%`,
                    right: isAr ? `${lowPct}%` : undefined,
                    width: `${bandWidth}%`,
                  }}
                  title={`Fair Range: ${low.toFixed(2)} - ${high.toFixed(2)} ${currency}`}
                />

                {/* Fair Mid Dashed Line Marker */}
                <div
                  className="absolute top-[-6px] bottom-[-6px] w-[2px] border-r-2 border-dashed border-slate-600 dark:border-slate-300 z-10"
                  style={{
                    left: isAr ? undefined : `${midPct}%`,
                    right: isAr ? `${midPct}%` : undefined,
                  }}
                />

                {/* Current Market Price Marker (Solid Black Pin) */}
                <div
                  className="absolute top-[-10px] bottom-[-10px] w-1 bg-black dark:bg-white rounded-full z-20 shadow-md"
                  style={{
                    left: isAr ? undefined : `${curPct}%`,
                    right: isAr ? `${curPct}%` : undefined,
                  }}
                />
              </div>

              {/* Range labels underneath */}
              <div className="relative w-full text-[11px] font-mono mt-3">
                <span
                  className="absolute transform -translate-x-1/2 text-slate-500"
                  style={{
                    left: isAr ? undefined : `${lowPct}%`,
                    right: isAr ? `${lowPct}%` : undefined,
                  }}
                >
                  {low.toFixed(1)}
                </span>
                <span
                  className="absolute transform -translate-x-1/2 font-bold text-slate-800 dark:text-slate-200"
                  style={{
                    left: isAr ? undefined : `${midPct}%`,
                    right: isAr ? `${midPct}%` : undefined,
                  }}
                >
                  {mid.toFixed(1)}
                </span>
                <span
                  className="absolute transform -translate-x-1/2 text-slate-500"
                  style={{
                    left: isAr ? undefined : `${highPct}%`,
                    right: isAr ? `${highPct}%` : undefined,
                  }}
                >
                  {high.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Margin of Safety & Distance Statement */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {isAr ? "هامش الأمان الاستثماري (Margin of Safety):" : "Margin of Safety:"}
                </span>
              </div>
              <div className="text-base font-black font-mono text-slate-900 dark:text-white">
                {marginOfSafety > 0 ? `+${marginOfSafety}%` : `${marginOfSafety}%`}
              </div>
            </div>
          </div>

          {/* Right: Key Metrics Grid (40%) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            {/* Metric 1 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">
                {isAr ? "متوسط القيمة العادلة" : "Fair Value Mid"}
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                {mid.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currency}</div>
            </div>

            {/* Metric 2 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">
                {isAr ? "السعر السوقي الحالي" : "Current Market Price"}
              </div>
              <div className="text-lg font-black font-mono text-slate-900 dark:text-white mt-1">
                {currentPrice.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currency}</div>
            </div>

            {/* Metric 3 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">
                {isAr ? "النطاق الاستثماري (±15%)" : "Fair Value Range"}
              </div>
              <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                {low.toFixed(1)} - {high.toFixed(1)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">{currency}</div>
            </div>

            {/* Metric 4 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 font-medium">
                {isAr ? "تغطية النماذج" : "Model Coverage"}
              </div>
              <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-1">
                {dataQuality ? `${dataQuality.models_used} / 9` : "7 / 9"}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                {confidenceLevel} {isAr ? "ثقة" : "Confidence"}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 4: 9-MODEL BREAKDOWN (Collapsible)                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowModels(!showModels)}
            className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {isAr ? "تفصيل النماذج الـ 9 للتقييم المالي" : "9-Model Valuation Breakdown"}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {dataQuality?.models_used || 7} active
              </span>
            </div>
            {showModels ? (
              <ChevronUp className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {showModels && (
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-xs text-slate-700 dark:text-slate-300">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                    <th className="pb-2 text-start font-bold">{isAr ? "النموذج" : "Valuation Model"}</th>
                    <th className="pb-2 text-end font-bold">{isAr ? "القيمة المقدرة" : "Est. Value"}</th>
                    <th className="pb-2 text-end font-bold">{isAr ? "الوزن النسبي" : "Weight"}</th>
                    <th className="pb-2 text-center font-bold">{isAr ? "مستوى الثقة" : "Confidence"}</th>
                    <th className="pb-2 text-start ps-4 font-bold">{isAr ? "الأساس المالي" : "Methodology / Reason"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {modelKeys.map(({ key, labelEn, labelAr }) => {
                    const m = models[key];
                    const val = m?.value;
                    const weightPct = m ? Math.round(m.weight * 100) : 0;
                    const conf = m?.confidence || "N/A";
                    const reason = m?.reason || "Not calculated";

                    return (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 font-semibold text-slate-900 dark:text-white">
                          {isAr ? labelAr : labelEn}
                        </td>
                        <td className="py-2.5 text-end font-mono font-bold">
                          {val !== null && val !== undefined ? (
                            <span>{val.toFixed(2)} {currency}</span>
                          ) : (
                            <span className="text-slate-400 font-normal italic">{isAr ? "غير منطبق" : "N/A"}</span>
                          )}
                        </td>
                        <td className="py-2.5 text-end font-mono">
                          {weightPct > 0 ? `${weightPct}%` : "—"}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              conf === "HIGH"
                                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                                : conf === "MEDIUM"
                                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            }`}
                          >
                            {conf}
                          </span>
                        </td>
                        <td className="py-2.5 ps-4 text-slate-500 text-[11px]">
                          {reason}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 5: DCF SENSITIVITY MATRIX (Collapsible)                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {sensitivity && sensitivity.dcf_matrix && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSensitivity(!showSensitivity)}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isAr ? "مصفوفة حساسية التدفقات النقدية (Growth vs WACC)" : "DCF Sensitivity Matrix (3×3)"}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? "اختبار متانة التقييم ضد تقلبات الفائدة والنمو" : "Stress-tested across discount & perpetual growth bands"}
                </span>
              </div>
              {showSensitivity ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {showSensitivity && (
              <div className="p-5 overflow-x-auto">
                <div className="text-[11px] text-slate-500 mb-3">
                  {isAr
                    ? "القيم بالداخل تمثل السعر العادل للسهم طبقاً لسيناريوهات تكلفة رأس المال (WACC) مقابل معدل نمو التدفقات (Growth):"
                    : "Grid cells reflect intrinsic share value across cost of capital (WACC) vs FCF growth combinations:"}
                </div>
                <table className="w-full text-xs border border-slate-200 dark:border-slate-700 text-center font-mono">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 font-bold text-start text-slate-600 dark:text-slate-300">
                        {isAr ? "معدل النمو \\ تكلفة المال" : "Growth \\ WACC"}
                      </th>
                      {sensitivity.col_labels.map((col, idx) => (
                        <th key={idx} className="p-2.5 font-bold text-slate-700 dark:text-slate-300">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sensitivity.dcf_matrix.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-start bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                          {sensitivity.row_labels[rIdx]}
                        </td>
                        {row.map((cellVal, cIdx) => {
                          const isBase = rIdx === 1 && cIdx === 1;
                          const isHigh = cellVal >= mid;
                          return (
                            <td
                              key={cIdx}
                              className={`p-2.5 font-bold ${
                                isBase
                                  ? "bg-slate-900 text-white dark:bg-white dark:text-black font-black"
                                  : isHigh
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {cellVal.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 6: PEER MULTIPLES COMPARISON                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {peerComp && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {isAr ? `مقارنة مضاعفات القطاع (${peerComp.sector})` : `Sector Multiples (${peerComp.sector})`}
              </h4>
              <span className="text-[11px] text-slate-500">
                {isAr
                  ? `وسيط القطاع P/E: ${peerComp.sector_median_pe}x | P/B: ${peerComp.sector_median_pb}x`
                  : `Sector Median P/E: ${peerComp.sector_median_pe}x | P/B: ${peerComp.sector_median_pb}x`}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-semibold">
                    <th className="p-3 text-start">{isAr ? "الرمز" : "Symbol"}</th>
                    <th className="p-3 text-end">{isAr ? "مضاعف الربحية (P/E)" : "P/E Ratio"}</th>
                    <th className="p-3 text-end">{isAr ? "مضاعف الدفترية (P/B)" : "P/B Ratio"}</th>
                    <th className="p-3 text-end">{isAr ? "القيمة السوقية" : "Market Cap"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {/* Current stock highlighted */}
                  <tr className="bg-slate-900 text-white dark:bg-white dark:text-black font-black">
                    <td className="p-3 text-start flex items-center gap-2">
                      <span>{sym}</span>
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/20">
                        {isAr ? "سهمك" : "Current"}
                      </span>
                    </td>
                    <td className="p-3 text-end">{peerComp.current_pe}x</td>
                    <td className="p-3 text-end">{peerComp.current_pb ? `${peerComp.current_pb}x` : "—"}</td>
                    <td className="p-3 text-end text-white/80 dark:text-black/80">—</td>
                  </tr>

                  {/* Sector Peers */}
                  {peerComp.peers.map((peer, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      <td className="p-3 text-start font-bold text-slate-900 dark:text-white">{peer.symbol}</td>
                      <td className="p-3 text-end">{peer.pe ? `${peer.pe}x` : "—"}</td>
                      <td className="p-3 text-end">{peer.pb ? `${peer.pb}x` : "—"}</td>
                      <td className="p-3 text-end text-slate-500">{peer.market_cap || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              {isAr
                ? `وسيط القطاع لمضاعف الربحية ${peerComp.sector_median_pe}x. يتداول سهم ${sym} عند خصم ${peerComp.discount_to_sector > 0 ? peerComp.discount_to_sector : Math.abs(peerComp.discount_to_sector)}% مقارنة بمتوسط أقرانه في القطاع.`
                : `Sector median P/E is ${peerComp.sector_median_pe}x. ${sym} trades at ${peerComp.discount_to_sector}% ${peerComp.discount_to_sector > 0 ? "discount" : "premium"} to industry peers.`}
            </p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ROW 7: HISTORICAL 90-DAY VALUATION SPARKLINE                   */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {history.length > 5 && (
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isAr ? "مسار القيمة العادلة مقابل السعر (آخر 90 يوماً)" : "90-Day Fair Value vs Price Trend"}
                </h4>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-0.5 bg-black dark:bg-white inline-block" />
                  {isAr ? "السعر السوقي" : "Market Price"}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block" />
                  {isAr ? "القيمة العادلة" : "Fair Value"}
                </span>
              </div>
            </div>

            {/* SVG Interactive Line Chart */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="h-32 w-full relative">
                {(() => {
                  const prices = history.map((h) => h.price);
                  const fvs = history.map((h) => h.fair_value);
                  const allVals = [...prices, ...fvs];
                  const minV = Math.min(...allVals) * 0.95;
                  const maxV = Math.max(...allVals) * 1.05;
                  const rangeV = maxV - minV || 1;

                  const width = 800;
                  const height = 120;

                  const getX = (idx: number) => (idx / (history.length - 1)) * width;
                  const getY = (val: number) => height - ((val - minV) / rangeV) * height;

                  // Price path
                  const pricePath = history
                    .map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(h.price).toFixed(1)}`)
                    .join(" ");

                  // Fair value path
                  const fvPath = history
                    .map((h, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(h.fair_value).toFixed(1)}`)
                    .join(" ");

                  return (
                    <svg
                      viewBox={`0 0 ${width} ${height}`}
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                    >
                      {/* Fair Value dashed path */}
                      <path
                        d={fvPath}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />

                      {/* Current price solid path */}
                      <path
                        d={pricePath}
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-900 dark:text-white"
                        strokeWidth="2"
                      />
                    </svg>
                  );
                })()}
              </div>

              {/* Date footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2">
                <span>{history[0]?.date}</span>
                <span>{isAr ? "تحديث اليوم" : "Today"} ({history[history.length - 1]?.date})</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
