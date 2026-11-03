'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
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
  Star,
  BarChart3,
  Globe,
  Sun,
  Moon,
  ArrowRight,
  Flame,
} from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { Language } from '@/context/AppContext';
import { DEFAULT_MEGA_MENU_DATA } from './marketMenuData';

interface MobileNavSheetProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: string;
  toggleTheme: () => void;
  onOpenSearch: () => void;
}

export default function MobileNavSheet({
  isOpen,
  onClose,
  language,
  setLanguage,
  theme,
  toggleTheme,
  onOpenSearch,
}: MobileNavSheetProps) {
  const [expandedSection, setExpandedSection] = useState<'markets' | 'tools' | 'research' | null>('markets');
  const isAr = language === 'ar';

  const toggleSection = (section: 'markets' | 'tools' | 'research') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const menuVariants = {
    closed: {
      x: isAr ? '100%' : '-100%',
      transition: { type: 'spring' as const, damping: 28, stiffness: 240 },
    },
    open: {
      x: 0,
      transition: { type: 'spring' as const, damping: 28, stiffness: 240, staggerChildren: 0.05, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    closed: { opacity: 0, y: 10 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Full Screen Drawer */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white border-e border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-base shadow-sm border border-slate-800">
                  <span>B</span>
                </div>
                <div>
                  <span className="text-lg font-black tracking-tight block">
                    {isAr ? 'بورصتي' : 'Borsaty'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block -mt-1">
                    Terminal
                  </span>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Top Search Trigger Bar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="w-full flex items-center justify-between h-11 px-3.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">
                    {isAr ? 'ابحث عن سهم، أداة، أو مؤشر...' : 'Search stocks, tools, indicators...'}
                  </span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* 3. Scrollable Accordion Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {/* Accordion 1: Markets */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('markets')}
                  className="w-full flex items-center justify-between p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'الأسواق والمؤشرات العالمية' : 'Markets & Live Indices'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'markets' ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'markets' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-1.5 overflow-hidden"
                    >
                      {DEFAULT_MEGA_MENU_DATA.indices.map((idx) => {
                        const isPos = idx.changePct >= 0;
                        return (
                          <Link
                            key={idx.symbol}
                            href={`/stock/${idx.symbol === 'EGX30' ? 'COMI' : idx.symbol === 'TASI' ? '2222' : 'AAPL'}`}
                            onClick={onClose}
                            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs"
                          >
                            <span className="font-bold">{isAr ? idx.nameAr : idx.nameEn}</span>
                            <div className="flex items-center gap-2 font-mono tabular-nums">
                              <span className="text-slate-500 dark:text-slate-400">
                                {idx.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                              </span>
                              <span
                                className={`font-bold ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}
                              >
                                {isPos ? '+' : ''}
                                {idx.changePct.toFixed(2)}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Commodities quick bar */}
                      <div className="pt-2 flex items-center justify-between text-xs px-1 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          {isAr ? 'الذهب:' : 'Gold:'}{' '}
                          <span className="font-mono font-bold text-slate-900 dark:text-white">$2,735</span>
                        </span>
                        <span>
                          {isAr ? 'النفط:' : 'Brent:'}{' '}
                          <span className="font-mono font-bold text-slate-900 dark:text-white">$74.20</span>
                        </span>
                      </div>

                      <Link
                        href="/"
                        onClick={onClose}
                        className="mt-2 w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors"
                      >
                        <span>{isAr ? 'عرض خريطة السوق التفاعلية' : 'Open Market Heatmap'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 2: Tools */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('tools')}
                  className="w-full flex items-center justify-between p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-500" />
                    <span>{isAr ? 'الأدوات والمحافظ الذكية' : 'Tools & Terminal'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'tools' ? 'rotate-180 text-cyan-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'tools' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-1.5 overflow-hidden"
                    >
                      <Link
                        href="/screener"
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-cyan-500/50 transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-cyan-500 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'مصفّي الأسهم' : 'Stock Screener'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'تصفية كمية متقدمة للأسهم' : 'Advanced quantitative market screener'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/portfolio"
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-indigo-500/50 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'محفظة الأوراق المالية' : 'Portfolio Terminal'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'تتبع الصفقات وأشعة X-Ray للمخاطر' : 'Live P&L and risk exposure radar'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/calendar"
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-rose-500/50 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'الأجندة الاقتصادية' : 'Economic Calendar'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'مؤشرات التضخم وقرارات الفائدة' : 'CPI inflation & central bank catalysts'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/compare"
                        onClick={onClose}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-violet-500/50 transition-colors"
                      >
                        <GitCompare className="w-4 h-4 text-violet-500 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'مقارنة الأصول والأسهم' : 'Side-by-Side Compare'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'رسم بياني معياري نسبي' : 'Normalized performance overlay'}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Accordion 3: Research & Institutional */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('research')}
                  className="w-full flex items-center justify-between p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'التوثيق والأبحاث المؤسسية' : 'Research & Institutional'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'research' ? 'rotate-180 text-emerald-500' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'research' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-1.5 overflow-hidden"
                    >
                      <Link
                        href="/signals"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        <span>{isAr ? 'الإشارات والفرص الفنية' : 'Trading Signals'}</span>
                      </Link>
                      <Link
                        href="/watchlist"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                        <span>{isAr ? 'قائمة المتابعة' : 'Watchlist'}</span>
                      </Link>
                      <Link
                        href="/changelog"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <History className="w-4 h-4 text-amber-500" />
                        <span>{isAr ? 'سجل التحديثات (Changelog)' : 'Release Notes'}</span>
                      </Link>
                      <Link
                        href="/docs"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-sky-500" />
                        <span>{isAr ? 'دليل الـ API البرمجي' : 'Developer API Docs'}</span>
                      </Link>
                      <Link
                        href="/status"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <Activity className="w-4 h-4 text-emerald-500" />
                        <span>{isAr ? 'حالة النظام (System Status)' : 'System Telemetry'}</span>
                      </Link>
                      <Link
                        href="/about"
                        onClick={onClose}
                        className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-900 transition-colors"
                      >
                        <Info className="w-4 h-4 text-blue-500" />
                        <span>{isAr ? 'عن بورصتي والرؤية الكمية' : 'About Platform'}</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Bottom Controls & Account Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-900/60">
              <div className="grid grid-cols-2 gap-2">
                {/* Language Switch */}
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500/40 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'ar' ? 'English (LTR)' : 'العربية (RTL)'}</span>
                </button>

                {/* Theme Switch */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-emerald-500/40 transition-colors"
                >
                  {theme === 'light' ? (
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                  ) : (
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{theme === 'light' ? (isAr ? 'داكن' : 'Dark Mode') : (isAr ? 'فاتح' : 'Light Mode')}</span>
                </button>
              </div>

              {/* Clerk Sign In / User Profile */}
              <div className="pt-1 flex items-center justify-center">
                <AuthButton />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
