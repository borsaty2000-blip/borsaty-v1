'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  DollarSign,
  PieChart as PieIcon,
  BarChart2,
  Clock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Compass,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import AddTransactionModal from './AddTransactionModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

interface Holding {
  symbol: string;
  nameEn: string;
  nameAr: string;
  sector: string;
  currency: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPct: number;
  allocationPct: number;
}

interface SectorAllocation {
  name: string;
  value: number;
  percentage: number;
}

interface Transaction {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: string;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalReturnPct: number;
  positionsCount: number;
  transactionsCount: number;
}

const PALETTE = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#14b8a6', '#6366f1'];

export default function PortfolioDashboard() {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    totalCost: 0,
    totalProfitLoss: 0,
    totalReturnPct: 0,
    positionsCount: 0,
    transactionsCount: 0,
  });
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setHoldings(data.holdings || []);
        setSectorAllocation(data.sectorAllocation || []);
        setTransactions(data.transactions || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleDeleteTransaction = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await fetch(`/api/portfolio/transaction/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchPortfolio();
        toast.success(isAr ? 'تم حذف العملية وتحديث المحفظة بنجاح' : 'Transaction deleted and portfolio recalculated');
      }
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const isProfitable = summary.totalProfitLoss >= 0;

  // Chart data for Holdings Market Value vs Cost
  const assetBarData = holdings.map((h) => ({
    symbol: h.symbol,
    MarketValue: Math.round(h.marketValue),
    CostBasis: Math.round(h.totalCost),
  }));

  // Portfolio X-Ray Radar Diversification Data (Spider Chart)
  const CORE_RADAR_SECTORS = [
    { key: 'finance', labelEn: 'Financials', labelAr: 'البنوك والمالية' },
    { key: 'tech', labelEn: 'Technology', labelAr: 'التكنولوجيا' },
    { key: 'energy', labelEn: 'Energy', labelAr: 'الطاقة' },
    { key: 'estate', labelEn: 'Real Estate', labelAr: 'العقارات' },
    { key: 'materials', labelEn: 'Materials', labelAr: 'المعادن' },
    { key: 'consumer', labelEn: 'Consumer', labelAr: 'الاستهلاك' },
  ];

  const radarData = CORE_RADAR_SECTORS.map((sec) => {
    const match = sectorAllocation.find((s) => s.name.toLowerCase().includes(sec.key));
    return {
      sector: isAr ? sec.labelAr : sec.labelEn,
      exposure: match ? Math.round(match.percentage) : 0,
      target: 20,
    };
  });

  // Calculate Risk Score: 0 to 100
  const maxSectorWeight = sectorAllocation.length > 0
    ? Math.max(...sectorAllocation.map((s) => s.percentage))
    : 0;
  const positionCount = holdings.length;

  let riskScore = 0;
  if (positionCount === 1) {
    riskScore = 85;
  } else if (positionCount === 2) {
    riskScore = 68;
  } else if (positionCount >= 3) {
    riskScore = Math.min(92, Math.max(22, Math.round(maxSectorWeight * 0.65 + (5 - Math.min(positionCount, 5)) * 5)));
  }

  const riskLabelEn =
    riskScore === 0 ? 'No Active Assets' : riskScore > 70 ? 'High Concentration Risk' : riskScore > 40 ? 'Moderate Balanced Risk' : 'Low Diversified Risk';
  const riskLabelAr =
    riskScore === 0 ? 'لا توجد أصول نشطة' : riskScore > 70 ? 'مخاطرة تركيز مرتفعة' : riskScore > 40 ? 'مخاطرة متوازنة معتدلة' : 'مخاطرة منخفضة منوّعة';
  const riskColor =
    riskScore === 0 ? 'text-slate-400 bg-slate-500/10 border-slate-500/20' : riskScore > 70 ? 'text-rose-500 bg-rose-500/10 border-rose-500/20' : riskScore > 40 ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'محفظة الأوراق المالية' : 'Institutional Portfolio Terminal'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تحليل شامل ومباشر لصافي القيمة، الأرباح والخسائر، وتوزيع السيولة حسب القطاعات.'
                : 'Real-time mark-to-market performance, cost basis tracking, and sector exposure.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPortfolio()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-black hover:bg-slate-900 text-white text-xs font-black shadow-sm border border-slate-800 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة صفقة جديدة' : 'Add Transaction'}</span>
          </button>
        </div>
      </div>

      {/* 1. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-xs font-bold text-slate-500 mb-1">
            {isAr ? 'القيمة الإجمالية للمحفظة' : 'Total Portfolio Value'}
          </div>
          <div className="text-2xl md:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            <AnimatedNumber value={summary.totalValue} prefix="$" decimals={2} />
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-2">
            {isAr ? `التكلفة الإجمالية: $${summary.totalCost.toLocaleString()}` : `Cost Basis: $${summary.totalCost.toLocaleString()}`}
          </div>
        </motion.div>

        {/* Total Profit / Loss */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-xs font-bold text-slate-500 mb-1">
            {isAr ? 'إجمالي الربح / الخسارة' : 'Total Unrealized P&L'}
          </div>
          <div
            className={`text-2xl md:text-3xl font-black tabular-nums flex items-center gap-1.5 ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isProfitable ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
            <span>
              {isProfitable ? '+' : ''}
              <AnimatedNumber value={summary.totalProfitLoss} prefix="$" decimals={2} />
            </span>
          </div>
          <div className="text-[11px] font-bold text-slate-400 mt-2">
            {isProfitable ? 'Unrealized Profit' : 'Unrealized Loss'}
          </div>
        </motion.div>

        {/* Total Return % */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-xs font-bold text-slate-500 mb-1">
            {isAr ? 'نسبة العائد الإجمالي' : 'Total Return'}
          </div>
          <div
            className={`text-2xl md:text-3xl font-black tabular-nums ${
              isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isProfitable ? '+' : ''}
            <AnimatedNumber value={summary.totalReturnPct} decimals={2} suffix="%" />
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-2">
            {isAr ? 'عائد مرجح زمني' : 'Money-weighted yield'}
          </div>
        </motion.div>

        {/* Positions & Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-xs font-bold text-slate-500 mb-1">
            {isAr ? 'الأصول والصفقات' : 'Positions & Activity'}
          </div>
          <div className="text-2xl md:text-3xl font-black tabular-nums text-slate-900 dark:text-white">
            {summary.positionsCount}
            <span className="text-sm font-medium text-slate-400 ms-2">
              {isAr ? 'سهم نشط' : 'Assets'}
            </span>
          </div>
          <div className="text-[11px] font-semibold text-slate-400 mt-2">
            {summary.transactionsCount} {isAr ? 'صفقة مسجلة' : 'Recorded Transactions'}
          </div>
        </motion.div>
      </div>

      {/* 2. Middle Row: Visual X-Ray Charts (Grid 3 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Allocation Pie Chart */}
        <ErrorBoundary fallbackTitleEn="Allocation Chart Error" fallbackTitleAr="تعذر عرض رسم التوزيع">
          <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'التوزيع القطاعي للمحفظة' : 'Sector Breakdown'}</span>
            </h3>

            {sectorAllocation.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => {
                        const num = Number(val);
                        return [`$${num.toLocaleString()}`, isAr ? 'القيمة' : 'Value'];
                      }}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[11px] font-bold text-slate-500">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-2">
                <PieIcon className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                <span>{isAr ? 'لا توجد أصول لعرض التوزيع' : 'No assets to display'}</span>
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* Portfolio X-Ray: Diversification Spider / Radar Chart */}
        <ErrorBoundary fallbackTitleEn="Portfolio X-Ray Error" fallbackTitleAr="تعذر عرض الرادار الفني للمحفظة">
          <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-slate-900 dark:text-white" />
                <span>{isAr ? 'أشعة إكس وتنويع المحفظة' : 'Portfolio X-Ray (Spider)'}</span>
              </h3>

              {/* Dynamic Risk Score Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${riskColor}`}>
                {riskScore > 0 ? `${riskScore}/100 ` : ''}{isAr ? riskLabelAr : riskLabelEn}
              </span>
            </div>

            {holdings.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius={70} data={radarData}>
                    <PolarGrid stroke="#334155" opacity={0.3} />
                    <PolarAngleAxis dataKey="sector" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={9} />
                    <Radar name={isAr ? 'التعرض الحالي %' : 'Actual Weight %'} dataKey="exposure" stroke="#1e40af" fill="#1e40af" fillOpacity={0.4} />
                    <Radar name={isAr ? 'الوزن المثالي %' : 'Benchmark %'} dataKey="target" stroke="#64748b" fill="#64748b" fillOpacity={0.15} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val) => [`${val}%`]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-2">
                <Compass className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                <span>{isAr ? 'سجل صفقات لتفعيل فحص الأشعة X-Ray' : 'Record trades to activate X-Ray analysis'}</span>
              </div>
            )}
          </div>
        </ErrorBoundary>

        {/* Asset Value vs Cost Bar Chart */}
        <ErrorBoundary fallbackTitleEn="Asset Chart Error" fallbackTitleAr="تعذر عرض رسم الأصول">
          <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-cyan-600" />
              <span>{isAr ? 'القيمة مقابل التكلفة' : 'Value vs Cost Basis'}</span>
            </h3>

            {assetBarData.length > 0 ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assetBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="symbol" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val) => {
                        const num = Number(val);
                        return [`$${num.toLocaleString()}`];
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(val) => <span className="text-[11px] font-bold text-slate-500">{val}</span>}
                    />
                    <Bar dataKey="MarketValue" fill="#10b981" radius={[4, 4, 0, 0]} name={isAr ? 'القيمة' : 'Market Value'} />
                    <Bar dataKey="CostBasis" fill="#64748b" radius={[4, 4, 0, 0]} name={isAr ? 'التكلفة' : 'Cost Basis'} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold gap-2">
                <BarChart2 className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                <span>{isAr ? 'لا توجد بيانات صفقات كافية' : 'No transactions recorded'}</span>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>

      {/* 3. Active Holdings Table */}
      <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'الأصول والمراكز النشطة' : 'ACTIVE PORTFOLIO HOLDINGS'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">{holdings.length} {isAr ? 'مراكز' : 'Positions'}</span>
        </div>

        {holdings.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-start">{isAr ? 'الأصل' : 'Asset'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'متوسط الشراء' : 'Avg Cost'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'السعر الحالي' : 'Live Price'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'القيمة السوقية' : 'Market Value'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الربح / الخسارة' : 'Unrealized P&L'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الوزن %' : 'Weight'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {holdings.map((h) => {
                  const gain = h.profitLoss >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 text-start">
                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                          {h.symbol}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {isAr ? h.nameAr : h.nameEn} • {h.sector}
                        </div>
                      </td>
                      <td className="py-3 text-end tabular-nums font-bold text-slate-700 dark:text-slate-300">
                        {h.quantity.toLocaleString()}
                      </td>
                      <td className="py-3 text-end tabular-nums text-slate-500">
                        ${h.avgBuyPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-end tabular-nums font-bold text-slate-900 dark:text-white">
                        ${h.currentPrice.toFixed(2)}
                      </td>
                      <td className="py-3 text-end tabular-nums font-extrabold text-slate-900 dark:text-white">
                        ${h.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-3 text-end tabular-nums font-extrabold ${gain ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        <div>{gain ? '+' : ''}${h.profitLoss.toFixed(2)}</div>
                        <div className="text-[10px]">{gain ? '+' : ''}{h.profitLossPct.toFixed(2)}%</div>
                      </td>
                      <td className="py-3 text-end tabular-nums font-bold text-slate-500">
                        {h.allocationPct.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
              <Briefcase className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              {isAr ? 'لا توجد مراكز نشطة' : 'No active holdings'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
              {isAr
                ? 'لا توجد مراكز نشطة. سجّل صفقتك الأولى لتتبع أداء المحفظة وتوزيع المخاطر وتطور القيمة السوقية.'
                : 'No active holdings. Record your first transaction to track portfolio performance and exposure.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-sm border border-slate-800 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة صفقة الآن' : 'Add First Transaction'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Transaction History Table */}
      <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{isAr ? 'سجل العمليات والصفقات' : 'TRANSACTION HISTORY'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">{transactions.length} {isAr ? 'عمليات' : 'Records'}</span>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'السهم' : 'Symbol'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'النوع' : 'Type'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'السعر' : 'Price'}</th>
                  <th className="py-3 px-3 text-end font-mono">{isAr ? 'الإجمالي' : 'Total'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'حذف' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                {transactions.map((t) => {
                  const isBuy = t.type === 'BUY';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 text-start text-slate-500 font-mono text-[11px]">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-start font-black text-slate-900 dark:text-white">
                        {t.symbol}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                            isBuy
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          }`}
                        >
                          {isBuy ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          <span>{t.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 text-end tabular-nums font-bold text-slate-700 dark:text-slate-300">
                        {t.quantity.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-end tabular-nums font-bold text-slate-500">
                        ${t.price.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-end tabular-nums font-black text-slate-900 dark:text-white">
                        ${(t.quantity * t.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(t.id)}
                          disabled={deletingId === t.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            {isAr ? 'لا توجد صفقات مسجلة بعد' : 'No recorded transactions yet.'}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchPortfolio()}
      />
    </div>
  );
}
