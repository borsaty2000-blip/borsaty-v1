"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutGrid, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useApp } from "@/context/AppContext";

export interface SectorStock {
  symbol: string;
  nameEn: string;
  nameAr: string;
  price: number;
  changePct: number;
  currency: string;
  market: string;
}

export interface SectorData {
  id: string;
  nameEn: string;
  nameAr: string;
  weight: number; // 1 to 4 relative size
  changePct: number;
  marketCapBillion: number;
  stocks: SectorStock[];
}

const SECTOR_HEATMAP_DATA: SectorData[] = [
  {
    id: "finance",
    nameEn: "Financials & Banks",
    nameAr: "البنوك والخدمات المالية",
    weight: 4,
    changePct: 1.45,
    marketCapBillion: 185.4,
    stocks: [
      { symbol: "COMI", nameEn: "CIB Egypt", nameAr: "التجاري الدولي", price: 86.5, changePct: 1.82, currency: "EGP", market: "EGX" },
      { symbol: "1120", nameEn: "Al Rajhi Bank", nameAr: "مصرف الراجحي", price: 88.4, changePct: 1.35, currency: "SAR", market: "TASI" },
      { symbol: "FWRY", nameEn: "Fawry Banking", nameAr: "فوري للحلول المصرفية", price: 7.95, changePct: 2.15, currency: "EGP", market: "EGX" },
    ],
  },
  {
    id: "energy",
    nameEn: "Energy & Petrochemicals",
    nameAr: "الطاقة والبتروكيماويات",
    weight: 3,
    changePct: 0.68,
    marketCapBillion: 210.0,
    stocks: [
      { symbol: "2222", nameEn: "Saudi Aramco", nameAr: "أرامكو السعودية", price: 28.5, changePct: 0.71, currency: "SAR", market: "TASI" },
      { symbol: "2010", nameEn: "SABIC", nameAr: "سابك", price: 74.2, changePct: 0.42, currency: "SAR", market: "TASI" },
      { symbol: "XOM", nameEn: "ExxonMobil", nameAr: "إكسون موبيل", price: 118.2, changePct: 0.95, currency: "USD", market: "NYSE" },
    ],
  },
  {
    id: "tech",
    nameEn: "Technology & Software",
    nameAr: "التكنولوجيا والبرمجيات",
    weight: 3,
    changePct: 2.18,
    marketCapBillion: 340.5,
    stocks: [
      { symbol: "NVDA", nameEn: "NVIDIA Corp", nameAr: "إنفيديا", price: 130.4, changePct: 3.42, currency: "USD", market: "NASDAQ" },
      { symbol: "AAPL", nameEn: "Apple Inc", nameAr: "أبل", price: 235.1, changePct: 1.64, currency: "USD", market: "NASDAQ" },
      { symbol: "7203", nameEn: "Elm Information", nameAr: "عِلم للحلول الرقمية", price: 980.0, changePct: 1.85, currency: "SAR", market: "TASI" },
    ],
  },
  {
    id: "realestate",
    nameEn: "Real Estate Development",
    nameAr: "العقارات والإنشاءات",
    weight: 2,
    changePct: -0.74,
    marketCapBillion: 92.1,
    stocks: [
      { symbol: "TMGH", nameEn: "Talaat Moustafa", nameAr: "مجموعة طلعت مصطفى", price: 58.2, changePct: -0.85, currency: "EGP", market: "EGX" },
      { symbol: "4300", nameEn: "Dar Al Arkan", nameAr: "دار الأركان", price: 14.2, changePct: -0.42, currency: "SAR", market: "TASI" },
      { symbol: "PHDC", nameEn: "Palm Hills", nameAr: "بالم هيلز للتعمير", price: 4.85, changePct: -1.02, currency: "EGP", market: "EGX" },
    ],
  },
  {
    id: "materials",
    nameEn: "Basic Materials & Metals",
    nameAr: "المعادن والمواد الأساسية",
    weight: 2,
    changePct: 1.12,
    marketCapBillion: 78.4,
    stocks: [
      { symbol: "1211", nameEn: "Maaden", nameAr: "معادن", price: 48.6, changePct: 1.35, currency: "SAR", market: "TASI" },
      { symbol: "ESRS", nameEn: "Ezz Steel", nameAr: "حديد عز", price: 92.0, changePct: 1.65, currency: "EGP", market: "EGX" },
      { symbol: "SWDY", nameEn: "Elsewedy Electric", nameAr: "السويدي إليكتريك", price: 48.1, changePct: 0.62, currency: "EGP", market: "EGX" },
    ],
  },
  {
    id: "telecom",
    nameEn: "Telecom & Networks",
    nameAr: "الاتصالات والشبكات",
    weight: 2,
    changePct: -0.28,
    marketCapBillion: 84.0,
    stocks: [
      { symbol: "7010", nameEn: "STC", nameAr: "إس تي سي الاتصالات", price: 40.2, changePct: -0.25, currency: "SAR", market: "TASI" },
      { symbol: "ETEL", nameEn: "Telecom Egypt", nameAr: "المصرية للاتصالات", price: 34.5, changePct: -0.45, currency: "EGP", market: "EGX" },
      { symbol: "MSFT", nameEn: "Microsoft Corp", nameAr: "مايكروسوفت", price: 422.0, changePct: 0.85, currency: "USD", market: "NASDAQ" },
    ],
  },
  {
    id: "consumer",
    nameEn: "Consumer & Staples",
    nameAr: "السلع الاستهلاكية والتجزئة",
    weight: 1,
    changePct: 0.52,
    marketCapBillion: 54.3,
    stocks: [
      { symbol: "EAST", nameEn: "Eastern Company", nameAr: "الشرقية للدخان", price: 32.5, changePct: 0.92, currency: "EGP", market: "EGX" },
      { symbol: "2280", nameEn: "Almarai", nameAr: "المراعي", price: 56.4, changePct: 0.35, currency: "SAR", market: "TASI" },
      { symbol: "4190", nameEn: "Jarir Marketing", nameAr: "جرير للتسويق", price: 13.8, changePct: 0.44, currency: "SAR", market: "TASI" },
    ],
  },
  {
    id: "healthcare",
    nameEn: "Healthcare & Pharma",
    nameAr: "الرعاية الصحية والأدوية",
    weight: 1,
    changePct: -1.35,
    marketCapBillion: 42.0,
    stocks: [
      { symbol: "4013", nameEn: "Dr Sulaiman Habib", nameAr: "مجموعة الحبيب الطبية", price: 294.0, changePct: -1.45, currency: "SAR", market: "TASI" },
      { symbol: "4002", nameEn: "Mouwasat Medical", nameAr: "المواساة للخدمات الطبية", price: 112.0, changePct: -1.22, currency: "SAR", market: "TASI" },
      { symbol: "ISPH", nameEn: "Ibnsina Pharma", nameAr: "ابن سينا فارما", price: 3.12, changePct: -1.15, currency: "EGP", market: "EGX" },
    ],
  },
];

export default function SectorHeatmap() {
  const { language } = useApp();
  const isAr = language === "ar";
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  const getHeatmapColor = (pct: number) => {
    if (pct >= 2.0) return "bg-[#059669] hover:bg-[#047857] text-white border-emerald-600";
    if (pct >= 0.8) return "bg-[#10b981] hover:bg-[#059669] text-white border-emerald-500";
    if (pct >= 0.0) return "bg-[#047857]/80 hover:bg-[#047857] text-white border-emerald-700";
    if (pct >= -0.8) return "bg-[#b91c1c]/80 hover:bg-[#991b1b] text-white border-rose-800";
    if (pct >= -2.0) return "bg-[#dc2626] hover:bg-[#b91c1c] text-white border-rose-600";
    return "bg-[#991b1b] hover:bg-[#7f1d1d] text-white border-rose-900";
  };

  return (
    <div className="p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1120] shadow-sm space-y-4 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-black text-[#00D9FF] flex items-center justify-center font-bold border border-slate-700">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isAr ? "خريطة أداء القطاعات اللحظية (Finviz Sector Heatmap)" : "Cross-Market Sector Heatmap"}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? "حجم المربع يعكس القيمة السوقية للقطاع، ولونه يعكس متوسط تغير اليوم عبر الأسهم القيادية."
                : "Block dimensions scale by market capitalization; hue indicates aggregate performance."}
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-500 self-start sm:self-auto">
          <span>-3%</span>
          <div className="flex items-center gap-0.5">
            <span className="w-3.5 h-3.5 rounded-xs bg-[#991b1b]" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#dc2626]" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#64748b]" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#10b981]" />
            <span className="w-3.5 h-3.5 rounded-xs bg-[#059669]" />
          </div>
          <span>+3%</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {SECTOR_HEATMAP_DATA.map((sector) => {
          const isSelected = selectedSector?.id === sector.id;
          const isUp = sector.changePct >= 0;
          const colorClass = getHeatmapColor(sector.changePct);

          // Span logic based on weight
          const colSpanClass =
            sector.weight >= 4
              ? "col-span-2 row-span-2 min-h-[140px]"
              : sector.weight === 3
              ? "col-span-2 sm:col-span-1 lg:col-span-2 min-h-[110px]"
              : "col-span-1 min-h-[90px]";

          return (
            <div
              key={sector.id}
              onClick={() => setSelectedSector(isSelected ? null : sector)}
              className={`relative rounded-xl p-3.5 cursor-pointer transition-all border flex flex-col justify-between shadow-xs select-none ${colSpanClass} ${colorClass} ${
                isSelected ? "ring-2 ring-white scale-[1.01] z-10" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <div>
                  <h4 className="font-extrabold text-xs md:text-sm tracking-tight leading-snug drop-shadow-xs">
                    {isAr ? sector.nameAr : sector.nameEn}
                  </h4>
                  <span className="text-[10px] opacity-80 font-mono">
                    ${sector.marketCapBillion}B Cap
                  </span>
                </div>
                <div className="text-end">
                  <div className="font-black text-sm md:text-base font-mono tabular-nums flex items-center justify-end gap-0.5">
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{isUp ? "+" : ""}{sector.changePct.toFixed(2)}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Stock Badges inside the block */}
              <div className="pt-2 flex flex-wrap gap-1.5 opacity-90">
                {sector.stocks.slice(0, 2).map((stk) => (
                  <span
                    key={stk.symbol}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/25 backdrop-blur-xs flex items-center gap-1"
                  >
                    <span>{stk.symbol}</span>
                    <span className="opacity-90">{stk.changePct >= 0 ? "+" : ""}{stk.changePct.toFixed(1)}%</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Sector Details (On click or default view) */}
      {selectedSector && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 duration-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF]" />
              <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                {isAr
                  ? `الأسهم القيادية في قطاع ${selectedSector.nameAr}`
                  : `Top Constituent Equities in ${selectedSector.nameEn}`}
              </h4>
            </div>
            <button
              onClick={() => setSelectedSector(null)}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {isAr ? "إغلاق التفاصيل" : "Close Details"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSector.stocks.map((stock) => {
              const isGain = stock.changePct >= 0;
              return (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="p-3 rounded-lg bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all flex items-center justify-between group shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-[#00D9FF] transition-colors">
                        {stock.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {stock.market}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                      {isAr ? stock.nameAr : stock.nameEn}
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {stock.price.toFixed(2)}
                    </div>
                    <div
                      className={`text-[11px] font-bold font-mono tabular-nums ${
                        isGain ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isGain ? "+" : ""}{stock.changePct.toFixed(2)}%
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
