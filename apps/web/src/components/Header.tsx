'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { useApp } from '@/context/AppContext';
import { useBorsaty } from '@/context/BorsatyContext';
import LiveMegaMenu from '@/components/navigation/LiveMegaMenu';
import MobileNavSheet from '@/components/navigation/MobileNavSheet';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { language, setLanguage, theme, toggleTheme, t } = useApp();
  const { setIsCommandPaletteOpen } = useBorsaty();
  const isAr = language === 'ar';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all duration-200 ${
        isScrolled ? 'shadow-sm' : ''
      }`}
    >
      {/* Top Banner / Ticker bar: Thin (h-8), Clean, Data-First */}
      <div className="relative bg-slate-900 text-white dark:bg-slate-950 h-8 px-4 text-[11px] font-medium tracking-wide flex items-center overflow-hidden border-b border-slate-800">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-10 bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 dark:from-slate-950 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-10 bg-gradient-to-l rtl:bg-gradient-to-r from-slate-900 dark:from-slate-950 to-transparent z-10" />

        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="hover:text-emerald-400 cursor-pointer font-bold transition-colors">
              EGX 30: <span className="text-emerald-400 tabular-nums">+1.24%</span>
            </span>
            <span className="hover:text-emerald-400 cursor-pointer font-bold transition-colors">
              TASI: <span className="text-emerald-400 tabular-nums">+0.68%</span>
            </span>
            <span className="hover:text-emerald-400 cursor-pointer font-bold transition-colors">
              S&P 500: <span className="text-emerald-400 tabular-nums">+0.35%</span>
            </span>
            <span className="hover:text-emerald-400 cursor-pointer font-bold transition-colors">
              Gold: <span className="text-emerald-400 tabular-nums">+0.54%</span>
            </span>
            <span className="hover:text-emerald-400 cursor-pointer font-bold transition-colors">
              BTC/USD: <span className="text-emerald-400 tabular-nums">+2.10%</span>
            </span>
            <span className="hover:text-rose-400 cursor-pointer font-bold transition-colors">
              EUR/USD: <span className="text-rose-400 tabular-nums">-0.17%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2 md:gap-4">
        {/* Far Left: Mobile Menu Trigger + Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ms-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap group">
            <div className="w-8 h-8 rounded-md bg-black text-white flex items-center justify-center font-bold text-lg shadow-xs group-hover:bg-slate-900 transition-colors border border-slate-800">
              <span>B</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isAr ? 'بورصتي' : 'Borsaty'}
            </span>
          </Link>
        </div>

        {/* Center / Left Navigation: The Live Mega Menu */}
        <div className="hidden md:flex items-center">
          <LiveMegaMenu language={language} />
        </div>

        {/* Far Right: Search, Language, Theme, Clerk Auth */}
        <div className="flex items-center gap-2.5">
          {/* Prominent Search Trigger: Compact, bg-slate-50, border border-slate-200 */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="group flex items-center justify-between w-36 sm:w-48 md:w-56 h-9 px-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-md text-sm text-slate-500 dark:text-slate-400 transition-all shadow-xs cursor-pointer"
            aria-label="Search markets (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors shrink-0" />
              <span className="truncate text-sm text-slate-500 dark:text-slate-400 font-normal">
                {isAr ? 'ابحث في الأسواق...' : 'Search markets...'}
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Language Toggle: Compact pill, bg-slate-100 */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="h-8 px-2.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Toggle language"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>

          {/* Theme Toggle Button: 32px circle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer shrink-0"
            aria-label="Toggle Theme"
            title={theme === 'light' ? t('common.themeDark') : t('common.themeLight')}
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-slate-600" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
          </button>

          {/* Clerk Auth Actions */}
          <div className="flex items-center ps-1 border-s border-slate-200 dark:border-slate-800 ms-1">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Sheet (< 768px) */}
      <MobileNavSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
      />
    </header>
  );
}
