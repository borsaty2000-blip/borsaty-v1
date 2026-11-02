'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Inbox } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface DataWrapperProps<T> {
  isLoading: boolean;
  error?: string | Error | null;
  data?: T | null;
  onRetry?: () => void;
  loadingSkeleton?: React.ReactNode;
  emptyState?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function DataWrapper<T>({
  isLoading,
  error,
  data,
  onRetry,
  loadingSkeleton,
  emptyState,
  children,
}: DataWrapperProps<T>) {
  const { t } = useApp();

  // 1. Loading State
  if (isLoading) {
    if (loadingSkeleton) return <>{loadingSkeleton}</>;
    return <DefaultSkeletonLoader />;
  }

  // 2. Error State
  if (error) {
    const errorMsg =
      typeof error === 'string'
        ? error
        : error?.message || t('errors.fetchFailed');

    return (
      <div className="w-full p-6 my-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 shadow-sm transition-all animate-in fade-in-50">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-start">
          <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold mb-1">
              {t('common.error')}
            </h4>
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              {errorMsg}
            </p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 sm:mt-0 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('common.retry')}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 3. Empty State (null or empty array/object)
  const isEmpty =
    data === null ||
    data === undefined ||
    (Array.isArray(data) && data.length === 0);

  if (isEmpty) {
    if (emptyState) return <>{emptyState}</>;

    return (
      <div className="w-full p-10 my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center text-slate-500 dark:text-slate-400 shadow-sm transition-all">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
          {t('common.noData')}
        </h4>
        <p className="text-xs text-slate-400">
          {t('common.insufficientData')}
        </p>
      </div>
    );
  }

  // 4. Data Content
  return <>{children(data as T)}</>;
}

export function DefaultSkeletonLoader() {
  return (
    <div className="w-full space-y-4 my-4 animate-pulse">
      {/* Top Header skeleton */}
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
      
      {/* Metric Cards Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-3"
          >
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
            <div className="h-7 bg-slate-300 dark:bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-1/3"></div>
          </div>
        ))}
      </div>

      {/* Big Chart / Content Box skeleton */}
      <div className="h-72 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-end space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
        <div className="h-full flex items-end gap-2 pt-6">
          {[40, 65, 30, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, idx) => (
            <div
              key={idx}
              className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-t"
              style={{ height: `${h}%` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
