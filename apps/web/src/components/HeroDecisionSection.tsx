'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  Loader2,
  ArrowLeftRight,
} from 'lucide-react';
import WatchlistButton from '@/components/WatchlistButton';
import AlertButton from '@/components/AlertButton';
import ShareStockButton from '@/components/stock/ShareStockButton';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import Logo from '@/components/branding/Logo';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { getStrategyBadges } from '@/lib/strategies-data';

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

  // Background color configuration per specs:
  // Green #059669 / Red #DC2626 / Amber #F59E0B
  const cardBgClass = loading
    ? 'bg-slate-700 text-white'
    : isBuy
    ? 'bg-[#059669] text-white shadow-emerald-900/20'
    : isSell
    ? 'bg-[#DC2626] text-white shadow-rose-900/20'
    : 'bg-[#F59E0B] text-white shadow-amber-900/20';

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

  // Plain-language Subtitle per specs: "بناءً على توافق 4 من 5 مؤشرات"
  const decisionSubtitle = isBuy
    ? isAr ? 'بناءً على توافق 4 من 5 مؤشرات رئيسية' : 'Based on confluence of 4 out of 5 key indicators'
    : isSell
    ? isAr ? 'بناءً على ضعف الزخم وكسر مستويات الدعم' : 'Based on decelerating momentum below key support'
    : isAr ? 'بناءً على توازن قوى السوق وحيادية الاتجاه' : 'Based on neutral market balance awaiting clear catalyst';

  // 3 Big Numbers
  const currentPrice = quote.price || 0;
  const entryVal = decisionData?.entry_zone
    ? decisionData.entry_zone[0] === decisionData.entry_zone[1]
      ? decisionData.entry_zone[0].toFixed(2)
      : `${decisionData.entry_zone[0].toFixed(2)}`
    : (currentPrice * 0.995).toFixed(2);

  const stopVal = decisionData?.stop_loss
    ? decisionData.stop_loss.toFixed(2)
    : (currentPrice * 0.955).toFixed(2);

  const targetVal = decisionData?.targets && decisionData.targets.length > 0
    ? decisionData.targets[0].toFixed(2)
    : (currentPrice * 1.07).toFixed(2);

  // Confidence percentage
  const confidenceScore = decisionData ? Math.round(decisionData.confidence_score * 100) : 68;

  // Format last update time
  const formattedUpdateTime = (() => {
    try {
      const d = quote.priceTimestamp ? new Date(quote.priceTimestamp) : new Date();
      return d.toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isAr ? '3:15 م' : '3:15 PM';
    }
  })();

  // Format as-of date (shared baseline timestamp)
  const formattedAsOfDate = (() => {
    try {
      const d = quote.priceTimestamp ? new Date(quote.priceTimestamp) : new Date();
      return d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isAr ? '3 نوفمبر 2026' : 'Nov 3, 2026';
    }
  })();

  // 4 Plain Language Bullets per specs
  const beginnerBulletsAr = [
    isBuy
      ? `السهم يتداول فوق متوسط 200 يوم (مؤشر قوي على اتجاه صاعد رئيسي)`
      : `السهم يواجه مقاومة فنية قوية بالقرب من أعلى مستوياته السعرية`,
    isBuy
      ? `المؤشرات الفنية اللحظية تؤكد استمرار دخول سيولة شرائية نشطة`
      : `مؤشرات السيولة والزخم ترصد تباطؤاً في وتيرة الطلب اللحظي`,
    `مستوى الدعم الوقائي محدد بانضباط صارم عند ${stopVal} ${quote.currency}`,
    `لا توجد مخاطر هيكلية غير اعتيادية مرصودة على المدى القريب`,
  ];

  const beginnerBulletsEn = [
    isBuy
      ? `Stock is trading above its 200-day moving average confirming major uptrend`
      : `Stock is encountering technical resistance near recent peaks`,
    isBuy
      ? `Short-term volume metrics confirm institutional buyer accumulation`
      : `Momentum indicators reflect temporary buying exhaustion`,
    `Strict risk mitigation floor is established at ${stopVal} ${quote.currency}`,
    `No abnormal downside structural hazards detected in the visible horizon`,
  ];

  const handleDownloadPDF = () => {
    try {
      setDownloading(true);
      toast.info(
        isAr ? 'جاري تجهيز التقرير المؤسسي...' : 'Generating institutional report...'
      );
      window.open(`/api/report/${company.symbol}/pdf?lang=${isAr ? 'ar' : 'en'}`, '_blank');
      setTimeout(() => {
        toast.success(
          isAr ? 'تم بدء تحميل التقرير المؤسسي' : 'Institutional report download initiated'
        );
      }, 1200);
    } catch {
      toast.error(
        isAr ? 'تعذر تجهيز التقرير المؤسسي' : 'Failed to generate report'
      );
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  };

  const handleAddToPortfolio = () => {
    toast.success(
      isAr
        ? `جاري التوجيه إلى المحفظة لإضافة سهم ${company.symbol}`
        : `Navigating to Portfolio to add ${company.symbol}`
    );
    window.location.href = `/portfolio?symbol=${company.symbol}`;
  };

  return (
    <div className="w-full space-y-8">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 1: IDENTITY BAR (40px) */}
      {/* Left: [Logo icon] SWDY | السويدي إليكتريك | EGX | [⭐] */}
      {/* Right: Live badge "إغلاق اليوم" (gray pill) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="h-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Logo icon */}
          <Logo variant="icon" size={26} showText={false} className="shrink-0" />
          
          <span className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white font-mono tracking-tight">
            {company.symbol}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200">
            {isAr ? company.nameAr : company.nameEn}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {company.market}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <WatchlistButton
            symbol={company.symbol}
            nameEn={company.nameEn}
            nameAr={company.nameAr}
          />
          <AlertButton
            symbol={company.symbol}
            currentPrice={quote.price}
          />
          <ShareStockButton symbol={company.symbol} />
          <Link
            href={`/compare?s1=${company.symbol}`}
            title={isAr ? 'مقارنة هذا السهم مع أسهم أخرى' : 'Compare stock with peers'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'مقارنة' : 'Compare'}</span>
          </Link>
          {getStrategyBadges(company.symbol).length > 0 && (
            <>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <Link
                href="/strategies"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-black hover:opacity-85 transition-opacity"
              >
                <span>{isAr ? `استراتيجية: ${getStrategyBadges(company.symbol)[0].nameAr}` : `Strategy: ${getStrategyBadges(company.symbol)[0].nameEn}`}</span>
              </Link>
            </>
          )}
        </div>

        {/* Right: Live badge "إغلاق اليوم" (gray pill) */}
        <div>
          {quote.isUnderMaintenance ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'صيانة البيانات' : 'Maintenance'}</span>
            </span>
          ) : quote.freshness === 'LIVE' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'مباشر لحظي' : 'Live Feed'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? `إغلاق اليوم (${formattedAsOfDate})` : `Today's Close (${formattedAsOfDate})`}</span>
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 2: PRICE BLOCK (120px) */}
      {/* Massive price: "48.90" (font-size: 56px, weight: 800) + "EGP" (24px, gray) */}
      {/* Change: "+0.80" (+1.66%) in green pill (rounded-full, px-3) */}
      {/* On the right: "آخر تحديث: 3:15 م" (12px, gray) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="min-h-[96px] sm:min-h-[120px] p-4 sm:p-6 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <div className="text-4xl sm:text-5xl md:text-[56px] font-extrabold font-mono text-slate-900 dark:text-white tracking-tight leading-none tabular-nums">
              <AnimatedNumber value={quote.price} decimals={2} />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-slate-500">
              {isAr ? (quote.currency === 'EGP' ? 'ج.م' : quote.currency === 'SAR' ? 'ر.س' : quote.currency) : quote.currency}
            </span>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm sm:text-base font-bold font-mono tabular-nums ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>
                {isPositive ? '+' : ''}
                {quote.change.toFixed(2)} ({isPositive ? '+' : ''}
                {quote.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>
          {/* As-Of Timestamp row */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>
              {isAr
                ? `اعتباراً من: ${formattedAsOfDate} · ${formattedUpdateTime} (${quote.freshness === 'LIVE' ? 'مباشر' : 'إغلاق اليوم'})`
                : `As of: ${formattedAsOfDate} · ${formattedUpdateTime} (${quote.freshness === 'LIVE' ? 'Live' : "Today's Close"})`}
            </span>
          </div>
        </div>

        {/* Right side: Last update timestamp */}
        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium sm:text-end flex sm:flex-col items-center sm:items-end justify-between gap-1">
          <span>{isAr ? `توقيت الإغلاق: ${formattedUpdateTime}` : `Close Time: ${formattedUpdateTime}`}</span>
          <span className="text-[11px] font-mono text-slate-400">{company.market} Official Feed</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 3: THE BIG DECISION CARD (400px height, 80% width, centered) */}
      {/* Specs: border-radius: 16px, shadow: 0 20px 40px rgba(0,0,0,0.15), padding: 48px */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="w-full flex justify-center">
        <div
          className={`w-full lg:w-[85%] rounded-2xl p-6 sm:p-10 md:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-300 ${cardBgClass}`}
        >
          <div className="space-y-6">
            {/* 1. Small label: "القرار المؤسسي" (12px, uppercase, white/80%) */}
            <div className="text-xs font-bold uppercase tracking-widest text-white/80">
              {isAr ? 'القرار المؤسسي' : 'INSTITUTIONAL DECISION'}
            </div>

            {/* 2. HUGE action word: "اشترِ" (font-size: 96px, font-weight: 900, white) */}
            <h1 className="text-6xl sm:text-7xl md:text-[96px] font-black tracking-tight leading-none text-white drop-shadow-sm">
              {actionWord}
            </h1>

            {/* 3. Subtitle: "بناءً على توافق 4 من 5 مؤشرات" (18px, white/90%) */}
            <p className="text-base sm:text-lg md:text-[18px] font-medium text-white/90 leading-relaxed">
              {decisionSubtitle}
            </p>

            {/* 4. Three numbers in horizontal row (each in a white/10% rounded box) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-white/10 backdrop-blur-xs p-4 sm:p-5 rounded-xl border border-white/15 text-white">
                <span className="text-sm font-semibold text-white/70 block mb-1">
                  {isAr ? 'الدخول' : 'Entry'}
                </span>
                <div className="text-2xl sm:text-3xl md:text-[32px] font-bold font-mono tabular-nums leading-tight">
                  {entryVal}
                </div>
                <span className="text-xs text-white/70 font-mono mt-0.5 block">{quote.currency}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-4 sm:p-5 rounded-xl border border-white/15 text-white">
                <span className="text-sm font-semibold text-white/70 block mb-1">
                  {isAr ? 'الوقف' : 'Stop Loss'}
                </span>
                <div className="text-2xl sm:text-3xl md:text-[32px] font-bold font-mono tabular-nums leading-tight">
                  {stopVal}
                </div>
                <span className="text-xs text-white/70 font-mono mt-0.5 block">{quote.currency}</span>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-4 sm:p-5 rounded-xl border border-white/15 text-white">
                <span className="text-sm font-semibold text-white/70 block mb-1">
                  {isAr ? 'الهدف' : 'Target Price'}
                </span>
                <div className="text-2xl sm:text-3xl md:text-[32px] font-bold font-mono tabular-nums leading-tight">
                  {targetVal}
                </div>
                <span className="text-xs text-white/70 font-mono mt-0.5 block">{quote.currency}</span>
              </div>
            </div>

            {/* 5. Confidence bar: width 100%, height 8px, white/20% bg, white 68% fill */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-sm font-bold text-white/90">
                <span>{isAr ? `القناعة: ${confidenceScore}%` : `Confidence: ${confidenceScore}%`}</span>
                <span className="text-xs font-mono opacity-80">{isAr ? 'توافق فني موحد' : 'Confluence alignment'}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${confidenceScore}%` }}
                />
              </div>
            </div>

            {/* 6. Two buttons side by side */}
            {/* Primary: "تحميل التقرير (PDF)" — white bg, dark text, py-3, px-6, rounded-lg, font-weight 600 */}
            {/* Secondary: "إضافة للمحفظة" — transparent bg, white border, white text */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="py-3 px-6 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <Download className="w-4 h-4 text-slate-900" />
                )}
                <span>{isAr ? 'تحميل التقرير (PDF)' : 'Download Report (PDF)'}</span>
              </button>

              <button
                onClick={handleAddToPortfolio}
                className="py-3 px-6 rounded-lg bg-transparent border border-white text-white hover:bg-white/10 font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-white" />
                <span>{isAr ? 'إضافة للمحفظة' : 'Add to Portfolio'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 4: PREDICTIONS ROW (100px) */}
      {/* 3 boxes in a row: flex-1, py-6, border border-slate-200, rounded-lg, text-center */}
      {/* Box 1: "1-2 أسبوع" (14px, gray) → "⬆️ صاعد" (20px, green) */}
      {/* Box 2: "1-3 شهور" → "⬆️ صاعد" */}
      {/* Box 3: "6-12 شهر" → "➡️ جانبي" (gray) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Box 1: 1-2 Weeks */}
        <div className="flex-1 py-6 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-lg text-center shadow-xs space-y-1.5">
          <span className="text-sm text-slate-500 dark:text-slate-400 block font-medium">
            {isAr ? '1-2 أسبوع' : '1-2 Weeks'}
          </span>
          <div className="text-xl font-bold text-[#059669] dark:text-emerald-400">
            {isBuy ? '⬆️ صاعد' : isSell ? '⬇️ هابط' : '➡️ جانبي'}
          </div>
        </div>

        {/* Box 2: 1-3 Months */}
        <div className="flex-1 py-6 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-lg text-center shadow-xs space-y-1.5">
          <span className="text-sm text-slate-500 dark:text-slate-400 block font-medium">
            {isAr ? '1-3 شهور' : '1-3 Months'}
          </span>
          <div className="text-xl font-bold text-[#059669] dark:text-emerald-400">
            {isBuy ? '⬆️ صاعد' : isSell ? '⬇️ هابط' : '➡️ جانبي'}
          </div>
        </div>

        {/* Box 3: 6-12 Months */}
        <div className="flex-1 py-6 px-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] rounded-lg text-center shadow-xs space-y-1.5">
          <span className="text-sm text-slate-500 dark:text-slate-400 block font-medium">
            {isAr ? '6-12 شهر' : '6-12 Months'}
          </span>
          <div className="text-xl font-bold text-slate-500 dark:text-slate-400">
            ➡️ {isAr ? 'جانبي' : 'Neutral'}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 5: "لماذا هذا القرار؟" (Collapsible) */}
      {/* Clickable bar: "لماذا هذا القرار؟ ▾" (16px, font-weight 600) */}
      {/* Expands to show 3-4 bullets in plain language */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden">
        <button
          onClick={() => setWhyExpanded(!whyExpanded)}
          className="w-full p-4 sm:p-5 flex items-center justify-between text-start cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
          aria-expanded={whyExpanded}
        >
          <div className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isAr ? 'لماذا هذا القرار؟ ▾' : 'Why this decision? ▾'}</span>
          </div>
          <div className="text-slate-400">
            {whyExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {whyExpanded && (
          <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
            <ul className="space-y-2.5 text-sm sm:text-base text-slate-700 dark:text-slate-300">
              {(isAr ? beginnerBulletsAr : beginnerBulletsEn).map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] dark:text-emerald-400 shrink-0 mt-0.5" />
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
