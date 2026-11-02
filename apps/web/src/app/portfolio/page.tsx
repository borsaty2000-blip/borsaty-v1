import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';

const PortfolioDashboard = dynamic(
  () => import('@/components/portfolio/PortfolioDashboard'),
  {
    loading: () => (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
          <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
        </div>
        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800" />
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: 'Portfolio Terminal | Borsaty — محفظة الأوراق المالية',
  description: 'Track real-time stock holdings, cost basis, unrealized P&L, sector allocation, and transaction logs on Borsaty.',
};

export default function PortfolioPage() {
  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load Portfolio Terminal"
      fallbackTitleAr="تعذر تحميل محفظة الأوراق المالية"
    >
      <PortfolioDashboard />
    </ErrorBoundary>
  );
}
