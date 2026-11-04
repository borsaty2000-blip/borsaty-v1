"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Terminal,
  FileCode,
  Copy,
  Check,
  Server,
  Key,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ApiEndpoint {
  method: "GET" | "POST";
  path: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  params: Array<{ name: string; type: string; required: boolean; descEn: string; descAr: string }>;
  responseSample: Record<string, unknown>;
  curlExample: string;
  pythonExample: string;
  tsExample: string;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/quotes?symbol={symbol} or ?symbols={symbols}",
    titleEn: "Market Quote",
    titleAr: "أحدث أسعار السوق وجودة البيانات",
    descriptionEn: "Retrieve the latest available asset pricing, 52-week metrics, and data quality provenance. Use symbols for a comma-separated list; that response is an array.",
    descriptionAr: "جلب أحدث الأسعار المتاحة ومؤشرات 52 أسبوعاً مع معلومات جودة ومصدر البيانات. استخدم symbols لقائمة مفصولة بفواصل؛ وتكون الاستجابة مصفوفة.",
    params: [
      { name: "symbol", type: "string", required: false, descEn: "One stock ticker (e.g. COMI, 2222, AAPL); returns one quote object.", descAr: "رمز سهم واحد (مثل COMI أو 2222 أو AAPL)؛ وتعيد كائن سعر واحداً." },
      { name: "symbols", type: "string", required: false, descEn: "Comma-separated tickers (e.g. COMI,SWDY,AAPL); returns an array of quote objects.", descAr: "رموز أسهم مفصولة بفواصل (مثل COMI,SWDY,AAPL)؛ وتعيد مصفوفة من كائنات الأسعار." },
    ],
    responseSample: {
      symbol: "COMI",
      price: 86.5,
      change: 1.25,
      changePct: 1.47,
      high52w: 94.5,
      low52w: 52.0,
      market: "EGX",
      currency: "EGP",
      dataQuality: {
        provider: "Market Data Feed",
        isRealtime: false,
        freshness: "TODAY_CLOSE",
        verifiedAt: "2026-11-02T18:00:00Z",
      },
    },
    curlExample: `curl -X GET "https://borsatyai.com/api/quotes?symbol=COMI" \\
  -H "Accept: application/json"`,
    pythonExample: `import requests

res = requests.get("https://borsatyai.com/api/quotes", params={"symbol": "COMI"})
quote = res.json()
print(f"Price: {quote['price']} {quote['currency']}")`,
    tsExample: `const res = await fetch("https://borsatyai.com/api/quotes?symbol=COMI");
const quote = await res.json();
console.log(quote.price, quote.dataQuality);`,
  },
  {
    method: "GET",
    path: "/api/decision/{symbol}",
    titleEn: "Quantitative Trade Decision",
    titleAr: "القرار الاستثماري الكمي ونقاط الدخول",
    descriptionEn: "Algorithmic quantitative verdict (BUY / SELL / HOLD) with multi-target plan and stop loss.",
    descriptionAr: "القرار الفني والكمي (شراء / بيع / ترقب) متضمناً مستويات الأهداف ووقف الخسارة ونسبة R:R.",
    params: [
      { name: "symbol", type: "string", required: true, descEn: "Target equity symbol", descAr: "رمز السهم المستهدف" },
    ],
    responseSample: {
      symbol: "COMI",
      decision: "BUY",
      confidence_score: 0.74,
      entry_zone: [85.5, 86.8],
      stop_loss: 82.3,
      targets: [91.5, 96.0, 102.5],
      primary_rr: 1.76,
      historical_evidence: {
        hit_rate_t1: 0.68,
        sample_size: 42,
        wilson_ci_95: [0.54, 0.79],
      },
    },
    curlExample: `curl -X GET "https://borsatyai.com/api/decision/COMI" \\
  -H "Accept: application/json"`,
    pythonExample: `import requests

res = requests.get("https://borsatyai.com/api/decision/COMI")
decision = res.json()
print("Verdict:", decision["decision"], "Confidence:", decision["confidence_score"])`,
    tsExample: `const res = await fetch("https://borsatyai.com/api/decision/COMI");
const decision = await res.json();
console.log(decision.decision, decision.entry_zone, decision.targets);`,
  },
  {
    method: "GET",
    path: "/api/analysis/{symbol}/full",
    titleEn: "Full 8-Engine Confluence & Wave Decomposition",
    titleAr: "التحليل الشامل لـ 8 محركات مع موجات إليوت والهارمونيك",
    descriptionEn: "Complete technical synthesis: Elliott Wave counts, Harmonic PRZ, Classical patterns, and dual narratives.",
    descriptionAr: "تفكيك فني شامل: ترقيم موجات إليوت، مناطق انعكاس الهارمونيك PRZ، الأنماط الكلاسيكية والسرد ثنائي اللغة.",
    params: [
      { name: "symbol", type: "string", required: true, descEn: "Stock ticker", descAr: "رمز السهم" },
      { name: "timeframe", type: "string", required: false, descEn: "1D, 4H, 1H (Default: 1D)", descAr: "الإطار الزمني (الافتراضي: 1D)" },
    ],
    responseSample: {
      symbol: "COMI",
      confluence_score: 72,
      regime: "BULLISH_TRENDING",
      elliott: { wave_count: "Wave (3) of [V]", certainty: "Probable" },
      harmonic: { pattern: "Gartley Bullish", prz: [84.8, 85.2] },
      narrative_ar: { full_text: "سهم التجاري الدولي يتحرك في موجة دافعة ثالثة..." },
      narrative_en: { full_text: "COMI exhibits structural wave 3 expansion..." },
    },
    curlExample: `curl -X GET "https://borsatyai.com/api/analysis/COMI/full?timeframe=1D" \\
  -H "Accept: application/json"`,
    pythonExample: `import requests

res = requests.get("https://borsatyai.com/api/analysis/COMI/full", params={"timeframe": "1D"})
analysis = res.json()
print(f"Confluence: {analysis['confluence_score']}/100")`,
    tsExample: `const res = await fetch("https://borsatyai.com/api/analysis/COMI/full?timeframe=1D");
const fullAnalysis = await res.json();
console.log(fullAnalysis.confluence_score, fullAnalysis.regime);`,
  },
  {
    method: "POST",
    path: "/api/screener/query",
    titleEn: "Natural Language Quantitative Screener",
    titleAr: "مصفّي الأسهم باللغة الطبيعية (NLU Engine)",
    descriptionEn: "Parses Arabic and English natural text queries into structured quantitative filtering criteria.",
    descriptionAr: "معالجة الاستعلامات باللغة الطبيعية وتحويلها إلى فلاتر كمية رياضية على كافة أسهم السوق.",
    params: [
      { name: "query", type: "string", required: true, descEn: "Search query (e.g. 'أسهم مصرية بـ RSI تحت 30')", descAr: "نص الاستعلام المطلوب تصفيته" },
    ],
    responseSample: {
      interpreted_dsl: { market: "EGX", rsi_lt: 30 },
      results_count: 4,
      results: [
        { symbol: "EAST", close: 32.1, RSI_14: 26.4, changePct: -1.2 },
      ],
      execution_ms: 142,
    },
    curlExample: `curl -X POST "https://borsatyai.com/api/screener/query" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "أسهم مصرية بـ RSI تحت 30"}'`,
    pythonExample: `import requests

payload = {"query": "Saudi banking stocks with P/E under 15"}
res = requests.post("https://borsatyai.com/api/screener/query", json=payload)
print("Matches:", len(res.json()["results"]))`,
    tsExample: `const res = await fetch("/api/screener/query", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "أسهم مصرية صاعدة" }),
});
const screenerData = await res.json();`,
  },
];

export default function DocsPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const [selectedEndpoint, setSelectedEndpoint] = useState<number>(0);
  const [codeTab, setCodeTab] = useState<"curl" | "python" | "ts">("curl");
  const [copied, setCopied] = useState<boolean>(false);

  const endpoint = API_ENDPOINTS[selectedEndpoint];

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCodeSnippet = () => {
    if (codeTab === "python") return endpoint.pythonExample;
    if (codeTab === "ts") return endpoint.tsExample;
    return endpoint.curlExample;
  };

  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load Developer Portal"
      fallbackTitleAr="تعذر تحميل بوابة المطورين والوثائق البرمجية"
    >
      <div className="max-w-6xl mx-auto space-y-10 pb-16">
        {/* Header */}
        <div className="space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Terminal className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>{isAr ? "بوابة المطورين والواجهات البرمجية" : "Developer Portal & OpenAPI Specs"}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? "توثيق واجهات برمجة التطبيقات (API Docs)" : "Institutional REST API Reference"}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            {isAr
              ? "واجهات برمجية مهيأة للربط مع مكاتب التداول الآلي، وصناديق الاستثمار، والتطبيقات المالية لتبادل تحليلات وقرارات المحركات الكمية الحتمية."
              : "High-throughput, low-latency financial endpoints engineered for quantitative trading desks, fintech integrations, and institutional portfolio managers."}
          </p>
        </div>

        {/* Global Architecture Info Pill */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-slate-700">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">{isAr ? "عنوان الخادم الأساسي" : "Base URL"}</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">https://borsatyai.com</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-slate-700">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">{isAr ? "المصادقة والأمان" : "Authentication"}</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">Bearer & Session Token</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0 border border-slate-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold">{isAr ? "معدل الطلبات المقبول" : "Rate Limits"}</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">60 req/min (Burst 120)</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Navigation & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Navigation Column */}
          <div className="lg:col-span-4 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
              {isAr ? "النقاط البرمجية المتاحة:" : "Available Endpoints:"}
            </div>

            {API_ENDPOINTS.map((ep, idx) => {
              const active = idx === selectedEndpoint;
              return (
                <button
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(idx)}
                  className={`w-full text-start p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-sm"
                      : "bg-white dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                        ep.method === "GET"
                          ? active
                            ? "bg-white text-black dark:bg-black dark:text-white"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          : active
                          ? "bg-emerald-400 text-black"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="text-xs font-bold truncate">
                      {isAr ? ep.titleAr : ep.titleEn}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-mono truncate ${
                      active ? "text-slate-300 dark:text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {ep.path}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right / Endpoint Details Column */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 md:p-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-6">
              {/* Endpoint Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-mono font-black px-2.5 py-1 rounded ${
                      endpoint.method === "GET"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="text-sm md:text-base font-mono font-bold text-slate-900 dark:text-white">
                    {endpoint.path}
                  </span>
                </div>

                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {isAr ? endpoint.titleAr : endpoint.titleEn}
                </h3>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isAr ? endpoint.descriptionAr : endpoint.descriptionEn}
                </p>
              </div>

              {/* Parameters Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isAr ? "معاملات الطلب (Parameters):" : "Query & Path Parameters:"}
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-start text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                        <th className="py-2.5 px-3 text-start">{isAr ? "المعامل" : "Parameter"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "النوع" : "Type"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "الحالة" : "Required"}</th>
                        <th className="py-2.5 px-3 text-start">{isAr ? "الوصف" : "Description"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {endpoint.params.map((p) => (
                        <tr key={p.name}>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{p.type}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                p.required
                                  ? "bg-rose-500/10 text-rose-500"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              {p.required ? "Required" : "Optional"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                            {isAr ? p.descAr : p.descEn}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Samples Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setCodeTab("curl")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        codeTab === "curl"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setCodeTab("python")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        codeTab === "python"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setCodeTab("ts")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        codeTab === "ts"
                          ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      TypeScript
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopyCode(getCodeSnippet())}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">{isAr ? "تم النسخ" : "Copied"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isAr ? "نسخ الكود" : "Copy"}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto shadow-inner leading-relaxed">
                  <pre>{getCodeSnippet()}</pre>
                </div>
              </div>

              {/* Response JSON Sample */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? "نموذج الاستجابة (JSON Response 200 OK):" : "Sample Response (200 OK):"}
                  </h4>
                  <button
                    onClick={() => handleCopyCode(JSON.stringify(endpoint.responseSample, null, 2))}
                    className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isAr ? "نسخ JSON" : "Copy JSON"}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto shadow-inner max-h-80 leading-relaxed">
                  <pre>{JSON.stringify(endpoint.responseSample, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
