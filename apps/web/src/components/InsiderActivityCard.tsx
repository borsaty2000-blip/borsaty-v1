'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface TransactionItem {
  date: string;
  insider_name: string;
  role: string;
  transaction_type: 'BUY' | 'SELL' | 'OPTION_EXERCISE';
  shares: number;
  price: number;
  total_value: number;
}

interface InstitutionalOwnership {
  total_pct: number;
  quarterly_change_pct: number;
  holders_count: number;
  top_holders: Array<{ name: string; shares: string; pct: number }>;
}

interface InsiderData {
  symbol: string;
  has_cluster_buy: boolean;
  cluster_info?: {
    insider_count: number;
    total_shares: number;
    total_value: number;
    window_days: number;
  };
  summary_ar: string;
  summary_en: string;
  institutional_ownership: InstitutionalOwnership;
  transactions: TransactionItem[];
}

interface InsiderActivityCardProps {
  symbol: string;
  className?: string;
}

export default function InsiderActivityCard({
  symbol,
  className = '',
}: InsiderActivityCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [data, setData] = useState<InsiderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllTxs, setShowAllTxs] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchInsider() {
      try {
        setLoading(true);
        const res = await fetch(`/api/intelligence/insider/${symbol.toUpperCase()}`);
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

    fetchInsider();
    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div className="w-48 h-5 bg-slate-100 dark:bg-slate-800 rounded-md" />
          <div className="w-24 h-6 bg-slate-100 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const inst = data.institutional_ownership;
  const txs = data.transactions || [];

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-6 ${className}`}>
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
            <Users className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'تتبع الداخليين والمؤسسات (SEC Form 4 & 13F)' : 'Insider & Institutional Tracking'}
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                SEC FILINGS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'رصد صفقات أعضاء مجالس الإدارة وحركة ملكية كبار الصناديق والمؤسسات العالمية'
                : 'Corporate insider transactions and 13F institutional ownership changes'}
            </p>
          </div>
        </div>

        {data.has_cluster_buy && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{isAr ? 'تم رصد شراء جماعي (Cluster Buy)' : 'CLUSTER BUY DETECTED'}</span>
          </span>
        )}
      </div>

      {/* 2. Cluster Buy Alert Banner (if active) */}
      {data.has_cluster_buy && (
        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
              {isAr ? 'إشارة ثقة مؤسسية قوية من الإدارة التنفيذية' : 'Strong Institutional Executive Conviction'}
            </h4>
            <p className="text-xs text-emerald-800/90 dark:text-emerald-200/90 leading-relaxed mt-0.5 font-normal">
              {isAr ? data.summary_ar : data.summary_en}
            </p>
          </div>
        </div>
      )}

      {/* 3. 13F Institutional Ownership Overview */}
      {inst && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'ملكية المؤسسات الإجمالية' : 'Total Institutional Ownership'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {inst.total_pct.toFixed(1)}%
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'التغير الربع سنوي في الملكية' : 'Quarterly Position Change'}
            </span>
            <span
              className={`text-xl font-black font-mono tabular-nums ${
                inst.quarterly_change_pct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {inst.quarterly_change_pct >= 0 ? `+${inst.quarterly_change_pct.toFixed(1)}%` : `${inst.quarterly_change_pct.toFixed(1)}%`}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              {isAr ? 'عدد الصناديق والمؤسسات' : 'Institutional Holders'}
            </span>
            <span className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {inst.holders_count.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* 4. Recent Insider Transactions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{isAr ? 'أحدث صفقات الداخليين والمطلعين' : 'RECENT INSIDER TRANSACTIONS'}</span>
          </h4>
          <span className="text-[11px] font-mono text-slate-400">
            {txs.length} {isAr ? 'صفقات' : 'Records'}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'المطلع / الداخلي' : 'Insider Name'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'المنصب / الصفة' : 'Role'}</th>
                <th className="py-2.5 px-3 text-start">{isAr ? 'نوع الصفقة' : 'Type'}</th>
                <th className="py-2.5 px-3 text-end">{isAr ? 'عدد الأسهم' : 'Shares'}</th>
                <th className="py-2.5 px-3 text-end">{isAr ? 'القيمة الإجمالية' : 'Total Value'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-slate-800 dark:text-slate-200">
              {txs.slice(0, showAllTxs ? txs.length : 4).map((tx, idx) => {
                const isBuy = tx.transaction_type === 'BUY';
                const isSell = tx.transaction_type === 'SELL';

                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 text-slate-500 text-[11px] tabular-nums whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-sans">
                      {tx.insider_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                      {tx.role}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isBuy ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {isAr ? 'شراء' : 'BUY'}
                        </span>
                      ) : isSell ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {isAr ? 'بيع' : 'SELL'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {isAr ? 'خيارات' : 'EXERCISE'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono tabular-nums">
                      {tx.shares.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-end font-mono font-bold tabular-nums">
                      {tx.total_value.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {txs.length > 4 && (
          <div className="pt-1 text-center">
            <button
              onClick={() => setShowAllTxs((prev) => !prev)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{showAllTxs ? (isAr ? 'عرض أقل' : 'Show Less') : (isAr ? 'عرض كافة الصفقات' : 'View All Transactions')}</span>
              {showAllTxs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
