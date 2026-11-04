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
  FileCode,
  Info,
  ChevronDown,
  Star,
  Bell,
  BarChart3,
  Globe,
  Sun,
  Moon,
  ArrowRight,
  FileDown,
  Settings,
  ShieldCheck,
  Newspaper,
} from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import Logo from '@/components/branding/Logo';
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

type SectionKey = 'markets' | 'tools' | 'reports' | 'settings' | 'about';

export default function MobileNavSheet({
  isOpen,
  onClose,
  language,
  setLanguage,
  theme,
  toggleTheme,
  onOpenSearch,
}: MobileNavSheetProps) {
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('markets');
  const isAr = language === 'ar';

  const toggleSection = (section: SectionKey) => {
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

          {/* Full Screen Slide-in Sheet */}
          <motion.div
            variants={menuVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="relative w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white border-e border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 overflow-hidden"
          >
            {/* 1. Header Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 min-h-[64px]">
              <Link href="/" onClick={onClose} className="flex items-center gap-2">
                <Logo variant="primary" size={28} showText={true} className="dark:hidden" />
                <Logo variant="white" size={28} showText={true} className="hidden dark:block" />
              </Link>
              <button
                onClick={onClose}
                className="min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/80 transition-colors"
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
                className="w-full flex items-center justify-between min-h-[48px] px-3.5 bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:border-blue-500/40 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="font-medium">
                    {isAr ? 'ابحث عن سهم، أداة، أو مؤشر...' : 'Search stocks, tools, indicators...'}
                  </span>
                </div>
                <kbd className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* 3. Scrollable Grouped Accordion Sections */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {/* Group 1: Markets */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('markets')}
                  className="w-full flex items-center justify-between min-h-[48px] p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{isAr ? 'الأسواق والمؤشرات' : 'Markets & Indices'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'markets' ? 'rotate-180 text-slate-900 dark:text-white' : ''
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
                      className="px-3 pb-3 space-y-2 overflow-hidden"
                    >
                      {DEFAULT_MEGA_MENU_DATA.indices.map((idx) => {
                        const isPos = idx.changePct >= 0;
                        return (
                          <Link
                            key={idx.symbol}
                            href={`/stock/${idx.symbol === 'EGX30' ? 'COMI' : idx.symbol === 'TASI' ? '2222' : 'AAPL'}`}
                            onClick={onClose}
                            className="flex items-center justify-between min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs"
                          >
                            <span className="font-bold">{isAr ? idx.nameAr : idx.nameEn}</span>
                            <div className="flex items-center gap-2 font-mono tabular-nums">
                              <span className="text-slate-500 dark:text-slate-400">
                                {idx.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                              </span>
                              <span
                                className={`font-bold ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                              >
                                {isPos ? '+' : ''}
                                {idx.changePct.toFixed(2)}%
                              </span>
                            </div>
                          </Link>
                        );
                      })}

                      <Link
                        href="/"
                        onClick={onClose}
                        className="mt-1 w-full min-h-[48px] flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <span>{isAr ? 'عرض خريطة السوق' : 'Open Market Heatmap'}</span>
                        <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group 2: Tools */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('tools')}
                  className="w-full flex items-center justify-between min-h-[48px] p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{isAr ? 'الأدوات والتحليل' : 'Tools & Terminal'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'tools' ? 'rotate-180 text-slate-900 dark:text-white' : ''
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
                      className="px-3 pb-3 space-y-2 overflow-hidden"
                    >
                      <Link
                        href="/screener"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'مصفّي الأسهم' : 'Stock Screener'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'تصفية كمية وفنية متقدمة' : 'Advanced quantitative market screener'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/portfolio"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'محفظة الأوراق المالية' : 'Portfolio Terminal'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'تتبع الصفقات والمخاطر' : 'Live P&L and risk exposure radar'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/compare"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <GitCompare className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'مقارنة الأصول والأسهم' : 'Side-by-Side Compare'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'مقارنة حركة الأسهم معاً' : 'Normalized relative performance'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/calendar"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                        <div>
                          <div className="font-bold">{isAr ? 'الأجندة الاقتصادية' : 'Economic Calendar'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'أحداث الاقتصاد الكلي' : 'Macro indicators & announcements'}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group 3: Reports */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('reports')}
                  className="w-full flex items-center justify-between min-h-[48px] p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{isAr ? 'التقارير المؤسسية' : 'Institutional Reports'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'reports' ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'reports' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-2 overflow-hidden"
                    >
                      <Link
                        href="/news"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <Newspaper className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'أخبار السوق' : 'Market News'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'آخر الأخبار المالية من مصادر متعددة' : 'Latest financial news from multiple sources'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/signals"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'إشارات وتوصيات السوق' : 'Market Signals & Opportunities'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'فرص فنية قائمة على 8 محركات' : 'Opportunities based on 8 technical engines'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/watchlist"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <Star className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'قائمة المتابعة الخاصة' : 'Personal Watchlist'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'متابعة الأسهم المفضلة لديك' : 'Track your starred assets in real-time'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/alerts"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'مركز التنبيهات الذكية' : 'Smart Alert Center'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'إدارة التنبيهات السعرية والفنية' : 'Manage price and indicator targets'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/docs"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold hover:border-slate-400 transition-colors"
                      >
                        <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'دليل الـ API المؤسسي' : 'Institutional API Docs'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'الربط البرمجي للبيانات والتحليلات' : 'Developer REST APIs and endpoints'}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group 4: Settings */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('settings')}
                  className="w-full flex items-center justify-between min-h-[48px] p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{isAr ? 'الإعدادات والمظهر' : 'Settings & Preferences'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'settings' ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'settings' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-2 overflow-hidden"
                    >
                      <button
                        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                        className="w-full flex items-center justify-between min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold"
                      >
                        <span className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          {isAr ? 'لغة الواجهة' : 'Interface Language'}
                        </span>
                        <span className="font-mono text-slate-500 font-bold">
                          {language === 'ar' ? 'العربية' : 'English'}
                        </span>
                      </button>

                      <button
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold"
                      >
                        <span className="flex items-center gap-2">
                          {theme === 'light' ? (
                            <Moon className="w-4 h-4 text-slate-600" />
                          ) : (
                            <Sun className="w-4 h-4 text-slate-400" />
                          )}
                          {isAr ? 'المظهر' : 'Theme'}
                        </span>
                        <span className="text-slate-500 font-bold">
                          {theme === 'light' ? (isAr ? 'فاتح' : 'Light') : (isAr ? 'داكن' : 'Dark')}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Group 5: About */}
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/40">
                <button
                  onClick={() => toggleSection('about')}
                  className="w-full flex items-center justify-between min-h-[48px] p-3.5 text-start font-bold text-sm text-slate-900 dark:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{isAr ? 'عن المنصة' : 'About Borsaty'}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      expandedSection === 'about' ? 'rotate-180 text-slate-900 dark:text-white' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedSection === 'about' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-3 pb-3 space-y-2 overflow-hidden"
                    >
                      <Link
                        href="/about"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold"
                      >
                        <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'رؤيتنا ومنهجيتنا' : 'Our Mission & Approach'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'نبذة عن المنصة والتقنيات الكمية' : 'About the institutional financial platform'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/changelog"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold"
                      >
                        <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'سجل التحديثات' : 'Changelog'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'الإصدارات والتطويرات المستمرة' : 'Version history and release notes'}
                          </div>
                        </div>
                      </Link>

                      <Link
                        href="/status"
                        onClick={onClose}
                        className="flex items-center gap-3 min-h-[48px] px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/60 text-xs font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-bold">{isAr ? 'حالة النظام المباشرة' : 'System Telemetry'}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {isAr ? 'كفاءة وسرعة الخوادم والبيانات' : 'Infrastructure and data uptime'}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* 4. Bottom User Auth Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 min-h-[72px] flex items-center justify-center">
              <AuthButton />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
