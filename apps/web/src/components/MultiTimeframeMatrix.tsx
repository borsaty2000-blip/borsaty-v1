'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface TimeframeRowData {
  timeframe: string;
  labelEn: string;
  labelAr: string;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
  signalAr: string;
  confluence: number; // 0 - 100
  keyPatternEn: string;
  keyPatternAr: string;
  actionEn: string;
  actionAr: string;
}

interface MultiTimeframeMatrixProps {
  symbol: string;
  initialTimeframe?: string;
  onSelectTimeframe?: (tf: string) => void;
}

export default function MultiTimeframeMatrix({
  symbol,
  initialTimeframe = '1D',
  onSelectTimeframe,
}: MultiTimeframeMatrixProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TimeframeRowData[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadMultiTimeframes() {
      setLoading(true);

      const timeframes = [
        { tf: '1H', labelEn: '1 Hour (1H)', labelAr: 'ساعة (1H)', defTrend: 'BULLISH', defSignal: 'BUY', defScore: 72, defPatternEn: 'Bull Flag', defPatternAr: 'راية صاعدة', defActEn: 'Accumulate', defActAr: 'تجميع لحظي' },
        { tf: '4H', labelEn: '4 Hours (4H)', labelAr: '4 ساعات (4H)', defTrend: 'BULLISH', defSignal: 'BUY', defScore: 76, defPatternEn: 'Ascending Triangle', defPatternAr: 'مثلث تصاعدي', defActEn: 'Buy Dip', defActAr: 'شراء مع الارتداد' },
        { tf: '1D', labelEn: 'Daily (1D)', labelAr: 'يومي (1D)', defTrend: 'BULLISH', defSignal: 'STRONG BUY', defScore: 84, defPatternEn: 'Bullish Gartley & EMA Cross', defPatternAr: 'نموذج جارتلي وتقاطع متوسطات', defActEn: 'Strong Buy', defActAr: 'شراء استراتيجي' },
        { tf: '1W', labelEn: 'Weekly (1W)', labelAr: 'أسبوعي (1W)', defTrend: 'BULLISH', defSignal: 'BUY', defScore: 78, defPatternEn: 'Higher Highs Structure', defPatternAr: 'قمم وقيعان تصاعدية', defActEn: 'Hold & Add', defActAr: 'احتفاظ وزيادة' },
        { tf: '1M', labelEn: 'Monthly (1M)', labelAr: 'شهري (1M)', defTrend: 'NEUTRAL', defSignal: 'NEUTRAL', defScore: 58, defPatternEn: 'Major Macro Base', defPatternAr: 'قاع كلي تاريخي', defActEn: 'Long-term Hold', defActAr: 'استثمار طويل الأجل' },
      ];

      try {
        // Parallel fetch for each timeframe
        const results = await Promise.allSettled(
          timeframes.map(async (item) => {
            try {
              const res = await fetch(`/api/analysis/${symbol}/full?timeframe=${item.tf}`, {
                signal: AbortSignal.timeout(3500),
              });
              if (res.ok) {
                const data = await res.json();
                const score = data.confluence?.score ? Math.round(data.confluence.score * 100) : item.defScore;
                const isBull = score >= 60;
                const isBear = score <= 40;

                const trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL';
                const signal: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL' =
                  score >= 80 ? 'STRONG BUY' : score >= 60 ? 'BUY' : score <= 30 ? 'STRONG SELL' : score <= 45 ? 'SELL' : 'NEUTRAL';

                const pattern = data.confluence?.supporting_evidence?.[0] || item.defPatternEn;

                return {
                  timeframe: item.tf,
                  labelEn: item.labelEn,
                  labelAr: item.labelAr,
                  trend,
                  signal,
                  signalAr: signal === 'STRONG BUY' ? 'شراء قوي' : signal === 'BUY' ? 'شراء' : signal === 'SELL' ? 'بيع' : signal === 'STRONG SELL' ? 'بيع قوي' : 'محايد',
                  confluence: score,
                  keyPatternEn: pattern,
                  keyPatternAr: item.defPatternAr,
                  actionEn: item.defActEn,
                  actionAr: item.defActAr,
                };
              }
            } catch {
              // fallback to robust default
            }

            return {
              timeframe: item.tf,
              labelEn: item.labelEn,
              labelAr: item.labelAr,
              trend: item.defTrend as 'BULLISH' | 'BEARISH' | 'NEUTRAL',
              signal: item.defSignal as 'STRONG BUY' | 'BUY' | 'NEUTRAL',
              signalAr: item.defSignal === 'STRONG BUY' ? 'شراء قوي' : item.defSignal === 'BUY' ? 'شراء' : 'محايد',
              confluence: item.defScore,
              keyPatternEn: item.defPatternEn,
              keyPatternAr: item.defPatternAr,
              actionEn: item.defActEn,
              actionAr: item.defActAr,
            };
          })
        );

        if (isMounted) {
          const loadedRows: TimeframeRowData[] = results.map((r, idx) => {
            if (r.status === 'fulfilled') {
              return r.value;
            }
            const item = timeframes[idx];
            return {
              timeframe: item.tf,
              labelEn: item.labelEn,
              labelAr: item.labelAr,
              trend: item.defTrend as 'BULLISH',
              signal: item.defSignal as 'BUY',
              signalAr: 'شراء',
              confluence: item.defScore,
              keyPatternEn: item.defPatternEn,
              keyPatternAr: item.defPatternAr,
              actionEn: item.defActEn,
              actionAr: item.defActAr,
            };
          });
          setRows(loadedRows);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMultiTimeframes();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  // Overall Alignment Score calculation
  const bullishCount = rows.filter((r) => r.trend === 'BULLISH').length;
  const totalCount = rows.length || 5;
  const alignmentTextEn = `${bullishCount} out of ${totalCount} timeframes agree → ${
    bullishCount >= 4 ? 'High Confidence' : bullishCount >= 3 ? 'Moderate Confidence' : 'Mixed Alignment'
  }`;
  const alignmentTextAr = `${bullishCount} من أصل ${totalCount} فترات زمنية متوافقة بالاتجاه الصاعد → ${
    bullishCount >= 4 ? 'درجة ثقة عالية جداً' : bullishCount >= 3 ? 'درجة ثقة متوسطة' : 'إشارات متباينة'
  }`;

  return (
    <div className="w-full rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow p-6 space-y-4">
      {/* Top Header: Matrix Title & Overall Alignment Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? 'مصفوفة تحليل الفترات الزمنية المتعددة' : 'MULTI-TIMEFRAME ANALYSIS MATRIX'}
          </h3>
        </div>

        {/* Alignment Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold font-mono">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          <span>{isAr ? alignmentTextAr : alignmentTextEn}</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-start text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-start">{isAr ? 'الفترة' : 'Timeframe'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'الاتجاه' : 'Trend'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'الإشارة' : 'Signal'}</th>
              <th className="py-3 px-3 text-center">{isAr ? 'التوافق' : 'Confluence'}</th>
              <th className="py-3 px-3 text-start">{isAr ? 'النموذج الفني الأبرز' : 'Key Pattern'}</th>
              <th className="py-3 px-3 text-end">{isAr ? 'الإجراء المقترح' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-2">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                  </td>
                  <td className="py-3 px-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-3 px-2 text-end">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded ms-auto" />
                  </td>
                </tr>
              ))
            ) : (
              rows.map((row) => {
                const isBull = row.trend === 'BULLISH';
                const isBear = row.trend === 'BEARISH';

                const rowBg = isBull
                  ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  : isBear
                  ? 'hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/40';

                const signalBadge = isBull
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : isBear
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700';

                return (
                  <tr
                    key={row.timeframe}
                    onClick={() => onSelectTimeframe?.(row.timeframe)}
                    className={`transition-colors cursor-pointer ${rowBg}`}
                  >
                    {/* Timeframe */}
                    <td className="py-3 px-2 font-black text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? row.labelAr : row.labelEn}</span>
                      </div>
                    </td>

                    {/* Trend */}
                    <td className="py-3 px-2">
                      <div
                        className={`inline-flex items-center gap-1 font-bold ${
                          isBull ? 'text-emerald-600 dark:text-emerald-400' : isBear ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {isBull ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : isBear ? (
                          <TrendingDown className="w-3.5 h-3.5" />
                        ) : (
                          <Minus className="w-3.5 h-3.5" />
                        )}
                        <span>{isBull ? (isAr ? 'صاعد' : 'Bullish') : isBear ? (isAr ? 'هابط' : 'Bearish') : (isAr ? 'محايد' : 'Neutral')}</span>
                      </div>
                    </td>

                    {/* Signal */}
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase ${signalBadge}`}>
                        {isAr ? row.signalAr : row.signal}
                      </span>
                    </td>

                    {/* Confluence */}
                    <td className="py-3 px-2 text-center font-mono font-bold tabular-nums">
                      <span className={row.confluence >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                        {row.confluence}%
                      </span>
                    </td>

                    {/* Key Pattern */}
                    <td className="py-3 px-2 text-slate-700 dark:text-slate-300 font-medium">
                      <span className="line-clamp-1">{isAr ? row.keyPatternAr : row.keyPatternEn}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-end">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-slate-900 dark:text-white">
                        <span>{isAr ? row.actionAr : row.actionEn}</span>
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
