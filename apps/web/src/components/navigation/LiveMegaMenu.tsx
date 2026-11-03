'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  SlidersHorizontal,
  Briefcase,
  Calendar,
  GitCompare,
  History,
  Activity,
  FileCode,
  Info,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Globe2,
} from 'lucide-react';
import { Language } from '@/context/AppContext';
import MiniSparkline from './MiniSparkline';
import { DEFAULT_MEGA_MENU_DATA, MegaMenuData } from './marketMenuData';

interface LiveMegaMenuProps {
  language: Language;
  onLinkClick?: () => void;
}

interface ApiMoverItem {
  symbol: string;
  changePct?: number;
  change_pct?: number;
}

export default function LiveMegaMenu({ language, onLinkClick }: LiveMegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<'markets' | 'tools' | 'research' | null>(null);
  const [menuData, setMenuData] = useState<MegaMenuData>(DEFAULT_MEGA_MENU_DATA);
  const isAr = language === 'ar';
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch updated market overview once on mount (cached for 60s)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetch('/api/market/overview', {
          headers: { 'Cache-Control': 'max-age=60' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (data.topGainers && Array.isArray(data.topGainers) && data.topGainers.length > 0) {
          setMenuData((prev) => ({
            ...prev,
            topGainers: data.topGainers.slice(0, 3).map((g: ApiMoverItem) => ({
              symbol: g.symbol,
              changePct: typeof g.changePct === 'number' ? g.changePct : (g.change_pct ?? 2.5),
            })),
            topLosers: data.topLosers.slice(0, 3).map((l: ApiMoverItem) => ({
              symbol: l.symbol,
              changePct: typeof l.changePct === 'number' ? l.changePct : (l.change_pct ?? -2.5),
            })),
          }));
        }
      } catch {
        // Fall back gracefully to DEFAULT_MEGA_MENU_DATA
      }
    }
    loadData();
    return () => {
      isMounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Keyboard navigation: Escape key closes any active dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMenu) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setActiveMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu]);

  // Hover behavior with 150ms delay
  const handleMouseEnter = (menu: 'markets' | 'tools' | 'research') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(menu);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(null);
  };

  return (
    <nav
      className="relative flex items-center gap-1 text-[13px] font-semibold text-slate-700 dark:text-slate-200"
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. Markets Trigger */}
      <div className="relative" onMouseEnter={() => handleMouseEnter('markets')}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'markets' ? null : 'markets')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none ${
            activeMenu === 'markets'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'markets'}
        >
          <TrendingUp className="w-4 h-4 text-slate-900 dark:text-white" />
          <span>{isAr ? 'الأسواق' : 'Markets'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'markets' ? 'rotate-180 text-slate-900 dark:text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* 2. Tools Trigger */}
      <div className="relative" onMouseEnter={() => handleMouseEnter('tools')}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none ${
            activeMenu === 'tools'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'tools'}
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-900 dark:text-white" />
          <span>{isAr ? 'الأدوات' : 'Tools'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'tools' ? 'rotate-180 text-slate-900 dark:text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* 3. Research Trigger */}
      <div className="relative" onMouseEnter={() => handleMouseEnter('research')}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'research' ? null : 'research')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:outline-none ${
            activeMenu === 'research'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'research'}
        >
          <Activity className="w-4 h-4 text-slate-900 dark:text-white" />
          <span>{isAr ? 'الأبحاث والتوثيق' : 'Research'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'research' ? 'rotate-180 text-slate-900 dark:text-white' : ''
            }`}
          />
        </button>
      </div>

      {/* Direct Portfolio & Watchlist links on larger screens */}
      <div className="hidden lg:flex items-center gap-1">
        <Link
          href="/portfolio"
          prefetch
          onClick={onLinkClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>{isAr ? 'المحفظة' : 'Portfolio'}</span>
        </Link>
        <Link
          href="/calendar"
          prefetch
          onClick={onLinkClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
          <span>{isAr ? 'الأجندة' : 'Calendar'}</span>
        </Link>
      </div>

      {/* Floating Mega Dropdown Container with Spring Animation */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute top-full mt-2 z-50 bg-white dark:bg-[#0f172a] border border-[#e5e7eb] dark:border-[#334155] rounded-xl shadow-2xl overflow-hidden ${
              activeMenu === 'markets'
                ? 'w-[960px] -start-8'
                : activeMenu === 'tools'
                ? 'w-[740px] -start-16'
                : 'w-[680px] -start-24'
            }`}
          >
            {/* ═══════════════════════════════════════════════════ */}
            {/* MARKETS DROPDOWN: 4 COLUMNS MINI-DASHBOARD          */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeMenu === 'markets' && (
              <div className="p-8">
                <div className="grid grid-cols-4 gap-6">
                  {/* Column 1: Indices */}
                  <div className="space-y-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <Globe2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? 'مؤشرات الأسواق' : 'Major Indices'}</span>
                    </div>
                    <div className="space-y-1">
                      {menuData.indices.map((item) => {
                        const isPos = item.changePct >= 0;
                        return (
                          <Link
                            key={item.symbol}
                            href={`/stock/${item.symbol === 'EGX30' ? 'COMI' : item.symbol === 'TASI' ? '2222' : 'AAPL'}`}
                            prefetch
                            onClick={() => {
                              setActiveMenu(null);
                              onLinkClick?.();
                            }}
                            className="group flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.symbol}</span>
                                <span className="text-[11px] text-slate-500 truncate max-w-[85px]">
                                  {isAr ? item.nameAr : item.nameEn}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="LIVE" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                                  {item.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} stroke="#94A3B8" />
                              <span
                                className={`text-xs font-medium tabular-nums flex items-center gap-0.5 ${
                                  isPos ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                <span>{isPos ? '▲' : '▼'}</span>
                                <span>{Math.abs(item.changePct).toFixed(2)}%</span>
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Commodities */}
                  <div className="space-y-4 border-s border-slate-200 dark:border-slate-800 ps-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? 'السلع والمعادن' : 'Commodities'}</span>
                    </div>
                    <div className="space-y-1">
                      {menuData.commodities.map((item) => {
                        const isPos = item.changePct >= 0;
                        return (
                          <div
                            key={item.symbol}
                            className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.symbol}</span>
                                <span className="text-[11px] text-slate-500 truncate max-w-[85px]">
                                  {isAr ? item.nameAr : item.nameEn}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="LIVE" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} stroke="#94A3B8" />
                              <span
                                className={`text-xs font-medium tabular-nums flex items-center gap-0.5 ${
                                  isPos ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                <span>{isPos ? '▲' : '▼'}</span>
                                <span>{Math.abs(item.changePct).toFixed(2)}%</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Crypto */}
                  <div className="space-y-4 border-s border-slate-200 dark:border-slate-800 ps-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? 'العملات الرقمية' : 'Digital Assets'}</span>
                    </div>
                    <div className="space-y-1">
                      {menuData.crypto.map((item) => {
                        const isPos = item.changePct >= 0;
                        return (
                          <div
                            key={item.symbol}
                            className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.symbol}</span>
                                <span className="text-[11px] text-slate-500 truncate max-w-[85px]">
                                  {isAr ? item.nameAr : item.nameEn}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="LIVE" />
                                <span className="text-sm font-medium text-slate-900 dark:text-white tabular-nums">
                                  ${item.price.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} stroke="#94A3B8" />
                              <span
                                className={`text-xs font-medium tabular-nums flex items-center gap-0.5 ${
                                  isPos ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                <span>{isPos ? '▲' : '▼'}</span>
                                <span>{Math.abs(item.changePct).toFixed(2)}%</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 4: Top Movers */}
                  <div className="space-y-4 border-s border-slate-200 dark:border-slate-800 ps-6">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200 dark:border-slate-800">
                      {isAr ? 'الأعلى تحركاً اليوم' : 'Active Movers'}
                    </div>

                    {/* Top Gainers */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-emerald-600 uppercase flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>{isAr ? 'الأعلى صعوداً' : 'Top Gainers'}</span>
                      </div>
                      {menuData.topGainers.map((stock) => (
                        <Link
                          key={stock.symbol}
                          href={`/stock/${stock.symbol}`}
                          prefetch
                          onClick={() => {
                            setActiveMenu(null);
                            onLinkClick?.();
                          }}
                          className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{stock.symbol}</span>
                          <span className="font-medium text-emerald-600 tabular-nums">
                            +{stock.changePct.toFixed(2)}%
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Top Decliners */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-semibold text-red-600 uppercase flex items-center gap-1">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>{isAr ? 'الأكثر تراجعاً' : 'Top Decliners'}</span>
                      </div>
                      {menuData.topLosers.map((stock) => (
                        <Link
                          key={stock.symbol}
                          href={`/stock/${stock.symbol}`}
                          prefetch
                          onClick={() => {
                            setActiveMenu(null);
                            onLinkClick?.();
                          }}
                          className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="font-bold text-slate-900 dark:text-white">{stock.symbol}</span>
                          <span className="font-medium text-red-600 tabular-nums">
                            {stock.changePct.toFixed(2)}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer of Mega Menu: Bloomberg-style Market Summary Bar */}
                <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="font-mono text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span>
                      {isAr
                        ? '3,245 سهم | 1,234 صاعد | 987 هابط | حالة السوق: متباين'
                        : '3,245 stocks | 1,234 advancing | 987 declining | Market: Mixed'}
                    </span>
                  </div>
                  <Link
                    href="/"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white hover:underline"
                  >
                    <span>{isAr ? 'عرض كافة الأسواق ←' : 'View Full Markets →'}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TOOLS DROPDOWN: 4 LARGE INTERACTIVE CARDS          */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeMenu === 'tools' && (
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 1: Stock Screener */}
                  <Link
                    href="/screener"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0 group-hover:scale-105 transition-transform">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'مصفّي الأسهم المؤسسي' : 'Stock Screener'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'تصفية وبحث فوري في آلاف الأسهم باستخدام المعايير الفنية والكمية.'
                          : 'Find high-probability setups using quantitative technical criteria.'}
                      </div>
                    </div>
                  </Link>

                  {/* Card 2: Portfolio Terminal */}
                  <Link
                    href="/portfolio"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'محفظة الأوراق المالية (Portfolio)' : 'Portfolio Terminal'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'تتبع حقيقي لصفقاتك، الأرباح والخسائر غير المحققة، ومصفوفة تنويع المخاطر.'
                          : 'Track holdings, realized/unrealized P&L, and portfolio risk diversification.'}
                      </div>
                    </div>
                  </Link>

                  {/* Card 3: Economic Calendar */}
                  <Link
                    href="/calendar"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0 group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'الأجندة الاقتصادية (Macro Calendar)' : 'Economic Calendar'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'متابعة قرارات البنوك المركزية، بيانات التضخم CPI، والأحداث المحركة للأسواق.'
                          : 'Track central bank interest rates, CPI inflation figures, and macro volatility catalysts.'}
                      </div>
                    </div>
                  </Link>

                  {/* Card 4: Asset Compare Tool */}
                  <Link
                    href="/compare"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0 group-hover:scale-105 transition-transform">
                      <GitCompare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'مقارنة الأصول والأسهم (Asset Compare)' : 'Side-by-Side Compare'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'مقارنة فنية وأداء نسبي بين سهمين أو مؤشرين في رسم بياني معياري واحد.'
                          : 'Analyze performance correlations, valuation metrics, and technical confluence side-by-side.'}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* RESEARCH DROPDOWN: INSTITUTIONAL PAGES             */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeMenu === 'research' && (
              <div className="p-8">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/changelog"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'سجل التحديثات والإصدارات' : 'Release Changelog'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'خارطة الطريق وتفاصيل التحديثات المؤسسية' : 'Version history, release milestones, and engine updates'}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/docs"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'دليل الـ API والمطورين' : 'Developer API Docs'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'أمثلة برمجية بنظام REST بلغات Python و cURL' : 'Interactive endpoint schemas and authentication guidelines'}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/status"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'حالة النظام والخوادم' : 'System Health Telemetry'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'رصد فوري للخدمات مع سجل استقرار 30 يوماً' : '99.98% uptime monitoring across distributed microservices'}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/about"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        {isAr ? 'عن المنصة والرؤية الكمية' : 'About Borsaty'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'الركائز الرياضية ومحركات التحليل المؤسسي' : 'Mission statement and proprietary quantitative architecture'}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
