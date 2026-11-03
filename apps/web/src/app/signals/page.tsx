"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Target,
  BarChart3,
  AlertTriangle,
  Info,
} from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

interface SignalItem {
  id: string;
  symbol: string;
  nameAr: string;
  market: string;
  type: string;
  entry: number;
  targets: number[];
  stopLoss: number;
  confluenceScore: number;
  status: string;
  resultPct: number | null;
  createdAt: string;
}

interface PatternStats {
  total: number;
  closed: number;
  isSignificant: boolean;
  hitRate: number;
  wilsonInterval: { lower: number; upper: number };
  hits: number;
  avgReturn: number;
}

interface SignalMetrics {
  overallSignificant: boolean;
  overallHitRate: number;
  overallWilson: { lower: number; upper: number };
  closedSignals: number;
  avgReturnOverall: number;
  activeSignals: number;
  totalSignals: number;
  breakdown: Record<string, PatternStats>;
}

interface SignalsData {
  metrics: SignalMetrics;
  signals: SignalItem[];
}

export default function SignalsDashboard() {
  const [data, setData] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signals")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching signals:", err);
        }
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm" />
        <div className="h-44 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm" />
        <div className="h-80 bg-white dark:bg-[#0f172a] rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm" />
      </div>
    );
  }

  const { metrics, signals } = data;

  const statusBadge = (status: string, resultPct: number | null) => {
    switch (status) {
      case "HIT_T1":
      case "HIT_T2":
      case "HIT_T3":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3.5 h-3.5" />
            تحقق الهدف ({status}) +{resultPct}%
          </span>
        );
      case "STOPPED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            وقف خسارة {resultPct}%
          </span>
        );
      case "ACTIVE":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5" />
            نشطة جارية ({resultPct && resultPct > 0 ? `+${resultPct}%` : `${resultPct || 0}%`})
          </span>
        );
    }
  };

  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to render signals performance dashboard"
      fallbackTitleAr="تعذر عرض لوحة أداء الإشارات والنسب الإحصائية"
    >
      <div className="space-y-8">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-black text-white">سجل الإشارات ونسبة النجاح (Signals & Hit Rate)</h1>
          </div>
          <p className="text-xs text-gray-400">
            قاعدة النزاهة الإحصائية: لا ادعاءات تسويقية زائفة — حماية مصداقية المنصة أمام المتداولين المحترفين
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
          <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>TimescaleDB Automated Hook & Signal Store</span>
        </div>
      </div>

      {/* Top Metrics Cards with Sample Size Protection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 relative overflow-hidden shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">نسبة النجاح العامة (Hit Rate)</div>
          {metrics.overallSignificant ? (
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{metrics.overallHitRate}%</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                95% CI: [{metrics.overallWilson.lower}% - {metrics.overallWilson.upper}%]
              </div>
            </div>
          ) : (
            <div>
              <div className="text-base font-bold text-amber-500 flex items-center gap-1.5 mt-1">
                <AlertTriangle className="w-4 h-4" />
                <span>بيانات غير كافية (n={metrics.closedSignals})</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-tight">
                يتطلب الحد الأدنى 30 إشارة مغلقة لاعتماد النسبة إحصائياً (Wilson Score)
              </div>
            </div>
          )}
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">متوسط العائد المحقق (المغلقة)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white" dir="ltr">
            +{metrics.avgReturnOverall}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            على إجمالي {metrics.closedSignals} صفقة أغلقت
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">الإشارات النشطة الجارية</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.activeSignals}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">قيد المتابعة الحية في السوق</div>
        </div>

        <div className="p-4 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">إجمالي الإشارات التلقائية المسجلة</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalSignals}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">تُحفظ تلقائياً عبر Auto-Persistence Hook</div>
        </div>
      </div>

      {/* Hit Rate Breakdown per Signal Type (With Wilson Score Interval & Sample Rule) */}
      <div className="p-5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              تفصيل نسبة النجاح (Hit Rate) ودرجة الدلالة الإحصائية
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            العتبة الإحصائية المعتمدة: n ≥ 30
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(metrics.breakdown || {}).map(([typeKey, stats]: [string, PatternStats]) => (
            <div key={typeKey} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-900 dark:text-slate-200">{typeKey}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">إجمالي: {stats.total}</span>
              </div>

              {stats.isSignificant ? (
                <div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{stats.hitRate}% نجاح</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    95% CI: [{stats.wilsonInterval.lower}% - {stats.wilsonInterval.upper}%]
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.hitRate}%` }} />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>بيانات غير كافية (n={stats.closed})</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    تم إغلاق {stats.closed} من أصل {stats.total} إشارة. لا تُعرض النسبة المئوية تفادياً لخداع العينة الصغيرة.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-2">
                <span>المحققة: {stats.hits}</span>
                <span>متوسط العائد: {stats.avgReturn > 0 ? `+${stats.avgReturn}%` : `${stats.avgReturn}%`}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signals History Table */}
      <div className="p-5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">سجل الإشارات التفصيلي وتتبع النتائج الفورية</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            تحديث مباشر مع كل شمعة إغلاق
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-3 px-3">السهم</th>
                <th className="py-3 px-3">السوق</th>
                <th className="py-3 px-3">النوع</th>
                <th className="py-3 px-3">سعر الدخول</th>
                <th className="py-3 px-3">الأهداف</th>
                <th className="py-3 px-3">وقف الخسارة</th>
                <th className="py-3 px-3">التوافق</th>
                <th className="py-3 px-3">الحالة والنتيجة</th>
                <th className="py-3 px-3">التاريخ</th>
                <th className="py-3 px-3 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {signals.map((sig: SignalItem) => (
                <tr key={sig.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white">{sig.symbol}</span>
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{sig.nameAr}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                      {sig.market}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{sig.type}</td>
                  <td className="py-3.5 px-3 font-mono font-medium text-slate-900 dark:text-white">{sig.entry.toFixed(2)}</td>
                  <td className="py-3.5 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                    {sig.targets.slice(0, 2).join(" | ")}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-rose-600 dark:text-rose-400">{sig.stopLoss.toFixed(2)}</td>
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-slate-900 dark:text-white">{sig.confluenceScore}%</span>
                  </td>
                  <td className="py-3.5 px-3">{statusBadge(sig.status, sig.resultPct)}</td>
                  <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(sig.createdAt).toLocaleDateString("ar-EG")}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <Link
                      href={`/stock/${sig.symbol}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-black text-slate-700 dark:text-slate-300 transition-colors text-[11px]"
                    >
                      عرض التحليل
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Verification Card */}
      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
          <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>استعلام التحقق من حجم العينة وفترة الثقة (Sample Size & Wilson Interval Verification):</span>
        </div>
        <pre className="p-3 rounded-lg bg-slate-900 dark:bg-black text-slate-100 font-mono text-[11px] overflow-x-auto border border-slate-700">
{`-- استعلام التحقق من حجم العينة لكل نوع إشارة وتطبيق قاعدة (n >= 30):
SELECT 
  type,
  COUNT(*) AS total_signals,
  COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) AS closed_signals,
  COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END) AS hits,
  CASE 
    WHEN COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) < 30 
    THEN 'بيانات غير كافية (n=' || COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END) || ')'
    ELSE ROUND((COUNT(CASE WHEN status IN ('HIT_T1', 'HIT_T2', 'HIT_T3') THEN 1 END)::numeric / COUNT(CASE WHEN status != 'ACTIVE' THEN 1 END)) * 100, 1) || '%'
  END AS reporting_verdict
FROM "Signal"
GROUP BY type
ORDER BY total_signals DESC;`}
        </pre>
      </div>
    </div>
    </ErrorBoundary>
  );
}
