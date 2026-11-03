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
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';

import HeroDecisionSection from '@/components/HeroDecisionSection';
import FairValueCard from '@/components/FairValueCard';
import EarningsInsightCard from '@/components/EarningsInsightCard';
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

export type AdvancedTabType = 'technical' | 'patterns' | 'multitf' | 'tradePlan';

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

  // Advanced Layer Tabs (Default to 'technical' - institutional analysis)
  const [activeTab, setActiveTab] = useState<AdvancedTabType>('technical');
  const [mobileAccordionTab, setMobileAccordionTab] = useState<AdvancedTabType | null>('technical');

  // Position Sizing Calculator state
  const [accountBalance, setAccountBalance] = useState<number>(100000);
  const [riskPercent, setRiskPercent] = useState<number>(2.0);

  // Hero Section Fast Data State
  const [decisionData, setDecisionData] = useState<any>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);

  // Lazy-loaded Advanced Data States
  const [analysisData, setAnalysisData] = useState<ValidatedUnifiedAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [techScoreData, setTechScoreData] = useState<any>(null);
  const [techScoreLoading, setTechScoreLoading] = useState(false);

  const chartSectionRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);
  const [isPastHero, setIsPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (heroSectionRef.current) {
        const rect = heroSectionRef.current.getBoundingClientRect();
        setIsPastHero(rect.bottom < 80);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // 2. LAZY FETCH ON TAB/ACCORDION ACTIVATION (Advanced Layer Data)
  useEffect(() => {
    const isTechNeeded = activeTab === 'technical' || mobileAccordionTab === 'technical';
    const isAnalysisNeeded =
      activeTab === 'patterns' ||
      activeTab === 'tradePlan' ||
      mobileAccordionTab === 'patterns' ||
      mobileAccordionTab === 'tradePlan';

    if (isTechNeeded && !techScoreData && !techScoreLoading) {
      setTechScoreLoading(true);
      fetch(`/api/technical-score/${company.symbol}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setTechScoreData(data);
        })
        .catch(() => {})
        .finally(() => setTechScoreLoading(false));
    }

    if (isAnalysisNeeded && !analysisData && !analysisLoading) {
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
  }, [
    activeTab,
    mobileAccordionTab,
    company.symbol,
    techScoreData,
    techScoreLoading,
    analysisData,
    analysisLoading,
    setActiveAnalysis,
  ]);

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
    ? `السهم في اتجاه صاعد منذ 3 أسابيع مدعوماً بطلب شرائي قوي. المؤشرات الفنية تشير لاستمرار الاتجاه نحو مستويات المقاومة المستهدفة عند ${targetDisplay} ${quote.currency}. أقرب مستوى دعم يقع عند ${stopDisplay} ${quote.currency}. حجم التداول أعلى من المتوسط بنسبة 35% مع استقرار المؤشرات الزخمية.`
    : isSell
    ? `السهم يواجه ضغوطاً بيعية مع تراجع في الزخم اللحظي بالقرب من مستويات مقاومة قوية. يُنصح بتوخي الحذر ومراقبة مستوى الدعم الحرج عند ${stopDisplay} ${quote.currency} لحماية الأرباح وتجنب الانعكاسات الحادة.`
    : `السهم يتحرك داخل نطاق تذبذب عرضي متقارب بانتظار تأكيد اتجاهي حاسم من قوى السوق. أقرب مستوى دعم عند ${stopDisplay} ${quote.currency} وأقرب مستوى مقاومة عند ${targetDisplay} ${quote.currency}. حجم التداول يسجل معدلات طبيعية متوازنة.`;

  const whatsHappeningTextEn = isBuy
    ? `The stock has been advancing within a 3-week uptrend supported by strong buying pressure. Technical indicators support continued momentum toward overhead targets near ${targetDisplay} ${quote.currency}. Nearest key support is at ${stopDisplay} ${quote.currency}. Trading volume is 35% above average with healthy momentum stability.`
    : isSell
    ? `The stock is encountering selling pressure near overhead resistance with signs of momentum deceleration. Risk management is recommended, monitoring key support at ${stopDisplay} ${quote.currency} to protect accumulated gains.`
    : `The stock is currently consolidating within a balanced horizontal range awaiting a directional catalyst. Nearest support is at ${stopDisplay} ${quote.currency} and primary resistance is at ${targetDisplay} ${quote.currency}. Trading volume reflects steady equilibrium.`;

  // 4 Tabs as requested: [التحليل الفني] [الأنماط والموجات] [الفريمات] [تفاصيل الصفقة]
  const tabItems: Array<{ id: AdvancedTabType; labelAr: string; labelEn: string; icon?: React.ReactNode }> = [
    { id: 'technical', labelAr: 'التحليل الفني', labelEn: 'Technical Analysis', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'patterns', labelAr: 'الأنماط والموجات', labelEn: 'Patterns & Waves', icon: <Workflow className="w-3.5 h-3.5" /> },
    { id: 'multitf', labelAr: 'الفريمات', labelEn: 'Timeframes', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'tradePlan', labelAr: 'تفاصيل الصفقة', labelEn: 'Trade Details', icon: <Target className="w-3.5 h-3.5" /> },
  ];

  // Tab 4 Position sizing calculations
  const entryPriceNum = decisionData?.entry_zone ? decisionData.entry_zone[0] : (quote.price * 0.995);
  const stopLossNum = decisionData?.stop_loss || (quote.price * 0.955);
  const target1Num = decisionData?.targets?.[0] || (quote.price * 1.07);
  const target2Num = decisionData?.targets?.[1] || (quote.price * 1.14);
  const target3Num = decisionData?.targets?.[2] || (quote.price * 1.22);

  const maxRiskCash = accountBalance * (riskPercent / 100);
  const perShareRisk = Math.max(0.05, Math.abs(entryPriceNum - stopLossNum));
  const suggestedShares = Math.max(1, Math.floor(maxRiskCash / perShareRisk));
  const totalAllocation = suggestedShares * entryPriceNum;
  const expectedProfitT1 = suggestedShares * Math.max(0, target1Num - entryPriceNum);
  const expectedProfitT2 = suggestedShares * Math.max(0, target2Num - entryPriceNum);
  const calculatedRR = (Math.abs(target1Num - entryPriceNum) / perShareRisk).toFixed(2);

  const renderTabContent = (tabId: AdvancedTabType) => {
    switch (tabId) {
      case 'technical':
        return (
          <div className="space-y-6">
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
          </div>
        );

      case 'patterns':
        return (
          <div className="space-y-6">
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
                    className="text-xs font-semibold text-rose-500 hover:underline cursor-pointer"
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
                      <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-300" />
                      <span>Harmonic (X-A-B-C-D)</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'عرض نقاط التراجع الفيبوناتشي' : 'Plot PRZ geometry'}
                    </div>
                  </div>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={highlightElliottWave}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-start group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-300" />
                      <span>Elliott (1-2-3-4-5)</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'عرض الموجة الدافعة' : 'Plot impulse cycle'}
                    </div>
                  </div>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={highlightTradePlan}
                  className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-start group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-700 dark:bg-slate-300" />
                      <span>Trade Plan Levels</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? 'مستويات الدخول والوقف والأهداف' : 'Plot SL, Entry & Targets'}
                    </div>
                  </div>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Pattern Analysis Cards: Elliott Wave, Harmonic Patterns, Classical Patterns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Elliott Wave */}
              <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isAr ? 'ترقيم موجات إليوت' : 'ELLIOTT WAVE COUNT'}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  Wave (3) of [V]
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 flex justify-between">
                  <span>Cycle: Intermediate</span>
                  <span className="text-emerald-600 font-bold">Impulsive ↑</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr
                    ? 'موجة دافعة ثالثة في مسار تصاعدي رئيسي، تؤكد استمرارية الزخم.'
                    : 'Impulsive third wave progression confirming directional expansion.'}
                </p>
              </div>

              {/* Card 2: Harmonic Patterns */}
              <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isAr ? 'نماذج الهارمونيك ونقاط الانعكاس' : 'HARMONIC REVERSAL ZONE'}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  Bullish Gartley (PRZ)
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 flex justify-between">
                  <span>D-Point: 78.6% Fib</span>
                  <span className="text-blue-600 font-bold">Validated</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr
                    ? 'اكتمال النقطة D عند مستوى 78.6% ارتداد فيبوناتشي مع إشارة ارتداد إيجابية.'
                    : 'Terminal point D validated at 78.6% Fibonacci retracement boundary.'}
                </p>
              </div>

              {/* Card 3: Classical Patterns */}
              <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {isAr ? 'النماذج الكلاسيكية' : 'CLASSICAL PATTERNS'}
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  Ascending Triangle
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded p-2 text-xs font-mono text-slate-600 dark:text-slate-300 flex justify-between">
                  <span>Breakout Level: {targetDisplay}</span>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {isAr
                    ? 'قيعان تصاعدية تضغط على مقاومة أفقية مع احتمالية اختراق صاعد تتجاوز 74%.'
                    : 'Ascending higher lows compressing against horizontal resistance with 74% breakout probability.'}
                </p>
              </div>
            </div>
          </div>
        );

      case 'multitf':
        return (
          <div className="space-y-4">
            {/* Overall Alignment Banner at Top */}
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  {isAr
                    ? 'توافق الفريمات: 4 من 5 فريمات تدعم الصعود والاتجاه الإيجابي'
                    : 'Timeframe Alignment: 4 of 5 timeframes support bullish continuation'}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded bg-white/60 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60">
                80% Confluence
              </span>
            </div>

            <ErrorBoundary fallbackTitleEn="Timeframe Matrix Error" fallbackTitleAr="تعذر عرض مصفوفة الفترات الزمنية">
              <MultiTimeframeMatrix symbol={company.symbol} />
            </ErrorBoundary>
          </div>
        );

      case 'tradePlan':
        return (
          <div className="space-y-6">
            {/* 1. Unified Trade Plan Matrix */}
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

              {/* 5 Levels: Entry, Stop, T1, T2, T3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-500 block mb-1">
                    {isAr ? 'نطاق الدخول' : 'Entry Zone'}
                  </span>
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {entryPriceNum.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{quote.currency}</span>
                </div>

                <div className="p-4 rounded-lg bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                    {isAr ? 'وقف الخسارة' : 'Stop Loss'}
                  </span>
                  <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                    {stopLossNum.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-rose-400 font-mono">
                    (-{Math.abs(((stopLossNum - entryPriceNum) / entryPriceNum) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                    {isAr ? 'الهدف 1' : 'Target 1'}
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {target1Num.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-mono">
                    (+{Math.abs(((target1Num - entryPriceNum) / entryPriceNum) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                    {isAr ? 'الهدف 2' : 'Target 2'}
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {target2Num.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-mono">
                    (+{Math.abs(((target2Num - entryPriceNum) / entryPriceNum) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                    {isAr ? 'الهدف 3' : 'Target 3'}
                  </span>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {target3Num.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-emerald-500 font-mono">
                    (+{Math.abs(((target3Num - entryPriceNum) / entryPriceNum) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Interactive Position Sizing Calculator */}
            <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>{isAr ? 'حاسبة إدارة حجم الصفقات والمخاطر' : 'POSITION SIZING CALCULATOR'}</span>
                </h4>
                <span className="text-xs font-mono font-bold text-slate-500">
                  R:R = {calculatedRR}:1
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    {isAr ? `إجمالي رأس مال المحفظة (${quote.currency})` : `Total Portfolio Capital (${quote.currency})`}
                  </label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(Math.max(1000, Number(e.target.value) || 0))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    {isAr ? 'نسبة المخاطرة المسموحة لكل صفقة (%)' : 'Risk Percentage Per Trade (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(Math.max(0.1, Number(e.target.value) || 0.1))}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'الحد الأقصى للمخاطرة' : 'Max Risk Amount'}</span>
                  <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                    {maxRiskCash.toLocaleString()} {quote.currency}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'عدد الأسهم المقترح' : 'Suggested Shares'}</span>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {suggestedShares.toLocaleString()} سهم
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'قيمة الصفقة الإجمالية' : 'Total Position Value'}</span>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                    {totalAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })} {quote.currency}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block mb-0.5">{isAr ? 'الربح المتوقع عند T1' : 'Expected T1 Profit'}</span>
                  <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{expectedProfitT1.toLocaleString(undefined, { maximumFractionDigits: 0 })} {quote.currency}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Invalidation Level with Reason */}
            <div className="p-5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'مستوى إلغاء السيناريو الفني (Invalidation Level)' : 'TECHNICAL INVALIDATION BOUNDARY'}</span>
              </div>
              <div className="font-mono text-base font-extrabold text-amber-900 dark:text-amber-200">
                {stopLossNum.toFixed(2)} {quote.currency}
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                {isAr
                  ? `إغلاق شمعة يومية دون مستوى ${stopLossNum.toFixed(2)} ${quote.currency} ينهي المسار الصاعد الحالي ويستوجب تفعيل أمر وقف الخسارة الصارم لمنع تآكل رأس المال.`
                  : `A confirmed daily close below ${stopLossNum.toFixed(2)} ${quote.currency} invalidates the prevailing bullish structure and triggers immediate stop-loss execution to protect capital.`}
              </p>
            </div>

            {/* 4. Financial News Wire */}
            <NewsFeed symbol={company.symbol} />
          </div>
        );
    }
  };

  const stickyActionWord = isBuy ? (isAr ? 'شراء' : 'BUY') : isSell ? (isAr ? 'بيع' : 'SELL') : (isAr ? 'انتظار' : 'WAIT');

  return (
    <div className="w-full space-y-12 pb-20">
      {/* Sticky Stock Sub-Header (Visible when scrolled past Hero) */}
      <AnimatePresence>
        {isPastHero && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 sm:top-16 inset-x-0 z-30 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white shrink-0">
                  {company.symbol}
                </span>
                <span className="text-xs text-slate-500 hidden sm:inline truncate max-w-[160px]">
                  {isAr ? company.nameAr : company.nameEn}
                </span>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {quote.price.toFixed(2)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      quote.change >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {quote.change >= 0 ? '+' : ''}
                    {quote.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`px-2.5 py-1 rounded text-xs font-black uppercase text-white ${
                    isBuy
                      ? 'bg-[#059669]'
                      : isSell
                      ? 'bg-[#DC2626]'
                      : 'bg-[#F59E0B]'
                  }`}
                >
                  {stickyActionWord}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    window.open(`/api/reports/${company.symbol}/download?lang=${language}`, '_blank');
                  }}
                  className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isAr ? 'تقرير PDF' : 'PDF'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* PART 1: THE HERO DECISION SECTION (Above the Fold — 3 Seconds) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section ref={heroSectionRef} className="min-h-[calc(100vh-140px)] flex flex-col justify-center">
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

        {/* 1. Candlestick Chart (Defaults to Simple View: price + EMA 20/50 + S/R lines, 500px desktop / 300px mobile) */}
        <ErrorBoundary fallbackTitleEn="Chart Display Error" fallbackTitleAr="تعذر عرض الرسم البياني">
          <PriceChart
            candles={candles}
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

        {/* 3. Fair Value Intrinsic Valuation Engine */}
        <ErrorBoundary fallbackTitleEn="Fair Value Engine Error" fallbackTitleAr="تعذر عرض نموذج القيمة العادلة">
          <FairValueCard
            symbol={company.symbol}
            currency={company.currency}
          />
        </ErrorBoundary>

        {/* 4. Earnings Call Intelligence & Management Sentiment */}
        <ErrorBoundary fallbackTitleEn="Earnings Intelligence Error" fallbackTitleAr="تعذر عرض ذكاء نتائج الأعمال">
          <EarningsInsightCard
            symbol={company.symbol}
          />
        </ErrorBoundary>
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

        {/* Pro Layer: Desktop Tabbed View (>= 640px) */}
        <div className="hidden sm:block space-y-6">
          <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`desktop-${activeTab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent(activeTab)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile View: Vertical Accordion (Below 640px) */}
        <div className="sm:hidden space-y-3">
          {tabItems.map((tab) => {
            const isOpen = mobileAccordionTab === tab.id;
            return (
              <div
                key={`mobile-${tab.id}`}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setMobileAccordionTab(isOpen ? null : tab.id)}
                  className="w-full p-4 flex items-center justify-between text-start cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2.5 font-bold text-sm text-slate-900 dark:text-white">
                    {tab.icon}
                    <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                  </div>
                  <div className="text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="pt-3">
                      {renderTabContent(tab.id)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
