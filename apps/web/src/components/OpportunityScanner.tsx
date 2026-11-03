'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, ArrowUpRight, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { OpportunityItem } from '@/app/api/opportunities/route';

const FALLBACK_OPPORTUNITIES: OpportunityItem[] = [
  {
    symbol: 'SWDY',
    nameEn: 'Elsewedy Electric',
    nameAr: 'السويدي إليكتريك',
    market: 'EGX',
    currency: 'EGP',
    price: 108.60,
    change: 1.77,
    changePct: 1.66,
    decision: 'BUY',
    confidence: 92,
    reasonEn: 'Elliott Wave 3 Impulse + Gartley Confluence',
    reasonAr: 'موجة إليوت 3 الدافعة + توافق نموذج جارتلي',
    sparkline: [105.3, 106.8, 106.2, 107.5, 107.2, 108.6],
    target: 122.50,
    stopLoss: 103.50,
    riskReward: 2.8,
    marginOfSafety: 16.5,
  },
  {
    symbol: 'COMI',
    nameEn: 'Commercial International Bank',
    nameAr: 'البنك التجاري الدولي',
    market: 'EGX',
    currency: 'EGP',
    price: 123.48,
    change: 0.98,
    changePct: 0.80,
    decision: 'BUY',
    confidence: 88,
    reasonEn: 'Institutional Inflows + 50 EMA Breakout',
    reasonAr: 'تدفقات مؤسسية + اختراق متوسط 50 يوم',
    sparkline: [120.5, 121.2, 122.0, 121.8, 122.9, 123.48],
    target: 135.00,
    stopLoss: 118.00,
    riskReward: 2.5,
    marginOfSafety: 18.4,
  },
  {
    symbol: 'NVDA',
    nameEn: 'NVIDIA Corporation',
    nameAr: 'إنفيديا',
    market: 'NASDAQ',
    currency: 'USD',
    price: 141.50,
    change: 3.20,
    changePct: 2.31,
    decision: 'BUY',
    confidence: 86,
    reasonEn: 'Impulse Cycle + Dynamic Volume Expansion',
    reasonAr: 'دورة زخم صاعدة + توسع في أحجام التداول',
    sparkline: [136.2, 138.0, 137.5, 139.8, 140.2, 141.5],
    target: 158.00,
    stopLoss: 134.00,
    riskReward: 3.0,
  },
];

function MiniSparkline({ points, isPositive }: { points: number[]; isPositive: boolean }) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const coords = points
    .map((p, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={isPositive ? '#059669' : '#DC2626'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export default function OpportunityScanner() {
  const { language } = useApp();
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>(FALLBACK_OPPORTUNITIES);
  const [loading, setLoading] = useState(false);
  const isAr = language === 'ar';

  useEffect(() => {
    let isMounted = true;
    async function loadOpportunities() {
      try {
        const res = await fetch('/api/opportunities');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.opportunities) && data.opportunities.length > 0) {
            setOpportunities(data.opportunities);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOpportunities();
  }, []);

  return (
    <section className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'أفضل 3 فرص فنية الآن' : 'Top 3 Opportunities Right Now'}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {isAr ? 'توافق فني 8/8' : '8-Engine Confluence'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'إشارات مرتفعة المصداقية مرتبة حسب نسبة الثقة الكمية والهدف المتاح'
                : 'Highest conviction institutional setups ranked by statistical confidence'}
            </p>
          </div>
        </div>

        <Link
          href="/signals"
          className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>{isAr ? 'عرض كافة الإشارات' : 'All Signals'}</span>
          <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* 3 Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {opportunities.map((opp, index) => {
          const isPos = opp.change >= 0;
          const currencyLabel = isAr
            ? opp.currency === 'EGP'
              ? 'ج.م'
              : opp.currency === 'SAR'
              ? 'ر.س'
              : opp.currency
            : opp.currency;

          return (
            <div
              key={opp.symbol}
              className="p-5 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover-card flex flex-col justify-between space-y-4"
            >
              {/* Card Top: Rank Badge + Symbol + Market + Decision */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <Link
                      href={`/stock/${opp.symbol}`}
                      className="font-mono font-black text-lg text-slate-900 dark:text-white hover:underline truncate"
                    >
                      {opp.symbol}
                    </Link>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold shrink-0">
                      {opp.market}
                    </span>
                  </div>

                  {/* Decision Badge */}
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-black uppercase text-white shrink-0 ${
                      opp.decision === 'BUY'
                        ? 'bg-[#059669]'
                        : opp.decision === 'SELL'
                        ? 'bg-[#DC2626]'
                        : 'bg-[#F59E0B]'
                    }`}
                  >
                    {isAr ? (opp.decision === 'BUY' ? 'شراء' : opp.decision === 'SELL' ? 'بيع' : 'انتظار') : opp.decision}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="text-xs text-slate-500 truncate">
                    {isAr ? opp.nameAr : opp.nameEn}
                  </div>
                  {opp.marginOfSafety && opp.marginOfSafety > 15 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shrink-0">
                      💎 {isAr ? `مقوم بأقل من قيمته ${opp.marginOfSafety}%` : `Undervalued ${opp.marginOfSafety}%`}
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Sparkline Row */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                    {opp.price.toFixed(2)}{' '}
                    <span className="text-xs font-normal text-slate-400 font-sans">{currencyLabel}</span>
                  </div>
                  <div className={`text-xs font-bold font-mono tabular-nums ${isPos ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {isPos ? '+' : ''}{opp.changePct.toFixed(2)}%
                  </div>
                </div>

                <MiniSparkline points={opp.sparkline} isPositive={isPos} />
              </div>

              {/* Technical Reason Tag */}
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
                  {isAr ? 'الدافع الفني' : 'Technical Driver'}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {isAr ? opp.reasonAr : opp.reasonEn}
                </span>
              </div>

              {/* Confidence & Target/Stop Levels */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{isAr ? 'نسبة الثقة الكمية' : 'Quantitative Confidence'}</span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">{opp.confidence}%</span>
                </div>

                {/* Confidence Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#059669]"
                    style={{ width: `${opp.confidence}%` }}
                  />
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 tabular-nums">
                  <span>{isAr ? 'الهدف:' : 'TP:'} <strong className="text-[#059669]">{opp.target.toFixed(2)}</strong></span>
                  <span>{isAr ? 'الوقف:' : 'SL:'} <strong className="text-[#DC2626]">{opp.stopLoss.toFixed(2)}</strong></span>
                  <span>R:R: <strong className="text-slate-800 dark:text-slate-200">{opp.riskReward}:1</strong></span>
                </div>
              </div>

              {/* Black Institutional CTA Button */}
              <Link
                href={`/stock/${opp.symbol}`}
                className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
              >
                <span>{isAr ? 'عرض التحليل المؤسسي' : 'View Institutional Analysis'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
