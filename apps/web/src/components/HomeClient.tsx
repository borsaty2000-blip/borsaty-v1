'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  Search,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Layers,
  ShieldCheck,
  Activity,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DataWrapper } from '@/components/ui/DataWrapper';
import { resolveStockAlias } from '@borsaty/shared';

export default function HomeClient() {
  const { language, t } = useApp();
  const isAr = language === 'ar';
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data = await res.json();
        setOverviewData(data);
      } else {
        setError(t('errors.fetchFailed'));
      }
    } catch {
      setError(t('errors.networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const alias = resolveStockAlias(searchQuery);
    if (alias) {
      router.push(`/stock/${alias.symbol}`);
    } else {
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="w-full space-y-10 pb-12">
      {/* 1. Hero Section: Clean, sharp, Investing.com style */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-8 md:p-12 shadow-sm transition-colors duration-200">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('common.appName')} v2.0 Institutional Analysis</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {t('home.heroTitle')}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {t('home.heroSubtitle')}
          </p>

          {/* Central Prominent Search Bar */}
          <form onSubmit={handleSearch} className="pt-2 max-w-xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.searchPlaceholder')}
                className="w-full h-12 px-4 ps-11 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm md:text-base text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner font-medium"
              />
              <Search className="w-5 h-5 text-slate-400 absolute start-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute end-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'بحث' : 'Search'}
              </button>
            </div>
          </form>

          {/* Action Chips */}
          <div className="flex flex-wrap gap-3 pt-3">
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('home.exploreScreener')}</span>
            </Link>
            <Link
              href="/stock/COMI"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <span>{t('home.exploreEgyptian')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Market Indices Ticker (Horizontal Scroll) */}
      <DataWrapper isLoading={loading} error={error} data={overviewData} onRetry={fetchOverview}>
        {(data) => (
          <div className="space-y-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {t('home.marketIndices')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.indices.map((idx: any) => {
                const pos = idx.change >= 0;
                return (
                  <div
                    key={idx.symbol}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      <span>{isAr ? idx.nameAr : idx.nameEn}</span>
                    </div>
                    <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-bold tabular-nums mt-1 ${
                        pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>
                        {pos ? '+' : ''}
                        {idx.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DataWrapper>

      {/* 3. Top Movers (Two Columns: Gainers & Losers) */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t('home.topGainers')}</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">1D Change</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {overviewData.topGainers.map((stk: any) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      {stk.symbol}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? stk.nameAr : stk.nameEn}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} {stk.currency}
                    </div>
                    <div className="text-xs font-extrabold text-emerald-600 tabular-nums">
                      +{stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{t('home.topLosers')}</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">1D Change</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {overviewData.topLosers.map((stk: any) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/50 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                      {stk.symbol}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {isAr ? stk.nameAr : stk.nameEn}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} {stk.currency}
                    </div>
                    <div className="text-xs font-extrabold text-rose-600 tabular-nums">
                      {stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Featured Institutional Decisions */}
      {overviewData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {t('home.featuredAnalyses')}
            </h2>
            <Link
              href="/signals"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'عرض كافة الإشارات' : 'View all signals'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overviewData.featuredAnalyses.map((item: any) => (
              <Link
                key={item.symbol}
                href={`/stock/${item.symbol}`}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.market}
                    </span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {item.decision} ({item.confluenceScore}%)
                    </span>
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {item.symbol}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {isAr ? item.nameAr : item.nameEn}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white tabular-nums">
                    {item.price.toFixed(2)} {item.currency}
                  </span>
                  <span className="text-emerald-600 flex items-center gap-1">
                    {t('home.viewAnalysis')}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
