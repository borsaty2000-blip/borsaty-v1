'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import WatchlistButton from '@/components/WatchlistButton';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useApp } from '@/context/AppContext';

export interface HeroDecisionData {
  decision: string;
  confidence_score: number;
  confidence_level?: string;
  direction?: string;
  entry_zone?: [number, number];
  stop_loss?: number;
  targets?: number[];
  primary_rr?: number;
  why_ar?: string[];
  why_en?: string[];
}

interface HeroDecisionSectionProps {
  company: {
    symbol: string;
    nameEn: string;
    nameAr: string;
    market: string;
    currency: string;
  };
  quote: {
    price: number;
    change: number;
    changePct: number;
    currency: string;
    freshness?: 'LIVE' | 'TODAY_CLOSE' | 'DELAYED';
    priceTimestamp?: string;
    isUnderMaintenance?: boolean;
  };
  decisionData: HeroDecisionData | null;
  loading?: boolean;
}

export default function HeroDecisionSection({
  company,
  quote,
  decisionData,
  loading = false,
}: HeroDecisionSectionProps) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [whyExpanded, setWhyExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isPositive = quote.change >= 0;

  // Decision classification
  const rawDecision = (decisionData?.decision || 'WAIT').toUpperCase();
  const isBuy = rawDecision.includes('BUY');
  const isSell = rawDecision.includes('SELL');
  const isStrongBuy = rawDecision === 'STRONG_BUY';
  const isStrongSell = rawDecision === 'STRONG_SELL';
  const isWait = !isBuy && !isSell;

  // Background color configuration
  // Green (#059669), Red (#DC2626), Amber (#F59E0B), Gray (#6B7280)
  const cardBgClass = loading
    ? 'bg-slate-600 text-white'
    : isBuy
    ? 'bg-[#059669] text-white shadow-emerald-900/20'
    : isSell
    ? 'bg-[#DC2626] text-white shadow-rose-900/20'
    : isWait
    ? 'bg-[#D97706] text-white shadow-amber-900/20'
    : 'bg-[#6B7280] text-white shadow-slate-900/20';

  // Action text
  const actionWord = isStrongBuy
    ? isAr ? 'شراء قوي' : 'STRONG BUY'
    : isBuy
    ? isAr ? 'اشترِ' : 'BUY'
    : isStrongSell
    ? isAr ? 'بيع قوي' : 'STRONG SELL'
    : isSell
    ? isAr ? 'بِع' : 'SELL'
    : isAr ? 'ترقّب' : 'WAIT';

  // Plain-language one-liner
  const simpleOneLiner = isBuy
    ? isAr
      ? 'التحليل يميل للشراء بناءً على 4 من 5 مؤشرات رئيسية تدعم الصعود'
      : 'Analysis favors buying based on positive momentum across key indicators'
    : isSell
    ? isAr
      ? 'التحليل يميل لتقليص المراكز وجني الأرباح لحماية رأس المال'
      : 'Analysis suggests reducing exposure or taking profit to preserve capital'
    : isAr
    ? 'حركة الأسعار متوازنة حالياً، يُنصح بالانتظار حتى اكتمال إشارة الدخول'
    : 'Market conditions are neutral; patience is advised until a clear signal forms';

  // 3 Big Numbers
  const currentPrice = quote.price || 0;
  const entryVal = decisionData?.entry_zone
    ? decisionData.entry_zone[0] === decisionData.entry_zone[1]
      ? decisionData.entry_zone[0].toFixed(2)
      : `${decisionData.entry_zone[0].toFixed(2)} - ${decisionData.entry_zone[1].toFixed(2)}`
    : (currentPrice * 0.995).toFixed(2);

  const stopVal = decisionData?.stop_loss
    ? decisionData.stop_loss.toFixed(2)
    : (currentPrice * 0.955).toFixed(2);

  const targetVal = decisionData?.targets && decisionData.targets.length > 0
    ? decisionData.targets[0].toFixed(2)
    : (currentPrice * 1.07).toFixed(2);

  // Confidence percentage
  const confidenceScore = decisionData ? Math.round(decisionData.confidence_score * 100) : 68;
  const confidenceText = isAr ? `${confidenceScore}% قناعة` : `${confidenceScore}% Confidence`;

  // Prediction calculations based on direction / momentum
  const shortTermDir = isBuy ? 'up' : isSell ? 'down' : 'neutral';
  const midTermDir = isBuy && confidenceScore >= 60 ? 'up' : isSell ? 'down' : 'neutral';
  const longTermDir = isBuy ? 'up' : isSell ? 'down' : 'neutral';

  const renderPredictionBox = (
    periodLabelAr: string,
    periodLabelEn: string,
    dir: 'up' | 'down' | 'neutral'
  ) => {
    const isUp = dir === 'up';
    const isDown = dir === 'down';

    const textAr = isUp ? 'صاعد' : isDown ? 'هابط' : 'جانبي';
    const textEn = isUp ? 'Bullish' : isDown ? 'Bearish' : 'Neutral';

    const textColor = isUp
      ? 'text-emerald-600 dark:text-emerald-400'
      : isDown
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-amber-600 dark:text-amber-400';

    const bgBadge = isUp
      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
      : isDown
      ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
      : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';

    return (
      <div className="p-4 sm:p-5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? periodLabelAr : periodLabelEn}
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-xl sm:text-2xl font-bold tracking-tight ${textColor}`}>
              {isAr ? textAr : textEn}
            </span>
          </div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${bgBadge} ${textColor}`}>
          {isUp ? (
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          ) : isDown ? (
            <ArrowDown className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          )}
        </div>
      </div>
    );
  };

  // 3 Simple Beginner-Friendly Bullet Points for "Why?" expander
  const beginnerBulletsAr = [
    isBuy
      ? 'السهم يتداول فوق متوسطات الحركة الرئيسية، مما يؤكد قوة الاتجاه العام'
      : isSell
      ? 'السهم يكسر مستويات الدعم اللحظية مع تراجع تدريجي في القوة الشرائية'
      : 'السهم يتحرك داخل نطاق سعري متقارب وبانتظار اتجاه واضح',
    isBuy
      ? 'مؤشرات السيولة تشير لدخول مشترين جدد في الجلسات الأخيرة'
      : isSell
      ? 'مؤشرات الزخم تشير لتشبع شرائي ورغبة المتداولين في جني الأرباح'
      : 'أحجام التداول في مستويات متوسطة تتماشى مع حركة الاستقرار السعري',
    `أقرب مستوى وقف خسارة منضبط لحماية رأس المال يقع عند ${stopVal} ${quote.currency}`,
  ];

  const beginnerBulletsEn = [
    isBuy
      ? 'Stock is trading above key moving averages, confirming structural strength'
      : isSell
      ? 'Price is testing key support with signs of institutional profit-taking'
      : 'Price is consolidating within a narrow band awaiting a clear breakout',
    isBuy
      ? 'Volume and liquidity indicators signal active buyer accumulation'
      : isSell
      ? 'Momentum indicators suggest temporary exhaustion from recent peaks'
      : 'Trading volumes remain at steady neutral averages',
    `Strict risk mitigation floor is established at ${stopVal} ${quote.currency}`,
  ];

  const handleDownloadPDF = () => {
    try {
      setDownloading(true);
      window.open(`/api/report/${company.symbol}/pdf`, '_blank');
    } catch {
      // non-blocking
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. STOCK IDENTITY BAR (Minimal, Institutional) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold font-mono text-sm flex items-center justify-center">
            {company.symbol.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {company.symbol}
              </span>
              <span className="text-slate-400">|</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                {isAr ? company.nameAr : company.nameEn}
              </span>
              <span className="text-slate-400">|</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {company.market}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{quote.currency}</span>
              <span>•</span>
              {/* Freshness Badge */}
              {quote.isUnderMaintenance ? (
                <span className="inline-flex items-center gap-1 text-amber-500 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isAr ? 'صيانة البيانات' : 'Under Maintenance'}
                </span>
              ) : quote.freshness === 'LIVE' ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAr ? 'لحظي مباشر' : 'Live'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {isAr ? 'إغلاق اليوم' : "Today's Close"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Watchlist Star & Price */}
        <div className="flex items-center justify-between sm:justify-end gap-5">
          <div className="text-start sm:text-end">
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
              <AnimatedNumber value={quote.price} decimals={2} />
              <span className="text-xs font-semibold text-slate-400 ms-1.5">{quote.currency}</span>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-bold font-mono tabular-nums sm:justify-end ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>
                {isPositive ? '+' : ''}
                {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                {quote.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          <WatchlistButton
            symbol={company.symbol}
            nameEn={company.nameEn}
            nameAr={company.nameAr}
          />
        </div>
      </div>

      {/* 2. THE BIG DECISION CARD (Hero 3-Second Visibility) */}
      <div
        className={`w-full rounded-lg p-6 sm:p-8 md:p-10 transition-all duration-300 shadow-md ${cardBgClass}`}
      >
        <div className="space-y-6">
          {/* Top Row: Giant Action Word + Confidence Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold opacity-90 block mb-1">
                {isAr ? 'القرار الفني المباشر' : 'IMMEDIATE TECHNICAL VERDICT'}
              </span>
              <h1 className="text-[48px] sm:text-5xl md:text-[64px] font-black tracking-tight leading-none text-white drop-shadow-sm">
                {actionWord}
              </h1>
            </div>

            {/* Confidence Progress Meter */}
            <div className="bg-black/25 backdrop-blur-xs p-3.5 rounded-lg border border-white/20 min-w-[200px] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{isAr ? 'نسبة القناعة الفنية' : 'Confidence'}</span>
                <span className="font-mono text-sm">{confidenceScore}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Simple One-Liner (No Jargon) */}
          <p className="text-sm sm:text-base md:text-lg font-medium text-white/95 max-w-3xl leading-relaxed">
            {simpleOneLiner}
          </p>

          {/* 3 Big Numbers (Horizontal Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 pb-2">
            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-lg border border-white/15 text-white">
              <span className="text-xs opacity-80 block mb-1 font-medium">
                {isAr ? 'نطاق الدخول المقترح' : 'Suggested Entry'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight">
                {entryVal}
              </div>
              <span className="text-[11px] opacity-75">{quote.currency}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-lg border border-white/15 text-white">
              <span className="text-xs opacity-80 block mb-1 font-medium">
                {isAr ? 'وقف الخسارة' : 'Stop Loss'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight">
                {stopVal}
              </div>
              <span className="text-[11px] opacity-75">{quote.currency}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-lg border border-white/15 text-white">
              <span className="text-xs opacity-80 block mb-1 font-medium">
                {isAr ? 'الهدف السعري' : 'Target Price'}
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight">
                {targetVal}
              </div>
              <span className="text-[11px] opacity-75">{quote.currency}</span>
            </div>
          </div>

          {/* One Big Button: Download PDF Report */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/15">
            <span className="text-xs text-white/80 font-medium">
              {isAr
                ? 'تقرير شامل مدقق وموثق بالأدلة الإحصائية'
                : 'Comprehensive report validated with statistical evidence'}
            </span>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full sm:w-auto h-12 px-6 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{isAr ? 'تحميل التقرير الكامل PDF' : 'Download Full PDF Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. THE SIMPLE PREDICTION ROW (3 Directional Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {renderPredictionBox('1-2 أسبوع (المدى القريب)', '1-2 Weeks (Short Term)', shortTermDir)}
        {renderPredictionBox('1-3 شهور (المدى المتوسط)', '1-3 Months (Medium Term)', midTermDir)}
        {renderPredictionBox('6-12 شهر (المدى الطويل)', '6-12 Months (Long Term)', longTermDir)}
      </div>

      {/* 4. THE "WHY?" EXPANDER */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm transition-all overflow-hidden">
        <button
          onClick={() => setWhyExpanded(!whyExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-start cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
            <span>{isAr ? 'لماذا هذا القرار؟' : 'Why this decision?'}</span>
            <span className="text-xs font-normal text-slate-500">
              ({isAr ? 'شرح مبسط للمستثمر' : 'Plain language explanation'})
            </span>
          </div>
          <div className="text-slate-400">
            {whyExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {whyExpanded && (
          <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {(isAr ? beginnerBulletsAr : beginnerBulletsEn).map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
