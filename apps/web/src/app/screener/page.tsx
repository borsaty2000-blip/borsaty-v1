"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface ScreenerResult {
  symbol: string;
  nameAr: string;
  nameEn: string;
  market: string;
  sector?: string;
  close: number;
  close_change_pct_1d?: number;
  volume_ratio_20d?: number;
  RSI_14?: number;
  SMA_50?: number;
  SMA_200?: number;
  MACD_hist?: number;
  Supertrend?: string;
  pe_ratio?: number;
}

export default function ScreenerPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ScreenerResult[] | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [interpretedDsl, setInterpretedDsl] = useState<any | null>(null);
  const [executionMs, setExecutionMs] = useState<number | null>(null);
  const [dataQuality, setDataQuality] = useState<{
    stale_instruments_excluded: number;
    insufficient_history_excluded: number;
  } | null>(null);

  const sampleChips = [
    "الأسهم السعودية في القطاع البنكي",
    "أسهم مصرية بـ RSI تحت 30",
    "كريبتو بحجم تداول مرتفع",
    "أسهم فوق SMA200 وتحت SMA50",
    "أسهم مصرية مع Supertrend صاعد",
    "أسهم بمكرر ربحية أقل من 15",
  ];

  const handleRunSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setExplanation(null);

    try {
      const res = await fetch("/api/screener/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "فشل معالجة استعلام التصفية");
      }

      setResults(data.results || []);
      setExplanation(data.interpreted_ar || null);
      setInterpretedDsl(data.interpreted || null);
      setExecutionMs(data.execution_ms || null);
      setDataQuality(data.data_quality || null);
    } catch (err: any) {
      setError(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (chipText: string) => {
    setQuery(chipText);
    handleRunSearch(chipText);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1f293d] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              مصفاة الذكاء الاصطناعي الحتمية
            </span>
            <span className="text-xs text-gray-400">DSL Engine v1.0 • 21 مؤشر فني</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            مصفاة الأسهم باللغة العربية (AI Market Screener)
          </h1>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            اكتب طلبك باللغة العربية الفصحى أو العامية الدارجة لتحويله تلقائياً إلى شروط رقمية حتمية ومصفاة دقيقة عبر 5,000+ أصل مالي دون أي هلوسة.
          </p>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-[#121929] border border-[#1f293d] rounded-2xl p-5 shadow-xl space-y-4">
        <label className="block text-sm font-semibold text-gray-200">
          استعلام التصفية بالعربية:
        </label>
        <div className="relative">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="مثال: أسهم مصرية بـ RSI أقل من 30 وسعرها فوق متوسط 200..."
            className="w-full bg-[#0d1320] border border-[#232e48] rounded-xl p-3.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none font-arabic"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleRunSearch(query);
              }
            }}
          />
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-2">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-emerald-400" />
            نماذج جاهزة وسريعة للاختبار:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChipClick(chip)}
                className="text-xs px-3 py-1.5 rounded-lg bg-[#182338] hover:bg-emerald-500/10 hover:text-emerald-400 border border-[#23314d] hover:border-emerald-500/30 text-gray-300 transition-all cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>حماية كاملة ضد حقن الأوامر (Strict Allowlist DSL)</span>
          </div>
          <button
            type="button"
            disabled={loading || !query.trim()}
            onClick={() => handleRunSearch(query)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-medium text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>جاري التحليل والتصفية...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>تنفيذ التصفية</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300">تعذر استكمال التصفية</div>
            <div className="text-xs mt-1 text-red-200/90">{error}</div>
          </div>
        </div>
      )}

      {/* Explanation Banner */}
      {explanation && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-100 text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-300">{explanation}</span>
              {interpretedDsl && (
                <div className="text-xs text-emerald-400/80 mt-1 font-mono">
                  السوق: {interpretedDsl.universe} • شروط التصفية: {interpretedDsl.conditions?.length || 0}
                </div>
              )}
            </div>
          </div>
          {executionMs !== null && (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#0e1424] px-3 py-1.5 rounded-lg border border-[#232e48]">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>زمن التنفيذ: {executionMs}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Data Quality Notice */}
      {dataQuality && (dataQuality.stale_instruments_excluded > 0 || dataQuality.insufficient_history_excluded > 0) && (
        <div className="text-xs bg-[#161f33] text-gray-300 px-4 py-2.5 rounded-lg border border-[#232e48] flex items-center gap-4">
          <span className="text-amber-400 font-medium">معايير جودة البيانات:</span>
          <span>استبعاد أصول قديمة: {dataQuality.stale_instruments_excluded}</span>
          <span>استبعاد بيانات غير كافية (&lt;200 بار): {dataQuality.insufficient_history_excluded}</span>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
              نتائج التصفية
              <span className="text-xs font-normal text-gray-400 bg-[#161f33] px-2.5 py-0.5 rounded-full border border-[#232e48]">
                {results.length} أصل مالي متطابق
              </span>
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-[#121929] rounded-2xl border border-[#1f293d] space-y-2">
              <Filter className="w-8 h-8 text-gray-500 mx-auto" />
              <div className="text-gray-300 font-medium">لا توجد أصول تطابق هذه الشروط حالياً</div>
              <div className="text-xs text-gray-500">جرب تخفيف الشروط أو فحص سوق آخر</div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#1f293d] bg-[#121929] shadow-lg">
              <table className="w-full text-sm text-right">
                <thead className="bg-[#161f33] text-gray-400 text-xs uppercase font-medium border-b border-[#232e48]">
                  <tr>
                    <th className="py-3 px-4">الأصل المالي</th>
                    <th className="py-3 px-4">السوق / القطاع</th>
                    <th className="py-3 px-4">السعر</th>
                    <th className="py-3 px-4">التغير اليومي</th>
                    <th className="py-3 px-4">RSI (14)</th>
                    <th className="py-3 px-4">متوسط 200 (SMA)</th>
                    <th className="py-3 px-4">Supertrend</th>
                    <th className="py-3 px-4 text-center">الرسم والتحليل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c263c] text-gray-200">
                  {results.map((row) => {
                    const isPositive = (row.close_change_pct_1d ?? 0) >= 0;
                    return (
                      <tr
                        key={row.symbol}
                        className="hover:bg-[#182238] transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-medium">
                          <Link
                            href={`/stock/${row.symbol}`}
                            className="flex flex-col group-hover:text-emerald-400 transition-colors"
                          >
                            <span className="font-bold text-white text-base flex items-center gap-1.5">
                              {row.symbol}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                            </span>
                            <span className="text-xs text-gray-400">{row.nameAr}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-[#1c263c] text-gray-300 border border-[#2b3956] inline-block mb-1">
                            {row.market}
                          </span>
                          <div className="text-gray-400">{row.sector || "—"}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {row.close ? row.close.toFixed(2) : "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {row.close_change_pct_1d !== undefined ? (
                            <span
                              className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                                isPositive
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : "text-red-400 bg-red-500/10"
                              }`}
                            >
                              {isPositive ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              {isPositive ? "+" : ""}
                              {row.close_change_pct_1d.toFixed(2)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs">
                          {row.RSI_14 !== undefined ? (
                            <span
                              className={`px-2 py-0.5 rounded ${
                                row.RSI_14 < 30
                                  ? "text-emerald-400 bg-emerald-500/10 font-bold"
                                  : row.RSI_14 > 70
                                  ? "text-red-400 bg-red-500/10 font-bold"
                                  : "text-gray-300"
                              }`}
                            >
                              {row.RSI_14.toFixed(1)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-gray-300">
                          {row.SMA_200 !== undefined ? row.SMA_200.toFixed(2) : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          {row.Supertrend ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                row.Supertrend === "BULLISH"
                                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                  : "text-red-400 bg-red-500/10 border border-red-500/20"
                              }`}
                            >
                              {row.Supertrend === "BULLISH" ? "صاعد (Bullish)" : "هابط (Bearish)"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/stock/${row.symbol}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1a2337] hover:bg-emerald-500/20 text-gray-300 hover:text-emerald-400 border border-[#232e48] hover:border-emerald-500/30 text-xs transition-colors"
                          >
                            <span>فتح التحليل</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
