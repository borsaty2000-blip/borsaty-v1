'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  Quote,
  TrendingUp,
  TrendingDown,
  Scale,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface EarningsData {
  symbol: string;
  quarter?: string;
  summary_ar: string;
  summary_en: string;
  tone: 'OPTIMISTIC' | 'CAUTIOUS' | 'NEUTRAL';
  tone_ar?: string;
  red_flags: string[];
  key_quotes: string[];
  forward_guidance?: string;
  confidence?: number;
  source?: string;
}

interface EarningsInsightCardProps {
  symbol: string;
  className?: string;
}

export default function EarningsInsightCard({
  symbol,
  className = '',
}: EarningsInsightCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showQuotes, setShowQuotes] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchEarnings() {
      try {
        setLoading(true);
        const res = await fetch(`/api/intelligence/earnings/${symbol.toUpperCase()}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch {
        // Non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchEarnings();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="w-40 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
          <div className="w-24 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="w-full h-12 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        <div className="w-64 h-4 bg-slate-100 dark:bg-slate-800 rounded-md" />
      </div>
    );
  }

  if (!data) return null;

  const toneBadge =
    data.tone === 'OPTIMISTIC' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
        <TrendingUp className="w-3.5 h-3.5" />
        <span>{isAr ? data.tone_ar || 'متفائل' : 'OPTIMISTIC TONE'}</span>
      </span>
    ) : data.tone === 'CAUTIOUS' ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>{isAr ? data.tone_ar || 'حذر ومتحفظ' : 'CAUTIOUS TONE'}</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <Scale className="w-3.5 h-3.5 text-slate-500" />
        <span>{isAr ? data.tone_ar || 'محايد' : 'NEUTRAL TONE'}</span>
      </span>
    );

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-5 ${className}`}>
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <FileText className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'ذكاء مؤتمرات الإفصاح والأرباح' : 'Earnings Call Intelligence'}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                {data.quarter || 'Q3 2026'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تحليل نبرة الإدارة، الأهداف المستقبلية، والمخاطر التشغيلية عبر Gemini AI'
                : 'Management sentiment, forward guidance, and red flags analyzed via Gemini AI'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {toneBadge}
        </div>
      </div>

      {/* 2. Executive Summary Box */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
          {isAr ? 'الملخص التنفيذي لنتائج الأعمال' : 'EXECUTIVE EARNINGS SUMMARY'}
        </span>
        <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {isAr ? data.summary_ar : data.summary_en}
        </p>

        {data.forward_guidance && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white me-1">
              {isAr ? 'التوجيه المستقبلي للإدارة:' : 'Forward Guidance:'}
            </span>
            <span>{data.forward_guidance}</span>
          </div>
        )}
      </div>

      {/* 3. Red Flags & Structural Risks List */}
      {data.red_flags && data.red_flags.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>{isAr ? 'نقاط الحذر والمخاطر التشغيلية (Red Flags)' : 'Key Operational Risks & Red Flags'}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-rose-900/90 dark:text-rose-200/90 ps-1">
            {data.red_flags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Collapsible Key Quotes from Executives */}
      {data.key_quotes && data.key_quotes.length > 0 && (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowQuotes((prev) => !prev)}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'اقتباسات مباشرة من الإدارة التنفيذية' : 'Executive Call Quotes & Highlights'}</span>
            </span>
            {showQuotes ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showQuotes && (
            <div className="mt-3 space-y-2.5">
              {data.key_quotes.map((quote, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 text-xs italic text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                >
                  <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans font-medium">"{quote}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
