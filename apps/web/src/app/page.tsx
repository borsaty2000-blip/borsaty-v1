import Link from "next/link";
import { getAllCompanies } from "@borsaty/db";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const allStocks = await getAllCompanies();
  const egxStocks = allStocks.filter((s) => s.market === "EGX");
  const tasiStocks = allStocks.filter((s) => s.market === "TASI");

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#131c31] via-[#101726] to-[#0a0f1d] border border-[#232e48] p-8 md:p-12 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>نظام دعم القرار الاستثماري العربي الأول بالعالم</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            من القاهرة إلى وول ستريت، <br />
            <span className="bg-gradient-to-l from-emerald-400 to-teal-200 bg-clip-text text-transparent">
              بيانات شفافة وقرارات حتمية بلا هلوسة
            </span>
          </h1>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl">
            منصة «بورصتي» تعيد تعريف أدوات التداول والتحليل المالي في العالم العربي.
            Elliott، Gann Square of 9، Harmonic Patterns، و17+ نموذج تقييم مالي عادل، مع شرح وتفسير كامل لكل رقم باللغة العربية.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/stock/COMI"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-105"
            >
              افتح تحليل سهم التجاري الدولي (COMI)
            </Link>
            <Link
              href="/stock/2222"
              className="px-6 py-3 rounded-xl bg-[#1b263b] hover:bg-[#23324d] text-gray-100 font-semibold text-sm border border-[#2d3d5d] transition-all"
            >
              افتح تحليل سهم أرامكو (2222)
            </Link>
          </div>
        </div>

        {/* Floating Background Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Non-Negotiable Principles Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] space-y-1">
          <div className="text-xs text-emerald-400 font-bold">1. لا اختلاق بيانات</div>
          <p className="text-[11px] text-gray-400">Order Book Proxy موسوم ومفصح عنه بشفافية كاملة</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] space-y-1">
          <div className="text-xs text-teal-400 font-bold">2. لا يقين مطلق</div>
          <p className="text-[11px] text-gray-400">كل إشارة تصنف: Confirmed / Probable / Potential</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] space-y-1">
          <div className="text-xs text-sky-400 font-bold">3. كل رقم له أساس</div>
          <p className="text-[11px] text-gray-400">لا Target أو Stop Loss بدون طريقة رياضية معلنة</p>
        </div>
        <div className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] space-y-1">
          <div className="text-xs text-purple-400 font-bold">4. الشفافية أولاً</div>
          <p className="text-[11px] text-gray-400">كل إشارة تعرض الأدلة المؤيدة والمعارضة بالتفصيل</p>
        </div>
      </div>

      {/* EGX Egyptian Market Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-white">البورصة المصرية (EGX 30)</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c263c] text-gray-400">
              Younit / EGX.news
            </span>
          </div>
          <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            تأخير 15 دقيقة (المرحلة 0)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {egxStocks.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] hover:border-emerald-500/40 hover:bg-[#141d30] transition-all group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {stock.symbol}
                  </span>
                  <span className="text-xs text-gray-400">({stock.nameAr})</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{stock.sector}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">
                  {stock.currentPrice.toFixed(2)} {stock.currency}
                </div>
                <div
                  className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                    stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span dir="ltr">
                    {stock.change >= 0 ? "+" : ""}
                    {stock.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* TASI Saudi Market Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
            <h2 className="text-lg font-bold text-white">السوق المالي السعودي (تاسي TASI)</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-[#1c263c] text-gray-400">
              SAHMK Python SDK
            </span>
          </div>
          <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            لحظي ومباشر
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tasiStocks.map((stock) => (
            <Link
              key={stock.symbol}
              href={`/stock/${stock.symbol}`}
              className="p-4 rounded-2xl bg-[#111827] border border-[#1f293d] hover:border-emerald-500/40 hover:bg-[#141d30] transition-all group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {stock.symbol}
                  </span>
                  <span className="text-xs text-gray-400">({stock.nameAr})</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{stock.sector}</div>
              </div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">
                  {stock.currentPrice.toFixed(2)} {stock.currency}
                </div>
                <div
                  className={`text-xs font-semibold flex items-center justify-end gap-1 ${
                    stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span dir="ltr">
                    {stock.change >= 0 ? "+" : ""}
                    {stock.changePct.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
