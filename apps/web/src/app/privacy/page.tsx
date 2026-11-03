"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, EyeOff } from "lucide-react";
import { useApp } from "@/context/AppContext";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function PrivacyPage() {
  const { language } = useApp();
  const isAr = language === "ar";

  return (
    <ErrorBoundary fallbackTitleEn="Unable to load Privacy Policy" fallbackTitleAr="تعذر تحميل سياسة الخصوصية">
      <div className="max-w-4xl mx-auto space-y-8 pb-16 pt-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Lock className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            <span>{isAr ? "حماية وخصوصية البيانات" : "Data Privacy & Protection"}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
            {isAr ? "سياسة الخصوصية وحماية البيانات" : "Privacy Policy & Security Standards"}
          </h1>
          <p className="text-xs text-slate-500">Last updated: November 2026 | آخر تحديث: نوفمبر 2026</p>
        </div>

        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-6 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "1. التزامنا بحماية الخصوصية" : "1. Our Commitment to Privacy"}
            </h2>
            <p>
              {isAr
                ? "في بورصتي، نعتبر بيانات محفظتك وصفقاتك وقوائم متابعتك سرية تماماً. نحن لا نبيع بيانات التداول أو اهتمامات المستخدمين لأي أطراف ثالثة أو شركات تسويق على الإطلاق."
                : "At Borsaty, your portfolio positions, transaction logs, and watchlist preferences are strictly confidential. We never monetize, sell, or distribute your private trading data to third-party brokers or advertisers."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "2. التشفير والمصادقة" : "2. Encryption & Authentication"}
            </h2>
            <p>
              {isAr
                ? "تتم مصادقة هويات المستخدمين عبر بروتوكولات Clerk المعتمدة بنكياً، مع تشفير كافة الاتصالات ببروتوكول TLS 1.3 وتخزين البيانات السحابية بقواعد بيانات Neon المحصنة."
                : "User authentication is secured via bank-grade Clerk infrastructure. All data in transit is encrypted under TLS 1.3 and stored in partitioned Neon serverless instances."}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? "3. التخزين المحلي وملفات الكوكيز" : "3. Local Storage & Session State"}
            </h2>
            <p>
              {isAr
                ? "نستخدم التخزين المحلي فقط لحفظ تفضيلاتك (اللغة المختارة، المظهر الداكن أو الفاتح) لضمان تجربة تصفح سريعة ومريحة دون تتبع إعلاني غير مرغوب فيه."
                : "We utilize local storage solely to retain your UI preferences (language selection, theme mode). We never inject tracking cookies or behavioral advertising pixels."}
            </p>
          </section>
        </div>
      </div>
    </ErrorBoundary>
  );
}
