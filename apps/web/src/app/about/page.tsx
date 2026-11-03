"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Scale,
  Award,
  Globe,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AboutPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const coreValues = [
    {
      icon: Cpu,
      titleEn: "Quantitative & Algorithmic Grounding",
      titleAr: "الأساس الرياضي والكمي",
      descEn:
        "Every price target, pivot level, and trade plan is derived strictly from validated mathematical equations (Fibonacci, Elliott, Gann, Harmonics) — never guessed arbitrarily.",
      descAr:
        "كل هدف سعري أو مستوى وقف أو نقطة تحول يُحسب حصرياً وفق نماذج رياضية وهندسية صارمة ومبني على قواعد كمية موثقة ومعلنة.",
    },
    {
      icon: Scale,
      titleEn: "Statistical Rigor & Integrity",
      titleAr: "النزاهة والصرامة الإحصائية",
      descEn:
        "We never boast misleading hit rates. Historical performance is reported only when sample size (n >= 30) is statistically adequate, accompanied by 95% Wilson confidence intervals.",
      descAr:
        "نرفض الادعاءات التسويقية الزائفة. لا نعلن أي نسبة نجاح دون اكتمال عينة إحصائية كافية (n >= 30) ومرفقة بفترات ثقة ويلسون 95% لضمان أعلى معايير الشفافية.",
    },
    {
      icon: ShieldCheck,
      titleEn: "Data Truth & Proxy Transparency",
      titleAr: "شفافية البيانات ومصادرها",
      descEn:
        "When level-2 order book depth is unavailable from regional exchanges, Borsaty explicitly flags it and transparently deploys audited synthetic volume proxies.",
      descAr:
        "عند عدم توفر عمق سجل الأوامر اللحظي في بعض البورصات الإقليمية، تعلن المنصة ذلك صراحة وتستخدم مؤشرات بديلة مدققة وموسومة بوضوح تام.",
    },
    {
      icon: Globe,
      titleEn: "Native Arabic & Global Standard",
      titleAr: "عربية أصيلة بمعايير وول ستريت",
      descEn:
        "Built from day one with bilingual architecture, supporting native RTL typography, ticker aliases, and institutional dual-authored narrative generation.",
      descAr:
        "صُممت المنصة منذ اليوم الأول لتكون عربية الهوية عالمية المستوى، مع دعم كامل للاتجاه من اليمين لليسار، والأسماء الشائعة للشركات، والسرد المالي المتقن.",
    },
  ];

  const architectureStats = [
    { value: "8", labelEn: "Quantitative Engines", labelAr: "محركات كمية وخوارزمية" },
    { value: "560+", labelEn: "Automated Verifications", labelAr: "اختبار فحص مؤتمت" },
    { value: "< 1s", labelEn: "Target LCP Render", labelAr: "زمن التحميل الفوري" },
    { value: "99.98%", labelEn: "Platform Availability", labelAr: "نسبة الجاهزية التشغيلية" },
  ];

  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load About page"
      fallbackTitleAr="تعذر تحميل صفحة نبذة عن المنصة"
    >
      <div className="max-w-5xl mx-auto space-y-12 pb-16">
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
            <Award className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>{isAr ? "الريادة المؤسسية في التحليل الكمي" : "Institutional Quantitative Terminal"}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {isAr
              ? "إعادة تعريف صناعة القرار المالي في العالم العربي"
              : "Institutional Intelligence for Modern Financial Markets"}
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            {isAr
              ? "بورصتي هي المنصة المالية التي تجمع بين المحركات الهندسية الكمية والتحليل متعدد الأطر، لتقديم قرارات تداول استثمارية موثوقة ومثبتة تاريخياً للمستثمرين الأفراد والمؤسسات."
              : "Borsaty connects quantitative mathematical models, multi-timeframe confluence, and live market infrastructure to empower investors with institutional-grade clarity across Cairo, Riyadh, and Wall Street."}
          </p>
        </div>

        {/* Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {architectureStats.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white font-mono mb-1">
                {stat.value}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {isAr ? stat.labelAr : stat.labelEn}
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement Card */}
        <div className="p-8 md:p-10 rounded-lg bg-slate-950 text-white border border-slate-800 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <span className="text-xs font-mono font-semibold uppercase tracking-widest text-slate-400">
              {isAr ? "رسالتنا المؤسسية" : "Our Institutional Mission"}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {isAr
                ? "القضاء على التكهنات العشوائية واستبدالها بالرياضيات الصارمة"
                : "Eliminating Guesswork Through Mathematical Discipline"}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              {isAr
                ? "لسنوات طويلة ظلت الأسواق المالية في المنطقة أسيرة الشائعات والتحليلات المتضاربة دون أساس رياضي واضح. مهمتنا في بورصتي هي توفير منصة مكافئة لأنظمة التداول في كبرى صناديق التحوط العالمية: دقة خوارزمية، وحساب دقيق لمعدلات العائد مقابل المخاطرة (R:R)، ونماذج تحقق تاريخي متدحرج لا تقبل التزييف."
                : "For years, regional market participants operated in information asymmetry, relying on unverified advice. Borsaty brings hedge-fund grade quantitative tooling to every investor: algorithmic precision, mathematical risk-to-reward profiling, and uncompromised historical integrity."}
            </p>
          </div>
        </div>

        {/* Core Principles */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              {isAr ? "لماذا بورصتي؟" : "Why Borsaty?"}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              {isAr
                ? "أربعة أركان أساسية تحكم كل رقم وقرار يظهر على شاشتك."
                : "The four architectural pillars that govern every calculation on our terminal."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {coreValues.map((val, idx) => {
              const Icon = val.icon;
              return (
                <div
                  key={idx}
                  className="p-6 md:p-8 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white flex items-center justify-center font-bold border border-slate-200 dark:border-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {isAr ? val.titleAr : val.titleEn}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {isAr ? val.descAr : val.descEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institutional Backing CTA */}
        <div className="p-8 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-start">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {isAr ? "جاهز للبدء مع منصة التداول والتحليل؟" : "Ready to analyze financial assets?"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr
                ? "تصفح الأسهم النشطة، استكشف الخريطة الحرارية، أو قارن بين الشركات الرائدة."
                : "Explore active markets, inspect the sector heatmap, or compare leading equities."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/screener"
              className="px-4 py-2.5 rounded-lg bg-black hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-sm border border-slate-800"
            >
              {isAr ? "فاحص الأسهم" : "Equity Screener"}
            </Link>
            <Link
              href="/changelog"
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold transition-all border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              {isAr ? "سجل الإصدارات" : "Changelog"}
            </Link>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
