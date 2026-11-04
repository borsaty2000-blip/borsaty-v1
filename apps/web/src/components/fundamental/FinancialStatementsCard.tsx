'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Layers,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowUpDown,
  BarChart3,
  Scale,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  ValidatedFinancialsResponse,
  IncomeStatementItem,
  BalanceSheetItem,
  CashFlowItem,
  FinancialRatios,
} from '@/lib/schemas';

interface FinancialStatementsCardProps {
  symbol: string;
  currency?: string;
  className?: string;
}

type StatementTab = 'income' | 'balance' | 'cashflow' | 'ratios';
type PeriodType = 'annual' | 'quarterly';

function formatVal(val: number | null | undefined, isCurrency = false, isPercent = false): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  if (isPercent) {
    return `${(val * 100).toFixed(2)}%`;
  }
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(2)}K`;
  return `${sign}${abs.toFixed(2)}`;
}

export default function FinancialStatementsCard({
  symbol,
  currency = 'USD',
  className = '',
}: FinancialStatementsCardProps) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const sym = symbol.toUpperCase().trim();

  const [activeTab, setActiveTab] = useState<StatementTab>('income');
  const [period, setPeriod] = useState<PeriodType>('annual');
  const [data, setData] = useState<ValidatedFinancialsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchFinancials() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/fundamental/financials/${sym}?period=${period}&years=3`);
        if (!res.ok) {
          throw new Error(`Failed to load financials for ${sym}`);
        }
        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error loading financial statements');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchFinancials();
    return () => {
      isMounted = false;
    };
  }, [sym, period]);

  // Loading Skeleton
  if (loading) {
    return (
      <div className={`p-6 rounded-2xl bg-white dark:bg-[#0c0d0e] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 animate-pulse ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-100 dark:bg-slate-900/60 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const isAvailable = data?.data_quality?.is_available && (
    (data.income_statement && data.income_statement.length > 0) ||
    (data.balance_sheet && data.balance_sheet.length > 0) ||
    (data.cash_flow && data.cash_flow.length > 0)
  );

  // Empty / Not Available State
  if (!isAvailable || error) {
    return (
      <div className={`p-8 rounded-2xl bg-white dark:bg-[#0c0d0e] border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-4 ${className}`}>
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-500 dark:text-slate-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {isAr ? 'البيانات المالية غير متوفرة لهذا السهم' : 'Financial data not available for this stock'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {isAr
              ? `لم تتوفر إفصاحات القوائم المالية الرسمية لسهم ${sym}. نقوم بتحديث البيانات فور صدور التقارير الربع سنوية والسنوية من هيئات الأسواق المالية.`
              : `Official SEC / EGX / CMA financial statements are currently unavailable for ${sym}. Data updates automatically upon regulatory filings.`}
          </p>
        </div>
      </div>
    );
  }

  const income = data?.income_statement || [];
  const balance = data?.balance_sheet || [];
  const cashflow = data?.cash_flow || [];
  const ratios = data?.ratios || {};

  // Extract column headers (e.g. Years "2025", "2024", "2023")
  const years = (
    activeTab === 'income' ? income :
    activeTab === 'balance' ? balance :
    cashflow
  ).map((item) => item.year);

  return (
    <div className={`p-6 rounded-2xl bg-white dark:bg-[#0c0d0e] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6 ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? 'القوائم المالية والنسب الأساسية' : 'Financial Statements & Ratios'}</span>
              <span className="text-[11px] px-2 py-0.5 rounded font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {sym}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'إفصاحات مدققة لآخر 3 فترات مع 20 نسبة مالية مؤسسية' : 'Audited multi-year filings with 20 fundamental ratios'}
            </p>
          </div>
        </div>

        {/* Period Selector (Annual / Quarterly) */}
        <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start md:self-center">
          <button
            onClick={() => setPeriod('annual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === 'annual'
                ? 'bg-white dark:bg-[#1a202c] text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'سنوي (3 سنوات)' : 'Annual (3Y)'}
          </button>
          <button
            onClick={() => setPeriod('quarterly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === 'quarterly'
                ? 'bg-white dark:bg-[#1a202c] text-slate-900 dark:text-white shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isAr ? 'ربع سنوي (آخر 4 فصول)' : 'Quarterly (4Q)'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800/80">
        {[
          { id: 'income', labelAr: 'قائمة الدخل', labelEn: 'Income Statement', icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'balance', labelAr: 'الميزانية العمومية', labelEn: 'Balance Sheet', icon: <Scale className="w-3.5 h-3.5" /> },
          { id: 'cashflow', labelAr: 'التدفقات النقدية', labelEn: 'Cash Flow', icon: <Activity className="w-3.5 h-3.5" /> },
          { id: 'ratios', labelAr: 'النسب المالية (20)', labelEn: 'Financial Ratios (20)', icon: <BarChart3 className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as StatementTab)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {tab.icon}
            <span>{isAr ? tab.labelAr : tab.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Income Statement Table */}
      {activeTab === 'income' && (
        <StatementTable
          years={years}
          currency={currency}
          isAr={isAr}
          rows={[
            {
              id: 'revenue',
              nameAr: 'الإيرادات الإجمالية',
              nameEn: 'Total Revenue',
              isHeader: true,
              values: income.map((i) => i.revenue),
            },
            {
              id: 'cogs',
              nameAr: 'تكلفة المبيعات / الإيرادات',
              nameEn: 'Cost of Goods Sold (COGS)',
              values: income.map((i) => i.cogs),
            },
            {
              id: 'gross_profit',
              nameAr: 'إجمالي الربح',
              nameEn: 'Gross Profit',
              values: income.map((i) => i.gross_profit),
            },
            {
              id: 'operating_income',
              nameAr: 'الدخل التشغيلي (EBIT)',
              nameEn: 'Operating Income',
              values: income.map((i) => i.operating_income),
            },
            {
              id: 'ebitda',
              nameAr: 'الأرباح قبل الفوائد والضرائب (EBITDA)',
              nameEn: 'EBITDA',
              values: income.map((i) => i.ebitda),
            },
            {
              id: 'net_income',
              nameAr: 'صافي الدخل',
              nameEn: 'Net Income',
              isHeader: true,
              values: income.map((i) => i.net_income),
            },
            {
              id: 'eps',
              nameAr: 'ربحية السهم المخففة (EPS)',
              nameEn: 'Diluted EPS',
              values: income.map((i) => i.eps),
              formatRaw: true,
            },
          ]}
        />
      )}

      {/* Tab 2: Balance Sheet Table */}
      {activeTab === 'balance' && (
        <StatementTable
          years={years}
          currency={currency}
          isAr={isAr}
          rows={[
            {
              id: 'total_assets',
              nameAr: 'إجمالي الأصول',
              nameEn: 'Total Assets',
              isHeader: true,
              values: balance.map((b) => b.total_assets),
            },
            {
              id: 'cash',
              nameAr: 'النقدية والاستثمارات قصيرة الأجل',
              nameEn: 'Cash & Short-Term Investments',
              values: balance.map((b) => b.cash),
            },
            {
              id: 'total_liabilities',
              nameAr: 'إجمالي الالتزامات',
              nameEn: 'Total Liabilities',
              isHeader: true,
              values: balance.map((b) => b.total_liabilities),
            },
            {
              id: 'total_debt',
              nameAr: 'إجمالي الديون التمويلية',
              nameEn: 'Total Debt',
              values: balance.map((b) => b.total_debt),
            },
            {
              id: 'total_equity',
              nameAr: 'حقوق المساهمين',
              nameEn: 'Stockholders’ Equity',
              isHeader: true,
              values: balance.map((b) => b.total_equity),
            },
          ]}
        />
      )}

      {/* Tab 3: Cash Flow Table */}
      {activeTab === 'cashflow' && (
        <StatementTable
          years={years}
          currency={currency}
          isAr={isAr}
          rows={[
            {
              id: 'operating_cf',
              nameAr: 'التدفقات النقدية التشغيلية',
              nameEn: 'Operating Cash Flow',
              isHeader: true,
              values: cashflow.map((c) => c.operating_cf),
            },
            {
              id: 'investing_cf',
              nameAr: 'التدفقات النقدية الاستثمارية',
              nameEn: 'Investing Cash Flow',
              values: cashflow.map((c) => c.investing_cf),
            },
            {
              id: 'financing_cf',
              nameAr: 'التدفقات النقدية التمويلية',
              nameEn: 'Financing Cash Flow',
              values: cashflow.map((c) => c.financing_cf),
            },
            {
              id: 'free_cf',
              nameAr: 'التدفق النقدي الحر (Free Cash Flow)',
              nameEn: 'Free Cash Flow',
              isHeader: true,
              values: cashflow.map((c) => c.free_cf),
            },
          ]}
        />
      )}

      {/* Tab 4: 20 Ratios Grid */}
      {activeTab === 'ratios' && (
        <RatiosGrid ratios={ratios} isAr={isAr} />
      )}

      {/* Verification footer badge */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
          <span>{isAr ? 'مصدر البيانات: الإفصاحات الرسمية المدققة' : 'Data source: Audited Regulatory Filings'}</span>
        </span>
        <span className="font-mono">{period.toUpperCase()} • {sym}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Component: Statement Table (Responsive Desktop Table + Mobile Layout)
// ─────────────────────────────────────────────────────────────────────────────

interface TableRowData {
  id: string;
  nameAr: string;
  nameEn: string;
  isHeader?: boolean;
  formatRaw?: boolean;
  values: Array<number | null | undefined>;
}

function StatementTable({
  years,
  currency,
  isAr,
  rows,
}: {
  years: string[];
  currency: string;
  isAr: boolean;
  rows: TableRowData[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-2.5 px-3 text-start">{isAr ? 'البند المالي' : 'Metric'}</th>
            {years.map((y) => (
              <th key={y} className="py-2.5 px-3 text-end font-mono">
                {y}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors ${
                row.isHeader ? 'font-bold bg-slate-50/50 dark:bg-slate-900/20' : ''
              }`}
            >
              <td className="py-3 px-3 text-start text-slate-800 dark:text-slate-200">
                {isAr ? row.nameAr : row.nameEn}
              </td>
              {row.values.map((val, idx) => {
                const isNeg = typeof val === 'number' && val < 0;
                const formatted = row.formatRaw && typeof val === 'number'
                  ? val.toFixed(2)
                  : formatVal(val);
                return (
                  <td
                    key={idx}
                    className={`py-3 px-3 text-end font-mono tabular-nums ${
                      isNeg
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Component: 20 Institutional Ratios Grid
// ─────────────────────────────────────────────────────────────────────────────

function RatiosGrid({
  ratios,
  isAr,
}: {
  ratios: FinancialRatios;
  isAr: boolean;
}) {
  const categories = [
    {
      titleAr: 'مؤشرات الربحية',
      titleEn: 'Profitability Ratios',
      items: [
        { key: 'gross_margin', nameAr: 'هامش الربح الإجمالي', nameEn: 'Gross Margin', isPercent: true },
        { key: 'operating_margin', nameAr: 'هامش التشغيل', nameEn: 'Operating Margin', isPercent: true },
        { key: 'net_margin', nameAr: 'هامش صافي الربح', nameEn: 'Net Profit Margin', isPercent: true },
        { key: 'roe', nameAr: 'العائد على حقوق المساهمين', nameEn: 'Return on Equity (ROE)', isPercent: true },
        { key: 'roa', nameAr: 'العائد على الأصول', nameEn: 'Return on Assets (ROA)', isPercent: true },
      ],
    },
    {
      titleAr: 'مؤشرات السيولة والرافعة',
      titleEn: 'Liquidity & Solvency',
      items: [
        { key: 'current_ratio', nameAr: 'نسبة التداول (السيولة)', nameEn: 'Current Ratio' },
        { key: 'quick_ratio', nameAr: 'السيولة السريعة', nameEn: 'Quick Ratio' },
        { key: 'debt_to_equity', nameAr: 'الدين / حقوق الملكية', nameEn: 'Debt to Equity' },
        { key: 'debt_to_ebitda', nameAr: 'الدين / الأرباح التشغيلية', nameEn: 'Debt / EBITDA' },
        { key: 'interest_coverage', nameAr: 'تغطية الفوائد', nameEn: 'Interest Coverage' },
      ],
    },
    {
      titleAr: 'كفاءة التشغيل ودوران الأصول',
      titleEn: 'Operating Efficiency',
      items: [
        { key: 'asset_turnover', nameAr: 'معدل دوران الأصول', nameEn: 'Asset Turnover' },
        { key: 'inventory_turnover', nameAr: 'دوران المخزون', nameEn: 'Inventory Turnover' },
        { key: 'receivables_turnover', nameAr: 'دوران الذمم المدينة', nameEn: 'Receivables Turnover' },
      ],
    },
    {
      titleAr: 'مضاعفات التقييم السوقي',
      titleEn: 'Market Valuation Multiples',
      items: [
        { key: 'pe', nameAr: 'مكرر الربحية (P/E)', nameEn: 'P/E Ratio' },
        { key: 'pb', nameAr: 'السعر للقيمة الدفترية (P/B)', nameEn: 'Price to Book (P/B)' },
        { key: 'ps', nameAr: 'السعر للمبيعات (P/S)', nameEn: 'Price to Sales (P/S)' },
        { key: 'ev_ebitda', nameAr: 'قيمة المنشأة / EBITDA', nameEn: 'EV / EBITDA' },
        { key: 'peg', nameAr: 'معدل PEG (النمو)', nameEn: 'PEG Ratio' },
        { key: 'dividend_yield', nameAr: 'عائد التوزيعات', nameEn: 'Dividend Yield', isPercent: true },
        { key: 'fcf_yield', nameAr: 'عائد التدفق الحر', nameEn: 'Free Cash Flow Yield', isPercent: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {categories.map((cat, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isAr ? cat.titleAr : cat.titleEn}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {cat.items.map((item) => {
              const rawVal = (ratios as any)[item.key];
              const isAvailable = rawVal !== null && rawVal !== undefined && !isNaN(rawVal);
              const formatted = isAvailable
                ? item.isPercent
                  ? `${(rawVal * 100).toFixed(2)}%`
                  : typeof rawVal === 'number'
                  ? rawVal.toFixed(2)
                  : String(rawVal)
                : '—';

              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between gap-1.5 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {isAr ? item.nameAr : item.nameEn}
                  </span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                    {formatted}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
