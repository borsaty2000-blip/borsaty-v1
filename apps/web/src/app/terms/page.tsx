"use client";

import React from "react";
import Link from "next/link";
import { Shield, AlertCircle, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function TermsPage() {
  const { language } = useApp();
  const isAr = language === "ar";

  return (
    <ErrorBoundary fallbackTitleEn="Unable to load Terms" fallbackTitleAr="تعذر تحميل الشروط والأحكام">
      <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <FileText className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>{isAr ? "الشروط والضوابط القانونية" : "Terms & Disclaimers"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
            {isAr ? "شروط الاستخدام وإخلاء المسؤولية" : "Terms of Service & Financial Disclaimer"}
          </h1>
          <p className="text-xs text-slate-500">Effective Date: November 2026 | سارية المفعول اعتباراً من نوفمبر 2026</p>
        </div>

        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-6 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {isAr
                ? "إخلاء مسؤولية مالي صريح: جميع مخرجات بورصتي AI هي تحليلات رياضية وحسابية وتعليمية لأغراض البحث فقط، ولا تُعتبر بأي شكل من الأشكال استشارة مالية أو توصية مباشرة بشراء أو بيع أي ورقة مالية."
                : "Strict Financial Disclaimer: All outputs, confluence scores, wave analyses, and trade plans provided by Borsaty AI are solely for mathematical and educational research. They do NOT constitute investment advice or trading recommendations."}
            </p>
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "1. طبيعة الخدمة والتحليلات الحتمية" : "1. Nature of Service & Deterministic Analysis"}
            </h2>
            <p>
              {isAr
                ? "تعتمد المنصة على خوارزميات حتمية (Deterministic Algorithms) لمعالجة البيانات السعرية والتاريخية. بينما تسعى المنصة لأعلى درجات الدقة والنزاهة، فإن أسواق الأسهم تنطوي دائماً على مخاطر تقلب قد تؤدي إلى خسارة جزء أو كل رأس المال المستثمر."
                : "The platform relies on deterministic algorithms to evaluate market dynamics. While we uphold uncompromised statistical integrity, financial markets inherently carry risk of capital loss."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "2. دقة البيانات ومصادر الأسعار" : "2. Market Feeds & Data Latency"}
            </h2>
            <p>
              {isAr
                ? "يتم جلب أسعار الأسهم من مزودي بيانات الأسواق العالمية والإقليمية. في حال وجود تأخير قانوني مفروض من البورصات المحلية (مثل 15 دقيقة)، يُعلن النظام ذلك في شريط جودة البيانات (Data Quality Provenance)."
                : "Market quotes are acquired from certified financial data providers. Any exchange-mandated latency is explicitly disclosed in our Data Quality provenance headers."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "3. الملكية الفكرية" : "3. Intellectual Property"}
            </h2>
            <p>
              {isAr
                ? "جميع المحركات الرياضية، والأكواد المصدرية، ونماذج التوافق، وتصاميم واجهات المستخدم هي حقوق ملكية حصرية لمنصة بورصتي AI © 2026."
                : "All proprietary deterministic engines, source algorithms, confluence models, and user terminal interfaces are the exclusive intellectual property of Borsaty AI © 2026."}
            </p>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
