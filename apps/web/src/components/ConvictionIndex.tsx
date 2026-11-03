'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ConvictionData } from '@/app/api/market/conviction/route';

const FALLBACK_CONVICTION: ConvictionData = {
  score: 42,
  normalizedScore: 71,
  regime: 'GREED',
  labelAr: 'السوق الآن: متفائل وإيجابي (+42/100)',
  labelEn: 'Market Regime: Bullish Optimism (+42/100)',
  bullishCount: 16,
  neutralCount: 6,
  bearishCount: 3,
  totalEvaluated: 25,
  updatedAt: new Date().toISOString(),
};

export default function ConvictionIndex() {
  const { language } = useApp();
  const [data, setData] = useState<ConvictionData>(FALLBACK_CONVICTION);
  const [loading, setLoading] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    let isMounted = true;
    async function fetchConviction() {
      try {
        const res = await fetch('/api/market/conviction');
        if (res.ok) {
          const resData = await res.json();
          if (isMounted && typeof resData.score === 'number') {
            setData(resData);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchConviction();
  }, []);

  // Map score [-100, +100] to angle [-90, +90] deg
  const needleAngle = Math.max(-90, Math.min(90, (data.score / 100) * 90));

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
      {/* Left side: Context & Quantitative Metrics */}
      <div className="space-y-4 max-w-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'مؤشر قناعة السوق العامة (Conviction Index)' : 'Market Conviction Index'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'مقياس إجمالي للزخم والسيولة محسوب من متوسط الدرجات الفنية لـ 25 سهماً قيادياً'
                : 'Aggregated macro regime derived from 25 leading equities across EGX, TASI, and US markets'}
            </p>
          </div>
        </div>

        {/* Big Status Banner */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
          <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
            {isAr ? data.labelAr : data.labelEn}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-mono">
            <span>
              {isAr ? `تم تقييم ${data.totalEvaluated} أصل مالي قيادي` : `${data.totalEvaluated} benchmark assets evaluated`}
            </span>
            <span>•</span>
            <span className="text-[#059669] font-bold">
              {data.score > 0 ? `+${data.score}` : data.score}/100
            </span>
          </div>
        </div>

        {/* 3 Sub-Pills: Bullish, Neutral, Bearish */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center gap-1 text-[#059669] font-bold text-xs mb-0.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isAr ? 'صاعد' : 'Bullish'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
              {data.bullishCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round((data.bullishCount / data.totalEvaluated) * 100)}%
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center gap-1 text-slate-500 font-bold text-xs mb-0.5">
              <Minus className="w-3.5 h-3.5" />
              <span>{isAr ? 'محايد' : 'Neutral'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
              {data.neutralCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round((data.neutralCount / data.totalEvaluated) * 100)}%
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-center gap-1 text-[#DC2626] font-bold text-xs mb-0.5">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{isAr ? 'هابط' : 'Bearish'}</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
              {data.bearishCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {Math.round((data.bearishCount / data.totalEvaluated) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Semicircular Speedometer Gauge */}
      <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto">
        <div className="relative w-72 h-40 flex items-end justify-center select-none overflow-hidden">
          <svg viewBox="0 0 200 115" className="w-72 h-40 overflow-visible">
            <defs>
              {/* Speedometer Arc Gradient: Red (Fear) -> Gray (Neutral) -> Green (Greed) */}
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#DC2626" />
                <stop offset="25%" stopColor="#E11D48" />
                <stop offset="50%" stopColor="#94A3B8" />
                <stop offset="75%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              {/* Shadow filter for needle */}
              <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" />
              </filter>
            </defs>

            {/* Background Arc Track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="14"
              strokeLinecap="round"
              className="dark:stroke-slate-800"
            />

            {/* Colored Gauge Arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Semicircle Ticks */}
            {/* -100 (Fear) */}
            <text x="18" y="112" fontSize="7" fontWeight="bold" fill="#DC2626" textAnchor="middle" fontFamily="monospace">
              -100
            </text>
            {/* 0 (Neutral) */}
            <text x="100" y="12" fontSize="7" fontWeight="bold" fill="#64748b" textAnchor="middle" fontFamily="monospace">
              0
            </text>
            {/* +100 (Greed) */}
            <text x="182" y="112" fontSize="7" fontWeight="bold" fill="#059669" textAnchor="middle" fontFamily="monospace">
              +100
            </text>

            {/* Animated Speedometer Needle */}
            <g
              transform={`translate(100, 100) rotate(${needleAngle})`}
              style={{ transition: 'transform 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Needle Body pointing straight UP at angle 0 */}
              <polygon
                points="-3,5 3,5 1,-70 -1,-70"
                fill="#0f172a"
                className="dark:fill-white"
                filter="url(#needleShadow)"
              />
              {/* Needle Pivot Cap */}
              <circle cx="0" cy="0" r="7" fill="#0f172a" className="dark:fill-white" />
              <circle cx="0" cy="0" r="3" fill="#ffffff" className="dark:fill-slate-900" />
            </g>
          </svg>
        </div>

        {/* Gauge Footer Labels */}
        <div className="w-72 flex items-center justify-between text-[11px] font-bold font-mono text-slate-500 px-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[#DC2626]">{isAr ? 'خوف / حذر' : 'Fear / Defensive'}</span>
          <span className="text-slate-400">{isAr ? 'حياد' : 'Neutral'}</span>
          <span className="text-[#059669]">{isAr ? 'طمع / تفاؤل' : 'Greed / Bullish'}</span>
        </div>
      </div>
    </div>
  );
}
