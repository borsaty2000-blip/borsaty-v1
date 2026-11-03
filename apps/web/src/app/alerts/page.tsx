"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Trash2,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Target,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

interface AlertItem {
  id: string;
  userId: string;
  symbol: string;
  type: "PRICE" | "RSI" | "FAIR_VALUE" | "HARMONIC";
  condition: "ABOVE" | "BELOW" | "CROSSES_ABOVE" | "CROSSES_BELOW";
  threshold: number;
  note?: string;
  triggered: boolean;
  createdAt: string;
  updatedAt: string;
}

interface QuoteData {
  price: number;
  currency: string;
}

export default function AlertsPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { language } = useApp();
  const isAr = language === "ar";

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({});
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "TRIGGERED">("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAlerts = async (triggerCheck: boolean = false) => {
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    try {
      const url = triggerCheck ? "/api/alerts?check=true" : "/api/alerts";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list: AlertItem[] = data.alerts || [];
        setAlerts(list);

        // Fetch quotes for distinct symbols
        const distinctSymbols = Array.from(new Set(list.map((a) => a.symbol)));
        distinctSymbols.forEach((sym) => fetchQuote(sym));
      }
    } catch {
      // Non-blocking
    } finally {
      setIsLoading(false);
      setIsChecking(false);
    }
  };

  const fetchQuote = async (symbol: string) => {
    try {
      const res = await fetch(`/api/quotes?symbol=${symbol}`);
      if (res.ok) {
        const q = await res.json();
        setQuotes((prev) => ({
          ...prev,
          [symbol.toUpperCase()]: {
            price: q.price || 0,
            currency: q.currency || "EGP",
          },
        }));
      }
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (isLoaded) {
      fetchAlerts();
    }
  }, [isLoaded, isSignedIn]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    await fetchAlerts(true);
    toast.success(isAr ? "تم تحديث وفحص التنبيهات بنجاح" : "Alerts checked and evaluated");
  };

  const handleDelete = async (id: string, symbol: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/alerts?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        toast.success(
          isAr ? `تم حذف التنبيه الخاص بـ ${symbol}` : `Alert for ${symbol} removed`
        );
      } else {
        toast.error(isAr ? "فشل حذف التنبيه" : "Failed to delete alert");
      }
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء الحذف" : "Error deleting alert");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "ACTIVE") return !a.triggered;
    if (filter === "TRIGGERED") return a.triggered;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.triggered).length;
  const triggeredCount = alerts.filter((a) => a.triggered).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? "مركز التنبيهات الذكية" : "Smart Alert Center"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              {isAr
                ? "إدارة ومراقبة التنبيهات السعرية والفنية الفورية لأسهمك في السوقين المصري والأمريكي."
                : "Manage and track real-time price and technical alerts for your portfolio stocks."}
            </p>
          </div>

          {isSignedIn && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualCheck}
                disabled={isChecking}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
                <span>{isAr ? "فحص وتحديث الآن" : "Check Alerts"}</span>
              </button>
              <Link
                href="/screener"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity shadow-xs"
              >
                <Target className="w-3.5 h-3.5" />
                <span>{isAr ? "استكشاف الأسهم" : "Browse Stocks"}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Not Signed In State */}
        {!isSignedIn ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
              {isAr ? "سجّل دخولك لإدارة تنبيهاتك" : "Sign in to manage alerts"}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {isAr
                ? "يمكنك تعيين أهداف سعرية ومستويات فنية وتلقي تنبيهات عند تحققها."
                : "Set price targets, technical indicators, and get notified when conditions are met."}
            </p>
            <SignInButton mode="modal">
              <button className="w-full py-2.5 px-4 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:opacity-90 transition-opacity shadow-sm">
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </button>
            </SignInButton>
          </div>
        ) : (
          <>
            {/* Stats Bar & Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "ALL"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isAr ? `الكل (${alerts.length})` : `All (${alerts.length})`}
                </button>
                <button
                  onClick={() => setFilter("ACTIVE")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "ACTIVE"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isAr ? `قيد المراقبة (${activeCount})` : `Active (${activeCount})`}
                </button>
                <button
                  onClick={() => setFilter("TRIGGERED")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === "TRIGGERED"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {isAr ? `متحققة (${triggeredCount})` : `Triggered (${triggeredCount})`}
                </button>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>
                  {isAr
                    ? `إجمالي ${alerts.length} تنبيه مسجل`
                    : `Total of ${alerts.length} configured alert(s)`}
                </span>
              </div>
            </div>

            {/* List or Empty State */}
            {isLoading ? (
              <div className="py-20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <BellOff className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {filter === "ALL"
                    ? isAr
                      ? "لا توجد أي تنبيهات حالياً"
                      : "No alerts configured"
                    : filter === "ACTIVE"
                    ? isAr
                      ? "لا توجد تنبيهات قيد المراقبة"
                      : "No active alerts"
                    : isAr
                    ? "لا توجد تنبيهات متحققة بعد"
                    : "No triggered alerts"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
                  {isAr
                    ? "يمكنك تعيين تنبيه لأي سهم بسهولة من خلال الضغط على زر التنبيه في صفحة السهم."
                    : "You can easily configure alerts from the Alert button on any stock detail page."}
                </p>
                <Link
                  href="/screener"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{isAr ? "الانتقال للماسح واستكشاف الأسهم" : "Explore Screener"}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAlerts.map((alert) => {
                  const quote = quotes[alert.symbol];
                  const currentPrice = quote?.price;
                  const isAbove = alert.condition === "ABOVE" || alert.condition === "CROSSES_ABOVE";

                  return (
                    <div
                      key={alert.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      {/* Card Top */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                              {alert.symbol}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {alert.type}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {alert.triggered ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-black">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isAr ? "متحقق" : "Triggered"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{isAr ? "نشط" : "Active"}</span>
                            </span>
                          )}
                        </div>

                        {/* Condition & Target */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 flex items-center gap-1">
                              {isAbove ? (
                                <TrendingUp className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                              )}
                              <span>
                                {isAbove
                                  ? isAr
                                    ? "أعلى من أو يساوي"
                                    : "Above / Equal"
                                  : isAr
                                  ? "أقل من أو يساوي"
                                  : "Below / Equal"}
                              </span>
                            </span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {alert.threshold.toFixed(2)}
                            </span>
                          </div>

                          {currentPrice !== undefined && (
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                              <span className="text-slate-400">
                                {isAr ? "السعر الحالي المرجعي:" : "Current Price:"}
                              </span>
                              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                {currentPrice.toFixed(2)} {quote.currency}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* User Note */}
                        {alert.note && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic mb-3">
                            &ldquo;{alert.note}&rdquo;
                          </p>
                        )}
                      </div>

                      {/* Card Bottom / Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                        <Link
                          href={`/stock/${alert.symbol}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <span>{isAr ? "صفحة السهم" : "View Stock"}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => handleDelete(alert.id, alert.symbol)}
                          disabled={deletingId === alert.id}
                          title={isAr ? "حذف التنبيه" : "Delete Alert"}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                          {deletingId === alert.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
