"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Logo from "@/components/branding/Logo";
import { useApp } from "@/context/AppContext";
import { generateStockPDF } from "@/lib/pdf-generator";

type JsonRecord = Record<string, unknown>;
type Language = "ar" | "en";

interface StockReportClientProps {
  company: {
    symbol: string;
    nameEn: string;
    nameAr: string;
    market: string;
    currency: string;
    sector: string;
  };
  quote: {
    price: number;
    change: number;
    changePct: number;
    freshness: string;
    priceTimestamp: string;
  };
  initialLanguage?: Language;
  autoDownload: boolean;
}

interface ReportData {
  decision: JsonRecord | null;
  analysis: JsonRecord | null;
  technical: JsonRecord | null;
  financials: JsonRecord | null;
  fairValue: JsonRecord | null;
  consensus: JsonRecord | null;
  dividends: JsonRecord | null;
  errors: Partial<Record<keyof Omit<ReportData, "errors">, string>>;
}

interface ResourceResult {
  data: JsonRecord | null;
  error: string | null;
}

const RATIO_LABELS: Record<string, { en: string; ar: string; percent?: boolean }> = {
  gross_margin: { en: "Gross margin", ar: "هامش إجمالي الربح", percent: true },
  operating_margin: { en: "Operating margin", ar: "هامش التشغيل", percent: true },
  net_margin: { en: "Net margin", ar: "هامش صافي الربح", percent: true },
  roe: { en: "Return on equity", ar: "العائد على حقوق الملكية", percent: true },
  roa: { en: "Return on assets", ar: "العائد على الأصول", percent: true },
  current_ratio: { en: "Current ratio", ar: "نسبة التداول" },
  quick_ratio: { en: "Quick ratio", ar: "النسبة السريعة" },
  debt_to_equity: { en: "Debt / equity", ar: "الدين إلى حقوق الملكية" },
  debt_to_ebitda: { en: "Debt / EBITDA", ar: "الدين إلى EBITDA" },
  interest_coverage: { en: "Interest coverage", ar: "تغطية الفوائد" },
  asset_turnover: { en: "Asset turnover", ar: "معدل دوران الأصول" },
  inventory_turnover: { en: "Inventory turnover", ar: "معدل دوران المخزون" },
  receivables_turnover: { en: "Receivables turnover", ar: "معدل دوران الذمم" },
  pe: { en: "P/E", ar: "مكرر الربحية" },
  pb: { en: "P/B", ar: "مكرر القيمة الدفترية" },
  ps: { en: "P/S", ar: "مكرر المبيعات" },
  ev_ebitda: { en: "EV / EBITDA", ar: "قيمة المنشأة إلى EBITDA" },
  peg: { en: "PEG", ar: "مكرر PEG" },
  dividend_yield: { en: "Dividend yield", ar: "عائد التوزيعات", percent: true },
  fcf_yield: { en: "Free cash flow yield", ar: "عائد التدفق النقدي الحر", percent: true },
};

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

async function fetchResource(path: string): Promise<ResourceResult> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return { data: null, error: `HTTP ${response.status}` };
    }
    const data = asRecord(await response.json());
    return data
      ? { data, error: null }
      : { data: null, error: "Invalid response" };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

function localizedNumber(value: number | null | undefined, language: Language, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

function localizedMoney(
  value: number | null | undefined,
  currency: string,
  language: Language
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(language === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${localizedNumber(value, language)} ${currency}`;
  }
}

function text(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function entryRange(value: unknown): [number | null, number | null] {
  if (Array.isArray(value)) {
    return [asNumber(value[0]), asNumber(value[1]) ?? asNumber(value[0])];
  }
  const range = asRecord(value);
  return [asNumber(range?.low), asNumber(range?.high)];
}

function formatKey(key: string): string {
  return key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SectionHeader({
  title,
  page,
  language,
}: {
  title: string;
  page: number;
  language: Language;
}) {
  return (
    <header className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
      <Logo variant="monochrome-black" size={23} showText className="shrink-0" />
      <div className="text-end">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {title}
        </p>
        <p className="mt-1 text-[9px] text-slate-400">
          {language === "ar" ? `الصفحة ${page} من 4` : `PAGE ${page} OF 4`}
        </p>
      </div>
    </header>
  );
}

function ReportFooter({ page, symbol }: { page: number; symbol: string }) {
  return (
    <footer className="absolute inset-x-[15mm] bottom-[7mm] flex justify-between border-t border-slate-200 pt-2 text-[8px] text-slate-400">
      <span>BORSATY · {symbol}</span>
      <span>{page} / 4</span>
    </footer>
  );
}

export default function StockReportClient({
  company,
  quote,
  initialLanguage,
  autoDownload,
}: StockReportClientProps) {
  const { language: appLanguage } = useApp();
  const language: Language = initialLanguage || (appLanguage === "ar" ? "ar" : "en");
  const isAr = language === "ar";
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const autoDownloadStarted = useRef(false);

  useEffect(() => {
    let active = true;
    const symbol = encodeURIComponent(company.symbol);
    const market = encodeURIComponent(company.market);

    async function loadReport() {
      const entries = await Promise.all([
        fetchResource(`/api/decision/${symbol}`),
        fetchResource(`/api/analysis/${symbol}/full`),
        fetchResource(`/api/technical-score/${symbol}`),
        fetchResource(`/api/fundamental/financials/${symbol}?period=annual&years=3`),
        fetchResource(`/api/fundamental/fair-value/${symbol}`),
        fetchResource(`/api/fundamental/analyst-consensus/${symbol}?market=${market}`),
        fetchResource(`/api/fundamental/dividends/${symbol}?market=${market}`),
      ]);
      if (!active) return;

      const [decision, analysis, technical, financials, fairValue, consensus, dividends] = entries;
      setReport({
        decision: decision.data,
        analysis: analysis.data,
        technical: technical.data,
        financials: financials.data,
        fairValue: fairValue.data,
        consensus: consensus.data,
        dividends: dividends.data,
        errors: {
          decision: decision.error || undefined,
          analysis: analysis.error || undefined,
          technical: technical.error || undefined,
          financials: financials.error || undefined,
          fairValue: fairValue.error || undefined,
          consensus: consensus.error || undefined,
          dividends: dividends.error || undefined,
        },
      });
      setLoading(false);
    }

    void loadReport();
    return () => {
      active = false;
    };
  }, [company.market, company.symbol]);

  const download = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await document.fonts.ready;
      await generateStockPDF(
        "stock-report-content",
        `Borsaty-${company.symbol}-${language}.pdf`
      );
    } catch (error) {
      setDownloadError(
        error instanceof Error
          ? error.message
          : isAr
            ? "تعذر إنشاء ملف PDF."
            : "Unable to generate the PDF."
      );
    } finally {
      setDownloading(false);
    }
  }, [company.symbol, isAr, language]);

  useEffect(() => {
    if (!autoDownload || !report || autoDownloadStarted.current) return;
    autoDownloadStarted.current = true;
    const timer = window.setTimeout(() => void download(), 250);
    return () => window.clearTimeout(timer);
  }, [autoDownload, download, report]);

  const decision = report?.decision;
  const analysis = report?.analysis;
  const financials = report?.financials;
  const fairValue = report?.fairValue;
  const consensus = report?.consensus;
  const dividends = report?.dividends;
  const tradePlan = asRecord(analysis?.trade_plan);
  const [entryLow, entryHigh] = entryRange(decision?.entry_zone ?? tradePlan?.entry_zone);
  const stop = asNumber(decision?.stop_loss) ?? asNumber(tradePlan?.stop_loss);
  const decisionTargets = asArray(decision?.targets).map(asNumber).filter((value): value is number => value !== null);
  const planTargets = asArray(tradePlan?.targets)
    .map((target) => {
      const item = asRecord(target);
      return asNumber(item?.price) ?? asNumber(target);
    })
    .filter((value): value is number => value !== null);
  const targets = decisionTargets.length ? decisionTargets : planTargets;
  const riskPerShare =
    entryLow !== null && entryHigh !== null && stop !== null
      ? Math.abs((entryLow + entryHigh) / 2 - stop)
      : null;
  const fairModels = asRecord(fairValue?.models);
  const ratioValues = asRecord(financials?.ratios);
  const ratios = Object.entries(RATIO_LABELS).map(([key, label]) => ({
    key,
    label: isAr ? label.ar : label.en,
    value: asNumber(ratioValues?.[key]),
    percent: Boolean(label.percent),
  }));
  const incomeStatements = asArray(financials?.income_statement)
    .map(asRecord)
    .filter((item): item is JsonRecord => item !== null)
    .slice(0, 3);
  const balanceStatements = asArray(financials?.balance_sheet)
    .map(asRecord)
    .filter((item): item is JsonRecord => item !== null)
    .slice(0, 3);
  const cashFlowStatements = asArray(financials?.cash_flow)
    .map(asRecord)
    .filter((item): item is JsonRecord => item !== null)
    .slice(0, 3);
  const statementSections = [
    {
      label: isAr ? "قائمة الدخل" : "Income statement",
      entries: incomeStatements,
      rows: [
        { field: "revenue", label: isAr ? "الإيرادات" : "Revenue" },
        { field: "operating_income", label: isAr ? "الدخل التشغيلي" : "Operating income" },
        { field: "net_income", label: isAr ? "صافي الدخل" : "Net income" },
        { field: "eps", label: "EPS" },
        { field: "ebitda", label: "EBITDA" },
      ],
    },
    {
      label: isAr ? "الميزانية العمومية" : "Balance sheet",
      entries: balanceStatements,
      rows: [
        { field: "total_assets", label: isAr ? "إجمالي الأصول" : "Total assets" },
        { field: "total_liabilities", label: isAr ? "إجمالي الالتزامات" : "Total liabilities" },
        { field: "total_equity", label: isAr ? "حقوق الملكية" : "Total equity" },
      ],
    },
    {
      label: isAr ? "التدفقات النقدية" : "Cash flow",
      entries: cashFlowStatements,
      rows: [
        { field: "operating_cf", label: isAr ? "التدفق التشغيلي" : "Operating cash flow" },
        { field: "free_cf", label: isAr ? "التدفق النقدي الحر" : "Free cash flow" },
      ],
    },
  ];
  const technicalComponents = asRecord(report?.technical?.components);
  const analysisEngines = asRecord(asRecord(analysis?.confluence)?.engines);
  const narrative = asString(asRecord(isAr ? analysis?.narrative_ar : analysis?.narrative_en)?.full_text);
  const reasons = asArray(decision?.[isAr ? "why_ar" : "why_en"]).filter(
    (item): item is string => typeof item === "string"
  );
  const disclaimer = asString(decision?.[isAr ? "disclaimer_ar" : "disclaimer_en"]);
  const decisionDirection = asString(decision?.direction);
  const reportDate = new Date(quote.priceTimestamp);
  const formattedReportDate = Number.isFinite(reportDate.getTime())
    ? new Intl.DateTimeFormat(isAr ? "ar-EG" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(reportDate)
    : "—";
  const companyName = isAr
    ? company.nameAr || company.nameEn || company.symbol
    : company.nameEn || company.nameAr || company.symbol;
  const decisionValue = text(decision?.decision ?? tradePlan?.direction, isAr ? "غير متاح" : "Unavailable");
  const decisionLabel = decisionValue.replaceAll("_", " ").toUpperCase();
  const priceChange = `${quote.change >= 0 ? "+" : ""}${localizedNumber(quote.change, language)} (${quote.changePct >= 0 ? "+" : ""}${localizedNumber(quote.changePct, language)}%)`;
  const availableErrors = Object.entries(report?.errors || {}).filter(([, error]) => error);

  return (
    <div className="mx-auto w-full overflow-x-auto py-4">
      <div className="mx-auto mb-4 flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-lg font-bold text-slate-900">
            {isAr ? "تقرير بورصتي المؤسسي" : "Borsaty Institutional Report"}
          </h1>
          <p className="text-xs text-slate-500">
            {loading
              ? isAr
                ? "جارٍ تحميل بيانات التقرير..."
                : "Loading report data..."
              : isAr
                ? "تم تحميل البيانات من واجهات المنصة."
                : "Report data loaded from platform APIs."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void download()}
          disabled={loading || downloading}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? isAr ? "جارٍ إنشاء PDF..." : "Generating PDF..."
            : isAr ? "تحميل PDF" : "Download PDF"}
        </button>
      </div>

      {downloadError && (
        <p role="alert" className="mx-auto mb-3 w-full max-w-[210mm] text-sm text-rose-700 print:hidden">
          {downloadError}
        </p>
      )}
      {availableErrors.length > 0 && (
        <details className="mx-auto mb-3 w-full max-w-[210mm] text-xs text-amber-800 print:hidden">
          <summary className="cursor-pointer">
            {isAr ? "تعذر تحميل بعض مصادر البيانات" : "Some report data sources could not be loaded"}
          </summary>
          <ul className="mt-1 list-inside list-disc">
            {availableErrors.map(([key, error]) => (
              <li key={key}>{key}: {error}</li>
            ))}
          </ul>
        </details>
      )}

      <div id="stock-report-content" className="stock-report-document mx-auto w-[210mm] bg-white shadow-xl">
        <section className="stock-report-page relative" dir={isAr ? "rtl" : "ltr"}>
          <SectionHeader
            title={isAr ? "تقرير تحليل السهم" : "EQUITY ANALYSIS REPORT"}
            page={1}
            language={language}
          />
          <div className="flex h-[225mm] flex-col justify-between">
            <div className="pt-8">
              <Logo variant="monochrome-black" size={48} showText className="mb-12" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {company.market} · {company.symbol}
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">
                {companyName}
              </h1>
              {company.sector && <p className="mt-2 text-sm text-slate-500">{company.sector}</p>}

              <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {isAr ? "السعر الحالي" : "CURRENT PRICE"}
                </p>
                <p className="mt-2 text-4xl font-black tabular-nums text-slate-950">
                  {localizedMoney(quote.price, company.currency, language)}
                </p>
                <p className={`mt-2 text-sm font-semibold ${quote.change >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {priceChange}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
                  <span>{isAr ? "حالة السعر" : "Price status"}: {quote.freshness}</span>
                  <span>{formattedReportDate}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-950 p-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">
                {isAr ? "القرار الكمي" : "QUANTITATIVE DECISION"}
              </p>
              <div className="mt-3 flex items-end justify-between gap-5">
                <h2 className="text-3xl font-black">{decisionLabel}</h2>
                <p className="text-sm text-white/75">
                  {decision?.confidence_score !== undefined
                    ? `${localizedNumber(asNumber(decision.confidence_score)! * 100, language, 0)}%`
                    : "—"}
                  {" "}{isAr ? "درجة الثقة" : "confidence"}
                </p>
              </div>
              {decisionDirection && (
                <p className="mt-3 text-sm text-white/75">
                  {isAr ? "الاتجاه" : "Direction"}: {decisionDirection}
                </p>
              )}
            </div>
          </div>
          <ReportFooter page={1} symbol={company.symbol} />
        </section>

        <section className="stock-report-page pdf-page-break relative" dir={isAr ? "rtl" : "ltr"}>
          <SectionHeader
            title={isAr ? "خطة التداول وإدارة المخاطر" : "TRADE PLAN & RISK"}
            page={2}
            language={language}
          />
          <h1 className="mb-1 text-2xl font-black">
            {isAr ? "مستويات التنفيذ" : "Execution levels"}
          </h1>
          <p className="mb-6 text-xs text-slate-500">{company.symbol} · {company.market}</p>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label={isAr ? "منطقة الدخول" : "Entry zone"}
              value={entryLow === null ? "—" : entryHigh === null || entryLow === entryHigh
                ? localizedMoney(entryLow, company.currency, language)
                : `${localizedMoney(entryLow, company.currency, language)} – ${localizedMoney(entryHigh, company.currency, language)}`}
            />
            <MetricCard
              label={isAr ? "وقف الخسارة" : "Stop loss"}
              value={localizedMoney(stop, company.currency, language)}
            />
            <MetricCard
              label={isAr ? "العائد إلى المخاطرة" : "Risk / reward"}
              value={localizedNumber(asNumber(decision?.primary_rr) ?? asNumber(tradePlan?.primary_rr), language)}
            />
            <MetricCard
              label={isAr ? "المخاطرة لكل سهم" : "Risk per share"}
              value={localizedMoney(riskPerShare, company.currency, language)}
            />
          </div>

          <div className="mt-6">
            <h2 className="mb-3 text-sm font-bold">
              {isAr ? "الأهداف السعرية" : "Price targets"}
            </h2>
            {targets.length ? (
              <div className="grid grid-cols-3 gap-3">
                {targets.map((target, index) => (
                  <MetricCard
                    key={`${target}-${index}`}
                    label={`${isAr ? "الهدف" : "Target"} ${index + 1}`}
                    value={localizedMoney(target, company.currency, language)}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                {isAr ? "لا توجد أهداف منشورة من بيانات الخطة." : "No targets were provided by the trade-plan data."}
              </p>
            )}
          </div>

          <div className="mt-7 rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-bold">{isAr ? "حجم المركز" : "Position sizing"}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isAr
                ? "احسب عدد الأسهم وفق رأس المال ومعدل المخاطرة الشخصي: (رأس المال × نسبة المخاطرة) ÷ المخاطرة لكل سهم. لم يُفترض رأس مال أو نسبة مخاطرة."
                : "Calculate shares using your own capital and risk tolerance: (account balance × risk %) ÷ risk per share. No account balance or risk percentage has been assumed."}
            </p>
            <p className="mt-3 font-mono text-xs text-slate-500" dir="ltr">
              Shares = (Account balance × Risk %) ÷ Risk per share
            </p>
          </div>

          {decision && (
            <div className="mt-7">
              <h2 className="mb-2 text-sm font-bold">{isAr ? "ملخص الخطة" : "Plan rationale"}</h2>
              <ul className="space-y-2 text-sm leading-6 text-slate-700">
                {asArray(decision[isAr ? "why_ar" : "why_en"])
                  .filter((item): item is string => typeof item === "string")
                  .slice(0, 3)
                  .map((reason, index) => <li key={index}>• {reason}</li>)}
              </ul>
            </div>
          )}
          <ReportFooter page={2} symbol={company.symbol} />
        </section>

        <section className="stock-report-page pdf-page-break relative" dir={isAr ? "rtl" : "ltr"}>
          <SectionHeader
            title={isAr ? "الأدلة الفنية والمالية" : "TECHNICAL & FUNDAMENTAL EVIDENCE"}
            page={3}
            language={language}
          />
          <h1 className="mb-4 text-2xl font-black">
            {isAr ? "الأدلة الفنية والمالية" : "Technical & financial evidence"}
          </h1>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {isAr ? "الدرجة الفنية" : "TECHNICAL SCORE"}
              </p>
              <p className="mt-1 text-xl font-black">
                {localizedNumber(asNumber(report?.technical?.score), language, 1)}
              </p>
              <p className="text-[10px] text-slate-500">
                {text(isAr ? report?.technical?.verdict_ar : report?.technical?.verdict)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {isAr ? "التوافق متعدد المحركات" : "MULTI-ENGINE CONFLUENCE"}
              </p>
              <p className="mt-1 text-xl font-black">
                {localizedNumber(
                  asNumber(asRecord(analysis?.confluence)?.score) === null
                    ? null
                    : asNumber(asRecord(analysis?.confluence)?.score)! * 100,
                  language,
                  1
                )}
              </p>
              <p className="text-[10px] text-slate-500">
                {text(asRecord(analysis?.confluence)?.strength)}
              </p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-5 gap-2">
            {Object.entries(technicalComponents || {}).slice(0, 5).map(([key, value]) => (
              <div key={key} className="rounded-md bg-slate-50 p-2 text-center">
                <p className="truncate text-[8px] text-slate-500">{formatKey(key)}</p>
                <p className="mt-1 text-xs font-bold">{localizedNumber(asNumber(value), language, 1)}</p>
              </div>
            ))}
          </div>

          {analysisEngines && Object.keys(analysisEngines).length > 0 && (
            <div className="mb-4">
              <h2 className="mb-2 text-xs font-bold">{isAr ? "إشارات الأنماط والمحركات" : "Pattern & engine signals"}</h2>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(analysisEngines).slice(0, 6).map(([key, value]) => {
                  const engine = asRecord(value);
                  const rationale = asString(engine?.[isAr ? "rationale_ar" : "rationale_en"]);
                  return (
                    <div key={key} className="rounded-md border border-slate-200 p-2">
                      <p className="text-[9px] font-bold">{formatKey(key)}</p>
                      <p className="mt-1 line-clamp-2 text-[8px] leading-3 text-slate-500">
                        {rationale || text(engine?.pattern_name ?? engine?.status, isAr ? "غير متاح" : "Unavailable")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <h2 className="mb-2 text-xs font-bold">{isAr ? "القيمة العادلة — النماذج المتاحة" : "Fair value — available models"}</h2>
            {fairModels && Object.keys(fairModels).length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(fairModels).slice(0, 9).map(([key, value]) => {
                  const model = asRecord(value);
                  return (
                    <div key={key} className="flex justify-between gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-[9px]">
                      <span className="truncate text-slate-600">{formatKey(key)}</span>
                      <strong className="shrink-0">
                        {localizedMoney(asNumber(model?.value), company.currency, language)}
                      </strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500">{isAr ? "بيانات التقييم غير متاحة." : "Valuation data unavailable."}</p>
            )}
          </div>

          <div className="mb-3">
            <h2 className="mb-2 text-xs font-bold">{isAr ? "القوائم المالية — آخر 3 سنوات" : "Financial statements — last 3 years"}</h2>
            {incomeStatements.length > 0 ? (
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-slate-100 text-start">
                    <th className="p-1.5 text-start">{isAr ? "البند" : "Item"}</th>
                    {incomeStatements.map((item, index) => (
                      <th key={`${text(item.year)}-${index}`} className="p-1.5 text-end">{text(item.year)}</th>
                    ))}
                  </tr>
                </thead>
                {statementSections.map((section) => (
                  section.entries.length > 0 && (
                    <tbody key={section.label}>
                      <tr className="bg-slate-50 font-semibold">
                        <th colSpan={incomeStatements.length + 1} className="p-1.5 text-start">
                          {section.label}
                        </th>
                      </tr>
                      {section.rows.map(({ field, label }) => (
                        <tr key={field} className="border-b border-slate-100">
                          <td className="p-1.5">{label}</td>
                          {incomeStatements.map((_, index) => (
                            <td key={`${field}-${index}`} className="p-1.5 text-end tabular-nums">
                              {localizedNumber(asNumber(section.entries[index]?.[field]), language)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  )
                ))}
              </table>
            ) : (
              <p className="text-[10px] text-slate-500">{isAr ? "القوائم المالية غير متاحة." : "Financial statements unavailable."}</p>
            )}
          </div>

          <div className="mb-3">
            <h2 className="mb-2 text-xs font-bold">{isAr ? "النسب المالية" : "Financial ratios"}</h2>
            {financials?.data_quality && (asRecord(financials.data_quality)?.is_available === false) ? (
              <p className="text-[10px] text-slate-500">{isAr ? "بيانات النسب غير متاحة." : "Ratio data unavailable."}</p>
            ) : (
              <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                {ratios.map((ratio) => {
                  const value = ratio.value === null
                    ? "—"
                    : ratio.percent
                      ? `${localizedNumber(ratio.value * 100, language)}%`
                      : localizedNumber(ratio.value, language);
                  return (
                    <div key={ratio.key} className="flex justify-between gap-1 border-b border-slate-100 py-1 text-[8px]">
                      <span className="truncate text-slate-500">{ratio.label}</span>
                      <strong className="shrink-0">{value}</strong>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
            <div>
              <h2 className="mb-1 text-[10px] font-bold">{isAr ? "إجماع المحللين" : "Analyst consensus"}</h2>
              {asRecord(consensus?.consensus) ? (
                <p className="text-[9px] text-slate-600">
                  {text(asRecord(consensus?.consensus)?.recommendation)} ·{" "}
                  {localizedNumber(asNumber(asRecord(consensus?.consensus)?.total_analysts), language, 0)}{" "}
                  {isAr ? "محلل" : "analysts"} ·{" "}
                  {localizedMoney(asNumber(asRecord(consensus?.price_targets)?.average), company.currency, language)}
                </p>
              ) : (
                <p className="text-[9px] text-slate-500">{text(isAr ? consensus?.message_ar : consensus?.message_en, isAr ? "لا تتوفر بيانات محللين." : "Analyst data unavailable.")}</p>
              )}
            </div>
            <div>
              <h2 className="mb-1 text-[10px] font-bold">{isAr ? "التوزيعات" : "Dividends"}</h2>
              <p className="text-[9px] text-slate-600">
                {asRecord(dividends?.current_yield)
                  ? `${localizedMoney(asNumber(asRecord(dividends?.current_yield)?.annual_dividend), company.currency, language)} · ${localizedNumber(asNumber(asRecord(dividends?.current_yield)?.current_yield_pct), language)}%`
                  : text(isAr ? dividends?.message_ar : dividends?.message_en, isAr ? "لا تتوفر بيانات التوزيعات." : "Dividend data unavailable.")}
              </p>
            </div>
          </div>
          <ReportFooter page={3} symbol={company.symbol} />
        </section>

        <section className="stock-report-page pdf-page-break relative" dir={isAr ? "rtl" : "ltr"}>
          <SectionHeader
            title={isAr ? "ملخص التحليل والإفصاح" : "SUMMARY & DISCLOSURE"}
            page={4}
            language={language}
          />
          <h1 className="mb-2 text-2xl font-black">
            {isAr ? "ملخص التحليل" : "Analysis summary"}
          </h1>
          <p className="mb-7 text-xs text-slate-500">{companyName} · {company.symbol} · {formattedReportDate}</p>

          <div className="min-h-[105mm] rounded-xl bg-slate-50 p-6">
            <h2 className="mb-4 text-sm font-bold">{isAr ? "السرد التحليلي" : "Narrative"}</h2>
            {narrative ? (
              <p className="whitespace-pre-line text-sm leading-8 text-slate-700">{narrative}</p>
            ) : reasons.length > 0 ? (
              <ul className="space-y-3 text-sm leading-7 text-slate-700">
                {reasons.map((reason, index) => <li key={index}>• {reason}</li>)}
              </ul>
            ) : (
              <p className="text-sm leading-7 text-slate-500">
                {isAr ? "لا يتوفر ملخص سردي من مصدر التحليل." : "No narrative summary is available from the analysis source."}
              </p>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5">
            <h2 className="mb-2 text-sm font-bold text-amber-950">
              {isAr ? "إخلاء المسؤولية" : "Disclaimer"}
            </h2>
            <p className="text-xs leading-6 text-amber-950">
              {disclaimer || (isAr
                ? "هذا التقرير لأغراض المعلومات والتعليم فقط، ولا يُعد توصية أو مشورة استثمارية. قرارات الاستثمار مسؤولية المستخدم."
                : "This report is for informational and educational purposes only and is not investment advice or a recommendation. Investment decisions remain the user's responsibility.")}
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-4 text-[9px] text-slate-400">
            <span>{isAr ? "مصدر السعر" : "Price source"}: {quote.freshness}</span>
            <span>{isAr ? "وقت السعر" : "Price timestamp"}: {formattedReportDate}</span>
          </div>
          <ReportFooter page={4} symbol={company.symbol} />
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[25mm] rounded-xl border border-slate-200 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-bold tabular-nums text-slate-950">{value}</p>
    </div>
  );
}
