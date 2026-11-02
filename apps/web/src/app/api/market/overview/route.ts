import { NextResponse } from "next/server";
import { getAllCompanies } from "@borsaty/db";

export interface MarketIndex {
  symbol: string;
  nameAr: string;
  nameEn: string;
  price: number;
  change: number;
  changePct: number;
  category: "EQUITY" | "COMMODITY" | "CRYPTO" | "FOREX";
}

export interface StockMover {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: string;
  currency: string;
  price: number;
  change: number;
  changePct: number;
  decision?: string;
  confluenceScore?: number;
}

export async function GET() {
  const allStocks = await getAllCompanies();

  // Top Indices Benchmark
  const indices: MarketIndex[] = [
    { symbol: "EGX30", nameAr: "مؤشر البورصة المصرية", nameEn: "EGX 30 Index", price: 30850.4, change: 378.2, changePct: 1.24, category: "EQUITY" },
    { symbol: "TASI", nameAr: "مؤشر تاسي السعودي", nameEn: "TASI Index", price: 12150.8, change: 82.3, changePct: 0.68, category: "EQUITY" },
    { symbol: "SPX", nameAr: "مؤشر إس آند بي 500", nameEn: "S&P 500", price: 5864.2, change: 20.5, changePct: 0.35, category: "EQUITY" },
    { symbol: "XAUUSD", nameAr: "الذهب أونصة", nameEn: "Gold (Oz)", price: 2735.6, change: 14.8, changePct: 0.54, category: "COMMODITY" },
    { symbol: "BTCUSD", nameAr: "بيتكوين", nameEn: "Bitcoin", price: 68420.0, change: 1410.0, changePct: 2.10, category: "CRYPTO" },
    { symbol: "EURUSD", nameAr: "يورو / دولار", nameEn: "EUR / USD", price: 1.0825, change: -0.0018, changePct: -0.17, category: "FOREX" },
  ];

  // Map stocks to movers
  const sortedByChange = [...allStocks].sort((a, b) => (b.changePct || 0) - (a.changePct || 0));

  const topGainers: StockMover[] = sortedByChange.slice(0, 5).map((s) => ({
    symbol: s.symbol,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    market: s.market,
    currency: s.currency,
    price: s.currentPrice,
    change: s.change || 0,
    changePct: s.changePct || 0,
    decision: "BUY",
    confluenceScore: 78,
  }));

  const topLosers: StockMover[] = [...sortedByChange].reverse().slice(0, 5).map((s) => ({
    symbol: s.symbol,
    nameAr: s.nameAr,
    nameEn: s.nameEn,
    market: s.market,
    currency: s.currency,
    price: s.currentPrice,
    change: s.change || 0,
    changePct: s.changePct || 0,
    decision: "AVOID",
    confluenceScore: 32,
  }));

  // Featured Analysis Cards
  const featuredAnalyses: StockMover[] = [
    {
      symbol: "COMI",
      nameAr: "البنك التجاري الدولي",
      nameEn: "Commercial International Bank",
      market: "EGX",
      currency: "EGP",
      price: 86.5,
      change: 2.1,
      changePct: 2.49,
      decision: "STRONG_BUY",
      confluenceScore: 84,
    },
    {
      symbol: "2222",
      nameAr: "أرامكو السعودية",
      nameEn: "Saudi Aramco",
      market: "TASI",
      currency: "SAR",
      price: 32.4,
      change: 0.35,
      changePct: 1.09,
      decision: "BUY",
      confluenceScore: 72,
    },
    {
      symbol: "AAPL",
      nameAr: "آبل",
      nameEn: "Apple Inc.",
      market: "US",
      currency: "USD",
      price: 235.0,
      change: 1.8,
      changePct: 0.77,
      decision: "BUY",
      confluenceScore: 68,
    },
  ];

  return NextResponse.json({
    indices,
    topGainers,
    topLosers,
    featuredAnalyses,
    updatedAt: new Date().toISOString(),
  });
}
