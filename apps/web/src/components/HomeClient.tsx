'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ChevronRight,
  Clock,
  BarChart2,
  Newspaper,
  Layers,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { DataWrapper } from '@/components/ui/DataWrapper';

const SectorHeatmap = dynamic(() => import('@/components/SectorHeatmap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-lg bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Loading Market Sector Heatmap...
    </div>
  ),
});

interface MarketIndexItem {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: number;
  change: number;
  changePct: number;
  category: string;
}

interface StockItem {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  volume?: number;
  decision?: string;
  confluenceScore?: number;
}

interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string;
  source: string;
  timeAgoEn: string;
  timeAgoAr: string;
  url: string;
  sentiment: string;
}

interface OverviewData {
  indices: MarketIndexItem[];
  topGainers: StockItem[];
  topLosers: StockItem[];
  priorityStocks?: StockItem[];
  featuredAnalyses: StockItem[];
  news?: NewsItem[];
  updatedAt: string;
}

export default function HomeClient() {
  const { language, t } = useApp();
  const isAr = language === 'ar';

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/market/overview');
      if (res.ok) {
        const data: OverviewData = await res.json();
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

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Institutional Hero Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isAr ? 'بورصتي — التحليلات المالية المؤسسية' : 'Borsaty — Institutional Market Analysis'}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl leading-relaxed">
          {isAr
            ? 'بيانات الأسواق اللحظية، والبحوث الكمية، والتحليل الفني المتقدم للأسواق المالية في الشرق الأوسط والأسواق العالمية.'
            : 'Real-time market data, quantitative research, and advanced technical analysis for MENA and global equity markets.'}
        </p>
      </div>

      {/* SECTION 1: Market Indices & Commodities (Data-First) */}
      <DataWrapper isLoading={loading} error={error} data={overviewData} onRetry={fetchOverview}>
        {(data) => (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-slate-500" />
                <span>{isAr ? 'مؤشرات الأسواق والسلع' : 'MARKET INDICES & COMMODITIES'}</span>
              </h2>
              <span className="text-xs font-mono text-slate-500">
                {isAr ? 'تحديث لحظي' : 'REAL-TIME FEED'}
              </span>
            </div>

            {/* Horizontal Ticker Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {data.indices.map((idx) => {
                const pos = idx.change >= 0;
                return (
                  <div
                    key={idx.symbol}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">
                      <span>{isAr ? idx.nameAr : idx.nameEn}</span>
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-white tabular-nums font-mono tracking-tight">
                      {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-semibold font-mono tabular-nums mt-1 ${
                        pos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {pos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
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

      {/* Cross-Market Sector Heatmap */}
      <SectorHeatmap />

      {/* SECTION 2: Top Gainers & Top Losers (Two Clean Columns) */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isAr ? 'الأسهم الأكثر صعوداً' : 'TOP GAINERS'}</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">1D %</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {overviewData.topGainers.map((stk) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 px-2 flex items-center justify-between group hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold font-mono flex items-center justify-center text-xs">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[140px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold tabular-nums font-mono text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} <span className="text-xs text-slate-400">{stk.currency}</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{isAr ? 'الأسهم الأكثر تراجعاً' : 'TOP LOSERS'}</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">1D %</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {overviewData.topLosers.map((stk) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 px-2 flex items-center justify-between group hover:bg-slate-50/70 dark:hover:bg-slate-800/50 rounded transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold font-mono flex items-center justify-center text-xs">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[140px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold tabular-nums font-mono text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} <span className="text-xs text-slate-400">{stk.currency}</span>
                    </div>
                    <div className="text-xs font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                      {stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Market Overview Table (Dense Bloomberg Table) */}
      {overviewData && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'جدول أسعار ومؤشرات الأسهم الرئيسية' : 'MARKET OVERVIEW'}</span>
            </h2>
            <Link
              href="/screener"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'فتح المصفي الكامل' : 'Open Screener'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Card List (< sm screens) */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {(overviewData.priorityStocks || overviewData.topGainers).map((stock) => {
              const isGain = stock.change >= 0;
              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="py-3 flex items-center justify-between group active:bg-slate-50 dark:active:bg-slate-900/40 rounded-lg px-1 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {stock.market}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[150px]">
                        {isAr ? stock.nameAr : stock.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-semibold tabular-nums font-mono text-sm text-slate-900 dark:text-white">
                      {stock.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stock.currency}</span>
                    </div>
                    <div className={`text-xs font-bold font-mono tabular-nums ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isGain ? '+' : ''}{stock.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Desktop & Tablet Dense Table (>= sm screens) */}
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-start">{isAr ? 'الرمز' : 'Symbol'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الشركة' : 'Name'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'السوق' : 'Market'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'التغير اليومي' : 'Change %'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الحجم' : 'Volume'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'التحليل' : 'Analysis'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {(overviewData.priorityStocks || overviewData.topGainers).map((stock) => {
                  const isGain = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-start font-bold font-mono text-slate-900 dark:text-white">
                        <Link href={`/stock/${stock.symbol}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-start text-slate-700 dark:text-slate-300">
                        {isAr ? stock.nameAr : stock.nameEn}
                      </td>
                      <td className="py-3 px-3 text-start">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {stock.market}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end tabular-nums font-mono font-semibold text-slate-900 dark:text-white">
                        {stock.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stock.currency}</span>
                      </td>
                      <td className={`py-3 px-3 text-end tabular-nums font-mono font-bold ${isGain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isGain ? '+' : ''}{stock.changePct.toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-end tabular-nums text-slate-500 font-mono text-xs">
                        {(stock.volume || 1420500).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>{isAr ? 'عرض' : 'View'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: Latest Financial News */}
      {overviewData?.news && overviewData.news.length > 0 && (
        <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'شريط الأخبار والتقارير المالية' : 'FINANCIAL NEWS WIRE'}</span>
            </h2>
            <Link
              href="/calendar"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'الأجندة الاقتصادية' : 'Economic Calendar'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overviewData.news.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all group block"
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5">
                  <span className="text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">
                    {n.source}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-slate-500 text-xs">
                    <Clock className="w-3 h-3" />
                    {isAr ? n.timeAgoAr : n.timeAgoEn}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                  {isAr ? n.titleAr : n.titleEn}
                </h4>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
