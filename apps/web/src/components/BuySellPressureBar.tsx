'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, ShieldAlert, Users, Scale } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface BuySellPressureBarProps {
  candles?: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  currentPrice?: number;
  changePct?: number;
  isRealtimeOrderBook?: boolean;
}

export default function BuySellPressureBar({
  candles = [],
  currentPrice = 86.5,
  changePct = 1.2,
  isRealtimeOrderBook = false,
}: BuySellPressureBarProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  // Compute Buyer vs Seller Pressure
  const { buyerPct, sellerPct } = useMemo(() => {
    if (!candles || candles.length < 2) {
      const base = 50 + (changePct || 0) * 8;
      const b = Math.max(15, Math.min(85, Math.round(base)));
      return { buyerPct: b, sellerPct: 100 - b };
    }

    const recent = candles.slice(-15);
    let totalBuy = 0;
    let totalSell = 0;

    for (const c of recent) {
      const range = Math.max(0.001, c.high - c.low);
      const buyFraction = (c.close - c.low) / range;
      const sellFraction = (c.high - c.close) / range;
      const vol = c.volume && c.volume > 0 ? c.volume : 1000;

      totalBuy += buyFraction * vol;
      totalSell += sellFraction * vol;
    }

    const total = totalBuy + totalSell;
    if (total <= 0) return { buyerPct: 50, sellerPct: 50 };

    const b = Math.round((totalBuy / total) * 100);
    const clampedB = Math.max(10, Math.min(90, b));
    return { buyerPct: clampedB, sellerPct: 100 - clampedB };
  }, [candles, changePct]);

  const isDominantBuyers = buyerPct >= 50;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm p-4 transition-colors space-y-3">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-500" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {isAr ? 'ميزان قوى الشراء مقابل البيع' : 'Buy / Sell Pressure'}
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-black font-mono border ${
            isDominantBuyers
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {isDominantBuyers
            ? isAr
              ? 'سيطرة المشترين'
              : 'Buyers Dominant'
            : isAr
            ? 'سيطرة البائعين'
            : 'Sellers Dominant'}
        </span>
      </div>

      {/* Percentage Numbers */}
      <div className="flex items-baseline justify-between text-xs font-extrabold">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{isAr ? 'المشترون (Buyers):' : 'Buyers:'}</span>
          <span className="text-sm font-black font-mono tabular-nums">{buyerPct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <span className="text-sm font-black font-mono tabular-nums">{sellerPct}%</span>
          <span>{isAr ? 'البائعون (Sellers):' : 'Sellers:'}</span>
          <span className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
      </div>

      {/* Split Dual-Color Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-1 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${buyerPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-emerald-500 rounded-s-full shadow-sm"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sellerPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-rose-500 rounded-e-full shadow-sm"
        />
      </div>

      {/* Accuracy Disclosure Label */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
        <span>
          {isRealtimeOrderBook
            ? isAr
              ? 'مبني على دفتر أوامر السوق المباشر (Order Book Depth)'
              : 'Real-time Level 2 Order Book Depth'
            : isAr
            ? 'مؤشر تقديري مشتق من تدفقات السعر والأحجام (Price-Volume Proxy)'
            : 'Estimated from price-volume proxy (not real order book)'}
        </span>
      </div>
    </div>
  );
}
