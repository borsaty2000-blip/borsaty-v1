"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

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
        <div className="w-full p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm flex flex-col items-center justify-center text-center my-4 transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {titleEn} / {titleAr}
          </h3>

          <p className="text-xs text-slate-600 dark:text-gray-400 max-w-md mb-4 leading-relaxed">
            {subEn}
          </p>

          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Retry / إعادة المحاولة</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
