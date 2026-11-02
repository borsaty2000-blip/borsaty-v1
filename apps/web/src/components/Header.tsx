"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  TrendingUp,
  Sun,
  Moon,
  BarChart3,
  SlidersHorizontal,
  ChevronDown,
  Star,
  Briefcase,
  Calendar,
  Menu,
  X,
  Layers,
} from "lucide-react";
import AuthButton from "@/components/AuthButton";
import { useApp } from "@/context/AppContext";
import { useBorsaty } from "@/context/BorsatyContext";

export default function Header() {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { language, setLanguage, theme, toggleTheme, t } = useApp();
  const { setIsCommandPaletteOpen } = useBorsaty();
  const isAr = language === "ar";

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { href: "/", label: t("nav.markets"), icon: null },
    { href: "/screener", label: t("nav.screener"), icon: <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" /> },
    { href: "/signals", label: t("nav.signals"), icon: <BarChart3 className="w-3.5 h-3.5 text-emerald-500" /> },
    { href: "/portfolio", label: isAr ? "المحفظة" : "Portfolio", icon: <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> },
    { href: "/calendar", label: isAr ? "الأجندة" : "Calendar", icon: <Calendar className="w-3.5 h-3.5 text-rose-500" /> },
    { href: "/watchlist", label: isAr ? "المتابعة" : "Watchlist", icon: <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> },
  ];

  const primaryNav = navLinks.slice(0, 3);
  const secondaryNav = navLinks.slice(3);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
      {/* Top Banner / Ticker bar: Thin (h-8), Clean, Data-First */}
      <div className="relative bg-slate-900 text-white dark:bg-slate-950 h-8 px-4 text-[11px] font-medium tracking-wide flex items-center overflow-hidden border-b border-slate-800">
        {/* Subtle gradient fades on edges */}
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
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 whitespace-nowrap group">
            <div className="relative w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-base shadow-sm group-hover:bg-slate-900 transition-colors border border-slate-800">
              <span>B</span>
              <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-[#00D9FF]" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              {isAr ? "بورصتي" : "Borsaty"}
            </span>
          </Link>
        </div>

        {/* Center / Left Navigation Links */}
        <div className="hidden md:flex items-center gap-1 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
          {/* Top 3 links: Always visible on tablet & desktop */}
          {primaryNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {/* Desktop (>1150px): Direct links for remaining items */}
          <div className="hidden xl:flex items-center gap-1">
            {secondaryNav.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1.5"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Tablet (768px - 1150px): "More" dropdown for secondary links */}
          <div className="relative xl:hidden" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="px-3 py-2 rounded-md hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1 text-[13px] font-semibold"
              aria-label="More navigation links"
            >
              <span>{isAr ? "المزيد" : "More"}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {moreMenuOpen && (
              <div className="absolute start-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                {secondaryNav.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Far Right: Search, Language, Theme, Clerk Auth */}
        <div className="flex items-center gap-2">
          {/* Prominent Search Trigger: Pill on desktop, icon on mobile */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-2 h-9 px-3 bg-slate-50 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-500 dark:text-slate-400 transition-colors shadow-sm cursor-pointer"
            aria-label="Search markets and stocks"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline-block pe-4 text-start">
              {t("common.searchPlaceholder")}
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-200/80 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700">
              ⌘K
            </kbd>
          </button>

          {/* Language Toggle: Clean text toggle (EN / AR) */}
          <button
            onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-emerald-500/40 transition-colors shadow-sm"
            aria-label="Toggle language"
            title={language === "ar" ? "Switch to English" : "التحويل إلى العربية"}
          >
            {language === "ar" ? "EN" : "عربي"}
          </button>

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

          {/* Clerk Auth Actions */}
          <div className="flex items-center ps-1 border-s border-slate-200 dark:border-slate-800 ms-1">
            <AuthButton />
          </div>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer (< 768px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-[#0B1120] h-full shadow-2xl flex flex-col z-10 border-e border-slate-200 dark:border-slate-800 p-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <div className="relative w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-black text-sm shadow-sm border border-slate-800">
                  <span>B</span>
                  <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full bg-[#00D9FF]" />
                </div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  {isAr ? "بورصتي" : "Borsaty"}
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors min-h-[44px]"
                >
                  <div className="w-6 flex items-center justify-center">
                    {link.icon || <Layers className="w-4 h-4 text-slate-500" />}
                  </div>
                  <span>{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Bottom Controls */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isAr ? "اللغة" : "Language"}
                </span>
                <button
                  onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                  className="px-3 py-1.5 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  {language === "ar" ? "English" : "العربية"}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {isAr ? "المظهر" : "Theme"}
                </span>
                <button
                  onClick={toggleTheme}
                  className="px-3 py-1.5 rounded-md text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  {theme === "light" ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{theme === "light" ? (isAr ? "داكن" : "Dark") : (isAr ? "فاتح" : "Light")}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <AuthButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
