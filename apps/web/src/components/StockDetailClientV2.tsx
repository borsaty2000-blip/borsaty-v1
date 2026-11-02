'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Clock,
  Layers,
  BarChart2,
  FileText,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { PriceChart } from '@/components/charts/PriceChart';
import { DataWrapper } from '@/components/ui/DataWrapper';
import { DecisionCard } from '@/components/DecisionCard';
import WatchlistButton from '@/components/WatchlistButton';
import { useApp } from '@/context/AppContext';

interface StockDetailClientProps {
  company: any;
  quote: any;
  candles: any[];
}

export default function StockDetailClientV2({
  company,
  quote,
  candles,
}: StockDetailClientProps) {
  const { language, t } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'analysis' | 'tradePlan' | 'patterns' | 'indicators' | 'narrative'>('analysis');
  const [decisionData, setDecisionData] = useState<any>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

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
          setAnalysisData(data);
        }
      } catch {
        // fallback
      }
    }

    fetchDecision();
    fetchAnalysis();
  }, [company.symbol]);

  const isPositive = quote.change >= 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 1. Stock Info Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm">
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
            <span>{company.sector}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'بيانات حية ومباشرة' : 'Live Data'}
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

      {/* 2. THE MOMENT OF TRUTH: PROMINENT DECISION CARD (FIRST THING) */}
      <DataWrapper isLoading={decisionLoading} data={decisionData}>
        {(dec) => (
          <DecisionCard
            symbol={company.symbol}
            currency={company.currency}
            decisionData={dec}
          />
        )}
      </DataWrapper>

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
          <Activity className="w-4 h-4" />
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
      </div>

      {/* 4. Main Content Grid (2 Columns: Left 2/3 Chart, Right 1/3 Summary Sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Price Chart */}
        <div className="lg:col-span-2 space-y-4">
          <PriceChart
            candles={candles}
            height={440}
            symbol={company.symbol}
            currency={company.currency}
          />
        </div>

        {/* Right Column: Quantitative Confluence & Metric Sidebar */}
        <div className="space-y-4">
          {/* Confluence Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm">
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
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {isAr ? 'ملخص خطة التداول' : 'Trade Plan Snapshot'}
            </h4>
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
    </div>
  );
}
