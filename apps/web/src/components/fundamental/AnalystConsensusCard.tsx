"use client";

import { useEffect, useState } from "react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  AnalystConsensusResponseSchema,
  ValidatedAnalystConsensusResponse,
} from "@/lib/schemas";

interface AnalystConsensusCardProps {
  symbol: string;
  currency?: string;
  className?: string;
}

const DISTRIBUTION = [
  { key: "strong_buy", labelEn: "Strong buy", labelAr: "شراء قوي", color: "bg-emerald-800" },
  { key: "buy", labelEn: "Buy", labelAr: "شراء", color: "bg-emerald-500" },
  { key: "hold", labelEn: "Hold", labelAr: "احتفاظ", color: "bg-slate-400" },
  { key: "sell", labelEn: "Sell", labelAr: "بيع", color: "bg-rose-400" },
  { key: "strong_sell", labelEn: "Strong sell", labelAr: "بيع قوي", color: "bg-rose-700" },
] as const;

function formatNumber(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatCompact(value: number | null | undefined, currency: string): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
}

function formatCurrency(value: number | null | undefined, currency: string): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(value);
}

export default function AnalystConsensusCard({
  symbol,
  currency = "USD",
  className = "",
}: AnalystConsensusCardProps) {
  const { language } = useApp();
  const isAr = language === "ar";
  const sym = symbol.toUpperCase().trim();
  const [data, setData] = useState<ValidatedAnalystConsensusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await fetch(`/api/fundamental/analyst-consensus/${encodeURIComponent(sym)}`);
        if (!response.ok) throw new Error(`Failed to load analyst data for ${sym}`);
        const parsed = AnalystConsensusResponseSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid analyst data response");
        if (active) setData(parsed.data);
      } catch {
        if (active) {
          setData({
            symbol: sym,
            available: false,
            reason: "Analyst data temporarily unavailable",
            message_en: "Analyst data is temporarily unavailable",
            message_ar: "بيانات المحللين غير متاحة مؤقتًا",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (sym) void load();
    return () => { active = false; };
  }, [sym]);

  if (loading) {
    return (
      <div className={`h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 ${className}`} />
    );
  }

  if (!data?.available || !data.consensus) {
    const noCoverage = data?.reason === "No analyst coverage";
    return (
      <section className={`rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`} dir={isAr ? "rtl" : "ltr"}>
        <Info className="mx-auto mb-3 h-6 w-6 text-slate-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">
          {noCoverage
            ? isAr ? "لا توجد تغطية من المحللين لهذا السهم" : "No analyst coverage"
            : isAr ? "بيانات المحللين غير متاحة مؤقتًا" : "Analyst data is temporarily unavailable"}
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {noCoverage
            ? isAr
              ? "هذا شائع في أسهم الشركات الصغيرة في منطقة الشرق الأوسط وشمال أفريقيا. ركز على التحليل الفني أدناه."
              : "This is common for MENA small-caps. Focus on our technical analysis below."
            : isAr
              ? data?.message_ar || "تعذر تحميل بيانات المحللين حاليًا."
              : data?.message_en || "Analyst data could not be loaded right now."}
        </p>
      </section>
    );
  }

  const { consensus, price_targets: targets, estimates, recent_actions: actions = [] } = data;
  const distribution = consensus.distribution;
  const total = consensus.total_analysts;
  const recommendationClass = consensus.recommendation === "BUY"
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
    : consensus.recommendation === "SELL"
      ? "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900"
      : "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700";

  const low = targets?.low;
  const average = targets?.average;
  const high = targets?.high;
  const current = targets?.current_price;
  const min = low != null && current != null ? Math.min(low, current) : low ?? current;
  const max = high != null && current != null ? Math.max(high, current) : high ?? current;
  const span = min != null && max != null && max > min ? max - min : null;
  const point = (value: number | null | undefined) =>
    span && min != null && value != null ? Math.max(0, Math.min(100, ((value - min) / span) * 100)) : null;
  const lowPoint = point(low);
  const highPoint = point(high);
  const upside = targets?.upside_pct;
  const targetRangeValues: Array<{ label: string; value: number | null | undefined }> = [
    { label: isAr ? "منخفض" : "Low", value: low },
    { label: isAr ? "متوسط" : "Average", value: average },
    { label: isAr ? "مرتفع" : "High", value: high },
    { label: isAr ? "السعر الحالي" : "Current price", value: current },
  ];

  return (
    <section className={`space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isAr ? "إجماع المحللين" : "Analyst consensus"} · {sym}
          </div>
          <div className="text-sm text-slate-500">
            {isAr ? `بناءً على ${total} محللًا` : `Based on ${total} analysts`}
          </div>
        </div>
        <span className={`self-start rounded-lg px-4 py-2 text-xl font-black tracking-wide ring-1 ${recommendationClass}`}>
          {consensus.recommendation}
          <span className="ms-2 text-[10px] font-semibold tracking-normal opacity-75">{consensus.strength}</span>
        </span>
      </header>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isAr ? "توزيع التوصيات" : "Rating distribution"}</h3>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={isAr ? "توزيع توصيات المحللين" : "Analyst rating distribution"}>
          {DISTRIBUTION.map(({ key, color }) => {
            const count = distribution[key];
            return count > 0 ? <div key={key} className={color} style={{ width: `${(count / total) * 100}%` }} /> : null;
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          {DISTRIBUTION.map(({ key, labelEn, labelAr, color }) => (
            <div key={key} className="flex min-w-0 items-center gap-2 text-slate-500">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${color}`} />
              <span className="truncate">{isAr ? labelAr : labelEn}</span>
              <strong className="ms-auto text-slate-800 dark:text-slate-100">{distribution[key]}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-950/50">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isAr ? "نطاق السعر المستهدف" : "Price target range"}</h3>
          <div className={`flex items-center gap-1 text-sm font-bold ${upside == null ? "text-slate-500" : upside >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {upside != null && (upside >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />)}
            {isAr ? "الارتفاع المحتمل:" : "Upside:"} {upside == null ? "—" : `${upside > 0 ? "+" : ""}${formatNumber(upside)}%`}
          </div>
        </div>
        <div className="relative h-7">
          <div className="absolute inset-x-0 top-3 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
          {span && lowPoint != null && highPoint != null && (
            <div className="absolute top-3 h-1 rounded-full bg-emerald-500" style={{ left: `${lowPoint}%`, width: `${Math.max(1, highPoint - lowPoint)}%` }} />
          )}
          {[
            { value: low, label: isAr ? "منخفض" : "Low", style: "bg-slate-500" },
            { value: average, label: isAr ? "متوسط" : "Average", style: "bg-emerald-600" },
            { value: high, label: isAr ? "مرتفع" : "High", style: "bg-slate-500" },
            { value: current, label: isAr ? "السعر الحالي" : "Current", style: "bg-black dark:bg-white" },
          ].map(({ value, label, style }) => {
            const position = point(value);
            return position == null ? null : (
              <div key={label} className="absolute top-0 h-7 -translate-x-1/2" style={{ left: `${position}%` }} title={`${label}: ${formatNumber(value)}`}>
                <div className={`mx-auto h-7 w-0.5 ${style}`} />
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-4">
          {targetRangeValues.map(({ label, value }) => (
            <div key={String(label)} className="flex justify-between gap-1">
              <span>{label}</span><strong className="text-slate-800 dark:text-slate-100">{formatCurrency(value, currency)}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Estimate label={isAr ? "ربحية السهم — السنة الحالية" : "EPS · Current year"} value={formatCurrency(estimates?.eps_current_year, currency)} />
        <Estimate
          label={isAr ? "ربحية السهم — السنة القادمة" : "EPS · Next year"}
          value={formatCurrency(estimates?.eps_next_year, currency)}
          growth={estimates?.eps_growth_pct}
          isAr={isAr}
        />
        <Estimate
          label={isAr ? "الإيرادات — السنة الحالية" : "Revenue · Current year"}
          value={formatCompact(estimates?.revenue_current, currency)}
          growth={estimates?.growth_rate_pct}
          isAr={isAr}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{isAr ? "أحدث تغييرات التوصيات" : "Recent analyst actions"}</h3>
        {actions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-xs" dir={isAr ? "rtl" : "ltr"}>
              <thead className="text-slate-500">
                <tr>{(isAr ? ["التاريخ", "الشركة", "الإجراء", "تغيير التوصية", "السعر المستهدف"] : ["Date", "Firm", "Action", "Rating change", "Target"]).map((label) => <th key={label} className="border-b border-slate-100 px-2 py-2 font-semibold dark:border-slate-800">{label}</th>)}</tr>
              </thead>
              <tbody>
                {actions.slice(0, 5).map((action, index) => {
                  const color = action.action === "upgrade" ? "text-emerald-600 dark:text-emerald-400" : action.action === "downgrade" ? "text-rose-600 dark:text-rose-400" : "text-slate-500";
                  const actionLabel = action.action === "upgrade" ? (isAr ? "ترقية" : "Upgrade") : action.action === "downgrade" ? (isAr ? "خفض" : "Downgrade") : (isAr ? "بدء تغطية" : "Initiate");
                  return (
                    <tr key={`${action.date}-${action.firm}-${index}`} className="text-slate-700 dark:text-slate-300">
                      <td className="whitespace-nowrap px-2 py-2.5">{action.date}</td>
                      <td className="max-w-40 truncate px-2 py-2.5 font-medium">{action.firm}</td>
                      <td className={`px-2 py-2.5 font-semibold ${color}`}>{actionLabel}</td>
                      <td className="px-2 py-2.5">{action.from || "—"}{action.from || action.to ? " → " : ""}{action.to || ""}</td>
                      <td className="whitespace-nowrap px-2 py-2.5">{formatCurrency(action.target, currency)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">{isAr ? "لا توجد تغييرات حديثة متاحة." : "No recent rating actions available."}</p>
        )}
      </div>
    </section>
  );
}

function Estimate({ label, value, growth, isAr = false }: { label: string; value: string; growth?: number | null; isAr?: boolean }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="text-[11px] font-medium text-slate-500">{label}</div>
      <div className="mt-1 truncate text-base font-bold text-slate-900 dark:text-white">{value}</div>
      {growth != null && (
        <div className={`mt-1 text-[11px] font-semibold ${growth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          {isAr ? "النمو:" : "Growth:"} {growth > 0 ? "+" : ""}{formatNumber(growth)}%
        </div>
      )}
    </div>
  );
}
