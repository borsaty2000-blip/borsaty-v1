'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Search,
  TrendingUp,
  SlidersHorizontal,
  BarChart3,
  Star,
  Sun,
  Moon,
  Globe,
  FileDown,
  ArrowRight,
  Sparkles,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { useBorsaty } from '@/context/BorsatyContext';
import { useApp } from '@/context/AppContext';

interface StockQuickItem {
  symbol: string;
  nameEn: string;
  nameAr: string;
  market: string;
  currency: string;
}

const POPULAR_STOCKS: StockQuickItem[] = [
  { symbol: 'COMI', nameEn: 'Commercial International Bank', nameAr: 'البنك التجاري الدولي', market: 'EGX', currency: 'EGP' },
  { symbol: '2222', nameEn: 'Saudi Aramco', nameAr: 'أرامكو السعودية', market: 'TASI', currency: 'SAR' },
  { symbol: 'AAPL', nameEn: 'Apple Inc.', nameAr: 'أبل', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'NVDA', nameEn: 'NVIDIA Corporation', nameAr: 'إنفيديا', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'MSFT', nameEn: 'Microsoft Corporation', nameAr: 'مايكروسوفت', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'TSLA', nameEn: 'Tesla Inc.', nameAr: 'تسلا', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'GOOGL', nameEn: 'Alphabet Inc.', nameAr: 'ألفابت (جوجل)', market: 'NASDAQ', currency: 'USD' },
  { symbol: 'TMGH', nameEn: 'Talaat Moustafa Group', nameAr: 'مجموعة طلعت مصطفى', market: 'EGX', currency: 'EGP' },
  { symbol: 'FWRY', nameEn: 'Fawry Banking & Payment', nameAr: 'فوري للمدفوعات', market: 'EGX', currency: 'EGP' },
  { symbol: 'EAST', nameEn: 'Eastern Company', nameAr: 'الشرقية للدخان', market: 'EGX', currency: 'EGP' },
];

export default function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, activeSymbol } = useBorsaty();
  const { language, setLanguage, theme, toggleTheme } = useApp();
  const [query, setQuery] = useState('');

  const isAr = language === 'ar';

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const handleSelectStock = (sym: string) => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    router.push(`/stock/${sym}`);
  };

  const handleNavigate = (path: string) => {
    setIsCommandPaletteOpen(false);
    setQuery('');
    router.push(path);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setIsCommandPaletteOpen(false);
  };

  const handleToggleLang = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
    setIsCommandPaletteOpen(false);
  };

  const handleDownloadPdf = () => {
    if (activeSymbol) {
      window.open(`/api/reports/${activeSymbol}/download?lang=${language}`, '_blank');
    }
    setIsCommandPaletteOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <Command
          filter={(value, search) => {
            if (value.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
          }}
          className="w-full flex flex-col"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              autoFocus
              placeholder={
                isAr
                  ? 'ابحث عن سهم، صفحة، أو إجراء فني سريع (Ctrl+K)...'
                  : 'Search stocks, pages, or quick actions (Ctrl+K)...'
              }
              className="w-full h-14 bg-transparent outline-none text-sm font-semibold placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-2 no-scrollbar">
            <Command.Empty className="py-8 text-center text-xs font-semibold text-slate-400">
              {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching results found.'}
            </Command.Empty>

            {/* Quick Stocks Group */}
            <Command.Group
              heading={
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-3 py-1 block">
                  {isAr ? 'الأسهم والأدوات الفنية' : 'Stocks & Instruments'}
                </span>
              }
            >
              {POPULAR_STOCKS.map((stock) => (
                <Command.Item
                  key={stock.symbol}
                  value={`${stock.symbol} ${stock.nameEn} ${stock.nameAr} ${stock.market}`}
                  onSelect={() => handleSelectStock(stock.symbol)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10 aria-selected:text-emerald-600 dark:aria-selected:text-emerald-400"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-slate-300">
                      {stock.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm">{stock.symbol}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? stock.nameAr : stock.nameEn}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {stock.market}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Platform Navigation */}
            <Command.Group
              heading={
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-3 py-1 block">
                  {isAr ? 'التنقل في المنصة' : 'Platform Navigation'}
                </span>
              }
            >
              <Command.Item
                value="markets overview home الرئيسية"
                onSelect={() => handleNavigate('/')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'نظرة عامة على الأسواق (Home)' : 'Markets Overview (Home)'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + H</kbd>
              </Command.Item>

              <Command.Item
                value="screener ai quantitative scanner فلتر الأسهم"
                onSelect={() => handleNavigate('/screener')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-cyan-600" />
                  <span>{isAr ? 'الفلتر الذكي للأسهم (AI Screener)' : 'AI Market Screener'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + S</kbd>
              </Command.Item>

              <Command.Item
                value="signals trading setups إشارات التداول"
                onSelect={() => handleNavigate('/signals')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'الإشارات والفرص الفنية' : 'Trading Signals & Confluence'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="portfolio holdings stocks tracker المحفظة الصفقات"
                onSelect={() => handleNavigate('/portfolio')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>{isAr ? 'محفظة الأوراق المالية (Portfolio)' : 'Portfolio Terminal'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + P</kbd>
              </Command.Item>

              <Command.Item
                value="calendar economic events macro cpi fed الأجندة الاقتصادية"
                onSelect={() => handleNavigate('/calendar')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>{isAr ? 'الأجندة الاقتصادية والمؤشرات (Calendar)' : 'Economic Calendar'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + C</kbd>
              </Command.Item>

              <Command.Item
                value="watchlist portfolio المتابعة المفضلة"
                onSelect={() => handleNavigate('/watchlist')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span>{isAr ? 'قائمة المتابعة (Watchlist)' : 'Persistent Watchlist'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + W</kbd>
              </Command.Item>
            </Command.Group>

            {/* Quick Actions & Settings */}
            <Command.Group
              heading={
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-3 py-1 block">
                  {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
                </span>
              }
            >
              <Command.Item
                value="theme toggle dark light mode تغيير المظهر"
                onSelect={handleToggleTheme}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
                  <span>{theme === 'light' ? 'Switch to Obsidian Dark Mode' : 'Switch to Crisp Light Mode'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="language arabic english تبديل اللغة العربية الإنجليزية"
                onSelect={handleToggleLang}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'Change Language to English' : 'تغيير اللغة إلى العربية'}</span>
                </div>
              </Command.Item>

              {activeSymbol && (
                <Command.Item
                  value={`download pdf institutional report تحميل تقرير ${activeSymbol}`}
                  onSelect={handleDownloadPdf}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-emerald-50 dark:aria-selected:bg-emerald-500/10"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="w-4 h-4 text-rose-500" />
                    <span>
                      {isAr ? `تحميل التقرير المؤسسي PDF (${activeSymbol})` : `Download Institutional PDF (${activeSymbol})`}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                </Command.Item>
              )}
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-600">Borsaty AI</span>
              <span>•</span>
              <span>Command Palette</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Navigate: ↑↓</span>
              <span>Select: ↵</span>
              <span>Close: Esc</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
