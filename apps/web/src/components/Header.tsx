"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  TrendingUp,
  Globe,
  Sun,
  Moon,
  BarChart3,
  SlidersHorizontal,
  History,
  Layers,
  ChevronDown
} from "lucide-react";
import { resolveStockAlias } from "@borsaty/shared";
import { useApp } from "@/context/AppContext";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const router = useRouter();
  const { language, setLanguage, theme, toggleTheme, t } = useApp();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const alias = resolveStockAlias(searchQuery);
    if (alias) {
      router.push(`/stock/${alias.symbol}`);
    } else {
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Top Banner / Ticker bar */}
      <div className="bg-slate-900 text-white dark:bg-slate-950 py-1 px-4 text-[11px] font-medium tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {t("common.appName")} Pro
            </span>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="hover:text-white cursor-pointer">EGX 30: +1.24%</span>
              <span className="hover:text-white cursor-pointer">TASI: +0.68%</span>
              <span className="hover:text-white cursor-pointer">S&P 500: +0.35%</span>
              <span className="hover:text-white cursor-pointer">BTC/USD: +2.10%</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px]">
            <span>{t("common.tagline")}</span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-700 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                {t("common.appName")}
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-gray-400">
                Investing-Grade Quantitative Engine
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
            <Link
              href="/"
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              {t("nav.markets")}
            </Link>
            <Link
              href="/screener"
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              {t("nav.screener")}
            </Link>
            <Link
              href="/signals"
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("nav.signals")}
            </Link>
            <Link
              href="/stock/COMI"
              className="px-3 py-2 rounded-md text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              COMI
            </Link>
            <Link
              href="/stock/2222"
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              2222 (أرامكو)
            </Link>
            <Link
              href="/stock/AAPL"
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              AAPL
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm sm:max-w-md relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              className="w-full h-10 px-4 ps-10 bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
            />
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3 pointer-events-none" />
          </div>
        </form>

        {/* Action Controls: Language & Theme Toggles */}
        <div className="flex items-center gap-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
              aria-label="Language Selector"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{language === "ar" ? "العربية" : "English"}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {langMenuOpen && (
              <div className="absolute end-0 mt-1.5 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 text-xs font-medium">
                <button
                  onClick={() => {
                    setLanguage("ar");
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-start px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                    language === "ar" ? "text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-500/10" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>العربية (AR)</span>
                  {language === "ar" && <span className="text-emerald-600 text-xs">✓</span>}
                </button>
                <button
                  onClick={() => {
                    setLanguage("en");
                    setLangMenuOpen(false);
                  }}
                  className={`w-full text-start px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                    language === "en" ? "text-emerald-600 font-bold bg-emerald-50/50 dark:bg-emerald-500/10" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>English (EN)</span>
                  {language === "en" && <span className="text-emerald-600 text-xs">✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            aria-label="Toggle Theme"
            title={theme === "light" ? t("common.themeDark") : t("common.themeLight")}
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4 text-slate-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
