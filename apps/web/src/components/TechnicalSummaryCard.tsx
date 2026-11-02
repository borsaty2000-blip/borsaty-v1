'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  BarChart3,
  Workflow,
  Sparkles,
  Compass,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface TechnicalSummaryCardProps {
  trendScore?: number;
  momentumScore?: number;
  volumeScore?: number;
  structureScore?: number;
  patternsScore?: number;
  rsi?: number;
  macdCross?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  detectedPatterns?: string[];
}

export default function TechnicalSummaryCard({
  trendScore = 25,
  momentumScore = 18,
  volumeScore = 10,
  structureScore = 15,
  patternsScore = 5,
  rsi = 62,
  macdCross = 'BULLISH',
  detectedPatterns = ['Bullish Gartley', 'Ascending Triangle'],
}: TechnicalSummaryCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const cards = [
    {
      category: isAr ? 'الاتجاه الفني' : 'Trend',
      icon: Compass,
      verdict: trendScore >= 15 ? (isAr ? 'صاعد قوي' : 'Strong Bullish') : trendScore <= -15 ? (isAr ? 'هابط' : 'Bearish') : (isAr ? 'محايد' : 'Neutral'),
      score: `${trendScore > 0 ? `+${trendScore}` : trendScore} / 30`,
      detail: isAr ? 'السعر أعلى من EMA 20 و EMA 50' : 'Price > EMA 20 & EMA 50',
      isBull: trendScore > 0,
      badgeColor: trendScore > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10',
    },
    {
      category: isAr ? 'زخم الحركة' : 'Momentum',
      icon: Activity,
      verdict: momentumScore >= 12 ? (isAr ? 'زخم صاعد قوي' : 'Strong Momentum') : momentumScore <= -12 ? (isAr ? 'زخم هابط' : 'Bearish Momentum') : (isAr ? 'معتدل' : 'Moderate'),
      score: `${momentumScore > 0 ? `+${momentumScore}` : momentumScore} / 25`,
      detail: `RSI ${rsi} • MACD ${macdCross === 'BULLISH' ? (isAr ? 'تقاطع صاعد' : 'Bullish Cross') : (isAr ? 'تقاطع هابط' : 'Bearish Cross')}`,
      isBull: momentumScore > 0,
      badgeColor: momentumScore > 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10',
    },
    {
      category: isAr ? 'معدل التذبذب' : 'Volatility',
      icon: BarChart2,
      verdict: isAr ? 'تذبذب معتدل وصحي' : 'Healthy Expansion',
      score: 'ATR 1.45',
      detail: isAr ? 'نطاقات بولينجر تتسع إيجابياً' : 'Bollinger Bandwidth 4.2%',
      isBull: true,
      badgeColor: 'text-indigo-500 bg-indigo-500/10',
    },
    {
      category: isAr ? 'السيولة والأحجام' : 'Volume',
      icon: BarChart3,
      verdict: volumeScore >= 8 ? (isAr ? 'تجميع مؤسسي مرتفع' : 'High Accumulation') : volumeScore <= -8 ? (isAr ? 'تصريف بيعي' : 'Distribution') : (isAr ? 'حجم طبيعي' : 'Normal Volume'),
      score: `${volumeScore > 0 ? `+${volumeScore}` : volumeScore} / 15`,
      detail: isAr ? 'أعلى من متوسط 20 يوم بـ 1.4x' : '1.4x 20-Day Volume SMA',
      isBull: volumeScore >= 0,
      badgeColor: volumeScore >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10',
    },
    {
      category: isAr ? 'هيكل السوق (HSPD)' : 'Structure',
      icon: Workflow,
      verdict: structureScore >= 10 ? (isAr ? 'قمم وقيعان صاعدة (HH+HL)' : 'Bullish (HH + HL)') : structureScore <= -10 ? (isAr ? 'قمم وقيعان هابطة (LH+LL)' : 'Bearish (LH + LL)') : (isAr ? 'نطاق تذبذب عرضي' : 'Consolidation'),
      score: `${structureScore > 0 ? `+${structureScore}` : structureScore} / 20`,
      detail: isAr ? 'تأكيد هيكلي عبر قيعان HSPD' : 'Higher Lows validated by HSPD',
      isBull: structureScore >= 0,
      badgeColor: structureScore >= 0 ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10',
    },
    {
      category: isAr ? 'النماذج الفنية' : 'Patterns',
      icon: Sparkles,
      verdict: detectedPatterns.length > 0 ? (isAr ? 'نماذج توافقية نشطة' : 'Patterns Confirmed') : (isAr ? 'لا توجد نماذج كبرى' : 'No Major Pattern'),
      score: `${patternsScore > 0 ? `+${patternsScore}` : patternsScore} / 10`,
      detail: detectedPatterns.slice(0, 2).join(' • ') || (isAr ? 'في انتظار تشكل نماذج جديدة' : 'Awaiting confirmation'),
      isBull: patternsScore >= 0,
      badgeColor: 'text-cyan-500 bg-cyan-500/10',
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-5 transition-colors space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            {isAr ? 'ملخص المحركات الفنية والمؤشرات الكمية' : 'Technical Analysis Summary Card'}
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-medium">
          {isAr ? 'تحديث لحظي متعدد الأبعاد' : 'Multi-Dimensional Synthesis'}
        </span>
      </div>

      {/* 6 Mini-Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 space-y-2 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.badgeColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {card.category}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-black text-slate-500">
                  {card.score}
                </span>
              </div>

              <div>
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {card.verdict}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {card.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
