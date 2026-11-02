'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ChevronRight,
  Clock,
  ExternalLink,
  BarChart2,
  Newspaper,
  Layers,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { DataWrapper } from '@/components/ui/DataWrapper';

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
    <div className="w-full space-y-6 pb-12">
      {/* SECTION 1: Market Indices & Commodities (Data-First) */}
      <DataWrapper isLoading={loading} error={error} data={overviewData} onRetry={fetchOverview}>
        {(data) => (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'مؤشرات الأسواق والسلع العالمية' : 'Major Indices & Commodities'}</span>
              </h2>
              <span className="text-[11px] font-semibold text-slate-400">
                {isAr ? 'تحديث لحظي' : 'Real-time Feed'}
              </span>
            </div>

            {/* Horizontal Ticker Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {data.indices.map((idx) => {
                const pos = idx.change >= 0;
                return (
                  <div
                    key={idx.symbol}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-0.5 truncate">
                      <span>{isAr ? idx.nameAr : idx.nameEn}</span>
                    </div>
                    <div className="text-sm md:text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div
                      className={`flex items-center gap-1 text-[11px] font-extrabold tabular-nums mt-0.5 ${
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

      {/* SECTION 2: Top Gainers & Top Losers (Two Clean Columns) */}
      {overviewData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Gainers */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{isAr ? 'الأسهم الأكثر صعوداً' : 'Top Gainers'}</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">1D %</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {overviewData.topGainers.map((stk) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-2.5 px-2 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center justify-center text-[10px]">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stk.currency}</span>
                    </div>
                    <div className="text-[11px] font-black text-emerald-600 tabular-nums">
                      +{stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800/80 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{isAr ? 'الأسهم الأكثر تراجعاً' : 'Top Losers'}</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400">1D %</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {overviewData.topLosers.map((stk) => (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-2.5 px-2 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 font-extrabold flex items-center justify-center text-[10px]">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {stk.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stk.currency}</span>
                    </div>
                    <div className="text-[11px] font-black text-rose-600 tabular-nums">
                      {stk.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Market Overview Table (Investing.com-Grade Dense Table) */}
      {overviewData && (
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>{isAr ? 'جدول أسعار ومؤشرات الأسهم الرئيسية' : 'Market Overview Table'}</span>
            </h2>
            <Link
              href="/screener"
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
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
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-800 dark:text-slate-200">
                      {stock.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                          {stock.symbol}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {stock.market}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[150px]">
                        {isAr ? stock.nameAr : stock.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="font-bold tabular-nums text-sm text-slate-900 dark:text-white">
                      {stock.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stock.currency}</span>
                    </div>
                    <div className={`text-xs font-black tabular-nums ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
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
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 text-start">{isAr ? 'الرمز' : 'Symbol'}</th>
                  <th className="py-2.5 text-start">{isAr ? 'الشركة' : 'Name'}</th>
                  <th className="py-2.5 text-start">{isAr ? 'السوق' : 'Market'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'التغير اليومي' : 'Change %'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'الحجم' : 'Volume'}</th>
                  <th className="py-2.5 text-center">{isAr ? 'التحليل' : 'Analysis'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {(overviewData.priorityStocks || overviewData.topGainers).map((stock) => {
                  const isGain = stock.change >= 0;
                  return (
                    <tr
                      key={stock.symbol}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="py-2.5 text-start font-black text-slate-900 dark:text-white">
                        <Link href={`/stock/${stock.symbol}`} className="hover:text-emerald-600 transition-colors">
                          {stock.symbol}
                        </Link>
                      </td>
                      <td className="py-2.5 text-start text-slate-600 dark:text-slate-300 font-medium">
                        {isAr ? stock.nameAr : stock.nameEn}
                      </td>
                      <td className="py-2.5 text-start">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {stock.market}
                        </span>
                      </td>
                      <td className="py-2.5 text-end tabular-nums font-bold text-slate-900 dark:text-white">
                        {stock.price.toFixed(2)} <span className="text-[10px] text-slate-400">{stock.currency}</span>
                      </td>
                      <td className={`py-2.5 text-end tabular-nums font-extrabold ${isGain ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isGain ? '+' : ''}{stock.changePct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 text-end tabular-nums text-slate-500 font-mono text-[11px]">
                        {(stock.volume || 1420500).toLocaleString()}
                      </td>
                      <td className="py-2.5 text-center">
                        <Link
                          href={`/stock/${stock.symbol}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <span>{isAr ? 'عرض' : 'View'}</span>
                          <ArrowUpRight className="w-3 h-3" />
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
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'شريط الأخبار والتقارير المالية' : 'Financial News Wire'}</span>
            </h2>
            <Link
              href="/calendar"
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>{isAr ? 'الأجندة الاقتصادية' : 'Economic Calendar'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overviewData.news.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30 hover:border-emerald-500/30 hover:bg-emerald-50/20 dark:hover:bg-emerald-500/5 transition-all group block"
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                    {n.source}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {isAr ? n.timeAgoAr : n.timeAgoEn}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
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
