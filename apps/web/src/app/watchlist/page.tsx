"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Trash2,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  SlidersHorizontal,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  User,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

interface WatchlistItem {
  id: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  createdAt: string;
}

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  currency: string;
  market: string;
}

export default function WatchlistPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { language } = useApp();
  const isAr = language === "ar";

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // 1. Fetch Watchlist items
  const fetchWatchlist = async () => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/watchlist");
      if (res.ok) {
        const data = await res.json();
        const list: WatchlistItem[] = data.items || [];
        setItems(list);

        // Fetch live quotes for each symbol in parallel
        list.forEach((item) => {
          fetchQuoteForSymbol(item.symbol);
        });
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Fetch live quote for individual symbol
  const fetchQuoteForSymbol = async (symbol: string) => {
    try {
      const res = await fetch(`/api/quotes?symbol=${symbol}`);
      if (res.ok) {
        const q = await res.json();
        setQuotes((prev) => ({
          ...prev,
          [symbol.toUpperCase()]: {
            price: q.price || 0,
            change: q.change || 0,
            changePct: q.changePct || 0,
            currency: q.currency || "EGP",
            market: q.market || "EGX",
          },
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  const exportWatchlistToCSV = () => {
    if (items.length === 0) return;
    const headers = ["Symbol", "Name EN", "Name AR", "Price", "Change %", "Currency", "Market"];
    const rows = items.map((item) => {
      const q = quotes[item.symbol];
      return [
        item.symbol,
        `"${(item.nameEn || "").replace(/"/g, '""')}"`,
        `"${(item.nameAr || "").replace(/"/g, '""')}"`,
        q ? q.price.toFixed(2) : "",
        q ? `${q.changePct.toFixed(2)}%` : "",
        q ? q.currency : "EGP",
        q ? q.market : "EGX",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `borsaty_watchlist_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isAr ? "تم تصدير قائمة المتابعة بنجاح بصيغة CSV" : "Watchlist exported to CSV");
  };

  useEffect(() => {
    if (isLoaded) {
      fetchWatchlist();
    }
  }, [isLoaded, isSignedIn]);

  // Remove symbol
  const handleRemove = async (symbol: string) => {
    setIsRemoving(symbol);
    try {
      const res = await fetch(`/api/watchlist/${symbol}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.symbol !== symbol));
        toast.success(isAr ? `تمت إزالة ${symbol} من قائمة المتابعة` : `${symbol} removed from watchlist`);
      }
    } catch {
      // Non-blocking
    } finally {
      setIsRemoving(null);
    }
  };

  // Unauthenticated State
  if (isLoaded && !isSignedIn) {
    return (
      <div className="py-16 max-w-xl mx-auto text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Star className="w-8 h-8 fill-slate-300 dark:fill-slate-700" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
          {isAr ? "سجّل الدخول لعرض قائمة المتابعة" : "Sign In to Access Your Watchlist"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-8 leading-relaxed">
          {isAr
            ? "قم بحفظ ومراقبة أسهمك المفضلة، ومتابعة تغيرات الأسعار اللحظية وإشارات التحليل الكمي في مكان واحد."
            : "Track your favorite assets across Egyptian, Saudi, and US markets with live price feeds and automated technical decision metrics."}
        </p>
        <SignInButton mode="modal">
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02]">
            <User className="w-4 h-4" />
            <span>{isAr ? "تسجيل الدخول / إنشاء حساب" : "Sign In / Create Account"}</span>
          </button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isAr ? "قائمة المتابعة" : "My Watchlist"}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {items.length} {isAr ? "أصول" : "assets"}
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400">
            {isAr
              ? "متابعة حية للأسعار والتغيرات اليومية لأسهمك المفضلة"
              : "Real-time price monitoring and quantitative signals for your saved assets"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              type="button"
              onClick={exportWatchlistToCSV}
              aria-label={isAr ? "تصدير إلى CSV" : "Export to CSV"}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
            </button>
          )}
          <Link
            href="/screener"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>{isAr ? "استكشاف المزيد" : "Explore Screener"}</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] animate-pulse space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className="w-20 h-6 bg-slate-100 dark:bg-slate-800 rounded-md" />
                <div className="w-12 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
              </div>
              <div className="w-32 h-8 bg-slate-100 dark:bg-slate-800 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="py-16 px-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-700">
            <Star className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {isAr ? "قائمة المتابعة المؤسسية فارغة" : "Your institutional watchlist is empty"}
          </h3>
          <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto mb-6 leading-relaxed">
            {isAr
              ? "قائمة المتابعة المؤسسية فارغة. أضف الأدوات المالية من الماسح الفني أو صفحات الأسهم لمتابعتها لحظياً."
              : "Your institutional watchlist is empty. Add instruments from the screener or stock pages to track them."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/screener"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              <span>{isAr ? "استعراض الماسح الفني" : "Browse Screener"}</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 me-1">
              {isAr ? "اقتراحات سريعة:" : "Suggested stocks:"}
            </span>
            {["COMI", "2222", "AAPL", "NVDA"].map((sym) => (
              <Link
                key={sym}
                href={`/stock/${sym}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-900 dark:hover:border-slate-500 transition-colors shadow-sm"
              >
                <span>{sym}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Watchlist Cards Grid */}
      {!isLoading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const q = quotes[item.symbol];
            const isPos = (q?.change || 0) >= 0;

            return (
              <div
                key={item.id}
                className="group relative p-5 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Symbol, Names, Delete */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stock/${item.symbol}`}
                          className="text-xl font-black text-slate-900 dark:text-white hover:text-navy-800 dark:hover:text-blue-400 transition-colors"
                        >
                          {item.symbol}
                        </Link>
                        {q?.market && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {q.market}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-500 dark:text-gray-400 mt-0.5">
                        {isAr ? item.nameAr || item.nameEn : item.nameEn || item.nameAr}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemove(item.symbol)}
                      disabled={isRemoving === item.symbol}
                      aria-label="Remove from watchlist"
                      title={isAr ? "إزالة من المتابعة" : "Remove"}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price Banner */}
                  <div className="my-4 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white">
                        {q ? q.price.toFixed(2) : "—"}
                        <span className="text-xs font-semibold text-slate-500 ms-1">
                          {q?.currency || "EGP"}
                        </span>
                      </div>
                    </div>

                    {q && (
                      <div
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                          isPos
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isPos ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span className="tabular-nums">
                          {isPos ? "+" : ""}
                          {q.changePct.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {isAr ? "بيانات حية" : "Live Feed"}
                  </span>

                  <Link
                    href={`/stock/${item.symbol}`}
                    className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    <span>{isAr ? "عرض التحليل والقرار" : "Decision & Analysis"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
