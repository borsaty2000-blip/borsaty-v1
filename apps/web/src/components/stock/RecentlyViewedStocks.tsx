'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface RecentStockItem {
  symbol: string;
  nameEn?: string;
  nameAr?: string;
  price?: number;
  changePct?: number;
  timestamp: number;
}

const STORAGE_KEY = 'borsaty_recent_stocks';
const MAX_ITEMS = 6;

export function recordRecentlyViewed(stock: Omit<RecentStockItem, 'timestamp'>) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RecentStockItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((item) => item.symbol.toUpperCase() !== stock.symbol.toUpperCase());
    const updated: RecentStockItem[] = [
      { ...stock, symbol: stock.symbol.toUpperCase(), timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Non-blocking
  }
}

export default function RecentlyViewedStocks({ currentSymbol }: { currentSymbol?: string }) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [recent, setRecent] = useState<RecentStockItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RecentStockItem[] = JSON.parse(raw);
        setRecent(parsed.filter((item) => item.symbol.toUpperCase() !== currentSymbol?.toUpperCase()));
      }
    } catch {
      // Non-blocking
    }
  }, [currentSymbol]);

  if (recent.length === 0) return null;

  return (
    <div className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs flex items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 shrink-0">
        <History className="w-4 h-4 text-slate-400" />
        <span className="font-semibold">{isAr ? 'تمت مشاهدتها مؤخراً:' : 'Recently Viewed:'}</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {recent.map((s) => {
          const isPos = (s.changePct || 0) >= 0;
          return (
            <Link
              key={s.symbol}
              href={`/stock/${s.symbol}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shrink-0 font-medium"
            >
              <span className="font-mono font-bold text-slate-900 dark:text-white">{s.symbol}</span>
              {s.changePct !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold flex items-center ${
                    isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                  dir="ltr"
                >
                  {isPos ? '+' : ''}
                  {s.changePct.toFixed(1)}%
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
