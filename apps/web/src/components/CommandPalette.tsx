'use client';

import { useEffect, useState, useCallback } from 'react';
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
  GitCompare,
  Activity,
  FileCode,
  History,
  Info,
  Clock,
  Trash2,
} from 'lucide-react';
import { useBorsaty } from '@/context/BorsatyContext';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

interface StockQuickItem {
  symbol: string;
  nameEn: string;
  nameAr: string;
  market: string;
  currency: string;
}

interface RecentSearchItem {
  symbol: string;
  nameEn: string;
  nameAr: string;
  market: string;
  timestamp: number;
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

const RECENT_SEARCHES_KEY = 'borsaty_recent_searches_v1';

export default function CommandPalette() {
  const router = useRouter();
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, activeSymbol } = useBorsaty();
  const { language, setLanguage, theme, toggleTheme } = useApp();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);

  const isAr = language === 'ar';

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Non-blocking
    }
  }, [isCommandPaletteOpen]);

  const saveRecentSearch = useCallback((stock: { symbol: string; nameEn: string; nameAr: string; market: string }) => {
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.symbol !== stock.symbol);
        const updated = [{ ...stock, timestamp: Date.now() }, ...filtered].slice(0, 5);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Non-blocking
    }
  }, []);

  const clearRecentSearches = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      // Non-blocking
    }
  }, []);

  // Global keyboard shortcuts: Ctrl+K / Cmd+K and G+H, G+P, G+W, G+S
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandPaletteOpen(!isCommandPaletteOpen);
        return;
      }

      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
        return;
      }

      // Quick Go-To Shortcuts (only when not typing in an input and palette closed)
      if (!isInput && !isCommandPaletteOpen) {
        const now = Date.now();
        const key = e.key.toLowerCase();

        if (lastKey === 'g' && now - lastKeyTime < 1000) {
          if (key === 'h') {
            e.preventDefault();
            router.push('/');
            lastKey = '';
            return;
          } else if (key === 'p') {
            e.preventDefault();
            router.push('/portfolio');
            lastKey = '';
            return;
          } else if (key === 'w') {
            e.preventDefault();
            router.push('/watchlist');
            lastKey = '';
            return;
          } else if (key === 's') {
            e.preventDefault();
            router.push('/screener');
            lastKey = '';
            return;
          }
        }

        if (key === 'g') {
          lastKey = 'g';
          lastKeyTime = now;
        } else {
          lastKey = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen, router]);

  if (!isCommandPaletteOpen) return null;

  const handleSelectStock = (stock: StockQuickItem | RecentSearchItem) => {
    saveRecentSearch(stock);
    setIsCommandPaletteOpen(false);
    setQuery('');
    router.push(`/stock/${stock.symbol}`);
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
      toast.info(
        language === 'ar' ? 'جاري تجهيز التقرير المؤسسي...' : 'Generating institutional report...'
      );
      window.open(
        `/stock/${encodeURIComponent(activeSymbol)}/report?lang=${language}&download=1`,
        '_blank',
        'noopener,noreferrer'
      );
      setTimeout(() => {
        toast.success(
          language === 'ar' ? 'تم فتح صفحة التقرير' : 'Report page opened'
        );
      }, 1200);
    }
    setIsCommandPaletteOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-150"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-[#0B1120] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-white"
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
            <AnimatedIcon icon={Search} animation="rotate" size={20} className="text-slate-500 dark:text-slate-400" />
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

            {/* 1. Recent Searches (If Available) */}
            {recentSearches.length > 0 && query.trim() === '' && (
              <Command.Group
                heading={
                  <div className="flex items-center justify-between px-3 py-1 text-[11px] font-black tracking-wider uppercase text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {isAr ? 'عمليات البحث الأخيرة' : 'Recent Searches'}
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="hover:text-rose-500 transition-colors flex items-center gap-1 text-[10px] lowercase cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isAr ? 'مسح' : 'clear'}
                    </button>
                  </div>
                }
              >
                {recentSearches.map((stock) => (
                  <Command.Item
                    key={`recent-${stock.symbol}`}
                    value={`recent ${stock.symbol} ${stock.nameEn} ${stock.nameAr}`}
                    onSelect={() => handleSelectStock(stock)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[11px] text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
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
                      <AnimatedIcon icon={ArrowRight} animation="slide" rtl={language === 'ar'} size={14} className="text-slate-400 rtl:rotate-180" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* 2. Popular Stocks Group */}
            <Command.Group
              heading={
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-3 py-1 block">
                  {isAr ? 'الأسهم الأكثر تداولاً' : 'Popular Stocks'}
                </span>
              }
            >
              {POPULAR_STOCKS.map((stock) => (
                <Command.Item
                  key={stock.symbol}
                  value={`${stock.symbol} ${stock.nameEn} ${stock.nameAr} ${stock.market}`}
                  onSelect={() => handleSelectStock(stock)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800 aria-selected:text-slate-900 dark:aria-selected:text-white"
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
                    <AnimatedIcon icon={ArrowRight} animation="slide" rtl={language === 'ar'} size={14} className="text-slate-400 rtl:rotate-180" />
                  </div>
                </Command.Item>
              ))}
            </Command.Group>

            {/* 3. Platform Navigation */}
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
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'نظرة عامة على الأسواق (Home)' : 'Markets Overview (Home)'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + H</kbd>
              </Command.Item>

              <Command.Item
                value="screener quantitative technical scanner فلتر الأسهم"
                onSelect={() => handleNavigate('/screener')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'مصفّي الأسهم (Stock Screener)' : 'Stock Screener'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + S</kbd>
              </Command.Item>

              <Command.Item
                value="portfolio holdings stocks tracker المحفظة الصفقات"
                onSelect={() => handleNavigate('/portfolio')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'محفظة الأوراق المالية (Portfolio)' : 'Portfolio Terminal'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + P</kbd>
              </Command.Item>

              <Command.Item
                value="compare stocks performance correlation مقارنة الأسهم"
                onSelect={() => handleNavigate('/compare')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <GitCompare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'مقارنة الأسهم والمؤشرات (Compare)' : 'Compare Assets Terminal'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="calendar economic events macro cpi fed الأجندة الاقتصادية"
                onSelect={() => handleNavigate('/calendar')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'الأجندة الاقتصادية والمؤشرات (Calendar)' : 'Economic Calendar'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="watchlist portfolio المتابعة المفضلة"
                onSelect={() => handleNavigate('/watchlist')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <AnimatedIcon icon={Star} animation="rotate" size={16} className="text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'قائمة المتابعة (Watchlist)' : 'Persistent Watchlist'}</span>
                </div>
                <kbd className="text-[10px] text-slate-400 font-mono">G + W</kbd>
              </Command.Item>

              <Command.Item
                value="signals trading setups إشارات التداول"
                onSelect={() => handleNavigate('/signals')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'الإشارات والفرص الفنية' : 'Trading Signals & Confluence'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="status system health telemetry uptime حالة النظام"
                onSelect={() => handleNavigate('/status')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'حالة الخوادم والخدمات (System Status)' : 'System Health & Status'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="docs api developer endpoints documentation التوثيق البرمجي"
                onSelect={() => handleNavigate('/docs')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <FileCode className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'دليل المطورين والـ API (Developer Docs)' : 'Developer API & Docs'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="changelog release notes version history سجل التحديثات"
                onSelect={() => handleNavigate('/changelog')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'سجل التحديثات والإصدارات (Changelog)' : 'Release Notes & Changelog'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="about mission institutional methodology عن المنصة"
                onSelect={() => handleNavigate('/about')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{isAr ? 'عن بورصتي والرؤية المؤسسية (About)' : 'About Borsaty'}</span>
                </div>
              </Command.Item>
            </Command.Group>

            {/* 4. Quick Actions & Settings */}
            <Command.Group
              heading={
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 px-3 py-1 block">
                  {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
                </span>
              }
            >
              {activeSymbol && (
                <Command.Item
                  value={`download pdf institutional report تحميل تقرير ${activeSymbol}`}
                  onSelect={handleDownloadPdf}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>
                      {isAr ? `تحميل التقرير المؤسسي PDF (${activeSymbol})` : `Download Institutional PDF (${activeSymbol})`}
                    </span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                </Command.Item>
              )}

              <Command.Item
                value="theme toggle dark light mode تغيير المظهر"
                onSelect={handleToggleTheme}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  {theme === 'light' ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-slate-400" />}
                  <span>{theme === 'light' ? 'Switch to Obsidian Dark Mode' : 'Switch to Crisp Light Mode'}</span>
                </div>
              </Command.Item>

              <Command.Item
                value="language arabic english تبديل اللغة العربية الإنجليزية"
                onSelect={handleToggleLang}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>{language === 'ar' ? 'Change Language to English' : 'تغيير اللغة إلى العربية'}</span>
                </div>
              </Command.Item>
            </Command.Group>
          </Command.List>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-slate-50 dark:bg-[#0b1120] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">Borsaty</span>
              <span>•</span>
              <span className="hidden sm:inline">Shortcuts: <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">G+H</kbd> Home, <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">G+P</kbd> Portfolio, <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">G+S</kbd> Screener</span>
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
