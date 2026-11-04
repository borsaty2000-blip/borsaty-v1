"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Home, TrendingUp, AlertCircle, ArrowLeft } from "lucide-react";
import { resolveStockAlias } from "@borsaty/shared";
import { useApp } from "@/context/AppContext";
import Logo from "@/components/branding/Logo";

export default function NotFound() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { language } = useApp();
  const isAr = language === "ar";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const alias = resolveStockAlias(query);
    if (alias) {
      router.push(`/stock/${alias.symbol}`);
    } else {
      router.push(`/stock/${query.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
        <Logo variant="monochrome-black" size={32} showText className="mx-auto dark:invert" />
        {/* Brand Icon Badge */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            404
          </span>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {isAr ? "الصفحة غير موجودة" : "Page Not Found"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? "عذراً، الصفحة التي تبحث عنها قد تم نقلها أو أنها غير متوفرة حالياً."
              : "Sorry, the page or financial asset you are looking for does not exist or has been moved."}
          </p>
        </div>

        {/* Stock Search Input */}
        <form onSubmit={handleSearch} className="relative text-start">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isAr
                ? "ابحث عن سهم (مثال: COMI, 2222, AAPL)..."
                : "Search a stock (e.g. COMI, 2222, AAPL)..."
            }
            className="w-full h-11 px-4 ps-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-slate-800 dark:focus:border-slate-500 transition-colors shadow-inner"
          />
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-3.5 pointer-events-none" />
          <button
            type="submit"
            className="absolute end-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-black transition-colors"
          >
            {isAr ? "بحث" : "Search"}
          </button>
        </form>

        {/* Action Button: Back to Markets */}
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "العودة إلى الأسواق" : "Back to Markets"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
