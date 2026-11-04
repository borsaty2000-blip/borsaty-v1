"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Props {
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  fallbackSubtitleAr?: string;
  fallbackSubtitleEn?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({
  titleEn,
  titleAr,
  subtitleEn,
  subtitleAr,
  onRetry,
}: {
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  onRetry: () => void;
}) {
  const { language } = useApp();
  const isAr = language === "ar";

  return (
    <section
      role="alert"
      className="my-4 flex w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mb-1 text-sm font-bold text-slate-950">
        {isAr ? titleAr : titleEn}
      </h2>
      <p className="mb-4 max-w-md text-xs leading-relaxed text-slate-600">
        {isAr ? subtitleAr : subtitleEn}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        {isAr ? "إعادة المحاولة" : "Try again"}
      </button>
    </section>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      // In development, log to assist debugging
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public render() {
    if (this.state.hasError) {
      const titleEn = this.props.fallbackTitleEn || "Unable to display this component";
      const titleAr = this.props.fallbackTitleAr || "تعذر عرض هذا الجزء من البيانات";
      const subEn =
        this.props.fallbackSubtitleEn ||
        "A temporary data inconsistency occurred. You can retry safely without reloading the page.";
      const subAr =
        this.props.fallbackSubtitleAr ||
        "حدث تعارض مؤقت في معالجة البيانات. يمكنك إعادة المحاولة بأمان دون الحاجة لإعادة تحميل الصفحة بالكامل.";

      return (
        <ErrorFallback
          titleEn={titleEn}
          titleAr={titleAr}
          subtitleEn={subEn}
          subtitleAr={subAr}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
