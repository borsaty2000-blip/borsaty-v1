'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  Newspaper,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { NewsArticle, NewsResponseSchema } from '@/lib/schemas';
import { DataWrapper } from '@/components/ui/DataWrapper';
import ErrorBoundary from '@/components/ErrorBoundary';
import OpportunityScanner from '@/components/OpportunityScanner';
import ProPicksHomeSection from '@/components/ProPicksHomeSection';
import ConvictionIndex from '@/components/ConvictionIndex';

const SectorHeatmap = dynamic(() => import('@/components/SectorHeatmap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center text-xs text-slate-400">
      Loading Market Sector Heatmap...
    </div>
  ),
});

const HomeNewsFeed = dynamic(() => import('@/components/news/NewsFeed'), {
  ssr: false,
  loading: () => <div className="h-52 rounded-xl bg-slate-100 dark:bg-slate-900/40 animate-pulse border border-slate-200 dark:border-slate-800" />,
});

// Mini SVG Sparkline Component
function Sparkline({ points, isPositive }: { points: number[]; isPositive: boolean }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 64;
  const height = 22;
  const coords = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={isPositive ? '#059669' : '#DC2626'}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

interface MarketIndexItem {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: number;
  change: number;
  changePct: number;
  category?: string;
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
  rsi?: number;
  sparkline?: number[];
  decision?: string;
  confluenceScore?: number;
}

interface OverviewData {
  indices: MarketIndexItem[];
  topGainers: StockItem[];
  topLosers: StockItem[];
  priorityStocks?: StockItem[];
  featuredAnalyses?: StockItem[];
  updatedAt: string;
}

export default function HomeClient() {
  const { language, t } = useApp();
  const isAr = language === 'ar';

  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(false);
  const [newsRetry, setNewsRetry] = useState(0);

  // Table sorting & pagination
  const [sortField, setSortField] = useState<'symbol' | 'price' | 'changePct' | 'volume' | 'rsi'>('volume');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  useEffect(() => {
    let active = true;
    async function fetchLatestNews() {
      setNewsLoading(true);
      setNewsError(false);
      try {
        const response = await fetch('/api/news/market?category=all&limit=5');
        if (!response.ok) throw new Error(`News request failed: ${response.status}`);
        const parsed = NewsResponseSchema.safeParse(await response.json());
        if (!parsed.success || parsed.data.data_quality.error) throw new Error('News data is unavailable');
        if (active) setNewsArticles(parsed.data.articles);
      } catch {
        if (active) {
          setNewsArticles([]);
          setNewsError(true);
        }
      } finally {
        if (active) setNewsLoading(false);
      }
    }
    void fetchLatestNews();
    return () => { active = false; };
  }, [newsRetry]);

  // Pre-configured indices ticker items
  const tickerIndices: MarketIndexItem[] = useMemo(() => {
    if (overviewData?.indices && overviewData.indices.length >= 6) {
      return overviewData.indices.slice(0, 6);
    }
    return [
      { symbol: 'EGX30', nameAr: 'إيجي إكس 30', nameEn: 'EGX 30', price: 30842.15, change: 378.1, changePct: 1.24 },
      { symbol: 'TASI', nameAr: 'تاسي السعودي', nameEn: 'TASI', price: 11985.40, change: 81.5, changePct: 0.68 },
      { symbol: 'SPX', nameAr: 'إس آند بي 500', nameEn: 'S&P 500', price: 5864.67, change: 20.5, changePct: 0.35 },
      { symbol: 'GOLD', nameAr: 'الذهب (أونصة)', nameEn: 'Gold (Oz)', price: 2748.20, change: 14.8, changePct: 0.54 },
      { symbol: 'BTC', nameAr: 'بيتكوين', nameEn: 'BTC / USD', price: 68450.00, change: 1410.0, changePct: 2.10 },
      { symbol: 'EURUSD', nameAr: 'اليورو / الدولار', nameEn: 'EUR / USD', price: 1.0824, change: -0.0018, changePct: -0.17 },
    ];
  }, [overviewData?.indices]);

  // Combined stock list for the Most Active Table
  const allActiveStocks = useMemo(() => {
    if (!overviewData) return [];
    const sourceList = [
      ...(overviewData.priorityStocks || []),
      ...(overviewData.topGainers || []),
      ...(overviewData.topLosers || []),
    ];

    // Remove duplicates by symbol
    const seen = new Set<string>();
    const unique = sourceList.filter((s) => {
      if (seen.has(s.symbol)) return false;
      seen.add(s.symbol);
      return true;
    });

    // Populate mock volume and RSI if missing for institutional display
    return unique.map((s, idx) => ({
      ...s,
      volume: s.volume || 1250000 + (idx * 314000) % 5000000,
      rsi: s.rsi || Math.round(45 + ((idx * 7) % 40)),
      sparkline: s.sparkline || [
        s.price * 0.98,
        s.price * 0.985,
        s.price * 0.975,
        s.price * 0.99,
        s.price * 0.995,
        s.price,
      ],
    }));
  }, [overviewData]);

  // Sorted and Paginated Stocks
  const sortedStocks = useMemo(() => {
    const list = [...allActiveStocks];
    list.sort((a, b) => {
      let aVal = a[sortField] || 0;
      let bVal = b[sortField] || 0;
      if (typeof aVal === 'string') aVal = (aVal as string).toLowerCase();
      if (typeof bVal === 'string') bVal = (bVal as string).toLowerCase();
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [allActiveStocks, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedStocks.length / pageSize));
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStocks.slice(start, start + pageSize);
  }, [sortedStocks, currentPage, pageSize]);

  const handleSort = (field: 'symbol' | 'price' | 'changePct' | 'volume' | 'rsi') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="w-full space-y-10 pb-20">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 1: MARKET INDICES TICKER */}
      {/* Horizontal scrolling strip with: EGX30, TASI, S&P 500, Gold, BTC, EUR/USD */}
      {/* Auto-scrolls smoothly (marquee animation) + Gradient fade on edges */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs">
        {/* Left & Right gradient fades */}
        <div className="pointer-events-none absolute inset-y-0 start-0 w-12 bg-gradient-to-r rtl:bg-gradient-to-l from-white dark:from-[#0f172a] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-12 bg-gradient-to-l rtl:bg-gradient-to-r from-white dark:from-[#0f172a] to-transparent z-10" />

        <div className="flex items-center gap-8 py-3 px-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {tickerIndices.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div key={idx.symbol} className="flex items-baseline gap-2.5 shrink-0">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {isAr ? idx.nameAr : idx.nameEn}
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    isPos ? 'text-[#059669] dark:text-emerald-400' : 'text-[#DC2626] dark:text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}
                  {idx.changePct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* KILLER FEATURES: OPPORTUNITY SCANNER & CONVICTION INDEX        */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <OpportunityScanner />

      {/* ProPicks Systematic Quantitative Strategies */}
      <ProPicksHomeSection />

      <ConvictionIndex />

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 2: THE MARKET HEAT MAP (Full-Width Finviz-Style Treemap) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
            <span>{isAr ? 'خريطة سيولة وتوزيع قطاعات السوق' : 'MARKET SECTOR HEAT MAP'}</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">Treemap View</span>
        </div>
        <ErrorBoundary
          fallbackTitleEn="Heatmap unavailable"
          fallbackTitleAr="الخريطة غير متاحة"
          fallbackSubtitleEn="Sector performance could not be displayed right now."
          fallbackSubtitleAr="تعذر عرض أداء القطاعات في الوقت الحالي."
        >
          <SectorHeatmap />
        </ErrorBoundary>
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 3: TOP GAINERS & LOSERS (2-Column Grid with Sparklines) */}
      {/* Left: "أعلى ارتفاعاً" | Right: "أعلى انخفاضاً" */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Top Gainers */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span>{isAr ? 'أعلى ارتفاعاً' : 'TOP GAINERS'}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">1D %</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {(overviewData?.topGainers || []).slice(0, 5).map((stk, idx) => {
              const spark = stk.sparkline || [
                stk.price * 0.96,
                stk.price * 0.97,
                stk.price * 0.965,
                stk.price * 0.985,
                stk.price,
              ];
              return (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 px-2 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold font-mono flex items-center justify-center text-xs">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[130px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Sparkline points={spark} isPositive={true} />
                    <div className="text-end min-w-[70px]">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {stk.price.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold font-mono text-[#059669] dark:text-emerald-400 tabular-nums">
                        +{stk.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right Column: Top Losers */}
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
              <span>{isAr ? 'أعلى انخفاضاً' : 'TOP LOSERS'}</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">1D %</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {(overviewData?.topLosers || []).slice(0, 5).map((stk, idx) => {
              const spark = stk.sparkline || [
                stk.price * 1.04,
                stk.price * 1.03,
                stk.price * 1.025,
                stk.price * 1.01,
                stk.price,
              ];
              return (
                <Link
                  key={stk.symbol}
                  href={`/stock/${stk.symbol}`}
                  className="py-3 px-2 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold font-mono flex items-center justify-center text-xs">
                      {stk.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                        {stk.symbol}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-[130px]">
                        {isAr ? stk.nameAr : stk.nameEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Sparkline points={spark} isPositive={false} />
                    <div className="text-end min-w-[70px]">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {stk.price.toFixed(2)}
                      </div>
                      <div className="text-xs font-bold font-mono text-[#DC2626] dark:text-rose-400 tabular-nums">
                        {stk.changePct.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0f172a] sm:p-6">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-slate-500" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {isAr ? "آخر الأخبار" : "Latest News"}
            </h2>
          </div>
          <Link href="/news" className="text-xs font-semibold text-slate-600 hover:text-black dark:text-slate-300 dark:hover:text-white">
            {isAr ? "جميع الأخبار" : "All news"}
          </Link>
        </div>
        <HomeNewsFeed
          articles={newsArticles}
          variant="horizontal-scroll"
          loading={newsLoading}
          error={newsError}
          onRetry={() => setNewsRetry((value) => value + 1)}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ROW 4: "الأسهم الأكثر تداولاً" (Most Active Data Table) */}
      {/* Columns: الرمز | الشركة | السعر | التغير | الحجم | RSI | إجراء */}
      {/* Sortable columns + Pagination (10 per page) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-sm hover:shadow-md transition-shadow space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'الأسهم الأكثر تداولاً' : 'MOST ACTIVE EQUITIES'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr
                ? 'جدول تفاعلي قابل للفرز بالأسعار وأحجام التداول ومؤشرات القوة النسبية.'
                : 'Interactive sortable table by price, volume, and momentum indicators.'}
            </p>
          </div>
          <Link
            href="/screener"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>{isAr ? 'فتح المصفي الكامل' : 'Open Screener'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View: Responsive Card List (< 640px) */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {paginatedStocks.map((stock) => {
            const isGain = stock.change >= 0;
            const spark = stock.sparkline || [
              stock.price * (isGain ? 0.97 : 1.03),
              stock.price * (isGain ? 0.985 : 1.015),
              stock.price * (isGain ? 0.99 : 1.01),
              stock.price,
            ];
            return (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                        {stock.currency}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5 max-w-[150px]">
                      {isAr ? stock.nameAr : stock.nameEn}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Sparkline points={spark} isPositive={isGain} />
                    <div className="text-end shrink-0">
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                        {stock.price.toFixed(2)}
                      </div>
                      <span
                        className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tabular-nums text-white ${
                          isGain ? 'bg-[#059669]' : 'bg-[#DC2626]'
                        }`}
                      >
                        {isGain ? '+' : ''}
                        {stock.changePct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{isAr ? 'حجم التداول:' : 'Vol:'} {(stock.volume || 0).toLocaleString()}</span>
                  <span>RSI: {stock.rsi || 52}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop View: Data Table (>= 640px) */}
        <div className="hidden sm:block overflow-x-auto no-scrollbar">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => handleSort('symbol')}
                  className="py-3 px-3 text-start cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>{isAr ? 'الرمز' : 'Symbol'}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 text-start">{isAr ? 'الشركة' : 'Company'}</th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-3 px-3 text-end font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isAr ? 'السعر' : 'Price'}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('changePct')}
                  className="py-3 px-3 text-end font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isAr ? 'التغير' : 'Change'}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('volume')}
                  className="py-3 px-3 text-end font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{isAr ? 'الحجم' : 'Volume'}</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rsi')}
                  className="py-3 px-3 text-center font-mono cursor-pointer hover:text-slate-900 dark:hover:text-white"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>RSI (14)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {paginatedStocks.map((stock) => {
                const isGain = stock.change >= 0;
                const rsiVal = stock.rsi || 52;
                return (
                  <tr
                    key={stock.symbol}
                    className="row-hover transition-colors"
                  >
                    <td className="py-3 px-3 text-start font-bold font-mono text-slate-900 dark:text-white">
                      <Link href={`/stock/${stock.symbol}`} className="hover:text-blue-600 transition-colors">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-start text-slate-700 dark:text-slate-300">
                      {isAr ? stock.nameAr : stock.nameEn}
                    </td>
                    <td className="py-3 px-3 text-end tabular-nums font-mono font-bold text-slate-900 dark:text-white">
                      {stock.price.toFixed(2)}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">{stock.currency}</span>
                    </td>
                    <td
                      className={`py-3 px-3 text-end tabular-nums font-mono font-bold ${
                        isGain ? 'text-[#059669] dark:text-emerald-400' : 'text-[#DC2626] dark:text-rose-400'
                      }`}
                    >
                      {isGain ? '+' : ''}
                      {stock.changePct.toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 text-end tabular-nums font-mono text-slate-500 dark:text-slate-400">
                      {(stock.volume || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rsiVal > 70
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : rsiVal < 35
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {rsiVal}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Link
                        href={`/stock/${stock.symbol}`}
                        className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
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

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500">
          <span>
            {isAr
              ? `صفحة ${currentPage} من ${totalPages}`
              : `Page ${currentPage} of ${totalPages}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
