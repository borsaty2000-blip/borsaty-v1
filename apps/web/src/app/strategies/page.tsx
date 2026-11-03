'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Award,
  Zap,
  Repeat,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  BarChart2,
  ExternalLink,
  Target,
  Percent,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface PickItem {
  symbol: string;
  name_ar: string;
  name_en: string;
  market: string;
  current_price: number;
  currency: string;
  strategy_score: number;
  rank: number;
  key_metric: string;
  rationale_ar: string;
  rationale_en: string;
  entry_zone?: number[];
  target_price?: number;
  stop_loss?: number;
  risk_reward?: number;
}

interface BacktestData {
  total_return_pct: number;
  benchmark_return_pct: number;
  alpha_pct: number;
  annualized_return_pct: number;
  win_rate_pct: number;
  sharpe_ratio: number;
  max_drawdown_pct: number;
  trades_count: number;
  performance_curve?: Array<{ date: string; strategy_return_pct: number; benchmark_return_pct: number }>;
}

interface StrategyItem {
  id: string;
  name_en: string;
  name_ar: string;
  tagline_en: string;
  tagline_ar: string;
  category: string;
  benchmark: string;
  risk_level: string;
  top_picks: PickItem[];
  backtest: BacktestData;
}

export default function StrategiesPage() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadStrategies() {
      try {
        const res = await fetch('/api/strategies');
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setStrategies(json.strategies || []);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStrategies();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStrategyIcon = (id: string) => {
    switch (id) {
      case 'value':
        return <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'momentum':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'reversal':
        return <Repeat className="w-5 h-5 text-sky-500" />;
      case 'dividend':
        return <DollarSign className="w-5 h-5 text-emerald-500" />;
      default:
        return <Award className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070B14] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 1. Header Banner */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'استراتيجيات الاختيار الكمي المؤسسي (PROPICKS)' : 'INSTITUTIONAL QUANTITATIVE PROPICKS'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'نماذج الاستثمار واختيارات المحترفين' : 'Quantitative Investment Strategies'}
          </h1>

          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? '4 نماذج خوارزمية مؤتمتة تم اختبارها تاريخياً على مدار عامين. تُفرز وتصنف الأسهم لحظياً بناءً على القيمة الجوهرية، زخم السيولة، اكتمال نماذج الهارمونيك، وعوائد التوزيعات النقدية.'
              : '4 automated algorithmic models backtested across 24 rolling months. Ranks instruments based on intrinsic fair value, liquidity velocity, harmonic completion, and defensive dividend yields.'}
          </p>
        </div>

        {/* 2. Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-6 w-48 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-24 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* 3. Strategies Grid (4 Cards) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strat) => {
              const isExpanded = expandedStrategy === strat.id;
              const bt = strat.backtest;
              const topPicks = strat.top_picks || [];

              return (
                <div
                  key={strat.id}
                  className="rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-6 sm:p-7 flex flex-col justify-between space-y-6"
                >
                  {/* Top Bar: Icon, Title, Risk Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          {getStrategyIcon(strat.id)}
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 dark:text-white">
                            {isAr ? strat.name_ar : strat.name_en}
                          </h2>
                          <span className="text-xs font-semibold text-slate-400">
                            {strat.category} · {strat.benchmark}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                        {strat.risk_level} RISK
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-2">
                      {isAr ? strat.tagline_ar : strat.tagline_en}
                    </p>
                  </div>

                  {/* 2-Year Backtest Metric Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        {isAr ? 'العائد التراكمي (2Y)' : '2Y Return'}
                      </span>
                      <span className="text-lg font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        +{bt.total_return_pct.toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        {isAr ? 'ألفا فوق المؤشر' : 'Alpha (Excess)'}
                      </span>
                      <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                        +{bt.alpha_pct.toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        {isAr ? 'نسبة الصفقات الرابحة' : 'Win Rate'}
                      </span>
                      <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                        {bt.win_rate_pct.toFixed(1)}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        {isAr ? 'معدل شارب' : 'Sharpe Ratio'}
                      </span>
                      <span className="text-lg font-black font-mono tabular-nums text-slate-900 dark:text-white">
                        {bt.sharpe_ratio.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Top 5 Picks List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? 'أعلى 5 أسهم مؤهلة حالياً' : 'TOP QUALIFIED PICKS'}</span>
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400">
                        {topPicks.length} {isAr ? 'أسهم' : 'Assets'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {topPicks.slice(0, isExpanded ? 10 : 5).map((pick) => (
                        <Link
                          key={pick.symbol}
                          href={`/stock/${pick.symbol}`}
                          className="group p-3 rounded-xl bg-white dark:bg-[#070B14] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
                              {pick.rank}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white">
                                  {pick.symbol}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {pick.market}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 block truncate max-w-[180px] sm:max-w-xs">
                                {isAr ? pick.name_ar : pick.name_en}
                              </span>
                            </div>
                          </div>

                          <div className="text-end">
                            <div className="flex items-baseline justify-end gap-1">
                              <span className="text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white">
                                {pick.current_price.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-slate-400">{pick.currency}</span>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                              {pick.key_metric}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedStrategy(isExpanded ? null : strat.id)}
                      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? (isAr ? 'عرض أقل' : 'Show Less') : (isAr ? 'عرض كافة التفاصيل' : 'View All Details')}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <Link
                      href={`/screener`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <span>{isAr ? 'فتح الماسح الفني' : 'Open in Screener'}</span>
                      <ArrowIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
