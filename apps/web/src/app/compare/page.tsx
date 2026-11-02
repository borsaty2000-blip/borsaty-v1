"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Layers,
  Award,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ComparableStock {
  symbol: string;
  nameEn: string;
  nameAr: string;
  market: string;
  currency: string;
  sectorEn: string;
  sectorAr: string;
  price: number;
  changePct: number;
  peRatio: number;
  marketCapBillion: number;
  high52w: number;
  low52w: number;
  confluenceScore: number;
  decision: "BUY" | "SELL" | "HOLD";
  volatility: string;
}

const COMPARABLE_STOCKS: ComparableStock[] = [
  {
    symbol: "COMI",
    nameEn: "Commercial International Bank",
    nameAr: "البنك التجاري الدولي مصر",
    market: "EGX",
    currency: "EGP",
    sectorEn: "Banking & Finance",
    sectorAr: "البنوك والخدمات المالية",
    price: 86.5,
    changePct: 1.47,
    peRatio: 7.2,
    marketCapBillion: 6.8,
    high52w: 94.5,
    low52w: 52.0,
    confluenceScore: 74,
    decision: "BUY",
    volatility: "Moderate",
  },
  {
    symbol: "2222",
    nameEn: "Saudi Aramco",
    nameAr: "أرامكو السعودية",
    market: "TASI",
    currency: "SAR",
    sectorEn: "Energy & Oil",
    sectorAr: "الطاقة والنفط",
    price: 28.5,
    changePct: 0.71,
    peRatio: 14.8,
    marketCapBillion: 1850.0,
    high52w: 34.2,
    low52w: 26.8,
    confluenceScore: 68,
    decision: "BUY",
    volatility: "Low",
  },
  {
    symbol: "AAPL",
    nameEn: "Apple Inc.",
    nameAr: "أبل الأمريكية",
    market: "NASDAQ",
    currency: "USD",
    sectorEn: "Technology & Consumer Electronics",
    sectorAr: "التكنولوجيا والبرمجيات",
    price: 235.1,
    changePct: 1.64,
    peRatio: 33.4,
    marketCapBillion: 3580.0,
    high52w: 237.2,
    low52w: 164.0,
    confluenceScore: 78,
    decision: "BUY",
    volatility: "Moderate",
  },
  {
    symbol: "NVDA",
    nameEn: "NVIDIA Corporation",
    nameAr: "إنفيديا للذكاء الاصطناعي",
    market: "NASDAQ",
    currency: "USD",
    sectorEn: "Semiconductors & AI",
    sectorAr: "أشباه الموصلات والذكاء الاصطناعي",
    price: 130.4,
    changePct: 3.42,
    peRatio: 52.1,
    marketCapBillion: 3210.0,
    high52w: 140.7,
    low52w: 45.1,
    confluenceScore: 84,
    decision: "BUY",
    volatility: "High",
  },
  {
    symbol: "TMGH",
    nameEn: "Talaat Moustafa Group",
    nameAr: "مجموعة طلعت مصطفى القابضة",
    market: "EGX",
    currency: "EGP",
    sectorEn: "Real Estate Development",
    sectorAr: "التطوير العقاري",
    price: 58.2,
    changePct: -0.85,
    peRatio: 11.4,
    marketCapBillion: 2.9,
    high52w: 89.0,
    low52w: 21.0,
    confluenceScore: 64,
    decision: "HOLD",
    volatility: "High",
  },
  {
    symbol: "1120",
    nameEn: "Al Rajhi Bank",
    nameAr: "مصرف الراجحي",
    market: "TASI",
    currency: "SAR",
    sectorEn: "Islamic Banking",
    sectorAr: "المصرفية الإسلامية",
    price: 88.4,
    changePct: 1.35,
    peRatio: 18.2,
    marketCapBillion: 94.2,
    high52w: 92.5,
    low52w: 68.0,
    confluenceScore: 76,
    decision: "BUY",
    volatility: "Moderate",
  },
  {
    symbol: "MSFT",
    nameEn: "Microsoft Corporation",
    nameAr: "مايكروسوفت",
    market: "NASDAQ",
    currency: "USD",
    sectorEn: "Cloud & Enterprise Software",
    sectorAr: "السحابة والبرمجيات المؤسسية",
    price: 422.0,
    changePct: 0.85,
    peRatio: 35.8,
    marketCapBillion: 3140.0,
    high52w: 468.3,
    low52w: 309.4,
    confluenceScore: 71,
    decision: "BUY",
    volatility: "Moderate",
  },
  {
    symbol: "FWRY",
    nameEn: "Fawry Banking & Payment",
    nameAr: "فوري لتكنولوجيا البنوك والمدفوعات",
    market: "EGX",
    currency: "EGP",
    sectorEn: "Fintech & Digital Payments",
    sectorAr: "التكنولوجيا المالية والمدفوعات",
    price: 7.95,
    changePct: 2.15,
    peRatio: 16.5,
    marketCapBillion: 0.9,
    high52w: 9.1,
    low52w: 4.8,
    confluenceScore: 69,
    decision: "BUY",
    volatility: "High",
  },
];

// Generate synthetic comparative performance normalized to % change (0% at start)
function generateComparisonData(symA: string, symB: string, range: "1M" | "3M" | "6M" | "1Y") {
  const points = range === "1M" ? 22 : range === "3M" ? 45 : range === "6M" ? 65 : 90;
  const data = [];
  let aAccum = 0;
  let bAccum = 0;

  // Stable seed based on symbols
  const seedA = (symA.charCodeAt(0) + (symA.charCodeAt(1) || 0)) % 7;
  const seedB = (symB.charCodeAt(0) + (symB.charCodeAt(1) || 0)) % 5;

  for (let i = 0; i < points; i++) {
    const t = i / points;
    // trend + oscillating components
    const stepA = Math.sin(t * 5 + seedA) * 1.2 + (seedA > 3 ? 0.35 : 0.15);
    const stepB = Math.cos(t * 4 + seedB) * 1.1 + (seedB > 2 ? 0.28 : 0.08);

    aAccum += stepA;
    bAccum += stepB;

    data.push({
      point: i === 0 ? "Start" : `Day ${i + 1}`,
      [symA]: Number(aAccum.toFixed(2)),
      [symB]: Number(bAccum.toFixed(2)),
    });
  }

  return data;
}

export default function ComparePage() {
  const { language } = useApp();
  const isAr = language === "ar";

  const [symbolA, setSymbolA] = useState<string>("COMI");
  const [symbolB, setSymbolB] = useState<string>("2222");
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y">("3M");

  const stockA = COMPARABLE_STOCKS.find((s) => s.symbol === symbolA) || COMPARABLE_STOCKS[0];
  const stockB = COMPARABLE_STOCKS.find((s) => s.symbol === symbolB) || COMPARABLE_STOCKS[1];

  const chartData = generateComparisonData(stockA.symbol, stockB.symbol, timeRange);
  const lastPoint = chartData[chartData.length - 1];
  const perfA = (lastPoint[stockA.symbol] as number) || 0;
  const perfB = (lastPoint[stockB.symbol] as number) || 0;

  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load Stock Compare Tool"
      fallbackTitleAr="تعذر تحميل أداة مقارنة الأسهم"
    >
      <div className="max-w-5xl mx-auto space-y-8 pb-16 pt-4">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>{isAr ? "محطة المقارنة المؤسسية المزدوجة" : "Cross-Asset Comparison Terminal"}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? "مقارنة رأس برأس بين الأسهم" : "Side-by-Side Equity Comparison"}
          </h1>

          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {isAr
              ? "قارن الأداء التاريخي والتقييمات الفنية ومكررات الأرباح ودرجات التوافق الكمي بين أي سهمين معاً على رسم بياني موحد."
              : "Compare normalized percentage alpha, valuation multiples, confluence strength, and risk profiles across any two regional or global assets."}
          </p>
        </div>

        {/* Stock Selector Controls */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Stock A Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF]" />
              <span>{isAr ? "السهم الأول (الأصل أ):" : "First Asset (Asset A):"}</span>
            </label>
            <div className="relative">
              <select
                value={symbolA}
                onChange={(e) => setSymbolA(e.target.value)}
                className="w-full h-11 px-3 ps-3 pe-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#00D9FF] cursor-pointer appearance-none"
              >
                {COMPARABLE_STOCKS.map((s) => (
                  <option key={s.symbol} value={s.symbol} disabled={s.symbol === symbolB}>
                    {s.symbol} — {isAr ? s.nameAr : s.nameEn} ({s.market})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute end-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Stock B Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span>{isAr ? "السهم الثاني (الأصل ب):" : "Second Asset (Asset B):"}</span>
            </label>
            <div className="relative">
              <select
                value={symbolB}
                onChange={(e) => setSymbolB(e.target.value)}
                className="w-full h-11 px-3 ps-3 pe-8 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs md:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#10b981] cursor-pointer appearance-none"
              >
                {COMPARABLE_STOCKS.map((s) => (
                  <option key={s.symbol} value={s.symbol} disabled={s.symbol === symbolA}>
                    {s.symbol} — {isAr ? s.nameAr : s.nameEn} ({s.market})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute end-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Normalized Performance Chart Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00D9FF]" />
                <span>{isAr ? "العائد التراكمي المقارن (%)" : "Normalized Cumulative Return (%)"}</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "قياس تغير القيمة بالدرجات المئوية بدءاً من نقطة الصفر المشتركة."
                  : "Tracks relative percentage performance indexed to 0% at period start."}
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              {(["1M", "3M", "6M", "1Y"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === r
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
                <XAxis
                  dataKey="point"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0B1120",
                    borderColor: "#1e293b",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                  formatter={(val) => [`${Number(val).toFixed(2)}%`]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(val) => <span className="text-xs font-black text-slate-700 dark:text-slate-300 mx-1">{val}</span>}
                />
                <Line
                  type="monotone"
                  dataKey={stockA.symbol}
                  stroke="#00D9FF"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey={stockB.symbol}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Winner Banner */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isAr
                  ? `الأصل المتفوق خلال فترة ${timeRange}: ${perfA > perfB ? stockA.symbol : stockB.symbol}`
                  : `Top Performer during ${timeRange}: ${perfA > perfB ? stockA.symbol : stockB.symbol}`}
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-slate-500">
              {stockA.symbol}: <span className={perfA >= 0 ? "text-emerald-500" : "text-rose-500"}>{perfA >= 0 ? "+" : ""}{perfA}%</span> | {stockB.symbol}: <span className={perfB >= 0 ? "text-emerald-500" : "text-rose-500"}>{perfB >= 0 ? "+" : ""}{perfB}%</span>
            </div>
          </div>
        </div>

        {/* Metric Comparison Table */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {isAr ? "مصفوفة المقارنة الفنية والمالية المباشرة" : "Technical & Fundamental Comparison Matrix"}
          </h3>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4 text-start">{isAr ? "المؤشر الفني / المالي" : "Metric"}</th>
                  <th className="py-3 px-4 text-center font-bold text-[#00D9FF]">
                    {stockA.symbol} ({stockA.market})
                  </th>
                  <th className="py-3 px-4 text-center font-bold text-emerald-500">
                    {stockB.symbol} ({stockB.market})
                  </th>
                  <th className="py-3 px-4 text-center">{isAr ? "التقييم المؤسسي" : "Advantage"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
                {/* 1. Price */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "السعر الحالي" : "Live Price"}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{stockA.price.toFixed(2)} {stockA.currency}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{stockB.price.toFixed(2)} {stockB.currency}</td>
                  <td className="py-3 px-4 text-center text-slate-400">—</td>
                </tr>

                {/* 2. Confluence Score */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "درجة التوافق الكمي (8 محركات)" : "Confluence Score"}</td>
                  <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">
                    {stockA.confluenceScore}/100
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-black text-slate-900 dark:text-white">
                    {stockB.confluenceScore}/100
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00D9FF]/10 text-cyan-600 dark:text-[#00D9FF]">
                      {stockA.confluenceScore > stockB.confluenceScore ? stockA.symbol : stockB.symbol} (+{Math.abs(stockA.confluenceScore - stockB.confluenceScore)})
                    </span>
                  </td>
                </tr>

                {/* 3. Decision */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "قرار المحرك الكمي" : "Algorithmic Verdict"}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {stockA.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {stockB.decision}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">Neutral</td>
                </tr>

                {/* 4. P/E Ratio */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "مكرر الربحية (P/E)" : "P/E Ratio"}</td>
                  <td className="py-3 px-4 text-center font-mono">{stockA.peRatio}x</td>
                  <td className="py-3 px-4 text-center font-mono">{stockB.peRatio}x</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                      {stockA.peRatio < stockB.peRatio ? `${stockA.symbol} (Lower Multiple)` : `${stockB.symbol} (Lower Multiple)`}
                    </span>
                  </td>
                </tr>

                {/* 5. Market Cap */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "القيمة السوقية" : "Market Capitalization"}</td>
                  <td className="py-3 px-4 text-center font-mono">${stockA.marketCapBillion}B</td>
                  <td className="py-3 px-4 text-center font-mono">${stockB.marketCapBillion}B</td>
                  <td className="py-3 px-4 text-center text-slate-400">
                    {stockA.marketCapBillion > stockB.marketCapBillion ? stockA.symbol : stockB.symbol}
                  </td>
                </tr>

                {/* 6. 52W Range */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "نطاق 52 أسبوعاً" : "52-Week Range"}</td>
                  <td className="py-3 px-4 text-center font-mono text-[11px]">{stockA.low52w} - {stockA.high52w}</td>
                  <td className="py-3 px-4 text-center font-mono text-[11px]">{stockB.low52w} - {stockB.high52w}</td>
                  <td className="py-3 px-4 text-center text-slate-400">—</td>
                </tr>

                {/* 7. Quick Links */}
                <tr>
                  <td className="py-3 px-4 text-slate-500">{isAr ? "التحليل المفصل" : "Full Terminal"}</td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/stock/${stockA.symbol}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00D9FF] hover:underline"
                    >
                      <span>{stockA.symbol} Analysis</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Link
                      href={`/stock/${stockB.symbol}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:underline"
                    >
                      <span>{stockB.symbol} Analysis</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-center text-slate-400">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
