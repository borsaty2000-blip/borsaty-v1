"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  GitCommit,
  CheckCircle2,
  Calendar,
  Layers,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ChangelogEntry {
  version: string;
  tag: string;
  date: string;
  dateAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
  badge: "major" | "feature" | "hardening";
}

const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "v2.4.0",
    tag: "Institutional Release",
    date: "November 2026",
    dateAr: "نوفمبر 2026",
    titleEn: "Institutional Polish, Sector Heatmap & Compare Terminal",
    titleAr: "الترسيخ المؤسسي، خريطة القطاعات الحرارية وأداة مقارنة الأسهم",
    descriptionEn:
      "Major institutional upgrade adding Finviz-grade market heatmap, side-by-side asset comparison, developer portal, and PWA mobile execution.",
    descriptionAr:
      "ترقية مؤسسية كبرى تشمل خريطة حرارية للأسواق على طراز Finviz، ومقارنة رأس برأس بين الأسهم، وبوابة المطورين، ودعم PWA بالكامل.",
    badge: "major",
    highlightsEn: [
      "Dynamic interactive Sector Heatmap with live market cap scaling",
      "Side-by-side Stock Compare Terminal with normalized percentage charts",
      "Developer API portal with OpenAPI specifications and code samples",
      "Full Progressive Web App (PWA) offline manifest and standalone execution",
      "Live platform status monitoring and system uptime telemetry",
    ],
    highlightsAr: [
      "خريطة حرارية تفاعلية للقطاعات مع قياس مرجح بالقيمة السوقية ونسب التغير",
      "محطة مقارنة شاملة للأسهم مع رسم بياني للنسب المئوية المقارنة",
      "بوابة المطورين وتوثيق برمجيات الربط API مع أمثلة كود جاهزة",
      "تطبيق ويب تقدمي (PWA) كامل مع وضع التشغيل المستقل والتثبيت على الهاتف",
      "شاشة حالة النظام الحية وقياسات زمن الاستجابة للمحركات",
    ],
  },
  {
    version: "v2.3.0",
    tag: "Performance & Security",
    date: "November 2026",
    dateAr: "نوفمبر 2026",
    titleEn: "Black Institutional Branding, Sub-1s LCP & Security Hardening",
    titleAr: "الهوية المؤسسية السوداء، سرعة فائقة وتحصين أمني مشدد",
    descriptionEn:
      "Complete visual transformation to pure institutional black, dynamic chart splitting for sub-second LCP, strict HTTP security headers, and keyboard navigation.",
    descriptionAr:
      "تحول بصري كامل للهوية المؤسسية السوداء، وتقسيم كود الشارتات لتحقيق تحميل فوري تحت ثانية واحدة، وترويس الأمان الصارمة واختصارات لوحة المفاتيح.",
    badge: "hardening",
    highlightsEn: [
      "Pure Institutional aesthetic with grayscale and subtle navy accents",
      "Sub-second Largest Contentful Paint (LCP) with next/dynamic chart splitting",
      "Strict security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy)",
      "Global keyboard shortcuts (Ctrl+K, G+H, G+P, G+W, G+S)",
      "Smart empty states and celebratory confetti on portfolio executions",
    ],
    highlightsAr: [
      "تصميم مؤسسي نقي بدرجات الرمادي ولمسات كحلية رصينة",
      "تحميل فوري LCP تحت ثانية واحدة عبر التقسيم الديناميكي للمكتبات الثقيلة",
      "ترويسات أمان قياسية صارمة (HSTS, X-Frame-Options, Content-Type, Permissions)",
      "اختصارات سريعة للوحة المفاتيح (Ctrl+K, G+H, G+P, G+W, G+S)",
      "حالات فارغة ذكية مع تأثيرات Confetti احتفالية عند إتمام صفقات المحفظة",
    ],
  },
  {
    version: "v2.2.0",
    tag: "Technical Depth",
    date: "October 2026",
    dateAr: "أكتوبر 2026",
    titleEn: "Command Center Terminal & Synced Multi-Timeframe Charts",
    titleAr: "غرفة عمليات السهم الموحدة ورسوم بيانية متزامنة متعددة الأطر",
    descriptionEn:
      "Stock Detail page transformed into an institutional trading terminal with synced RSI and MACD sub-panels and multi-timeframe trend alignment.",
    descriptionAr:
      "إعادة تصميم صفحة السهم لتتحول إلى غرفة عمليات متكاملة مع نوافذ RSI و MACD متزامنة بدقة ومصفوفة توافق الأطر الزمنية.",
    badge: "feature",
    highlightsEn: [
      "Institutional Command Center header with circular confluence gauge",
      "5-Timeframe trend alignment matrix (15M, 1H, 4H, 1D, 1W)",
      "Timescale-synchronized multi-panel PriceChart (Candlesticks, RSI, MACD)",
      "Order Book proxy depth and volume pressure analysis",
      "Multi-category technical summary matrix across 21 indicators",
    ],
    highlightsAr: [
      "شريط غرفة العمليات المؤسسي مع عداد التوافق الدائري المتطور",
      "مصفوفة اتجاهات ومطابقة 5 أطر زمنية (15د، 1س، 4س، يومي، أسبوعي)",
      "رسم بياني متزامن المحاور والنطاقات الزمنية (شموع يابانية، RSI، MACD)",
      "مؤشر ضغط العرض والطلب وتقييم عمق السيولة",
      "ملخص فني مؤسسي متعدد الفئات يغطي 21 مؤشراً كمياً",
    ],
  },
  {
    version: "v2.1.0",
    tag: "Platform Foundation",
    date: "October 2026",
    dateAr: "أكتوبر 2026",
    titleEn: "Portfolio Terminal, User Watchlists & Clerk Auth",
    titleAr: "محفظة الأوراق المالية، قوائم المتابعة وتوثيق المستخدمين",
    descriptionEn:
      "Empowered traders with real-time mark-to-market portfolio accounting, Neon serverless watchlist persistence, and secure Clerk authentication.",
    descriptionAr:
      "تمكين المتداولين من تتبع صفقاتهم وأرباحهم غير المحققة لحظياً، وقوائم متابعة سريعة عبر قاعدة بيانات Neon وحسابات آمنة مع Clerk.",
    badge: "feature",
    highlightsEn: [
      "Mark-to-market portfolio engine with automatic cost-basis & P&L calculation",
      "Sector exposure breakdown and transaction history management",
      "Server-persisted Watchlist system with one-click toggles and live quotes",
      "Seamless bi-directional Arabic and English authentication flows",
    ],
    highlightsAr: [
      "محرك تتبع المحفظة وإعادة التقييم اليومي لاحتساب الأرباح والخسائر ومتوسط التكلفة",
      "تحليل توزيع القطاعات وإدارة سجل الصفقات التاريخية",
      "قوائم متابعة محفوظة سحابياً مع تحديث فوري لأسعار الأسهم",
      "تسجيل دخول موحد وسلس باللغتين العربية والإنجليزية",
    ],
  },
  {
    version: "v1.0.0",
    tag: "Genesis",
    date: "August 2026",
    dateAr: "أغسطس 2026",
    titleEn: "Genesis: 8 Quantitative Engines & Institutional PDF Engine",
    titleAr: "الإطلاق التأسيسي: 8 محركات كمية وخوارزمية وتقارير PDF عالية الدقة",
    descriptionEn:
      "Core mathematical engine deployment connecting HSPD, Elliott Waves, Harmonics, Classical Patterns, Confluence, and WeasyPrint PDF publication.",
    descriptionAr:
      "إطلاق النواة الحسابية الرياضية عبر دمج محركات إليوت، والهارمونيك، والأنماط الكلاسيكية، ونقاط التوافق، وتقارير PDF المؤسسية.",
    badge: "major",
    highlightsEn: [
      "8 mathematical engines operational with 560+ automated test verifications",
      "Zero-hallucination dual-authored analytical narrator (Arabic & English)",
      "Institutional PDF generation engine with high-resolution vector charts",
      "Cross-market coverage across EGX, TASI, and US Markets",
    ],
    highlightsAr: [
      "تشغيل 8 محركات كمية مثبتة بأكثر من 560 اختبار وحدة مؤتمت",
      "محرك سرد تحليلي ثنائي اللغة منعدم الهلوسة يعتمد كلياً على الأرقام الحتمية",
      "نظام توليد تقارير PDF المؤسسية عبر محرك WeasyPrint بدقة طباعة فائقة",
      "تغطية أسواق المال في مصر (EGX)، والسعودية (TASI)، والأسواق الأمريكية",
    ],
  },
];

export default function ChangelogPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load platform changelog"
      fallbackTitleAr="تعذر تحميل سجل التحديثات"
    >
      <div className="max-w-4xl mx-auto space-y-10 pb-16">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200">
            <GitCommit className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>{isAr ? "سجل الإصدارات المؤسسي" : "Institutional Changelog"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? "سجل التحديثات والتطور" : "Product Updates & Changelog"}
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "توثيق مستمر لكل إصدار وترقية وتحديث أمني أو كمي يطرأ على منصة بورصتي لضمان الشفافية المؤسسية الكاملة."
              : "Continuous institutional documentation of releases, mathematical engines, performance benchmarks, and security enhancements."}
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative border-s-2 border-slate-200 dark:border-slate-800 ms-4 md:ms-8 ps-6 md:ps-10 space-y-12">
          {CHANGELOG_DATA.map((entry, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={entry.version} className="relative group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -start-[31px] md:-start-[47px] top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-[#0B1120] transition-colors ${
                    isLatest
                      ? "bg-slate-900 dark:bg-white shadow-sm"
                      : "bg-slate-400 dark:bg-slate-600 group-hover:bg-slate-900 dark:group-hover:bg-white"
                  }`}
                />

                {/* Card Container */}
                <div className="p-6 md:p-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group-hover:border-slate-400 dark:group-hover:border-slate-700">
                  {/* Top Bar: Version + Tag + Date */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono">
                        {entry.version}
                      </span>
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          entry.badge === "major"
                            ? "bg-black text-white dark:bg-white dark:text-slate-900"
                            : entry.badge === "hardening"
                            ? "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {entry.tag}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isAr ? entry.dateAr : entry.date}</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-2">
                    {isAr ? entry.titleAr : entry.titleEn}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
                    {isAr ? entry.descriptionAr : entry.descriptionEn}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {isAr ? "أبرز التحسينات والميزات:" : "Key Improvements:"}
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {(isAr ? entry.highlightsAr : entry.highlightsEn).map((hl, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation CTA */}
        <div className="p-6 md:p-8 rounded-lg bg-slate-900 text-white dark:bg-black border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white mb-1">
              {isAr ? "استكشف محركات التحليل المباشرة" : "Explore Quantitative Engines Live"}
            </h4>
            <p className="text-xs text-slate-400">
              {isAr
                ? "جرب الفحص اللحظي المباشر لأي سهم في البورصة المصرية أو السوق السعودي الآن."
                : "Experience quantitative multi-engine analysis across EGX, TASI, and US Equities."}
            </p>
          </div>
          <Link
            href="/stock/COMI"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-colors shrink-0"
          >
            <span>{isAr ? "فحص سهم CIB مصر" : "Inspect COMI Stock"}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
}
