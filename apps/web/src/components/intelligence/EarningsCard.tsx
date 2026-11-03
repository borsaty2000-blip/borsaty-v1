'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Loader2,
  DollarSign,
  Quote,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface QuoteItem {
  speaker: string;
  quote: string;
}

interface GuidanceInfo {
  revenue: string;
  eps: string;
  changed_vs_previous: 'RAISED' | 'LOWERED' | 'MAINTAINED' | 'UNCHANGED';
}

interface AnalysisPayload {
  key_points: string[];
  management_tone: 'OPTIMISTIC' | 'CAUTIOUS' | 'NEUTRAL';
  tone_change_vs_previous: 'IMPROVED' | 'DECLINED' | 'STABLE';
  sentiment_score: number; // -1.0 to 1.0
  guidance: GuidanceInfo;
  red_flags: string[];
  key_quotes: QuoteItem[];
  operational_highlights: string[];
  capital_allocation: string;
}

interface FinancialMetrics {
  revenue_actual: number;
  revenue_estimate: number;
  revenue_surprise_pct: number;
  eps_actual: number;
  eps_estimate: number;
  eps_surprise_pct: number;
  verdict: 'BEAT' | 'MISS' | 'IN_LINE';
}

interface HistoricalReaction {
  quarter: string;
  date: string;
  return_3d_pct: number;
}

interface EarningsData {
  symbol: string;
  quarter: string;
  earnings_date: string;
  transcript_available: boolean;
  reason?: string;
  analysis?: AnalysisPayload | null;
  financials?: FinancialMetrics;
  historical_reactions?: HistoricalReaction[];
  data_quality?: {
    transcript_source?: string | null;
    gemini_used?: boolean;
    confidence?: string;
  };
}

interface EarningsCardProps {
  symbol: string;
}

export default function EarningsCard({ symbol }: EarningsCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quotesOpen, setQuotesOpen] = useState<boolean>(false);

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
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load earnings intelligence:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (symbol) fetchEarnings();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-pulse">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="w-28 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          ))}
        </div>
        <div className="h-52 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  // Graceful degradation when transcripts are not available (e.g. MENA stocks)
  if (!data || !data.transcript_available) {
    const isMena = !['AAPL', 'NVDA', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META'].includes(symbol.toUpperCase());
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'تحليل نتائج أعمال ومؤتمرات الأرباح' : 'Earnings Call Intelligence'}
            </h2>
            <p className="text-xs text-slate-500">
              {data?.quarter || 'Q3 2026'} · {symbol.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'نص مؤتمر الأرباح غير متاح لهذا السهم' : 'Earnings Transcript Unavailable'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'تحليل النصوص المفرغة لمؤتمرات الأرباح متاح حالياً للشركات المقيدة في الأسواق الأمريكية ذات النصوص المنشورة رسمياً. بالنسبة لأسهم منطقة الشرق الأوسط (مصر، السعودية، الإمارات)، تتوفر البيانات المالية عبر إفصاحات البورصة الرسمية وصفحات علاقات المستثمرين.'
                  : 'Earnings call transcript analysis is currently supported for US-listed companies with public audio transcripts. For MENA securities, periodic financial disclosures and audited earnings reports are filed directly with regional regulatory exchanges.'}
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isMena ? (
              <a
                href={symbol.toUpperCase() === 'COMI' ? 'https://www.cibeg.com/about-cib/investor-relations' : 'https://www.egx.com.eg'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold transition-all"
              >
                <span>{isAr ? 'زيارة صفحة علاقات المستثمرين' : 'View Company IR Disclosures'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <a
                href={`https://www.sec.gov/edgar/searchedgar/companysearch?companyName=${symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold transition-all"
              >
                <span>{isAr ? 'استعراض إيداعات SEC' : 'View SEC EDGAR Filings'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Show Financials & Historical Reactions if available */}
        {data?.financials && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
              {isAr ? 'المؤشرات المالية المعلنة للربع' : 'Reported Quarterly Financials'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400 font-mono text-[11px] mb-1">{isAr ? 'الإيرادات الفعلية' : 'Revenue'}</div>
                <div className="font-black text-slate-900 dark:text-white font-mono text-base">
                  {data.financials.revenue_actual}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400 font-mono text-[11px] mb-1">{isAr ? 'ربحية السهم' : 'Reported EPS'}</div>
                <div className="font-black text-slate-900 dark:text-white font-mono text-base">
                  {data.financials.eps_actual}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400 font-mono text-[11px] mb-1">{isAr ? 'مفاجأة الأرباح' : 'EPS Surprise'}</div>
                <div className={`font-black font-mono text-base ${data.financials.eps_surprise_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {data.financials.eps_surprise_pct >= 0 ? '+' : ''}{data.financials.eps_surprise_pct}%
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-slate-400 font-mono text-[11px] mb-1">{isAr ? 'النتيجة' : 'Verdict'}</div>
                <div className={`font-black font-mono text-base ${data.financials.verdict === 'BEAT' ? 'text-emerald-500' : data.financials.verdict === 'MISS' ? 'text-rose-500' : 'text-slate-400'}`}>
                  {data.financials.verdict}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const analysis = data.analysis;
  const financials = data.financials;
  const reactions = data.historical_reactions || [];

  const tone = analysis?.management_tone || 'NEUTRAL';
  const toneBg =
    tone === 'OPTIMISTIC'
      ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20'
      : tone === 'CAUTIOUS'
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
      : 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  const toneLabel =
    tone === 'OPTIMISTIC'
      ? isAr ? 'متفائل (Optimistic)' : 'OPTIMISTIC'
      : tone === 'CAUTIOUS'
      ? isAr ? 'حذر (Cautious)' : 'CAUTIOUS'
      : isAr ? 'محايد (Neutral)' : 'NEUTRAL';

  // Sentiment score from -1.0 to +1.0 converted to percentage 0% to 100%
  const sentimentScore = analysis?.sentiment_score ?? 0;
  const needlePositionPct = Math.min(100, Math.max(0, ((sentimentScore + 1) / 2) * 100));

  const guidanceChange = analysis?.guidance?.changed_vs_previous || 'MAINTAINED';
  const guidanceColor =
    guidanceChange === 'RAISED'
      ? 'text-emerald-500'
      : guidanceChange === 'LOWERED'
      ? 'text-rose-500'
      : 'text-slate-400';

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'تحليل الأرباح الذكي' : 'Earnings Insight'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                {data.data_quality?.gemini_used ? 'GEMINI 1.5 PRO' : 'INSTITUTIONAL AI'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {data.quarter} · {data.earnings_date} · {symbol.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Tone Badge */}
        <div className={`px-4 py-2 rounded-xl border text-xs font-black tracking-wide flex items-center gap-2 self-start sm:self-auto ${toneBg}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{toneLabel}</span>
        </div>
      </div>

      {/* Section 1 — Financial Metrics (4 mini-cards) */}
      {financials && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'الإيرادات الفعلية' : 'Revenue'}
            </span>
            <div className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white">
              ${financials.revenue_actual}B
            </div>
            <div className={`text-[11px] font-mono font-bold ${financials.revenue_surprise_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {financials.revenue_surprise_pct >= 0 ? '+' : ''}{financials.revenue_surprise_pct}% {isAr ? 'عن التقديرات' : 'vs est'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'ربحية السهم (EPS)' : 'Diluted EPS'}
            </span>
            <div className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white">
              ${financials.eps_actual.toFixed(2)}
            </div>
            <div className={`text-[11px] font-mono font-bold ${financials.eps_surprise_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {financials.eps_surprise_pct >= 0 ? '+' : ''}{financials.eps_surprise_pct}% {isAr ? 'عن التقديرات' : 'vs est'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'نتيجة الأرباح' : 'Earnings Verdict'}
            </span>
            <div className={`text-lg md:text-xl font-black font-mono ${financials.verdict === 'BEAT' ? 'text-emerald-500' : financials.verdict === 'MISS' ? 'text-rose-500' : 'text-slate-400'}`}>
              {financials.verdict}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {financials.verdict === 'BEAT' ? (isAr ? 'تجاوز التوقعات' : 'Beats Consensus') : financials.verdict === 'MISS' ? (isAr ? 'دون التوقعات' : 'Below Consensus') : (isAr ? 'متطابق' : 'In Line')}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'تغير نبرة الإدارة' : 'Tone Shift'}
            </span>
            <div className="text-lg md:text-xl font-black font-mono text-slate-900 dark:text-white">
              {analysis?.tone_change_vs_previous || 'STABLE'}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {isAr ? 'مقارنة بالربع السابق' : 'vs prior quarter'}
            </div>
          </div>
        </div>
      )}

      {/* Section 2 — Sentiment Score Gauge */}
      {analysis && (
        <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'مقياس معنويات الإدارة التنفيذية' : 'Management Sentiment Gauge'}
            </span>
            <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
              {sentimentScore >= 0 ? `+${sentimentScore}` : sentimentScore} ({toneLabel})
            </span>
          </div>

          {/* Linear Gauge track */}
          <div className="relative w-full h-3 rounded-full bg-gradient-to-r from-rose-500 via-slate-400 to-emerald-500 overflow-visible">
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-black border-2 border-slate-900 dark:border-white shadow-md transition-all duration-500"
              style={{ left: `calc(${needlePositionPct}% - 8px)` }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>-1.0 ({isAr ? 'حذر وسلبي' : 'Bearish/Cautious'})</span>
            <span>0.0 ({isAr ? 'محايد' : 'Neutral'})</span>
            <span>+1.0 ({isAr ? 'متفائل جداً' : 'Very Optimistic'})</span>
          </div>
        </div>
      )}

      {/* Section 3 — Key Points */}
      {analysis?.key_points && analysis.key_points.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            {isAr ? 'أهم النقاط الجوهرية (Executive Key Points)' : 'Executive Key Points'}
          </h3>
          <ul className="space-y-2.5">
            {analysis.key_points.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0 mt-1.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 4 — Red Flags */}
      {analysis?.red_flags && analysis.red_flags.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2.5">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{isAr ? 'إشارات التحذير والمخاوف (Red Flags)' : 'Potential Red Flags & Key Concerns'}</span>
          </div>
          <ul className="space-y-2">
            {analysis.red_flags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-rose-600/90 dark:text-rose-400 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Section 5 — Key Quotes (Collapsible) */}
      {analysis?.key_quotes && analysis.key_quotes.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setQuotesOpen(!quotesOpen)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-slate-500" />
              <span>{isAr ? 'اقتباسات الإدارة التنفيذية المباشرة (Key Executive Quotes)' : 'Key Executive Quotes'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {analysis.key_quotes.length}
              </span>
            </div>
            {quotesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {quotesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-4 space-y-3 bg-white dark:bg-[#0b0f19] divide-y divide-slate-100 dark:divide-slate-800"
              >
                {analysis.key_quotes.map((q, idx) => (
                  <div key={idx} className={`text-xs ${idx > 0 ? 'pt-3' : ''} space-y-1`}>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{q.speaker}</span>
                    </div>
                    <blockquote className="italic text-slate-600 dark:text-slate-400 pl-3 border-l-2 border-slate-300 dark:border-slate-700">
                      "{q.quote}"
                    </blockquote>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Section 6 — Historical Reactions (Last 4 Quarters) */}
      {reactions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {isAr ? 'رد فعل السهم التاريخي بعد إعلان الأرباح (3 أيام)' : 'Historical 3-Day Post-Earnings Reactions'}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {isAr ? 'آخر 4 أرباع سنوية' : 'Last 4 Quarters'}
            </span>
          </div>

          <div className="h-44 w-full p-2 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reactions} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  formatter={(val) => {
                    const num = Number(val) || 0;
                    return [`${num >= 0 ? '+' : ''}${num}%`, isAr ? 'عائد 3 أيام' : '3-Day Return'];
                  }}
                  labelFormatter={(lbl) => `${lbl}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
                <Bar dataKey="return_3d_pct" radius={[4, 4, 0, 0]}>
                  {reactions.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.return_3d_pct >= 0 ? '#10b981' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section 7 — Forward Guidance */}
      {analysis?.guidance && (
        <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
            <span>{isAr ? 'توجيهات الإدارة المستقبلية (Forward Guidance)' : 'Management Forward Guidance'}</span>
            <span className={`font-mono text-[11px] font-black ${guidanceColor}`}>
              {guidanceChange}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                {isAr ? 'توجيهات الإيرادات' : 'Revenue Guidance'}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {analysis.guidance.revenue}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">
                {isAr ? 'توجيهات ربحية السهم (EPS)' : 'EPS Guidance'}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {analysis.guidance.eps}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
