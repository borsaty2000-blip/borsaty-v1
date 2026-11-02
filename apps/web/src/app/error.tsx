"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = useApp();
  const isAr = language === "ar";

  useEffect(() => {
    // Log the error internally for diagnostics, without exposing raw traces in the UI
    console.error("Borsaty application error boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-[#0B1120] border border-rose-200 dark:border-rose-900/50 rounded-2xl p-8 shadow-sm">
        {/* Warning Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? "حدث خطأ غير متوقع" : "Something Went Wrong"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAr
              ? "واجه النظام استجابة غير متوقعة أثناء جلب البيانات المالية. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية."
              : "An unexpected condition was encountered while communicating with market data feeds. Please retry or return to the overview page."}
          </p>
        </div>

        {/* Action Buttons: Retry & Back to Markets */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-sm cursor-pointer border border-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{isAr ? "إعادة المحاولة" : "Try Again"}</span>
          </button>

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <Home className="w-4 h-4" />
            <span>{isAr ? "الرئيسية" : "Home"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
