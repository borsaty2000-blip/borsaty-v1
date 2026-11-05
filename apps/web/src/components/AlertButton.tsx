"use client";

import React, { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Bell, Loader2, X, Check, Target, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { AnimatedIcon } from "@/components/ui/AnimatedIcon";

interface AlertButtonProps {
  symbol: string;
  currentPrice?: number;
  className?: string;
  showLabel?: boolean;
}

export default function AlertButton({
  symbol,
  currentPrice = 100,
  className = "",
  showLabel = true,
}: AlertButtonProps) {
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const { language } = useApp();
  const isAr = language === "ar";
  const sym = symbol.toUpperCase();

  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"PRICE" | "FAIR_VALUE" | "RSI">("PRICE");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [threshold, setThreshold] = useState<string>(
    currentPrice ? (currentPrice * 1.05).toFixed(2) : "100"
  );
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      openSignIn?.();
      return;
    }

    // Preset threshold to 5% above current price by default
    if (currentPrice && (!threshold || threshold === "100")) {
      setThreshold((currentPrice * 1.05).toFixed(2));
    }
    setIsOpen(true);
  };

  const handleQuickPercent = (pct: number) => {
    if (!currentPrice) return;
    const calculated = currentPrice * (1 + pct / 100);
    setThreshold(calculated.toFixed(2));
    if (pct > 0) setCondition("ABOVE");
    else setCondition("BELOW");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(threshold);
    if (isNaN(num) || num <= 0) {
      toast.error(isAr ? "يرجى إدخال سعر مستهدف صالح" : "Please enter a valid target price");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: sym,
          type,
          condition,
          threshold: num,
          note: note.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success(
          isAr
            ? `تم تعيين التنبيه لسهم ${sym} عند ${num.toFixed(2)} بنجاح`
            : `Alert set for ${sym} at ${num.toFixed(2)}`
        );
        setIsOpen(false);
        setNote("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || (isAr ? "فشل إنشاء التنبيه" : "Failed to create alert"));
      }
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء حفظ التنبيه" : "Error saving alert");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        aria-label="Set Alert"
        title={isAr ? "تعيين تنبيه سعري" : "Set Price Alert"}
        className={`btn-press group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
      >
        <AnimatedIcon icon={Bell} animation="shake" size={14} className="text-slate-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
        {showLabel && (
          <span>{isAr ? "تنبيه" : "Alert"}</span>
        )}
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden text-right"
            dir={isAr ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isAr ? `تنبيه ذكي — ${sym}` : `Smart Alert — ${sym}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? `السعر المرجعي الحالي: ${currentPrice ? currentPrice.toFixed(2) : "—"}`
                      : `Current Reference Price: ${currentPrice ? currentPrice.toFixed(2) : "—"}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label={isAr ? "إغلاق النافذة" : "Close modal"}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "نوع التنبيه" : "Alert Type"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("PRICE")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      type === "PRICE"
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isAr ? "السعر" : "Price"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("FAIR_VALUE")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      type === "FAIR_VALUE"
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isAr ? "القيمة العادلة" : "Fair Value"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("RSI")}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      type === "RSI"
                        ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {isAr ? "مؤشر RSI" : "RSI Level"}
                  </button>
                </div>
              </div>

              {/* Condition Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "الشرط" : "Condition"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCondition("ABOVE")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      condition === "ABOVE"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{isAr ? "أعلى من أو يساوي" : "Greater / Equal"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCondition("BELOW")}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                      condition === "BELOW"
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black border-transparent"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{isAr ? "أقل من أو يساوي" : "Less / Equal"}</span>
                  </button>
                </div>
              </div>

              {/* Threshold Target Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {type === "RSI"
                      ? isAr
                        ? "مستوى RSI المستهدف (0 - 100)"
                        : "Target RSI Level (0 - 100)"
                      : isAr
                      ? "المستوى المستهدف"
                      : "Target Price Threshold"}
                  </label>
                  {type === "PRICE" && currentPrice > 0 && (
                    <div className="flex items-center gap-1 text-[10px]">
                      <button
                        type="button"
                        onClick={() => handleQuickPercent(5)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      >
                        +5%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPercent(10)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      >
                        +10%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPercent(-5)}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900"
                      >
                        -5%
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Target className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Note (optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? "ملاحظة شخصية (اختياري)" : "Personal Note (Optional)"}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isAr ? "مثال: جني أرباح، كسر المقاومة، وقف خسارة" : "e.g. Take profit target, stop loss"
                  }
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isAr ? "حفظ التنبيه" : "Create Alert"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
