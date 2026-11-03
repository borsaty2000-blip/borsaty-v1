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
  Legend,
} from 'recharts';
import {
  ShieldAlert,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  TrendingUp,
  TrendingDown,
  Building2,
  UserCheck,
  Award,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface InsiderTransaction {
  date: string;
  insider: string;
  role: string;
  type: 'BUY' | 'SELL' | 'OTHER';
  shares: number;
  price: number;
  value: number;
  is_open_market: boolean;
}

interface TrackRecordItem {
  insider: string;
  hit_rate: number;
  avg_return: number;
  trades: number;
}

interface ClusterInfo {
  type: 'CLUSTER_BUY' | 'CLUSTER_SELL';
  count: number;
  total_value: number;
  insiders: string[];
  date_range: string;
  insider_track_records?: TrackRecordItem[];
}

interface InstitutionalHolding {
  institution: string;
  shares: number;
  value: number;
  percent_of_company: number;
  change_pct: number;
}

interface InsiderData {
  symbol: string;
  as_of?: string;
  available?: boolean;
  reason?: string;
  message_ar?: string;
  message_en?: string;
  insider_transactions?: InsiderTransaction[];
  clusters?: ClusterInfo[];
  insider_summary?: {
    total_buys_90d: number;
    total_sells_90d: number;
    total_buy_value?: number;
    total_sell_value?: number;
    net_flow: string;
    cluster_buy_detected: boolean;
    cluster_sell_detected: boolean;
  };
  institutional_holdings?: InstitutionalHolding[];
  institutional_summary?: {
    total_holders: number;
    top_10_concentration_pct: number;
    notable_changes: Array<{ institution: string; change: string }>;
  };
  data_quality?: {
    source: string;
    fetched_at: string;
    available: boolean;
  };
}

interface HistoricalMonthlyFlow {
  month: string;
  buy_value_m: number;
  sell_value_m: number;
}

interface InsiderCardProps {
  symbol: string;
}

export default function InsiderCard({ symbol }: InsiderCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [data, setData] = useState<InsiderData | null>(null);
  const [history, setHistory] = useState<HistoricalMonthlyFlow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAllTransactions, setShowAllTransactions] = useState<boolean>(false);
  const [showClusterDetails, setShowClusterDetails] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        setLoading(true);
        const [resMain, resHist] = await Promise.allSettled([
          fetch(`/api/intelligence/insider/${symbol.toUpperCase()}`),
          fetch(`/api/intelligence/insider/${symbol.toUpperCase()}/history?days=365`),
        ]);

        if (resMain.status === 'fulfilled' && resMain.value.ok) {
          const json = await resMain.value.json();
          if (isMounted) setData(json);
        }

        if (resHist.status === 'fulfilled' && resHist.value.ok) {
          const histJson = await resHist.value.json();
          if (isMounted && Array.isArray(histJson.history)) {
            setHistory(histJson.history);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load insider intelligence:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (symbol) fetchData();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-slate-900 dark:text-white" />
          <span className="text-xs font-semibold">
            {isAr ? 'جاري فحص إفصاحات هيئة الأوراق المالية (SEC Form 4 & 13F)...' : 'Scanning SEC EDGAR insider filings...'}
          </span>
        </div>
      </div>
    );
  }

  // Graceful degradation when not available (e.g. MENA stocks)
  const isAvailable = data?.available ?? (data?.data_quality?.available ?? false);
  if (!data || !isAvailable) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'حركة المطلعين والمؤسسات' : 'Smart Money & Insider Radar'}
            </h2>
            <p className="text-xs text-slate-500">
              {symbol.toUpperCase()} · {isAr ? 'بيانات السوق الرسمية' : 'Regulatory Tracking'}
            </p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isAr
                  ? `تتبع المطلعين غير متاح لـ ${symbol.toUpperCase()}`
                  : `Insider tracking not available for ${symbol.toUpperCase()}`}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {isAr
                  ? 'رادار المطلعين وحركات كبار الملاك متاح حالياً للأسهم المدرجة في الأسواق الأمريكية بموجب إفصاحات SEC Form 4 و13F. بالنسبة للأسهم الإقليمية (مصر والخليج)، تُنشر إفصاحات تعاملات الداخليين والقوائم الدورية عبر موقع البورصة الرسمي.'
                  : 'Insider transactions and institutional holding radar are currently supported for US-listed equities via mandatory SEC Form 4 and 13F regulatory disclosures. MENA equities disclose insider trades directly through regional exchange portals.'}
              </p>
            </div>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <a
              href="https://www.sec.gov/edgar/searchedgar/companysearch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-xs font-bold transition-all"
            >
              <span>{isAr ? 'بوابة هيئة الأوراق المالية SEC EDGAR' : 'Explore SEC EDGAR Database'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const transactions = data.insider_transactions || [];
  const clusters = data.clusters || [];
  const summary = data.insider_summary;
  const holdings = data.institutional_holdings || [];
  const instSummary = data.institutional_summary;

  const clusterBuy = clusters.find((c) => c.type === 'CLUSTER_BUY');
  const clusterSell = clusters.find((c) => c.type === 'CLUSTER_SELL');

  const displayedTransactions = showAllTransactions ? transactions : transactions.slice(0, 10);

  const netFlowPositive = (summary?.net_flow || '').startsWith('+');

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {isAr ? 'حركة المطلعين ورادار المؤسسات' : 'Smart Money & Insider Radar'}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
                SEC EDGAR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {symbol.toUpperCase()} · {isAr ? 'آخر 90 يوماً' : 'Last 90 days'} · {data.as_of || '2026-11'}
            </p>
          </div>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          Source: SEC Form 4 & 13F
        </div>
      </div>

      {/* Section 1 — Cluster Alert Banner */}
      {clusterBuy ? (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                {isAr
                  ? `🔥 تم رصد شراء جماعي: ${clusterBuy.count} تنفيذيين اشتروا بقيمة $${(clusterBuy.total_value / 1e6).toFixed(1)}M خلال 30 يوماً`
                  : `🔥 Cluster Buy Alert: ${clusterBuy.count} distinct insiders bought $${(clusterBuy.total_value / 1e6).toFixed(1)}M in last 30 days`}
              </div>
              <p className="text-xs text-emerald-700/90 dark:text-emerald-400 mt-0.5">
                {clusterBuy.date_range} · {isAr ? 'إشارة ثقة استثمارية مؤسسية قوية' : 'Strong executive conviction signal'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowClusterDetails(!showClusterDetails)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer"
          >
            {showClusterDetails ? (isAr ? 'إخفاء التفاصيل' : 'Hide Details') : (isAr ? 'عرض التفاصيل ←' : 'View Details →')}
          </button>
        </div>
      ) : clusterSell ? (
        <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
          <div>
            <div className="text-sm font-black text-rose-800 dark:text-rose-300">
              {isAr
                ? `⚠️ بيع جماعي مكثف: ${clusterSell.count} تنفيذيين باعوا بقيمة $${(clusterSell.total_value / 1e6).toFixed(1)}M خلال 30 يوماً`
                : `⚠️ Cluster Sell Alert: ${clusterSell.count} insiders sold $${(clusterSell.total_value / 1e6).toFixed(1)}M in last 30 days`}
            </div>
            <p className="text-xs text-rose-700/90 dark:text-rose-400">
              {clusterSell.date_range}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-500">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {isAr
              ? 'لا يوجد نشاط شراء أو بيع جماعي غير اعتيادي مرصود خلال آخر 30 يوماً.'
              : 'No significant cluster insider activity detected in the last 30 days.'}
          </span>
        </div>
      )}

      {/* Cluster Details Drawer (Section 5 — Insider Track Record) */}
      <AnimatePresence>
        {showClusterDetails && clusterBuy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{isAr ? 'سجل نجاح التنفيذيين المشترين (Track Record)' : 'Buyer Historical Track Record'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(clusterBuy.insider_track_records || []).map((rec, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{rec.insider}</span>
                    <span className="font-mono text-emerald-500 font-black">
                      {Math.round(rec.hit_rate * 100)}% Hit Rate
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isAr
                      ? `متوسط عائد +${Math.round(rec.avg_return * 100)}% على مدار آخر ${rec.trades} صفقات خلال 3 سنوات.`
                      : `Avg +${Math.round(rec.avg_return * 100)}% return across last ${rec.trades} purchases (3-year horizon).`}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 2 — Insider Summary (3 mini-cards) */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'إجمالي الشراء (90 يوماً)' : 'Total Buys (90d)'}
            </span>
            <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {summary.total_buys_90d} {isAr ? 'صفقات' : 'trades'}
            </div>
            <div className="text-xs font-mono text-emerald-500 font-bold">
              ${((summary.total_buy_value || 0) / 1e6).toFixed(1)}M
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'إجمالي البيع (90 يوماً)' : 'Total Sells (90d)'}
            </span>
            <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {summary.total_sells_90d} {isAr ? 'صفقات' : 'trades'}
            </div>
            <div className="text-xs font-mono text-rose-500 font-bold">
              ${((summary.total_sell_value || 0) / 1e6).toFixed(1)}M
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
              {isAr ? 'صافي تدفق المطلعين (Net Flow)' : 'Net Insider Flow'}
            </span>
            <div className={`text-xl md:text-2xl font-black font-mono ${netFlowPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {summary.net_flow}
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              {netFlowPositive ? (isAr ? 'صافي شراء إيجابي' : 'Net Inflow') : (isAr ? 'صافي بيع تنفيذي' : 'Net Outflow')}
            </div>
          </div>
        </div>
      )}

      {/* Section 6 — Historical Chart (12 Months) */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {isAr ? 'تدفقات المطلعين الشهرية (12 شهراً)' : '12-Month Insider Flow (Buys vs Sells)'}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {isAr ? 'بالمليون دولار ($M)' : 'in $ Millions'}
            </span>
          </div>

          <div className="h-48 w-full p-2 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={history} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}M`} />
                <Tooltip
                  formatter={(val, name) => [`$${val ?? 0}M`, name === 'buy_value_m' ? (isAr ? 'شراء' : 'Buy') : (isAr ? 'بيع' : 'Sell')]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                />
                <Legend
                  formatter={(value) => (value === 'buy_value_m' ? (isAr ? 'قيمة الشراء' : 'Insider Buys') : (isAr ? 'قيمة البيع' : 'Insider Sells'))}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                />
                <Bar dataKey="buy_value_m" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="sell_value_m" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Section 3 — Recent Transactions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
            {isAr ? 'أحدث صفقات المطلعين (SEC Form 4)' : 'Recent Insider Transactions (Form 4)'}
          </h3>
          {transactions.length > 10 && (
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              {showAllTransactions ? (isAr ? 'عرض أقل' : 'Show less') : (isAr ? 'عرض الكل' : 'Show all')}
            </button>
          )}
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs text-left rtl:text-right">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="py-3 px-4 font-bold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 font-bold">{isAr ? 'المطلع' : 'Insider'}</th>
                <th className="py-3 px-4 font-bold">{isAr ? 'المنصب' : 'Role'}</th>
                <th className="py-3 px-4 font-bold text-center">{isAr ? 'النوع' : 'Type'}</th>
                <th className="py-3 px-4 font-bold text-right rtl:text-left">{isAr ? 'الأسهم' : 'Shares'}</th>
                <th className="py-3 px-4 font-bold text-right rtl:text-left">{isAr ? 'القيمة الإجمالية' : 'Total Value'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedTransactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500">{tx.date}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{tx.insider}</td>
                  <td className="py-3 px-4 text-slate-500">{tx.role}</td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        tx.type === 'BUY'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : tx.type === 'SELL'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-right rtl:text-left text-slate-700 dark:text-slate-300">
                    {tx.shares.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-right rtl:text-left text-slate-900 dark:text-white">
                    ${tx.value.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4 — Institutional Holdings (Top 10 from 13F) */}
      {holdings.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              {isAr ? 'أكبر 10 مؤسسات وصناديق مالكة (SEC 13F)' : 'Top 10 Institutional Holders (13F)'}
            </h3>
            {instSummary && (
              <span className="text-[11px] font-mono text-slate-400">
                {isAr ? `إجمالي المؤسسات: ${instSummary.total_holders.toLocaleString()}` : `Total Holders: ${instSummary.total_holders.toLocaleString()}`}
              </span>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-bold">#</th>
                  <th className="py-3 px-4 font-bold">{isAr ? 'المؤسسة' : 'Institution'}</th>
                  <th className="py-3 px-4 font-bold text-right rtl:text-left">{isAr ? 'الأسهم المملوكة' : 'Shares Held'}</th>
                  <th className="py-3 px-4 font-bold text-right rtl:text-left">{isAr ? 'نسبة الملكية' : '% Owned'}</th>
                  <th className="py-3 px-4 font-bold text-right rtl:text-left">{isAr ? 'التغير الربع سنوي' : 'QoQ Change'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {holdings.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{h.institution}</td>
                    <td className="py-3 px-4 font-mono text-right rtl:text-left text-slate-700 dark:text-slate-300">
                      {h.shares.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right rtl:text-left text-slate-900 dark:text-white">
                      {h.percent_of_company}%
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right rtl:text-left">
                      <span className={h.change_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {h.change_pct >= 0 ? '+' : ''}{h.change_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {instSummary && (
            <div className="text-[11px] font-mono text-slate-500 text-right rtl:text-left pt-1">
              {isAr
                ? `نسبة تركز أكبر 10 مؤسسات: ${instSummary.top_10_concentration_pct}% من إجمالي أسهم الشركة.`
                : `Top 10 institutional concentration: ${instSummary.top_10_concentration_pct}% of total float.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
