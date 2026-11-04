'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  Briefcase,
  CheckCircle2,
  Loader2,
  Target,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import AddTransactionModal from '@/components/portfolio/AddTransactionModal';
import ErrorBoundary from '@/components/ErrorBoundary';

export interface DecisionCardProps {
  symbol: string;
  currency?: string;
  currentPrice?: number;
  onAddToPortfolio?: () => void;
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

function DecisionCardContent({
  symbol,
  currency = 'EGP',
  currentPrice,
  onAddToPortfolio,
  decisionData,
}: DecisionCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [downloading, setDownloading] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);

  const dec = decisionData.decision?.toUpperCase() || 'WAIT';
  const isMaintenance = dec === 'MAINTENANCE';
  const isStrongBuy = !isMaintenance && dec.includes('STRONG BUY');
  const isBuy = !isMaintenance && dec.includes('BUY');
  const isStrongSell = !isMaintenance && dec.includes('STRONG SELL');
  const isSell = !isMaintenance && dec.includes('SELL');

  // Confluence percentage (0 - 100)
  const confluencePct = isMaintenance ? 0 : Math.round(decisionData.confidence_score * 100);

  // Massive background colors per requirements
  const cardGradient = isMaintenance
    ? 'bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white shadow-xl border-amber-600/40'
    : isBuy
    ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white shadow-xl shadow-emerald-950/20 border-emerald-500/40'
    : isSell
    ? 'bg-gradient-to-br from-rose-600 via-rose-700 to-red-950 text-white shadow-xl shadow-rose-950/20 border-rose-500/40'
    : 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 text-white shadow-xl border-slate-600/40';

  // Primary decision text
  const decisionTextEn = isMaintenance
    ? 'DATA UNDER MAINTENANCE'
    : isStrongBuy
    ? 'STRONG BUY'
    : isBuy
    ? 'BUY'
    : isStrongSell
    ? 'STRONG SELL'
    : isSell
    ? 'SELL'
    : 'WATCH & WAIT';

  const decisionTextAr = isMaintenance
    ? 'بيانات تحت الصيانة الفنية'
    : isStrongBuy
    ? 'شراء قوي'
    : isBuy
    ? 'شراء'
    : isStrongSell
    ? 'بيع قوي'
    : isSell
    ? 'بيع'
    : 'مراقبة وانتظار';

  const whyList = isAr ? decisionData.why_ar : decisionData.why_en;
  const risksList = isAr ? decisionData.risks_ar : decisionData.risks_en;

  const handleDownloadPDF = () => {
    try {
      setDownloading(true);
      toast.info(
        isAr ? 'جاري تجهيز التقرير المؤسسي...' : 'Generating institutional report...'
      );
      window.open(
        `/stock/${encodeURIComponent(symbol)}/report?lang=${isAr ? 'ar' : 'en'}&download=1`,
        '_blank',
        'noopener,noreferrer'
      );
    } catch {
      toast.error(
        isAr ? 'حدث خطأ أثناء تحميل التقرير' : 'An error occurred during report generation'
      );
    } finally {
      window.setTimeout(() => setDownloading(false), 1500);
    }
  };

  // SVG Circular Gauge calculations (Radius: 28, Circumference: 2 * PI * 28 ≈ 175.9)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confluencePct / 100) * circumference;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`w-full rounded-lg border p-6 shadow-sm hover:shadow-md transition-all duration-200 ${cardGradient}`}
      >
        {/* Top Header: Decision Badge & Circular Confluence Gauge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                {isAr ? 'قرار المحرك الكمي الموحد' : 'Quantitative Decision'}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">
              {isAr ? decisionTextAr : decisionTextEn}
            </h2>
          </div>

          {/* Circular Confluence Gauge */}
          <div className="flex items-center gap-3 bg-black/20 backdrop-blur-sm px-3.5 py-2 rounded-lg border border-white/15">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-white/20"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-white transition-all duration-1000 ease-out"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-white">
                {confluencePct}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/70 block font-semibold uppercase">
                {isAr ? 'درجة التوافق' : 'Confluence'}
              </span>
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-white/20 border border-white/30 inline-block uppercase mt-0.5">
                {decisionData.confidence_level}
              </span>
            </div>
          </div>
        </div>

        {/* Trade Parameters 4-Box Grid or Maintenance Banner */}
        {isMaintenance ? (
          <div className="py-4 border-b border-white/15">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/15">
              <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-white block">
                  {isAr ? 'حماية دقة الأسعار مفعلة' : 'Institutional Price Accuracy Guard Active'}
                </span>
                <p className="text-white/80 leading-relaxed">
                  {isAr
                    ? 'يتم تدقيق ومطابقة أسعار السهم مع دفاتر التداول المباشرة. تم تعليق الإشارات الفنية التلقائية لحماية رأس المال حتى اكتمال التحقق الفني.'
                    : 'Stock price data is currently undergoing audit and verification with official market feeds. Automated trading signals are paused to prevent inaccurate execution.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-white/15 text-xs font-semibold">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/15">
              <span className="text-[10px] text-white/70 block mb-1">
                {isAr ? 'نطاق الدخول' : 'Entry Zone'}
              </span>
              <span className="text-sm md:text-base font-bold font-mono tabular-nums text-white">
                {decisionData.entry_zone[0]} - {decisionData.entry_zone[1]}
              </span>
              <span className="text-[10px] text-white/70 ms-1">{currency}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/15">
              <span className="text-[10px] text-rose-200 block mb-1">
                {isAr ? 'وقف الخسارة' : 'Stop Loss'}
              </span>
              <span className="text-sm md:text-base font-bold font-mono tabular-nums text-white">
                {decisionData.stop_loss}
              </span>
              <span className="text-[10px] text-white/70 ms-1">{currency}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/15">
              <span className="text-[10px] text-emerald-200 block mb-1">
                {isAr ? 'الهدف الأول (T1)' : 'Target 1'}
              </span>
              <span className="text-sm md:text-base font-bold font-mono tabular-nums text-white">
                {decisionData.targets[0] || '—'}
              </span>
              <span className="text-[10px] text-white/70 ms-1">{currency}</span>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/15">
              <span className="text-[10px] text-emerald-200 block mb-1">
                {isAr ? 'نسبة العائد:المخاطرة' : 'R:R Ratio'}
              </span>
              <span className="text-sm md:text-base font-bold font-mono tabular-nums text-white">
                {decisionData.primary_rr}:1
              </span>
              <span className="text-[9px] text-white/70 block">
                {isAr ? 'مكافأة ممتازة' : 'Reward/Risk'}
              </span>
            </div>
          </div>
        )}

        {/* Target 2 & Catalysts preview */}
        <div className="py-3 text-xs space-y-2">
          {decisionData.targets[1] && (
            <div className="flex items-center justify-between text-xs font-semibold px-1 text-white/90">
              <span className="text-white/70">
                {isAr ? 'الهدف الثاني الممتد (T2):' : 'Extended Target 2 (T2):'}
              </span>
              <span className="font-mono font-bold">
                {decisionData.targets[1]} {currency}
              </span>
            </div>
          )}

          {whyList && whyList.length > 0 && (
            <ul className="space-y-1 text-xs text-white/90 pt-1">
              {whyList.slice(0, 2).map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Buttons: Download PDF (Large) + Add to Portfolio */}
        <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full sm:flex-1 h-11 px-4 rounded-lg bg-white text-slate-900 hover:bg-white/90 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isAr ? 'تحميل التقرير الكامل (PDF)' : 'Download PDF Report'}</span>
          </button>

          <button
            onClick={() => {
              if (onAddToPortfolio) {
                onAddToPortfolio();
              } else {
                setPortfolioModalOpen(true);
              }
            }}
            className="w-full sm:w-auto h-11 px-4 rounded-lg bg-black/30 hover:bg-black/40 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer"
          >
            <Briefcase className="w-4 h-4" />
            <span>{isAr ? 'إضافة إلى المحفظة' : 'Add to Portfolio'}</span>
          </button>
        </div>
      </motion.div>

      {/* Add to Portfolio Modal */}
      <AddTransactionModal
        isOpen={portfolioModalOpen}
        onClose={() => setPortfolioModalOpen(false)}
        onSuccess={() => setPortfolioModalOpen(false)}
        initialSymbol={symbol}
        initialPrice={currentPrice || decisionData.entry_zone[0]}
      />
    </>
  );
}

export function DecisionCard(props: DecisionCardProps) {
  return (
    <ErrorBoundary
      fallbackTitleEn="Analysis unavailable"
      fallbackTitleAr="التحليل غير متاح"
      fallbackSubtitleEn="The decision card could not be displayed."
      fallbackSubtitleAr="تعذر عرض بطاقة القرار."
    >
      <DecisionCardContent {...props} />
    </ErrorBoundary>
  );
}
