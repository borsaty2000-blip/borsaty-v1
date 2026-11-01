"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Compass,
} from "lucide-react";

interface ExplainabilityProps {
  symbol: string;
  confluenceScore: number;
  certainty: "Confirmed" | "Probable" | "Potential" | "Unconfirmed";
  confidencePct: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  primaryScenario: string;
  alternativeScenario: string;
  invalidationCriteria: string;
  targets: Array<{ level: number; price: number; method: string }>;
  stopLoss: { price: number; method: string };
  dataQuality: {
    provider: string;
    isRealtime: boolean;
    isDelayed: boolean;
    delayMinutes: number;
    hasOrderBook: boolean;
    orderBookProxyUsed: boolean;
    warnings: string[];
    missingFields: string[];
  };
}

export default function ExplainabilityPanel({
  symbol,
  confluenceScore,
  certainty,
  confidencePct,
  supportingEvidence,
  contradictingEvidence,
  primaryScenario,
  alternativeScenario,
  invalidationCriteria,
  targets,
  stopLoss,
  dataQuality,
}: ExplainabilityProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Certainty Color Map
  const certaintyBadgeStyles: Record<string, { bg: string; text: string; border: string; labelAr: string }> = {
    Confirmed: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      labelAr: "مؤكد (Confirmed)",
    },
    Probable: {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      border: "border-teal-500/30",
      labelAr: "راجح (Probable)",
    },
    Potential: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      border: "border-amber-500/30",
      labelAr: "محتمل (Potential)",
    },
    Unconfirmed: {
      bg: "bg-rose-500/10",
      text: "text-rose-400",
      border: "border-rose-500/30",
      labelAr: "غير مؤكد (Unconfirmed)",
    },
  };

  const badge = certaintyBadgeStyles[certainty] || certaintyBadgeStyles.Potential;

  return (
    <div className="w-full rounded-2xl border border-[#232e48] bg-[#111827] overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-r from-[#141d30] to-[#121929] border-b border-[#232e48] flex items-center justify-between cursor-pointer select-none hover:bg-[#18233b] transition-colors"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">لوحة التفسير والشفافية (Explainability Panel)</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                {badge.labelAr}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              تحليل حتمي متعدد المحركات — لا هلوسة، وكل رقم وراءه نموذج رياضي معلن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-left hidden sm:block">
            <div className="text-xs text-gray-400">توافق الأدوات (Confluence)</div>
            <div className="text-sm font-bold text-emerald-400">{confluenceScore} / 100</div>
          </div>
          <button className="text-gray-400 hover:text-white p-1">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Panel Body */}
      {isOpen && (
        <div className="p-5 space-y-6 text-sm">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48]">
              <div className="text-xs text-gray-400 mb-1">درجة التوافق الفني (Confluence)</div>
              <div className="text-xl font-bold text-white flex items-center gap-2">
                <span>{confluenceScore}%</span>
                <span className="text-xs text-emerald-400 font-normal">وزن مركب</span>
              </div>
              <div className="w-full bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${confluenceScore}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48]">
              <div className="text-xs text-gray-400 mb-1">مستوى اليقين المصنف</div>
              <div className="text-base font-semibold text-white mt-1">
                {badge.labelAr}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                المبدأ 2: لا يقين مطلق — تصنيف احصائي
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48]">
              <div className="text-xs text-gray-400 mb-1">مصدر وتحديث البيانات</div>
              <div className="text-sm font-semibold text-white flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>{dataQuality.provider}</span>
                {dataQuality.isDelayed && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    تأخير {dataQuality.delayMinutes} دقيقة
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                {dataQuality.orderBookProxyUsed ? "Order Book: Proxy تقديري" : "Order Book: لحظي مباشر"}
              </p>
            </div>
          </div>

          {/* Supporting & Contradicting Evidence Grid (Non-negotiable rule 4: Transparency First) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supporting */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>الأدلة المؤيدة للسيناريو الصاعد ({supportingEvidence.length})</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {supportingEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contradicting */}
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2.5">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>الأدلة المعارضة ومصادر الخطر ({contradictingEvidence.length})</span>
              </div>
              <ul className="space-y-1.5 text-xs text-gray-300">
                {contradictingEvidence.map((ev, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Scenarios (Primary vs Alternative) */}
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48]">
              <div className="flex items-center gap-2 text-sky-400 font-medium text-xs mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>السيناريو الأساسي (Primary Scenario)</span>
              </div>
              <p className="text-xs text-gray-200">{primaryScenario}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48]">
              <div className="flex items-center gap-2 text-amber-400 font-medium text-xs mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>السيناريو البديل (Alternative Scenario)</span>
              </div>
              <p className="text-xs text-gray-200">{alternativeScenario}</p>
            </div>
          </div>

          {/* Declared Targets with Methods (Rule 3: Every Number Has a Basis) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              الأهداف السعرية المعلنة والأساس الرياضي لكل هدف:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {targets.map((t) => (
                <div key={t.level} className="p-3 rounded-xl bg-[#141c2e] border border-[#232e48]">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-400">هدف {t.level}</span>
                    <span className="text-emerald-400 font-bold">{t.price}</span>
                  </div>
                  <div className="text-[11px] text-gray-300 font-mono bg-[#0b0f19] px-2 py-1 rounded border border-[#1f293d]">
                    الطريقة: {t.method}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Invalidation Level (Rule 3: Named Stop Loss Basis) */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-semibold text-rose-300">مستوى الإبطال ووقف الخسارة (Invalidation Rule): </span>
                <span className="text-gray-200">{invalidationCriteria}</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold shrink-0">
              {stopLoss.price} — {stopLoss.method}
            </div>
          </div>

          {/* Data Quality Disclosures (Rule 1: No Fabricated Data) */}
          <div className="p-3 rounded-xl bg-[#0e1524] border border-[#1d263b] text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-gray-300">
              <Info className="w-4 h-4 text-sky-400" />
              <span>إفصاح جودة البيانات وشفافية المصادر (Data Quality Disclosures):</span>
            </div>
            {dataQuality.warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-gray-400 pr-5">• {w}</p>
            ))}
            {dataQuality.missingFields.length > 0 && (
              <p className="text-[11px] text-amber-400/80 pr-5">
                • حقول غير متوفرة في التغذية الحالية: {dataQuality.missingFields.join(", ")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
