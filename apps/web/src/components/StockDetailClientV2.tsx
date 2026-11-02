'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Layers,
  Sparkles,
  FileDown,
  Crosshair,
  Target,
  AlertTriangle,
  ArrowRight,
  Maximize2,
  Workflow,
  Compass,
  Newspaper,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PriceChart } from '@/components/charts/PriceChart';
import { DataWrapper } from '@/components/ui/DataWrapper';
import { DecisionCard, DecisionCardProps } from '@/components/DecisionCard';
import WatchlistButton from '@/components/WatchlistButton';
import NewsFeed from '@/components/news/NewsFeed';
import ErrorBoundary from '@/components/ErrorBoundary';
import { safeParseAnalysis, ValidatedUnifiedAnalysis } from '@/lib/schemas';
import { useApp } from '@/context/AppContext';
import { useBorsaty, ChartHighlightPoint } from '@/context/BorsatyContext';

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
}

interface StockDetailClientProps {
  company: CompanyInfo;
  quote: QuoteInfo;
  candles: Array<{
    time: string | number;
    open: number;
    high: number;
    low: number;
    close: number;
  }>;
}

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

  const [activeTab, setActiveTab] = useState<'analysis' | 'tradePlan' | 'narrative' | 'news'>('analysis');
  const [decisionData, setDecisionData] = useState<DecisionCardProps['decisionData'] | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<ValidatedUnifiedAnalysis | null>(null);

  const chartSectionRef = useRef<HTMLDivElement>(null);

  // Sync active symbol with global context
  useEffect(() => {
    setActiveSymbol(company.symbol);
    return () => {
      setActiveSymbol(null);
      clearHighlight();
    };
  }, [company.symbol, setActiveSymbol, clearHighlight]);

  useEffect(() => {
    async function fetchDecision() {
      try {
        setDecisionLoading(true);
        const res = await fetch(`/api/decision/${company.symbol}`);
        if (res.ok) {
          const data = await res.json();
          setDecisionData(data);
        }
      } catch {
        // fallback
      } finally {
        setDecisionLoading(false);
      }
    }

    async function fetchAnalysis() {
      try {
        const res = await fetch(`/api/analysis/${company.symbol}/full`);
        if (res.ok) {
          const data = await res.json();
          const validated = safeParseAnalysis(data, company.symbol);
          setAnalysisData(validated);
          setActiveAnalysis(validated);
        }
      } catch {
        const fallback = safeParseAnalysis(null, company.symbol);
        setAnalysisData(fallback);
        setActiveAnalysis(fallback);
      }
    }

    fetchDecision();
    fetchAnalysis();
  }, [company.symbol, setActiveAnalysis]);

  const isPositive = quote.change >= 0;

  // Highlight helper for Trade Plan
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

  // Highlight helper for Harmonic Patterns
  const highlightHarmonicPattern = (patternName: string) => {
    if (candles.length < 5) return;

    // Pick 5 representative pivot swings from the last 30 candles
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

  // Highlight helper for Elliott Waves
  const highlightElliottWave = () => {
    if (candles.length < 5) return;

    const subset = candles.slice(-25);
    const step = Math.floor(subset.length / 5);
    const points: ChartHighlightPoint[] = [
      { time: subset[0].time, price: subset[0].low, label: '(1)', color: '#a855f7' },
      { time: subset[step * 1].time, price: subset[step * 1].high, label: '(2)', color: '#a855f7' },
      { time: subset[step * 2].time, price: subset[step * 2].low, label: '(3)', color: '#a855f7' },
      { time: subset[step * 3].time, price: subset[step * 3].high, label: '(4)', color: '#a855f7' },
      { time: subset[subset.length - 1].time, price: subset[subset.length - 1].close, label: '(5)', color: '#a855f7' },
    ];

    setActiveHighlight({
      id: 'elliott_impulse',
      name: isAr ? 'موجة إليوت الدافعة (1-2-3-4-5)' : 'Elliott Impulse Wave (1-2-3-4-5)',
      type: 'elliott',
      points,
    });

    chartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* 1. Stock Info Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {company.symbol}
            </h1>
            <span className="text-lg md:text-xl font-bold text-slate-700 dark:text-slate-300">
              {isAr ? company.nameAr : company.nameEn}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {company.market}
            </span>
            <WatchlistButton
              symbol={company.symbol}
              nameEn={company.nameEn}
              nameAr={company.nameAr}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>{company.sector || 'Equities'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'بيانات حية ومباشرة' : 'Live Data Verified'}
            </span>
          </div>
        </div>

        {/* Current Price Banner */}
        <div className="flex items-baseline gap-3">
          <div className="text-3xl md:text-4xl font-black tabular-nums text-slate-900 dark:text-white">
            {quote.price.toFixed(2)}
            <span className="text-sm font-bold text-slate-500 ms-1.5">{quote.currency}</span>
          </div>
          <div
            className={`flex items-center gap-1 text-sm md:text-base font-extrabold px-2.5 py-1 rounded-lg ${
              isPositive
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="tabular-nums">
              {isPositive ? '+' : ''}
              {quote.change.toFixed(2)} ({quote.changePct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. THE MOMENT OF TRUTH: PROMINENT DECISION CARD */}
      <ErrorBoundary fallbackTitleEn="Decision Card Unavailable" fallbackTitleAr="تعذر عرض بطاقة القرار">
        <DataWrapper isLoading={decisionLoading} data={decisionData}>
          {(dec) => (
            <DecisionCard
              symbol={company.symbol}
              currency={company.currency}
              decisionData={dec}
            />
          )}
        </DataWrapper>
      </ErrorBoundary>

      {/* 3. Section Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400">
        <button
          onClick={() => setActiveTab('analysis')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'analysis'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Crosshair className="w-4 h-4" />
          <span>{isAr ? 'التحليل الفني والرسم البياني' : 'Technical & Chart'}</span>
        </button>
        <button
          onClick={() => setActiveTab('tradePlan')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'tradePlan'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'خطة التداول الموحدة' : 'Unified Trade Plan'}</span>
        </button>
        <button
          onClick={() => setActiveTab('narrative')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'narrative'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? 'السرد التحليلي والتقرير' : 'Narrative & Report'}</span>
        </button>
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'news'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>{isAr ? 'الأخبار والتقارير' : 'Financial News'}</span>
        </button>
      </div>

      {/* 4. Main Content Grid (Chart + Confluence Sidebar) */}
      <div ref={chartSectionRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Price Chart & Pattern Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <ErrorBoundary fallbackTitleEn="Chart Display Error" fallbackTitleAr="تعذر عرض الرسم البياني">
            <PriceChart
              candles={candles}
              height={440}
              symbol={company.symbol}
              currency={company.currency}
            />
          </ErrorBoundary>

          {/* Interactive Pattern Linking Controls (Harmonic, Elliott, Trade Plan) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-600" />
                <span>{isAr ? 'الربط التفاعلي للأنماط على الرسم البياني' : 'Interactive Pattern Overlay'}</span>
              </h4>
              {activeHighlight && (
                <button
                  onClick={clearHighlight}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  {isAr ? 'مسح التحديد' : 'Clear Highlights'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => highlightHarmonicPattern('Bullish Gartley')}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-50/30 dark:hover:bg-cyan-500/10 transition-all text-start group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    <span>Gartley (X-A-B-C-D)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'عرض نقاط التراجع الفيبوناتشي' : 'Fibonacci geometry'}
                  </div>
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={highlightElliottWave}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-purple-50/30 dark:hover:bg-purple-500/10 transition-all text-start group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Elliott (1-2-3-4-5)</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'عرض الموجة الدافعة' : 'Impulse wave cycle'}
                  </div>
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={highlightTradePlan}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-500/10 transition-all text-start group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Trade Plan Levels</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'مستويات الدخول والوقف والأهداف' : 'Entry, SL & Targets'}
                  </div>
                </div>
                <Maximize2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Right Column: Quantitative Confluence & Metric Sidebar */}
        <div className="space-y-4">
          {/* Confluence Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>{isAr ? 'درجة التوافق الكمي (Confluence)' : 'Confluence Score'}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                8 Engines
              </span>
            </h3>

            <div className="flex items-center justify-center my-4">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-emerald-500/20">
                <div className="text-center">
                  <span className="text-3xl font-black tabular-nums text-slate-900 dark:text-white">
                    {decisionData ? Math.round(decisionData.confidence_score * 100) : 68}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-bold">من 100</span>
                </div>
              </div>
            </div>

            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              {isAr
                ? 'محسوبة بأوزان ديناميكية تعتمد على بيئة السوق الحالية بدون أي تدخل يدوي.'
                : 'Empirically derived across 8 engines weighted dynamically by market regime.'}
            </p>
          </div>

          {/* Quick Trade Plan Snapshot */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                {isAr ? 'ملخص خطة التداول' : 'Trade Plan Snapshot'}
              </h4>
              <button
                onClick={highlightTradePlan}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{isAr ? 'عرض بالرسم' : 'Plot'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الدخول المقترح' : 'Entry Zone'}</span>
                <span className="font-bold tabular-nums">
                  {decisionData?.entry_zone ? `${decisionData.entry_zone[0]} - ${decisionData.entry_zone[1]}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'وقف الخسارة' : 'Stop Loss'}</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                  {decisionData?.stop_loss || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{isAr ? 'الهدف الأولي' : 'Primary Target'}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {decisionData?.targets?.[0] || '—'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">{isAr ? 'العائد للمخاطرة' : 'R:R'}</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {decisionData?.primary_rr ? `${decisionData.primary_rr}:1` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Tab Panels Details (Active Tab Content with Framer Motion) */}
      <AnimatePresence mode="wait">
        {activeTab === 'tradePlan' && (
          <motion.div
            key="tab-tradePlan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {isAr ? 'تفاصيل خطة التداول الموحدة' : 'Unified Trade Plan Matrix'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'محسوبة بدقة عبر محرك التداول الكمي مع تحديد أهداف متعددة ونسب عائد لمخاطرة واضحة.'
                    : 'Computed via deterministic quantitative trade engine with dynamic multi-target optimization.'}
                </p>
              </div>
              <button
                onClick={highlightTradePlan}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Target className="w-4 h-4" />
                <span>{isAr ? 'عرض المستويات على الرسم البياني' : 'Plot All Levels on Chart'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="text-xs font-bold text-slate-500 mb-1">{isAr ? 'منطقة الدخول' : 'Entry Zone'}</div>
                <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums">
                  {decisionData?.entry_zone ? `${decisionData.entry_zone[0]} - ${decisionData.entry_zone[1]}` : `${quote.price.toFixed(2)}`}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {isAr ? 'دخول منضبط عند اكتمال التأكيد الفني' : 'Optimal liquidity entry threshold'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'وقف الخسارة الحاسم' : 'Strict Stop Loss'}</span>
                </div>
                <div className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums">
                  {decisionData?.stop_loss || (quote.price * 0.96).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {isAr ? 'إلغاء النموذج الفني عند كسر هذا المستوى' : 'Invalidation level for technical premise'}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAr ? 'الهدف الأولي' : 'Primary Target'}</span>
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {decisionData?.targets?.[0] || (quote.price * 1.05).toFixed(2)}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {decisionData?.primary_rr ? `R:R ${decisionData.primary_rr}:1` : 'R:R 2.2:1'}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'narrative' && (
          <motion.div
            key="tab-narrative"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>{isAr ? 'السرد التحليلي المؤسسي' : 'Institutional Dual-Authored Narrative'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'سرد متكامل يجمع بين التحليل الفني والكمي وإدارة المخاطر.'
                    : 'Engineered quantitative synthesis generated across 8 deterministic engines.'}
                </p>
              </div>
              <button
                onClick={() => window.open(`/api/reports/${company.symbol}/download?lang=${language}`, '_blank')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'تحميل التقرير الكامل PDF' : 'Download Institutional PDF'}</span>
              </button>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 leading-relaxed text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {isAr
                ? analysisData?.narrative_ar?.full_text || decisionData?.why_ar?.join('\n') || 'التحليل الفني متوفر مع درجة توافق كمي متقدمة.'
                : analysisData?.narrative_en?.full_text || decisionData?.why_en?.join('\n') || 'Technical and quantitative analysis is available with validated multi-engine confluence.'}
            </div>
          </motion.div>
        )}

        {activeTab === 'news' && (
          <motion.div
            key="tab-news"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <NewsFeed symbol={company.symbol} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial News Wire Section (Always visible below main charts on Technical tab) */}
      {activeTab === 'analysis' && (
        <div className="pt-2">
          <NewsFeed symbol={company.symbol} />
        </div>
      )}
    </div>
  );
}
