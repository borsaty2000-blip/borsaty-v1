"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Logo from "@/components/branding/Logo";
import { useApp } from "@/context/AppContext";

export interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  titleEn?: string;
  titleAr?: string;
}

export default function RouteErrorFallback({
  error,
  reset,
  titleEn = "Something went wrong",
  titleAr = "حدث خطأ غير متوقع",
}: RouteErrorFallbackProps) {
  const { language } = useApp();
  const isAr = language === "ar";

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Borsaty route error boundary caught:", error);
    }
  }, [error]);

  return (
    <main
      className="flex min-h-[65vh] items-center justify-center bg-white px-4 py-12 text-slate-950"
      dir={isAr ? "rtl" : "ltr"}
    >
      <section className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Logo variant="monochrome-black" size={32} showText className="mx-auto" />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold">{isAr ? titleAr : titleEn}</h1>
          <p className="text-sm leading-6 text-slate-600">
            {isAr
              ? "تعذر تحميل هذه الصفحة. حاول مرة أخرى أو ارجع إلى الصفحة الرئيسية."
              : "This page could not be loaded. Try again or return to the home page."}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {isAr ? "حاول مرة أخرى" : "Try again"}
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {isAr ? "الصفحة الرئيسية" : "Go home"}
          </Link>
        </div>
      </section>
    </main>
  );
}
