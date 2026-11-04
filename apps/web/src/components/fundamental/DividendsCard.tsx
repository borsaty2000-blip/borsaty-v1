"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, CalendarDays, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import {
  DividendsResponseSchema,
  ValidatedDividendsResponse,
} from "@/lib/schemas";

interface DividendsCardProps {
  symbol: string;
  market: string;
  currency?: string;
  className?: string;
}

function formatNumber(value: number | null | undefined, digits = 2): string {
  return value == null || !Number.isFinite(value)
    ? "—"
    : value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function formatMoney(value: number | null | undefined, currency: string): string {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 3,
    }).format(value);
  } catch {
    return `${formatNumber(value, 3)} ${currency}`;
  }
}

function relativeDate(value: string, isAr: boolean): string {
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(isAr ? "ar" : "en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function DividendsCard({
  symbol,
  market,
  currency = "USD",
  className = "",
}: DividendsCardProps) {
  const { language } = useApp();
  const isAr = language === "ar";
  const sym = symbol.trim().toUpperCase();
  const marketCode = market.trim().toUpperCase();
  const [data, setData] = useState<ValidatedDividendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const query = new URLSearchParams({ market: marketCode });
        const response = await fetch(`/api/fundamental/dividends/${encodeURIComponent(sym)}?${query}`);
        if (!response.ok) throw new Error(`Failed to load dividend data: ${response.status}`);
        const parsed = DividendsResponseSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid dividend response");
        if (active) setData(parsed.data);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (sym && marketCode) void load();
    return () => { active = false; };
  }, [marketCode, sym]);

  const annualHistory = useMemo(() => {
    const totals = new Map<number, number>();
    for (const payment of data?.history || []) {
      const year = Number(payment.date.slice(0, 4));
      totals.set(year, (totals.get(year) || 0) + payment.amount_per_share);
    }
    return Array.from(totals.entries())
      .sort(([left], [right]) => left - right)
      .slice(-5);
  }, [data?.history]);

  if (loading) {
    return <div className={`h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900/40 ${className}`} />;
  }

  if (error || !data?.available) {
    const noHistory = !error && data?.reason === "No dividend history";
    return (
      <section className={`rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 ${className}`} dir={isAr ? "rtl" : "ltr"}>
        <Info className="mx-auto mb-3 h-6 w-6 text-slate-500" />
        <h3 className="font-bold text-slate-900 dark:text-white">
          {noHistory
            ? isAr ? "لا توجد توزيعات أرباح لهذا السهم" : "No dividend history"
            : isAr ? "بيانات التوزيعات غير متاحة مؤقتًا" : "Dividend data is temporarily unavailable"}
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {noHistory
            ? isAr
              ? "هذا السهم لا يوزع أرباحًا حاليًا أو لا تتوفر له سجلات توزيعات."
              : "This stock does not currently pay dividends, or dividend records are unavailable."
            : isAr
              ? data?.message_ar || "تعذر تحميل بيانات التوزيعات حاليًا."
              : data?.message_en || "Dividend data could not be loaded right now."}
        </p>
      </section>
    );
  }

  const currentYield = data.current_yield;
  const payout = data.payout_ratio;
  const growth = data.growth;
  const displayCurrency = data.history[0]?.currency || currency;
  const maxAnnualDividend = Math.max(0, ...annualHistory.map(([, amount]) => amount));
  const yieldClass = currentYield?.current_yield_pct != null && currentYield.current_yield_pct > 3
    ? "text-emerald-700 dark:text-emerald-400"
    : "text-slate-900 dark:text-white";

  const metrics = [
    {
      label: isAr ? "العائد الحالي" : "Current yield",
      value: currentYield?.current_yield_pct == null ? "—" : `${formatNumber(currentYield.current_yield_pct)}%`,
      className: yieldClass,
    },
    {
      label: isAr ? "نسبة التوزيع" : "Payout ratio",
      value: payout ? `${formatNumber(payout.payout_ratio_pct)}%` : "—",
      className: !payout
        ? "text-slate-900 dark:text-white"
        : payout.is_sustainable
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
    },
    {
      label: isAr ? "نمو ٥ سنوات" : "5Y growth",
      value: growth?.cagr_5y_pct == null
        ? "—"
        : `${growth.cagr_5y_pct > 0 ? "+" : ""}${formatNumber(growth.cagr_5y_pct)}%`,
      className: growth?.cagr_5y_pct == null
        ? "text-slate-900 dark:text-white"
        : growth.cagr_5y_pct >= 0
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-rose-600 dark:text-rose-400",
    },
  ];

  const frequencyLabel = currentYield?.frequency === "quarterly"
    ? isAr ? "يُدفع ربع سنويًا" : "Paid quarterly"
    : currentYield?.frequency === "semi-annual"
      ? isAr ? "يُدفع نصف سنويًا" : "Paid semi-annually"
      : isAr ? "يُدفع سنويًا" : "Paid annually";

  return (
    <section className={`space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 sm:p-6 ${className}`} dir={isAr ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-1 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isAr ? "التوزيعات والإجراءات المؤسسية" : "Dividends & corporate actions"} · {sym}
          </div>
          <h2 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
            {isAr ? "سجل التوزيعات والعائد" : "Dividend history and yield"}
          </h2>
        </div>
        <span className="text-xs text-slate-500">{frequencyLabel}</span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
            <div className="text-xs font-medium text-slate-500">{metric.label}</div>
            <div className={`mt-2 text-2xl font-black tabular-nums ${metric.className}`}>{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? "التوزيعات السنوية" : "Annual dividends"}
            </h3>
            <p className="text-xs text-slate-500">{isAr ? `لكل سهم · ${displayCurrency}` : `Per share · ${displayCurrency}`}</p>
          </div>
          {growth?.is_aristocrat && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {isAr ? "سهم أرستقراطي في التوزيعات" : "Dividend aristocrat"}
            </span>
          )}
        </div>
        {annualHistory.length > 0 ? (
          <div className="flex h-40 items-end justify-around gap-3 border-b border-slate-200 px-2 dark:border-slate-700" role="img" aria-label={isAr ? "رسم التوزيعات السنوية لكل سهم" : "Annual dividend per share chart"}>
            {annualHistory.map(([year, amount]) => (
              <div key={year} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] tabular-nums text-slate-500">{formatNumber(amount, 2)}</span>
                <div
                  className="w-full max-w-12 rounded-t-md bg-emerald-800 dark:bg-emerald-600"
                  style={{ height: `${maxAnnualDividend > 0 ? Math.max(5, amount / maxAnnualDividend * 100) : 0}%` }}
                  title={`${year}: ${formatMoney(amount, displayCurrency)}`}
                />
                <span className="pb-2 text-[10px] font-medium text-slate-500">{year}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">{isAr ? "لا يوجد سجل تاريخي كافٍ" : "No historical dividend records available"}</p>
        )}
        {growth && (
          <p className="text-xs text-slate-500">
            {isAr
              ? `سنوات زيادة متتالية: ${growth.consecutive_increase_years}`
              : `Consecutive years of increases: ${growth.consecutive_increase_years}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{isAr ? "التوزيع القادم" : "Upcoming dividend"}</h3>
          </div>
          {data.upcoming ? (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div><dt className="text-slate-500">{isAr ? "تاريخ الاستحقاق" : "Ex-date"}</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{relativeDate(data.upcoming.ex_date, isAr)}</dd></div>
              <div><dt className="text-slate-500">{isAr ? "المبلغ" : "Amount"}</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{formatMoney(data.upcoming.amount, displayCurrency)}</dd></div>
              <div><dt className="text-slate-500">{isAr ? "العائد" : "Yield"}</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{data.upcoming.yield_pct == null ? "—" : `${formatNumber(data.upcoming.yield_pct)}%`}</dd></div>
              <div><dt className="text-slate-500">{isAr ? "الأيام المتبقية" : "Days until"}</dt><dd className="mt-1 font-semibold text-slate-900 dark:text-white">{data.upcoming.days_until}</dd></div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">{isAr ? "لم يتم الإعلان عن توزيع قادم" : "No upcoming dividend announced"}</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <ArrowDownUp className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{isAr ? "تجزئة الأسهم" : "Stock splits"}</h3>
          </div>
          {data.splits.length ? (
            <div className="space-y-2">
              {data.splits.map((split) => (
                <div key={`${split.date}-${split.factor}`} className="grid grid-cols-3 gap-2 border-b border-slate-100 pb-2 text-xs last:border-0 dark:border-slate-800">
                  <span className="text-slate-500">{relativeDate(split.date, isAr)}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{split.ratio}</span>
                  <span className="text-end text-slate-500">{isAr ? "المعامل" : "Factor"} {formatNumber(split.factor, 3)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{isAr ? "لا توجد تجزئات مسجلة خلال الفترة" : "No stock splits recorded in this period"}</p>
          )}
        </div>
      </div>
    </section>
  );
}
