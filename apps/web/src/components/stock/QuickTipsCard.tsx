'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, ShieldAlert, Award, Compass, Layers } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const STORAGE_KEY = 'borsaty_hide_stock_tips';

export default function QuickTipsCard() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const isHidden = localStorage.getItem(STORAGE_KEY) === 'true';
      if (!isHidden) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // Non-blocking
    }
  };

  if (!visible) return null;

  return (
    <div className="relative p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-xs">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? 'دليل القراءة والتحليل المؤسسي السريع' : 'Institutional Terminal Analyst Guide'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'كيف تستفيد من محركات بورصتي الثمانية في بناء خطة تداول حاسمة وخالية من العواطف'
                : 'How to combine Borsaty quantitative engines into an objective, rules-based execution plan'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label={isAr ? 'إخفاء الدليل' : 'Dismiss tips'}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Layers className="w-3.5 h-3.5 text-blue-500" />
            <span>{isAr ? 'درجة التوافق (Confluence):' : 'Confluence Score:'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'تجمع بين إليوت، الهارمونيك، ومناطق السيولة. الدرجة ≥ 75% تدل على توافق رياضي قوي بين المحركات.'
              : 'Synthesizes Elliott waves, Harmonic PRZ, and liquidity zones. A score ≥ 75% signifies high probabilistic alignment.'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Award className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isAr ? 'القيمة العادلة وهامش الأمان:' : 'Fair Value & MoS:'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'تتكون من 9 نماذج تقييمية (DCF، DDM، مضاعف الربحية). هامش أمان > 15% يمنحك وسادة وقاية كافية.'
              : 'Weighted across 9 valuation models (DCF, DDM, P/E relative). A margin of safety > 15% offers solid downside cushion.'}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span>{isAr ? 'معامل العائد / المخاطرة:' : 'Risk / Reward Ratio:'}</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'لا تدخل صفقة بنسبة أقل من 1:2. الالتزام الصارم بنقطة وقف الخسارة هو مفتاح حماية رأس المال.'
              : 'Never enter below 1:2 risk/reward. Strict adherence to calculated stop loss levels guarantees capital preservation.'}
          </p>
        </div>
      </div>
    </div>
  );
}
