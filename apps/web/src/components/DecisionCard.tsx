'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Share2,
  CheckCircle2,
  HelpCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface DecisionCardProps {
  symbol: string;
  currency?: string;
  decisionData: {
    decision: string;
    confidence_level: string;
    confidence_score: number;
    direction: string;
    entry_zone: [number, number];
    stop_loss: number;
    targets: number[];
    primary_rr: number;
    why_ar: string[];
    why_en: string[];
    risks_ar: string[];
    risks_en: string[];
    historical_evidence: {
      status: string;
      sample_adequate: boolean;
      hit_rate_t1?: number | null;
      wilson_ci_95?: [number, number] | null;
      total_signals?: number;
      message_ar?: string;
      message_en?: string;
    };
    disclaimer_ar: string;
    disclaimer_en: string;
  };
}

export function DecisionCard({ symbol, currency = 'EGP', decisionData }: DecisionCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [downloading, setDownloading] = useState(false);

  const dec = decisionData.decision;
  const isBuy = dec.includes('BUY');
  const isSell = dec.includes('SELL');
  const confPct = Math.round(decisionData.confidence_score * 100);

  // Status Styling
  const badgeBg = isBuy
    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
    : isSell
    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-300'
    : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300';

  const dotColor = isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-slate-400';

  const decisionTitle = isBuy
    ? isAr
      ? 'قرار: شراء (قناعة عالية)'
      : 'DECISION: BUY (HIGH CONVICTION)'
    : isSell
    ? isAr
      ? 'قرار: بيع أو تخفيف'
      : 'DECISION: SELL OR REDUCE'
    : isAr
    ? 'قرار: مراقبة وانتظار'
    : 'DECISION: WATCH & WAIT';

  const whyList = isAr ? decisionData.why_ar : decisionData.why_en;
  const risksList = isAr ? decisionData.risks_ar : decisionData.risks_en;
  const histMsg = isAr
    ? decisionData.historical_evidence?.message_ar
    : decisionData.historical_evidence?.message_en;

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/report/${symbol}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BORSATY_${symbol}_DECISION.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert(isAr ? 'تعذر تحميل التقرير حالياً، يرجى المحاولة بعد قليل' : 'Failed to download PDF. Please try again.');
      }
    } catch {
      alert(isAr ? 'حدث خطأ أثناء تحميل التقرير' : 'An error occurred during PDF generation');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`w-full rounded-2xl border p-5 md:p-6 transition-all duration-200 shadow-sm ${badgeBg} mb-6`}
    >
      {/* Top Header: Decision & Confidence Gauge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-current/10">
        <div className="flex items-center gap-3">
          <span className={`w-3.5 h-3.5 rounded-full ${dotColor} animate-pulse`} />
          <h2 className="text-xl md:text-2xl font-black tracking-tight">{decisionTitle}</h2>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-white/80 dark:bg-slate-900/80 shadow-sm border border-current/20 tabular-nums">
            {confPct}% {isAr ? 'نسبة القناعة' : 'Confidence'}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-current/10 uppercase tracking-wider">
            {decisionData.confidence_level}
          </span>
        </div>
      </div>

      {/* Trade Parameters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-current/10 text-xs font-semibold">
        <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-current/10">
          <span className="text-[11px] opacity-70 block mb-1">
            {isAr ? 'نطاق الدخول المقترح' : 'Entry Zone'}
          </span>
          <span className="text-sm md:text-base font-extrabold tabular-nums">
            {decisionData.entry_zone[0]} - {decisionData.entry_zone[1]} {currency}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-current/10">
          <span className="text-[11px] opacity-70 block mb-1">
            {isAr ? 'وقف الخسارة' : 'Stop Loss'}
          </span>
          <span className="text-sm md:text-base font-extrabold text-rose-600 dark:text-rose-400 tabular-nums">
            {decisionData.stop_loss} {currency}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-current/10">
          <span className="text-[11px] opacity-70 block mb-1">
            {isAr ? 'الهدف الأول (T1)' : 'Target 1'}
          </span>
          <span className="text-sm md:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {decisionData.targets[0] || '—'} {currency}
          </span>
        </div>
        <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-current/10">
          <span className="text-[11px] opacity-70 block mb-1">
            {isAr ? 'نسبة العائد:المخاطرة' : 'R:R Ratio'}
          </span>
          <span className="text-sm md:text-base font-extrabold tabular-nums">
            {decisionData.primary_rr}:1
          </span>
        </div>
      </div>

      {/* Catalyst & Reasoning Bullets */}
      <div className="py-4 space-y-3">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider mb-2 opacity-90">
            {isAr ? 'لماذا نوصي بهذا القرار:' : 'Key Decision Catalysts:'}
          </h4>
          <ul className="space-y-1.5 text-xs md:text-sm font-medium">
            {whyList.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        {risksList && risksList.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-black uppercase tracking-wider mb-2 text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isAr ? 'المخاطر والتحذيرات:' : 'Risk Factors:'}</span>
            </h4>
            <ul className="space-y-1 text-xs md:text-sm font-medium text-rose-700 dark:text-rose-300">
              {risksList.map((risk, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="block w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Historical Evidence Box */}
        {histMsg && (
          <div className="mt-3 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-current/10 flex items-center gap-2 text-xs font-bold">
            <span className="text-base">📊</span>
            <span>{histMsg}</span>
          </div>
        )}
      </div>

      {/* Action Download Bar */}
      <div className="pt-4 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>{isAr ? 'تحميل التقرير الكامل (PDF)' : 'Download Full PDF Report'}</span>
        </button>

        <p className="text-[10px] text-slate-500 dark:text-slate-400 max-w-xl">
          {isAr ? decisionData.disclaimer_ar : decisionData.disclaimer_en}
        </p>
      </div>
    </motion.div>
  );
}
