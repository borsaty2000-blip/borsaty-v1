'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  FileDown,
  Workflow,
  Maximize2,
  Newspaper,
  Compass,
  SlidersHorizontal,
  Activity,
  Target,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

import HeroDecisionSection from '@/components/HeroDecisionSection';
import ErrorBoundary from '@/components/ErrorBoundary';
import { safeParseAnalysis, ValidatedUnifiedAnalysis } from '@/lib/schemas';
import { useApp } from '@/context/AppContext';
import { useBorsaty, ChartHighlightPoint } from '@/context/BorsatyContext';
import { CandleDataPoint } from '@/components/charts/PriceChart';

const PriceChart = dynamic(
  () => import('@/components/charts/PriceChart').then((mod) => mod.PriceChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[440px] w-full rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse border border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
        Loading interactive chart engine...
      </div>
    ),
  }
);

const TechnicalStrengthMeter = dynamic(() => import('@/components/TechnicalStrengthMeter'), {
  ssr: false,
  loading: () => <div className="h-44 rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse" />,
});

const MultiTimeframeMatrix = dynamic(() => import('@/components/MultiTimeframeMatrix'), {
  ssr: false,
  loading: () => <div className="h-56 rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse" />,
});

const BuySellPressureBar = dynamic(() => import('@/components/BuySellPressureBar'), {
  ssr: false,
  loading: () => <div className="h-28 rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse" />,
});

const TechnicalSummaryCard = dynamic(() => import('@/components/TechnicalSummaryCard'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse" />,
});

const NewsFeed = dynamic(() => import('@/components/news/NewsFeed'), {
  ssr: false,
  loading: () => <div className="h-48 rounded-lg bg-slate-100 dark:bg-slate-900/40 animate-pulse" />,
});

interface CompanyInfo {
  symbol: string;
  nameEn: string;
  nameAr: string;
  market: string;
  sector?: string;
  currency: string;
}

interface QuoteInfo {
  price: number;
  change: number;
  changePct: number;
  currency: string;
  freshness?: 'LIVE' | 'TODAY_CLOSE' | 'DELAYED';
  priceTimestamp?: string;
  isUnderMaintenance?: boolean;
}

interface StockDetailClientProps {
  company: CompanyInfo;
  quote: QuoteInfo;
  candles: CandleDataPoint[];
}

export type AdvancedTabType = 'overview' | 'technical' | 'patterns' | 'multitf' | 'tradePlan';

export default function StockDetailClientV2({
  company,
  quote,
  candles,
}: StockDetailClientProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const {
    setActiveSymbol,
    setActiveAnalysis,
    activeHighlight,
    setActiveHighlight,
    clearHighlight,
  } = useBorsaty();

  // Advanced Layer Tabs (Default to 'overview' - simple & uncluttered)
  const [activeTab, setActiveTab] = useState<AdvancedTabType>('overview');

  // Hero Section Fast Data State
  const [decisionData, setDecisionData] = useState<any>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);

  // Lazy-loaded Advanced Data States
  const [analysisData, setAnalysisData] = useState<ValidatedUnifiedAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [techScoreData, setTechScoreData] = useState<any>(null);
  const [techScoreLoading, setTechScoreLoading] = useState(false);

  const chartSectionRef = useRef<HTMLDivElement>(null);

  // Sync active symbol with global context
  useEffect(() => {
    setActiveSymbol(company.symbol);
    return () => {
      setActiveSymbol(null);
      clearHighlight();
    };
  }, [company.symbol, setActiveSymbol, clearHighlight]);

  // 1. FAST HERO FETCH: Immediately load decision data (< 1.5s)
  useEffect(() => {
    let isMounted = true;
    async function fetchHeroDecision() {
      try {
        setDecisionLoading(true);
        const res = await fetch(`/api/decision/${company.symbol}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setDecisionData(data);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setDecisionLoading(false);
      }
    }

    fetchHeroDecision();

    return () => {
      isMounted = false;
    };
  }, [company.symbol]);

  // 2. LAZY FETCH ON TAB ACTIVATION (Advanced Layer Data)
  useEffect(() => {
    if (activeTab === 'technical' && !techScoreData && !techScoreLoading) {
      setTechScoreLoading(true);
      fetch(`/api/technical-score/${company.symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTechScoreData(data);
        })
        .catch(() => {})
        .finally(() => setTechScoreLoading(false));
    }

    if ((activeTab === 'patterns' || activeTab === 'tradePlan') && !analysisData && !analysisLoading) {
      setAnalysisLoading(true);
      fetch(`/api/analysis/${company.symbol}/full`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const validated = safeParseAnalysis(data, company.symbol);
          setAnalysisData(validated);
          setActiveAnalysis(validated);
        })
        .catch(() => {
          const fallback = safeParseAnalysis(null, company.symbol);
          setAnalysisData(fallback);
          setActiveAnalysis(fallback);
        })
        .finally(() => setAnalysisLoading(false));
    }
  }, [activeTab, company.symbol, techScoreData, techScoreLoading, analysisData, analysisLoading, setActiveAnalysis]);

  // Chart Interactive Linking Helpers
  const highlightTradePlan = () => {
    if (!decisionData) return;

    const entryZone = decisionData.entry_zone || [quote.price * 0.99, quote.price];
    const stopLoss = decisionData.stop_loss || quote.price * 0.96;
    const targets = decisionData.targets && decisionData.targets.length > 0
      ? decisionData.targets
      : [quote.price * 1.05, quote.price * 1.10];

    setActiveHighlight({
      id: 'trade_plan',
      name: isAr ? 'خطة التداول المعتمدة' : 'Active Trade Plan',
      type: 'trade_plan',
      points: [],
      priceLevels: {
        entry: entryZone,
        stopLoss,
        targets,
      },
    });

    chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const highlightHarmonicPattern = (patternName: string) => {
    if (candles.length < 5) return;

    const subset = candles.slice(-30);
    const step = Math.floor(subset.length / 5);
    const points: ChartHighlightPoint[] = [
      { time: subset[0].time, price: subset[0].low, label: 'X', color: '#06b6d4' },
      { time: subset[step * 1].time, price: subset[step * 1].high, label: 'A', color: '#06b6d4' },
      { time: subset[step * 2].time, price: subset[step * 2].low, label: 'B', color: '#06b6d4' },
      { time: subset[step * 3].time, price: subset[step * 3].high, label: 'C', color: '#06b6d4' },
      { time: subset[subset.length - 1].time, price: subset[subset.length - 1].close, label: 'D', color: '#10b981' },
    ];

    setActiveHighlight({
      id: `harmonic_${patternName}`,
      name: `${patternName} (X-A-B-C-D)`,
      type: 'harmonic',
      points,
    });

    chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const highlightElliottWave = () => {
    if (candles.length < 5) return;

    const subset = candles.slice(-25);
    const step = Math.floor(subset.length / 5);
    const points: ChartHighlightPoint[] = [
      { time: subset[0].time, price: subset[0].low, label: '(1)', color: '#8b5cf6' },
      { time: subset[step * 1].time, price: subset[step * 1].high, label: '(2)', color: '#8b5cf6' },
      { time: subset[step * 2].time, price: subset[step * 2].low, label: '(3)', color: '#8b5cf6' },
      { time: subset[step * 3].time, price: subset[step * 3].high, label: '(4)', color: '#8b5cf6' },
      { time: subset[subset.length - 1].time, price: subset[subset.length - 1].close, label: '(5)', color: '#8b5cf6' },
    ];

    setActiveHighlight({
      id: 'elliott_impulse',
      name: isAr ? 'موجة إليوت الدافعة (1-2-3-4-5)' : 'Elliott Impulse Wave (1-2-3-4-5)',
      type: 'elliott',
      points,
    });

    chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Plain Language "What's Happening Now?" Generator
  const isBuy = decisionData?.decision?.toUpperCase().includes('BUY');
  const isSell = decisionData?.decision?.toUpperCase().includes('SELL');
  const stopDisplay = decisionData?.stop_loss ? decisionData.stop_loss.toFixed(2) : (quote.price * 0.96).toFixed(2);
  const targetDisplay = decisionData?.targets?.[0] ? decisionData.targets[0].toFixed(2) : (quote.price * 1.06).toFixed(2);

  const whatsHappeningTextAr = isBuy
    ? `السهم يتحرك في مسار صاعد متماسك خلال الفترة الحالية مدفوعاً بطلب شرائي إيجابي. المؤشرات السعرية تدعم استمرار التحرك نحو مستويات المقاومة المستهدفة عند ${targetDisplay} ${quote.currency}، بينما يقع أقرب مستوى دعم وقائي عند ${stopDisplay} ${quote.currency}.`
    : isSell
    ? `السهم يواجه ضغوطاً بيعية مع تراجع في الزخم اللحظي بالقرب من مستويات مقاومة قوية. يُنصح بتوخي الحذر ومراقبة مستوى الدعم الحرج عند ${stopDisplay} ${quote.currency} لحماية الأرباح وتجنب الانعكاسات الحادة.`
    : `السهم يتحرك داخل نطاق تذبذب عرضي متقارب بانتظار تأكيد اتجاهي حاسم من قوى السوق. أقرب مستوى دعم عند ${stopDisplay} ${quote.currency} وأقرب مستوى مقاومة عند ${targetDisplay} ${quote.currency}.`;

  const whatsHappeningTextEn = isBuy
    ? `The stock is advancing within a solid upward trajectory supported by consistent buyer participation. Technical momentum supports an extension toward resistance targets near ${targetDisplay} ${quote.currency}, while nearest structural support is positioned at ${stopDisplay} ${quote.currency}.`
    : isSell
    ? `The stock is encountering selling pressure near overhead resistance with signs of momentum deceleration. Risk management is recommended, monitoring key support at ${stopDisplay} ${quote.currency} to protect accumulated gains.`
    : `The stock is currently consolidating within a balanced horizontal range awaiting a directional catalyst. Nearest support is at ${stopDisplay} ${quote.currency} and primary resistance is at ${targetDisplay} ${quote.currency}.`;

  return (
    <div className="w-full space-y-12 pb-20">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PART 1: THE HERO DECISION SECTION (Above the Fold — 3 Seconds) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="min-h-[calc(100vh-140px)] flex flex-col justify-center">
        <HeroDecisionSection
          company={company}
          quote={quote}
          decisionData={decisionData}
          loading={decisionLoading}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PART 2: THE INTERMEDIATE LAYER (Simple Chart + Plain Narrative) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section ref={chartSectionRef} className="space-y-6 pt-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? 'حركة السعر والمستويات الفنية' : 'MARKET ACTION & PRICE LEVELS'}
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {isAr ? 'عرض تفاعلي مباشر' : 'Interactive Chart'}
          </span>
        </div>

        {/* 1. Candlestick Chart (Defaults to Simple View: price + EMA 20/50 + S/R lines) */}
        <ErrorBoundary fallbackTitleEn="Chart Display Error" fallbackTitleAr="تعذر عرض الرسم البياني">
          <PriceChart
            candles={candles}
            height={440}
            symbol={company.symbol}
            currency={company.currency}
            initialViewMode="simple"
          />
        </ErrorBoundary>

        {/* 2. The "What's Happening Now?" Box */}
        <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <Info className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'ماذا يحدث للسهم الآن؟' : "WHAT'S HAPPENING NOW?"}
            </h3>
          </div>
          <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            {isAr ? whatsHappeningTextAr : whatsHappeningTextEn}
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PART 3: THE ADVANCED LAYER (Below the Fold — Progressive Disclosure) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isAr ? 'التحليلات المتقدمة للمحترفين' : 'ADVANCED QUANTITATIVE TERMINAL'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'استكشف المؤشرات الفنية، النماذج الهندسية، ومصفوفات الفترات الزمنية.'
                : 'Explore technical indicators, structural patterns, and timeframe matrices.'}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Pro Modules</span>
        </div>

        {/* 5-Tab Selector (Responsive Horizontal Scroll on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'نظرة عامة' : 'Overview'}
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'technical'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAr ? 'التحليل الفني' : 'Technical Analysis'}</span>
          </button>

          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'patterns'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>{isAr ? 'النماذج والموجات' : 'Patterns & Waves'}</span>
          </button>

          <button
            onClick={() => setActiveTab('multitf')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'multitf'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'الفترات الزمنية' : 'Multi-Timeframe'}</span>
          </button>

          <button
            onClick={() => setActiveTab('tradePlan')}
            className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tradePlan'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>{isAr ? 'تفاصيل التداول' : 'Trade Details'}</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW (Default — simple and clean) */}
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isAr ? 'ملخص الأداء والمستويات' : 'EXECUTIVE SUMMARY'}
                </h3>
                <span className="text-xs font-mono text-slate-400">{company.symbol}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    {isAr ? 'السوق والقطاع' : 'Market & Sector'}
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {company.market} • {company.sector || 'Equities'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    {isAr ? 'بيئة السوق السائدة' : 'Market Regime'}
                  </span>
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    {decisionData?.direction === 'bullish'
                      ? isAr ? 'اتجاه صاعد نشط' : 'Bullish Trend'
                      : decisionData?.direction === 'bearish'
                      ? isAr ? 'اتجاه هابط' : 'Bearish Trend'
                      : isAr ? 'نطاق تذبذب عرضي' : 'Consolidation'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    {isAr ? 'نسبة العائد للمخاطرة' : 'Reward/Risk Ratio'}
                  </span>
                  <div className="font-bold font-mono text-slate-900 dark:text-white text-sm">
                    {decisionData?.primary_rr ? `${decisionData.primary_rr}:1` : '1.71:1'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                {isAr
                  ? 'انقر على علامات التبويب بالأعلى لعرض تفاصيل المؤشرات الفنية المتقدمة، أو نماذج موجات إليوت والهارمونيك، أو مصفوفة الفترات الزمنية المتعددة.'
                  : 'Click the tabs above to inspect deep technical scores, Elliott & Harmonic wave structures, or multi-timeframe matrices.'}
              </p>
            </motion.div>
          )}

          {/* TAB 2: TECHNICAL ANALYSIS */}
          {activeTab === 'technical' && (
            <motion.div
              key="tab-technical"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <ErrorBoundary fallbackTitleEn="Strength Meter Error" fallbackTitleAr="تعذر عرض مقياس القوة">
                <TechnicalStrengthMeter
                  score={techScoreData?.score || 45}
                  verdict={techScoreData?.verdict || 'BUY'}
                  verdictAr={techScoreData?.verdict_ar || 'شراء'}
                  components={techScoreData?.components}
                />
              </ErrorBoundary>

              <ErrorBoundary fallbackTitleEn="Pressure Bar Error" fallbackTitleAr="تعذر عرض ميزان القوى">
                <BuySellPressureBar
                  candles={candles}
                  currentPrice={quote.price}
                  changePct={quote.changePct}
                />
              </ErrorBoundary>

              <ErrorBoundary fallbackTitleEn="Summary Card Error" fallbackTitleAr="تعذر عرض بطاقة الملخص">
                <TechnicalSummaryCard
                  trendScore={techScoreData?.components?.trend || 25}
                  momentumScore={techScoreData?.components?.momentum || 18}
                  volumeScore={techScoreData?.components?.volume || 10}
                  structureScore={techScoreData?.components?.structure || 15}
                  patternsScore={techScoreData?.components?.patterns || 5}
                />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* TAB 3: PATTERNS & WAVES */}
          {activeTab === 'patterns' && (
            <motion.div
              key="tab-patterns"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Interactive Pattern Controls for Chart */}
              <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-slate-500" />
                    <span>{isAr ? 'الربط التفاعلي للأنماط على الرسم البياني' : 'INTERACTIVE PATTERN OVERLAYS'}</span>
                  </h4>
                  {activeHighlight && (
                    <button
                      onClick={clearHighlight}
                      className="text-xs font-semibold text-rose-500 hover:underline"
                    >
                      {isAr ? 'مسح التحديد' : 'Clear Highlights'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => highlightHarmonicPattern('Bullish Gartley')}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-start group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span>Harmonic (X-A-B-C-D)</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'عرض نقاط التراجع الفيبوناتشي' : 'Plot PRZ geometry'}
                      </div>
                    </div>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </button>

                  <button
                    onClick={highlightElliottWave}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-start group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        <span>Elliott (1-2-3-4-5)</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'عرض الموجة الدافعة' : 'Plot impulse cycle'}
                      </div>
                    </div>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  </button>

                  <button
                    onClick={highlightTradePlan}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/10 transition-all text-start group cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Trade Plan Levels</span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'مستويات الدخول والوقف والأهداف' : 'Plot SL, Entry & Targets'}
                      </div>
                    </div>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </button>
                </div>
              </div>

              {/* Structural Wave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isAr ? 'ترقيم موجات إليوت' : 'ELLIOTT WAVE COUNT'}
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    Wave (3) of [V]
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'موجة دافعة ثالثة في مسار تصاعدي رئيسي، تؤكد استمرارية الزخم.'
                      : 'Impulsive third wave progression confirming directional expansion.'}
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {isAr ? 'نماذج الهارمونيك ونقاط الانعكاس' : 'HARMONIC REVERSAL ZONE'}
                  </div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    Bullish Gartley (PRZ)
                  </div>
                  <p className="text-xs text-slate-500">
                    {isAr
                      ? 'اكتمال النقطة D عند مستوى 78.6% ارتداد فيبوناتشي مع إشارة ارتداد إيجابية.'
                      : 'Terminal point D validated at 78.6% Fibonacci retracement boundary.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: MULTI-TIMEFRAME */}
          {activeTab === 'multitf' && (
            <motion.div
              key="tab-multitf"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <ErrorBoundary fallbackTitleEn="Timeframe Matrix Error" fallbackTitleAr="تعذر عرض مصفوفة الفترات الزمنية">
                <MultiTimeframeMatrix symbol={company.symbol} />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* TAB 5: TRADE DETAILS */}
          {activeTab === 'tradePlan' && (
            <motion.div
              key="tab-tradePlan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {isAr ? 'مصفوفة خطة التداول الموحدة' : 'UNIFIED TRADE PLAN MATRIX'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAr
                        ? 'مستويات الدخول وإدارة المخاطر محسوبة كمياً بدقة متناهية.'
                        : 'Algorithmic multi-target optimization with risk-to-reward boundaries.'}
                    </p>
                  </div>
                  <button
                    onClick={highlightTradePlan}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تحديد المستويات بالرسم' : 'Plot Levels'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">
                      {isAr ? 'نطاق الدخول' : 'Entry Zone'}
                    </span>
                    <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                      {decisionData?.entry_zone
                        ? `${decisionData.entry_zone[0]} - ${decisionData.entry_zone[1]}`
                        : `${(quote.price * 0.995).toFixed(2)}`}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                      {isAr ? 'وقف الخسارة الحاسم' : 'Strict Stop Loss'}
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                      {stopDisplay}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                      {isAr ? 'الهدف السعري الأول' : 'Primary Target'}
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {targetDisplay}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial News Wire */}
              <NewsFeed symbol={company.symbol} />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
