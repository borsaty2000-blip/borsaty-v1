'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Gauge, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface TechnicalStrengthMeterProps {
  score: number; // -100 to +100
  verdict?: string;
  verdictAr?: string;
  components?: {
    trend: number;
    momentum: number;
    volume: number;
    structure: number;
    patterns: number;
  };
}

export default function TechnicalStrengthMeter({
  score,
  verdict = 'BUY',
  verdictAr = 'شراء',
  components,
}: TechnicalStrengthMeterProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const clampedScore = Math.max(-100, Math.min(100, Math.round(score)));
  // Percent on scale (0% = -100, 50% = 0, 100% = +100)
  const percent = ((clampedScore + 100) / 200) * 100;

  const isStrongBuy = clampedScore >= 50;
  const isBuy = clampedScore >= 15 && clampedScore < 50;
  const isStrongSell = clampedScore <= -50;
  const isSell = clampedScore <= -15 && clampedScore > -50;
  const isNeutral = !isStrongBuy && !isBuy && !isStrongSell && !isSell;

  const colorClass = isStrongBuy || isBuy
    ? 'text-emerald-500 dark:text-emerald-400'
    : isStrongSell || isSell
    ? 'text-rose-500 dark:text-rose-400'
    : 'text-slate-400';

  const bgBadge = isStrongBuy || isBuy
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    : isStrongSell || isSell
    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="w-full p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? 'مقياس القوة الفنية الكمية' : 'TECHNICAL STRENGTH METER'}
          </h3>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-black border ${bgBadge} flex items-center gap-1.5`}>
          {isStrongBuy || isBuy ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : isStrongSell || isSell ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          <span>{isAr ? verdictAr : verdict}</span>
          <span className="font-mono tabular-nums font-extrabold ms-1">
            ({clampedScore > 0 ? `+${clampedScore}` : clampedScore})
          </span>
        </div>
      </div>

      {/* Gauge Track */}
      <div className="relative pt-6 pb-2">
        {/* Needle Marker */}
        <div
          className="absolute top-0 -translate-x-1/2 transition-all duration-500 ease-out z-10 flex flex-col items-center pointer-events-none"
          style={{ left: `${percent}%` }}
        >
          <div className="px-2 py-0.5 rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black font-mono shadow-md whitespace-nowrap">
            {clampedScore > 0 ? `+${clampedScore}` : clampedScore}
          </div>
          <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-white mt-0.5" />
        </div>

        {/* Horizontal Gradient Bar */}
        <div className="h-3 w-full rounded-full bg-gradient-to-r from-rose-500 via-slate-400 to-emerald-500 shadow-inner relative overflow-hidden">
          {/* Subtle midpoint divider */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/70 dark:bg-slate-900/70 -translate-x-1/2" />
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 mt-2 px-1">
          <span className="text-rose-500">-100 ({isAr ? 'بيع قوي' : 'Strong Sell'})</span>
          <span className="text-rose-400 hidden sm:inline">-50</span>
          <span className="text-slate-400">0 ({isAr ? 'محايد' : 'Neutral'})</span>
          <span className="text-emerald-400 hidden sm:inline">+50</span>
          <span className="text-emerald-500">+100 ({isAr ? 'شراء قوي' : 'Strong Buy'})</span>
        </div>
      </div>

      {/* 5 Components Weighted Breakdown */}
      {components && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? 'الاتجاه (±30)' : 'Trend (±30)'}
            </span>
            <span className={`font-mono font-black ${components.trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {components.trend > 0 ? `+${components.trend}` : components.trend}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? 'الزخم (±25)' : 'Momentum (±25)'}
            </span>
            <span className={`font-mono font-black ${components.momentum >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {components.momentum > 0 ? `+${components.momentum}` : components.momentum}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? 'السيولة (±15)' : 'Volume (±15)'}
            </span>
            <span className={`font-mono font-black ${components.volume >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {components.volume > 0 ? `+${components.volume}` : components.volume}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? 'الهيكل (±20)' : 'Structure (±20)'}
            </span>
            <span className={`font-mono font-black ${components.structure >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {components.structure > 0 ? `+${components.structure}` : components.structure}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block mb-0.5">
              {isAr ? 'النماذج (±10)' : 'Patterns (±10)'}
            </span>
            <span className={`font-mono font-black ${components.patterns >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {components.patterns > 0 ? `+${components.patterns}` : components.patterns}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
