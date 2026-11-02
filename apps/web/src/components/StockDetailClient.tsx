"use client";

import React, { useState } from "react";
import CandlestickChart from "@/components/CandlestickChart";
import ExplainabilityPanel from "@/components/ExplainabilityPanel";
import AskAIDialog from "@/components/AskAIDialog";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Sliders,
} from "lucide-react";

interface StockDetailClientProps {
  symbol: string;
  quote: any;
  historical: any;
}

export default function StockDetailClient({
  symbol,
  quote,
  historical,
}: StockDetailClientProps) {
  // Indicator Toggles
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(false);

  const isPositive = quote.change >= 0;
  const lastCandle = historical.candles[historical.candles.length - 1];

  return (
    <div className="space-y-6">
      {/* Stock Hero Banner */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-[#1f293d] shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-2xl font-black tracking-tight text-white">{symbol}</span>
            <span className="text-base text-gray-300 font-medium">({quote.nameAr})</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#1d263b] text-gray-300 border border-[#2d3a54]">
              {quote.market}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              لحظي مباشر
            </span>
          </div>
          <p className="text-xs text-gray-400">
            {quote.nameEn} • القطاع: {quote.sector || "سوق المال"} • العملة: {quote.currency}
          </p>
        </div>

        {/* Price & Action */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-left">
            <div className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 justify-end">
              <span>{quote.price.toFixed(2)}</span>
              <span className="text-xs text-gray-400 font-normal">{quote.currency}</span>
            </div>
            <div
              className={`text-sm font-semibold flex items-center gap-1 justify-end ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span dir="ltr">
                {isPositive ? "+" : ""}
                {quote.change.toFixed(2)} ({isPositive ? "+" : ""}
                {quote.changePct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Ask AI Action Button */}
          <AskAIDialog
            symbol={symbol}
            nameAr={quote.nameAr}
            currentPrice={quote.price}
            confluenceScore={historical.confluence.score}
            certainty={historical.confluence.certainty}
            targets={historical.confluence.targets}
            stopLoss={historical.confluence.stopLoss}
            fairValue={{
              mid: historical.fairValue.mid,
              verdictAr: historical.fairValue.verdictAr,
            }}
            dataQuality={quote.dataQuality}
          />
        </div>
      </div>

      {/* Indicators Control Toolbar (5 Indicators Requirement) */}
      <div className="p-4 rounded-xl bg-[#131b2c] border border-[#212d46] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <span>المؤشرات الفنية (5 مؤشرات):</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* SMA 20 */}
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showSMA
                ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                : "bg-[#182338] text-gray-400 border-[#232e48] hover:text-white"
            }`}
          >
            SMA 20 ({lastCandle?.sma20 || "-"})
          </button>

          {/* EMA 20 */}
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showEMA
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : "bg-[#182338] text-gray-400 border-[#232e48] hover:text-white"
            }`}
          >
            EMA 20 ({lastCandle?.ema20 || "-"})
          </button>

          {/* Bollinger Bands */}
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showBollinger
                ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                : "bg-[#182338] text-gray-400 border-[#232e48] hover:text-white"
            }`}
          >
            Bollinger (20,2)
          </button>

          {/* RSI 14 */}
          <button
            onClick={() => setShowRSI(!showRSI)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showRSI
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                : "bg-[#182338] text-gray-400 border-[#232e48] hover:text-white"
            }`}
          >
            RSI 14 ({lastCandle?.rsi || "-"})
          </button>

          {/* MACD */}
          <button
            onClick={() => setShowMACD(!showMACD)}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-all ${
              showMACD
                ? "bg-teal-500/20 text-teal-400 border-teal-500/40"
                : "bg-[#182338] text-gray-400 border-[#232e48] hover:text-white"
            }`}
          >
            MACD (12,26,9)
          </button>
        </div>
      </div>

      {/* Main Lightweight Charts v5 Canvas with fixed min-height for 0 CLS */}
      <div className="min-h-[480px]">
        <CandlestickChart
          data={historical.candles}
          symbol={symbol}
          showSMA={showSMA}
          showEMA={showEMA}
          showBollinger={showBollinger}
          targets={historical.confluence.targets}
          stopLoss={historical.confluence.stopLoss}
        />
      </div>

      {/* RSI Sub-chart Indicator Bar if enabled */}
      {showRSI && lastCandle?.rsi && (
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1f293d] flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-400">مؤشر القوة النسبية (RSI 14):</span>
            <span className="font-bold text-white text-sm">{lastCandle.rsi}</span>
            <span className="text-gray-400">
              {lastCandle.rsi > 70
                ? "• تشبع شرائي (Overbought)"
                : lastCandle.rsi < 30
                ? "• تشبع بيعي (Oversold)"
                : "• منطقة زخم طبيعية ومتوازنة"}
            </span>
          </div>
          <div className="w-36 bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                lastCandle.rsi > 70
                  ? "bg-rose-500"
                  : lastCandle.rsi < 30
                  ? "bg-emerald-400"
                  : "bg-sky-400"
              }`}
              style={{ width: `${lastCandle.rsi}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Fundamental Fair Value Card */}
      <div className="p-5 rounded-2xl bg-[#111827] border border-[#1f293d] shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">القيمة العادلة ونماذج التقييم (Fair Value)</h3>
            <p className="text-xs text-gray-400">مبني على 17+ نموذج كمي خوارزمي (DCF, Graham, P/E Relative)</p>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400">القيمة العادلة المرجحة</div>
            <div className="text-xl font-extrabold text-emerald-400">
              {historical.fairValue.mid} {quote.currency}
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#141c2e] border border-[#232e48] text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">الحكم الكمي (Quantitative Verdict):</span>
            <span className="text-emerald-400 font-semibold">{historical.fairValue.verdictAr}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">النطاق التقديري العادل:</span>
            <span className="text-white font-mono">
              {historical.fairValue.low} — {historical.fairValue.high} {quote.currency}
            </span>
          </div>
          <div className="text-[11px] text-gray-400 border-t border-[#1f293d] pt-2">
            ملاحظة: النماذج المستخدمة تشمل التدفقات النقدية المخصومة، ومضاعف الربحية التاريخي، ونموذج جراهام. تقدير كمي بحت وليس نصيحة استثمارية.
          </div>
        </div>
      </div>

      {/* Explainability Panel (Non-Negotiable Core Feature) */}
      <ExplainabilityPanel
        symbol={symbol}
        confluenceScore={historical.confluence.score}
        certainty={historical.confluence.certainty}
        confidencePct={historical.confluence.confidencePct}
        supportingEvidence={historical.confluence.supportingEvidence}
        contradictingEvidence={historical.confluence.contradictingEvidence}
        primaryScenario={historical.confluence.primaryScenario}
        alternativeScenario={historical.confluence.alternativeScenario}
        invalidationCriteria={historical.confluence.invalidationCriteria}
        targets={historical.confluence.targets}
        stopLoss={historical.confluence.stopLoss}
        dataQuality={quote.dataQuality}
      />
    </div>
  );
}
