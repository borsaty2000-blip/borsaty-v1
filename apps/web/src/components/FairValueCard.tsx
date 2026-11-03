'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Scale,
  Percent,
  Calculator,
  Info,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ValidatedFairValue } from '@/lib/schemas';

interface FairValueCardProps {
  symbol: string;
  currency?: string;
  initialData?: ValidatedFairValue | null;
  className?: string;
}

export default function FairValueCard({
  symbol,
  currency = 'EGP',
  initialData,
  className = '',
}: FairValueCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [data, setData] = useState<ValidatedFairValue | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchFairValue() {
      try {
        setLoading(true);
        const res = await fetch(`/api/fundamental/fair-value/${symbol.toUpperCase()}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFairValue();
    return () => {
      isMounted = false;
    };
  }, [symbol, initialData]);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="w-36 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
          <div className="w-24 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="w-48 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
    );
  }

  if (!data) return null;

  const currentPrice = data.current_price;
  const curr = data.currency || currency;
  const rangeLow = data.fair_value_range.low;
  const rangeMid = data.fair_value_range.mid;
  const rangeHigh = data.fair_value_range.high;
  const margin = data.margin_of_safety_pct;

  // Visual position calculation along horizontal slider
  const minScale = Math.min(rangeLow * 0.85, currentPrice * 0.9);
  const maxScale = Math.max(rangeHigh * 1.15, currentPrice * 1.1);
  const totalSpan = maxScale - minScale || 1;

  const currentPricePosPct = Math.max(2, Math.min(98, ((currentPrice - minScale) / totalSpan) * 100));
  const rangeLowPct = Math.max(0, Math.min(100, ((rangeLow - minScale) / totalSpan) * 100));
  const rangeHighPct = Math.max(0, Math.min(100, ((rangeHigh - minScale) / totalSpan) * 100));
  const rangeMidPct = Math.max(0, Math.min(100, ((rangeMid - minScale) / totalSpan) * 100));

  // Verdict style mapping
  const isUndervalued = data.verdict === 'UNDERVALUED';
  const isOvervalued = data.verdict === 'OVERVALUED';

  const verdictBadge = isUndervalued ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
      <TrendingUp className="w-3.5 h-3.5" />
      <span>{isAr ? data.verdict_ar || 'مقوم بأقل من قيمته العادلة' : 'UNDERVALUED'}</span>
    </span>
  ) : isOvervalued ? (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
      <TrendingDown className="w-3.5 h-3.5" />
      <span>{isAr ? data.verdict_ar || 'مقوم بأعلى من قيمته العادلة' : 'OVERVALUED'}</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      <Scale className="w-3.5 h-3.5 text-slate-500" />
      <span>{isAr ? data.verdict_ar || 'قريب من القيمة العادلة' : 'FAIR VALUE'}</span>
    </span>
  );

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-6 ${className}`}>
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Calculator className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'القيمة العادلة والتقييم الجوهري' : 'Institutional Fair Value'}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                DCF + MULTIPLES
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'نموذج تقييم كمي مركب (التدفقات النقدية المخصومة + مضاعفات القطاع + نموذج غراهام)'
                : 'Weighted quantitative model combining DCF, Sector Multiples, and Graham Number'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {verdictBadge}
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Fair Value Midpoint */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'القيمة العادلة المرجحة' : 'Fair Value (Mid)'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {rangeMid.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">{curr}</span>
          </div>
        </div>

        {/* Current Price */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'السعر السوقي الحالي' : 'Market Price'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {currentPrice.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">{curr}</span>
          </div>
        </div>

        {/* Margin of Safety */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'هامش الأمان' : 'Margin of Safety'}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-xl font-black font-mono tabular-nums ${
                margin > 10
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : margin < -10
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {margin > 0 ? `+${margin.toFixed(1)}%` : `${margin.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {/* Implied Growth */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'النمو السنوي الضمني' : 'Implied Growth (Reverse DCF)'}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {data.reverse_dcf_implied_growth.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Visual Fair Value Range Slider */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{isAr ? 'النطاق العادل المقدر:' : 'Estimated Fair Value Corridor:'}</span>
          <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
            {rangeLow.toFixed(2)} — {rangeHigh.toFixed(2)} {curr}
          </span>
        </div>

        {/* Track Container */}
        <div className="relative h-6 rounded-full bg-slate-100 dark:bg-slate-800/70 flex items-center px-1">
          {/* Fair Value Zone Highlight */}
          <div
            className="absolute h-3.5 rounded-full bg-slate-300 dark:bg-slate-600/70 transition-all"
            style={{
              left: `${Math.min(rangeLowPct, rangeHighPct)}%`,
              width: `${Math.abs(rangeHighPct - rangeLowPct)}%`,
            }}
          />

          {/* Fair Value Midpoint Line */}
          <div
            className="absolute top-1 bottom-1 w-0.5 bg-slate-700 dark:bg-slate-200 z-10"
            style={{ left: `${rangeMidPct}%` }}
            title={`Fair Mid: ${rangeMid.toFixed(2)}`}
          />

          {/* Current Market Price Marker */}
          <div
            className="absolute z-20 flex flex-col items-center -top-6 transform -translate-x-1/2 transition-all"
            style={{ left: `${currentPricePosPct}%` }}
          >
            <div className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-mono font-bold whitespace-nowrap shadow-md">
              {currentPrice.toFixed(2)}
            </div>
            <div className="w-1.5 h-1.5 bg-black rotate-45 -mt-0.5" />
          </div>
        </div>

        {/* Slider Axis Labels */}
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
          <span>{rangeLow.toFixed(2)} (Low)</span>
          <span className="text-slate-600 dark:text-slate-300 font-bold">{rangeMid.toFixed(2)} (Mid)</span>
          <span>{rangeHigh.toFixed(2)} (High)</span>
        </div>
      </div>

      {/* 4. Collapsible Model Breakdown Toggle */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setShowBreakdown((prev) => !prev)}
          className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'تفاصيل النماذج الحسابية الأربعة' : 'View Detailed 4-Model Valuation Breakdown'}</span>
          </span>
          {showBreakdown ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showBreakdown && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-start font-semibold">{isAr ? 'النموذج المعتمد' : 'Valuation Model'}</th>
                  <th className="py-2.5 px-3 text-start font-semibold">{isAr ? 'القيمة الناتجة' : 'Output Value'}</th>
                  <th className="py-2.5 px-3 text-start font-semibold">{isAr ? 'الوزن النسبي' : 'Weight'}</th>
                  <th className="py-2.5 px-3 text-start font-semibold">{isAr ? 'آلية الحساب' : 'Methodology'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 font-bold font-sans">
                    {isAr ? 'التدفقات النقدية المخصومة (DCF)' : 'Discounted Cash Flow (DCF)'}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {data.dcf_value.toFixed(2)} {curr}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-500">
                    {Math.round((data.model_breakdown?.dcf?.weight || 0.35) * 100)}%
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                    {data.model_breakdown?.dcf?.description || '5-Year FCF Projections + Terminal Value'}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 font-bold font-sans">
                    {isAr ? 'مضاعف الربحية النسبي (Relative P/E)' : 'Relative P/E Multiple'}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums">
                    {data.relative_pe_value.toFixed(2)} {curr}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-500">
                    {Math.round((data.model_breakdown?.pe?.weight || 0.30) * 100)}%
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                    {data.model_breakdown?.pe?.description || 'Sector Median P/E × EPS'}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 font-bold font-sans">
                    {isAr ? 'مضاعف القيمة الدفترية (Relative P/B)' : 'Relative P/B Multiple'}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums">
                    {data.relative_pb_value.toFixed(2)} {curr}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-500">
                    {Math.round((data.model_breakdown?.pb?.weight || 0.20) * 100)}%
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                    {data.model_breakdown?.pb?.description || 'Sector Median P/B × BVPS'}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 font-bold font-sans">
                    {isAr ? 'رقم بنيامين غراهام (Graham Number)' : 'Benjamin Graham Number'}
                  </td>
                  <td className="py-2.5 px-3 font-bold tabular-nums">
                    {data.graham_number.toFixed(2)} {curr}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-slate-500">
                    {Math.round((data.model_breakdown?.graham?.weight || 0.15) * 100)}%
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-500 text-[11px]">
                    √(22.5 × EPS × BVPS)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
