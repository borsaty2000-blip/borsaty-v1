'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
} from 'lucide-react';
import { Language } from '@/context/AppContext';
import MiniSparkline from './MiniSparkline';
import { DEFAULT_MEGA_MENU_DATA, MegaMenuData } from './marketMenuData';

interface LiveMegaMenuProps {
  language: Language;
  onLinkClick?: () => void;
}

export default function LiveMegaMenu({ language, onLinkClick }: LiveMegaMenuProps) {
  const [activeMenu, setActiveMenu] = useState<'markets' | 'tools' | 'research' | null>(null);
  const [menuData, setMenuData] = useState<MegaMenuData>(DEFAULT_MEGA_MENU_DATA);
  const isAr = language === 'ar';

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

        // Merge live data with sparkline fallbacks
        if (data.topGainers && Array.isArray(data.topGainers) && data.topGainers.length > 0) {
          interface ApiMoverItem {
            symbol: string;
            nameEn: string;
            nameAr: string;
            market: string;
            price: number;
            changePct: number;
          }
          setMenuData((prev) => ({
            ...prev,
            topGainers: data.topGainers.slice(0, 3).map((g: ApiMoverItem) => ({
              symbol: g.symbol,
              nameEn: g.nameEn,
              nameAr: g.nameAr,
              market: g.market,
              price: g.price,
              changePct: g.changePct,
            })),
            topLosers: (data.topLosers || []).slice(0, 3).map((l: ApiMoverItem) => ({
              symbol: l.symbol,
              nameEn: l.nameEn,
              nameAr: l.nameAr,
              market: l.market,
              price: l.price,
              changePct: l.changePct,
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
    };
  }, []);

  // Keyboard navigation: Escape key closes any active dropdown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeMenu) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeMenu]);

  const handleMouseEnter = (menu: 'markets' | 'tools' | 'research') => {
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
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
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            activeMenu === 'markets'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'markets'}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>{isAr ? 'الأسواق' : 'Markets'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'markets' ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </button>
      </div>

      {/* 2. Tools Trigger */}
      <div className="relative" onMouseEnter={() => handleMouseEnter('tools')}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            activeMenu === 'tools'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'tools'}
        >
          <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
          <span>{isAr ? 'الأدوات' : 'Tools'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'tools' ? 'rotate-180 text-cyan-500' : ''
            }`}
          />
        </button>
      </div>

      {/* 3. Research Trigger */}
      <div className="relative" onMouseEnter={() => handleMouseEnter('research')}>
        <button
          onClick={() => setActiveMenu(activeMenu === 'research' ? null : 'research')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            activeMenu === 'research'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
          }`}
          aria-expanded={activeMenu === 'research'}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>{isAr ? 'الأبحاث والتوثيق' : 'Research'}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              activeMenu === 'research' ? 'rotate-180 text-amber-500' : ''
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
          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isAr ? 'المحفظة' : 'Portfolio'}</span>
        </Link>
        <Link
          href="/calendar"
          prefetch
          onClick={onLinkClick}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-rose-500" />
          <span>{isAr ? 'الأجندة' : 'Calendar'}</span>
        </Link>
      </div>

      {/* Floating Mega Dropdown Container with Spring Animation */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-2.5 z-50 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden ${
              activeMenu === 'markets'
                ? 'w-[920px] -start-8'
                : activeMenu === 'tools'
                ? 'w-[720px] -start-16'
                : 'w-[640px] -start-24'
            }`}
          >
            {/* ═══════════════════════════════════════════════════ */}
            {/* MARKETS DROPDOWN: 4 COLUMNS MINI-DASHBOARD          */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeMenu === 'markets' && (
              <div className="p-6">
                <div className="grid grid-cols-4 gap-6">
                  {/* Column 1: Indices */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <Globe2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isAr ? 'مؤشرات الأسواق' : 'Major Indices'}
                      </span>
                    </div>
                    <div className="space-y-2">
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
                            className="group flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                                {isAr ? item.nameAr : item.nameEn}
                              </div>
                              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                {item.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} />
                              <span
                                className={`text-[11px] font-mono font-bold tabular-nums ${
                                  isPos ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {isPos ? '+' : ''}
                                {item.changePct.toFixed(2)}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Commodities */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isAr ? 'السلع والمعادن' : 'Commodities'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {menuData.commodities.map((item) => {
                        const isPos = item.changePct >= 0;
                        return (
                          <div
                            key={item.symbol}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {isAr ? item.nameAr : item.nameEn}
                              </div>
                              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} />
                              <span
                                className={`text-[11px] font-mono font-bold tabular-nums ${
                                  isPos ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {isPos ? '+' : ''}
                                {item.changePct.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 3: Crypto */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {isAr ? 'العملات الرقمية' : 'Digital Assets'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {menuData.crypto.map((item) => {
                        const isPos = item.changePct >= 0;
                        return (
                          <div
                            key={item.symbol}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 dark:text-white">
                                {isAr ? item.nameAr : item.nameEn}
                              </div>
                              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <MiniSparkline data={item.sparkline} isPositive={isPos} />
                              <span
                                className={`text-[11px] font-mono font-bold tabular-nums ${
                                  isPos ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {isPos ? '+' : ''}
                                {item.changePct.toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 4: Top Movers */}
                  <div className="space-y-3 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-1 border-b border-slate-200 dark:border-slate-800">
                      {isAr ? 'الأعلى تحركاً اليوم' : 'Active Movers'}
                    </span>

                    {/* Top Gainers */}
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase">
                        <ArrowUpRight className="w-3 h-3" />
                        {isAr ? 'الأعلى صعوداً' : 'Top Gainers'}
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
                          className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-emerald-500/10 transition-colors"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{stock.symbol}</span>
                          <span className="font-mono font-bold text-emerald-500">
                            +{stock.changePct.toFixed(2)}%
                          </span>
                        </Link>
                      ))}
                    </div>

                    {/* Top Losers */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1 uppercase">
                        <ArrowDownRight className="w-3 h-3" />
                        {isAr ? 'الأكثر تراجعاً' : 'Top Decliners'}
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
                          className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{stock.symbol}</span>
                          <span className="font-mono font-bold text-rose-500">
                            {stock.changePct.toFixed(2)}%
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer of the Mega Menu */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {isAr
                        ? 'تحديثات الأسعار الفورية عبر محركات التحليل المؤسسي'
                        : 'Real-time telemetry powered by institutional quantitative feeds'}
                    </span>
                  </div>
                  <Link
                    href="/"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>{isAr ? 'عرض خريطة السوق الكاملة' : 'View All Markets & Heatmap'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TOOLS DROPDOWN: 4 LARGE INTERACTIVE CARDS          */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeMenu === 'tools' && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Card 1: Stock Screener */}
                  <Link
                    href="/screener"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shrink-0 group-hover:scale-105 transition-transform">
                      <SlidersHorizontal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                        {isAr ? 'مصفّي الأسهم المؤسسي' : 'Stock Screener'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'تصفية وبحث فوري في آلاف الأسهم باستخدام اللغة الطبيعية والمعايير الكمية.'
                          : 'Find high-probability setups using natural language and quantitative criteria.'}
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
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                        {isAr ? 'محفظة الأوراق المالية (Portfolio)' : 'Portfolio Terminal'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {isAr
                          ? 'تتبع حقيقي لصفقاتك، الأرباح والخسائر غير المحققة، ومصفوفة أشعة X-Ray للمخاطر.'
                          : 'Track holdings, realized/unrealized P&L, and portfolio sector X-Ray risk score.'}
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
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
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
                    className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 transition-all flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 shrink-0 group-hover:scale-105 transition-transform">
                      <GitCompare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">
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
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link
                    href="/changelog"
                    prefetch
                    onClick={() => {
                      setActiveMenu(null);
                      onLinkClick?.();
                    }}
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-amber-500/5 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
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
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-sky-500/5 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
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
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-emerald-500/5 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                        {isAr ? 'حالة النظام والخوادم' : 'System Health Telemetry'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'رصد فوري لـ 12 خدمة وخادم مع سجل استقرار 30 يوماً' : '99.98% uptime monitoring across 12 distributed microservices'}
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
                    className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-500/5 transition-all flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <Info className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">
                        {isAr ? 'عن المنصة والرؤية الكمية' : 'About Borsaty'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isAr ? 'الركائز الرياضية ومحركات التحليل المؤسسي الـ 8' : 'Mission statement and proprietary 8-engine architecture'}
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
