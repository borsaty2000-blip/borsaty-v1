import { Metadata } from 'next';
import PortfolioDashboard from '@/components/portfolio/PortfolioDashboard';

export const metadata: Metadata = {
  title: 'Portfolio Terminal | Borsaty — محفظة الأوراق المالية',
  description: 'Track real-time stock holdings, cost basis, unrealized P&L, sector allocation, and transaction logs on Borsaty.',
};

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}
