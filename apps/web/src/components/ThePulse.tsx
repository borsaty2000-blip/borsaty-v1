'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

interface PulseItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

const FALLBACK_PULSE: PulseItem[] = [
  { symbol: 'EGX30', name: 'EGX 30', price: 30842.15, change: 377.2, changePct: 1.24 },
  { symbol: 'TASI', name: 'TASI', price: 12180.50, change: 82.4, changePct: 0.68 },
  { symbol: 'SWDY', name: 'Elsewedy Electric', price: 108.60, change: 1.77, changePct: 1.66 },
  { symbol: 'COMI', name: 'CIB Egypt', price: 123.48, change: 0.98, changePct: 0.80 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 235.10, change: 1.85, changePct: 0.79 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 141.50, change: 3.20, changePct: 2.31 },
  { symbol: 'TMGH', name: 'Talaat Moustafa', price: 58.20, change: -0.40, changePct: -0.68 },
  { symbol: 'EAST', name: 'Eastern Co', price: 34.50, change: 0.35, changePct: 1.02 },
  { symbol: 'FWRY', name: 'Fawry Banking', price: 8.92, change: 0.14, changePct: 1.59 },
  { symbol: '2222', name: 'Aramco', price: 27.85, change: 0.15, changePct: 0.54 },
  { symbol: '1120', name: 'Al Rajhi', price: 92.40, change: 0.80, changePct: 0.87 },
  { symbol: 'MSFT', name: 'Microsoft', price: 428.15, change: 1.10, changePct: 0.26 },
  { symbol: 'GOLD', name: 'Gold Spot', price: 2735.40, change: 14.60, changePct: 0.54 },
  { symbol: 'BTC', name: 'Bitcoin', price: 68450.00, change: 1410.00, changePct: 2.10 },
];

export default function ThePulse() {
  const { language } = useApp();
  const [pulseData, setPulseData] = useState<PulseItem[]>(FALLBACK_PULSE);
  const [isHovered, setIsHovered] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    let isMounted = true;
    async function fetchPulse() {
      try {
        const res = await fetch('/api/market/pulse');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.items) && data.items.length > 0) {
            setPulseData(data.items);
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    fetchPulse();
    const interval = setInterval(fetchPulse, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Duplicate items for seamless continuous looping marquee
  const tickerItems = [...pulseData, ...pulseData];

  return (
    <aside
      aria-label="Live Market Tape"
      className="fixed bottom-14 md:bottom-0 inset-x-0 z-30 h-8 bg-slate-900 border-t border-slate-800 text-white text-xs select-none shadow-[0_-2px_10px_rgba(0,0,0,0.3)] flex items-center overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Fixed "LIVE" Pulse Badge */}
      <div className="flex items-center gap-2 px-3 h-full bg-slate-950 border-e border-slate-800 shrink-0 z-10 font-bold font-mono text-[10px] tracking-wider text-slate-200">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
        </span>
        <span>{isAr ? 'مباشر' : 'LIVE'}</span>
      </div>

      {/* 2. Gradient Edge Fades for sleek professional finish */}
      <div className="pointer-events-none absolute inset-y-0 start-16 w-8 bg-gradient-to-r rtl:bg-gradient-to-l from-slate-900 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l rtl:bg-gradient-to-r from-slate-900 to-transparent z-10" />

      {/* 3. Smooth Infinite Marquee Scrolling Right-to-Left */}
      <div className="overflow-hidden whitespace-nowrap flex-1 h-full flex items-center">
        <motion.div
          className="flex items-center gap-4 inline-flex"
          animate={{ x: isHovered ? undefined : ['0%', '-50%'] }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 35,
              ease: 'linear',
            },
          }}
        >
          {tickerItems.map((item, idx) => {
            const isPos = item.change >= 0;
            const targetSymbol = item.symbol === 'EGX30' ? 'COMI' : item.symbol === 'TASI' ? '2222' : item.symbol;

            return (
              <span key={`${item.symbol}-${idx}`} className="inline-flex items-center gap-1.5 font-mono text-xs">
                <Link
                  href={`/stock/${targetSymbol}`}
                  className="font-bold text-slate-100 hover:text-white transition-colors"
                >
                  {item.symbol}
                </Link>

                <span className={`font-bold ${isPos ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                  {isPos ? '▲' : '▼'}
                </span>

                <span className="font-semibold text-slate-200 tabular-nums">
                  {item.price >= 1000 ? item.price.toLocaleString(undefined, { minimumFractionDigits: 1 }) : item.price.toFixed(2)}
                </span>

                <span
                  className={`font-semibold tabular-nums ${
                    isPos ? 'text-[#059669]' : 'text-[#DC2626]'
                  }`}
                >
                  ({isPos ? '+' : ''}
                  {item.changePct.toFixed(2)}%)
                </span>

                <span className="text-slate-600 px-2 font-normal">|</span>
              </span>
            );
          })}
        </motion.div>
      </div>
    </aside>
  );
}
