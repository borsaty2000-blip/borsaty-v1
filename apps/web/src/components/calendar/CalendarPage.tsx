'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Filter,
  AlertCircle,
  Globe,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Landmark,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface EconomicEvent {
  id: string;
  date: string;
  timeUtc: string;
  country: string;
  countryFlag: string;
  market: 'US' | 'EGX' | 'TASI' | 'EU' | 'GLOBAL';
  eventNameEn: string;
  eventNameAr: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: string | null;
  forecast: string;
  previous: string;
  unit: string;
  importanceDescriptionEn: string;
  importanceDescriptionAr: string;
}

export default function CalendarPage() {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<'ALL' | 'US' | 'EGX' | 'TASI' | 'EU'>('ALL');
  const [highImpactOnly, setHighImpactOnly] = useState(false);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        setLoading(true);
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  const filteredEvents = events.filter((ev) => {
    if (highImpactOnly && ev.impact !== 'HIGH') return false;
    if (selectedMarket !== 'ALL' && ev.market !== selectedMarket) return false;
    return true;
  });

  const getImpactBadge = (impact: EconomicEvent['impact']) => {
    switch (impact) {
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span>{isAr ? 'عالي التأثير' : 'High Impact'}</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            {isAr ? 'متوسط' : 'Medium'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            {isAr ? 'منخفض' : 'Low'}
          </span>
        );
    }
  };

  return (
    <ErrorBoundary fallbackTitleEn="Economic Calendar Unavailable" fallbackTitleAr="تعذر عرض المفكرة الاقتصادية">
      <div className="w-full space-y-6 pb-16">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{isAr ? 'الأجندة الاقتصادية والمؤشرات الكلية' : 'Global Economic Calendar & Macro Pulse'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Macro Terminal
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'رصد اجتماعات البنوك المركزية (الفيدرالي، المركزي المصري)، معدلات التضخم، ومحاضر أوبك+.'
                  : 'Real-time monitoring of Central Bank rate decisions, CPI inflation, and global liquidity drivers.'}
              </p>
            </div>
          </div>
        </div>

        {/* Macro Central Bank Watch Quick Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-start gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <span>🇺🇸 Fed Rate Watch</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {isAr ? 'توقعات خفض الفائدة بـ 25 نقطة أساس' : '25 bps Rate Cut Priced In'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {isAr ? 'المستوى المتوقع: 4.25% مقابل 4.50% سابقاً' : 'Expected: 4.25% vs 4.50% prior'}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-start gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <span>🇪🇬 CBE Egypt Watch</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {isAr ? 'تثبيت أسعار الفائدة الحالية' : 'CBE Rate Hold Consensus'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {isAr ? 'سعر الإيداع والإقراض: 27.25% مع تباطؤ التضخم' : 'Current benchmark: 27.25% steady'}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] flex items-start gap-3 shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                <span>🇸🇦 OPEC+ Discipline</span>
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                {isAr ? 'تأكيد الحفاظ على سقف الإنتاج' : 'Output Cut Extensions'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {isAr ? 'دعم استقرار أسواق الطاقة وتوازن المعروض' : 'Crude supply balance floor support'}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold">
          {/* Region Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(
              [
                { id: 'ALL', labelEn: 'All Markets', labelAr: 'كافة الأسواق' },
                { id: 'US', labelEn: '🇺🇸 United States', labelAr: '🇺🇸 أمريكا' },
                { id: 'EGX', labelEn: '🇪🇬 Egypt', labelAr: '🇪🇬 مصر' },
                { id: 'TASI', labelEn: '🇸🇦 Saudi Arabia', labelAr: '🇸🇦 السعودية' },
                { id: 'EU', labelEn: '🇪🇺 Eurozone', labelAr: '🇪🇺 أوروبا' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMarket(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedMarket === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isAr ? tab.labelAr : tab.labelEn}
              </button>
            ))}
          </div>

          {/* High Impact Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={highImpactOnly}
              onChange={(e) => setHighImpactOnly(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-sm"
            />
            <span>{isAr ? 'عالي التأثير فقط' : 'High Impact Only'}</span>
          </label>
        </div>

        {/* Events Table */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'جدول الأحداث الاقتصادية المرتقبة' : 'Scheduled Macroeconomic Releases'}</span>
            </h3>
            <span className="text-xs font-bold text-slate-500">{filteredEvents.length} {isAr ? 'أحداث' : 'Events'}</span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-2.5 text-start">{isAr ? 'التاريخ والوقت (UTC)' : 'Date & Time (UTC)'}</th>
                  <th className="py-2.5 text-start">{isAr ? 'الدولة' : 'Country'}</th>
                  <th className="py-2.5 text-start">{isAr ? 'الحدث الاقتصادي' : 'Event / Metric'}</th>
                  <th className="py-2.5 text-center">{isAr ? 'الأهمية' : 'Impact'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'التوقع' : 'Forecast'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'السابق' : 'Previous'}</th>
                  <th className="py-2.5 text-end">{isAr ? 'الفعلي' : 'Actual'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
                {filteredEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 text-start text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div>{ev.date}</div>
                      <div className="text-[10px] text-slate-400">{ev.timeUtc} UTC</div>
                    </td>
                    <td className="py-3 text-start whitespace-nowrap">
                      <span className="text-lg me-1.5">{ev.countryFlag}</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">{ev.country}</span>
                    </td>
                    <td className="py-3 text-start">
                      <div className="font-extrabold text-slate-900 dark:text-white text-xs md:text-sm">
                        {isAr ? ev.eventNameAr : ev.eventNameEn}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {isAr ? ev.importanceDescriptionAr : ev.importanceDescriptionEn}
                      </div>
                    </td>
                    <td className="py-3 text-center whitespace-nowrap">
                      {getImpactBadge(ev.impact)}
                    </td>
                    <td className="py-3 text-end tabular-nums font-extrabold text-slate-900 dark:text-white">
                      {ev.forecast}
                    </td>
                    <td className="py-3 text-end tabular-nums text-slate-500">
                      {ev.previous}
                    </td>
                    <td className="py-3 text-end tabular-nums font-mono">
                      {ev.actual ? (
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{ev.actual}</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400">
                          {isAr ? 'قيد الانتظار' : 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
