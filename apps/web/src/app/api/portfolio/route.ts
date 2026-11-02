import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getTransactions, findCompany, SEED_COMPANIES } from '@borsaty/db';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getTransactions(userId);

    // Group transactions by symbol to calculate holdings
    interface HoldingAccumulator {
      symbol: string;
      nameEn: string;
      nameAr: string;
      sector: string;
      currency: string;
      quantity: number;
      totalCost: number;
    }

    const holdingsMap = new Map<string, HoldingAccumulator>();

    // Process transactions in chronological order
    const sortedTx = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const tx of sortedTx) {
      const sym = tx.symbol.toUpperCase();
      let holding = holdingsMap.get(sym);

      if (!holding) {
        const comp = await findCompany(sym);
        const seedComp = SEED_COMPANIES.find((c) => c.symbol.toUpperCase() === sym);
        holding = {
          symbol: sym,
          nameEn: comp?.nameEn || seedComp?.nameEn || sym,
          nameAr: comp?.nameAr || seedComp?.nameAr || sym,
          sector: comp?.sector || seedComp?.sector || 'Equities',
          currency: comp?.currency || seedComp?.currency || 'USD',
          quantity: 0,
          totalCost: 0,
        };
        holdingsMap.set(sym, holding);
      }

      if (tx.type === 'BUY') {
        holding.totalCost += tx.quantity * tx.price;
        holding.quantity += tx.quantity;
      } else if (tx.type === 'SELL') {
        if (holding.quantity > 0) {
          const avgCost = holding.totalCost / holding.quantity;
          holding.quantity = Math.max(0, holding.quantity - tx.quantity);
          holding.totalCost = holding.quantity * avgCost;
        }
      }
    }

    // Now calculate market value and P&L for each active holding
    let totalPortfolioValue = 0;
    let totalPortfolioCost = 0;

    const activeHoldings = [];

    for (const [, h] of holdingsMap.entries()) {
      if (h.quantity <= 0.0001) continue;

      const comp = await findCompany(h.symbol);
      const seedComp = SEED_COMPANIES.find((c) => c.symbol.toUpperCase() === h.symbol);
      const currentPrice =
        comp && 'currentPrice' in comp && typeof comp.currentPrice === 'number'
          ? comp.currentPrice
          : seedComp?.currentPrice || 100.0;

      const avgBuyPrice = h.quantity > 0 ? h.totalCost / h.quantity : 0;
      const marketValue = h.quantity * currentPrice;
      const profitLoss = marketValue - h.totalCost;
      const profitLossPct = h.totalCost > 0 ? (profitLoss / h.totalCost) * 100 : 0;

      totalPortfolioValue += marketValue;
      totalPortfolioCost += h.totalCost;

      activeHoldings.push({
        symbol: h.symbol,
        nameEn: h.nameEn,
        nameAr: h.nameAr,
        sector: h.sector,
        currency: h.currency,
        quantity: h.quantity,
        avgBuyPrice,
        currentPrice,
        marketValue,
        totalCost: h.totalCost,
        profitLoss,
        profitLossPct,
        allocationPct: 0, // computed below
      });
    }

    // Calculate allocation percentage
    activeHoldings.forEach((h) => {
      h.allocationPct = totalPortfolioValue > 0 ? (h.marketValue / totalPortfolioValue) * 100 : 0;
    });

    const totalProfitLoss = totalPortfolioValue - totalPortfolioCost;
    const totalReturnPct = totalPortfolioCost > 0 ? (totalProfitLoss / totalPortfolioCost) * 100 : 0;

    // Sector allocation breakdown for pie chart
    const sectorMap = new Map<string, number>();
    activeHoldings.forEach((h) => {
      const current = sectorMap.get(h.sector) || 0;
      sectorMap.set(h.sector, current + h.marketValue);
    });

    const sectorAllocation = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      name: sector,
      value: Math.round(value * 100) / 100,
      percentage: totalPortfolioValue > 0 ? Math.round((value / totalPortfolioValue) * 1000) / 10 : 0,
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalValue: Math.round(totalPortfolioValue * 100) / 100,
        totalCost: Math.round(totalPortfolioCost * 100) / 100,
        totalProfitLoss: Math.round(totalProfitLoss * 100) / 100,
        totalReturnPct: Math.round(totalReturnPct * 100) / 100,
        positionsCount: activeHoldings.length,
        transactionsCount: transactions.length,
      },
      holdings: activeHoldings,
      sectorAllocation,
      transactions,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to calculate portfolio';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
