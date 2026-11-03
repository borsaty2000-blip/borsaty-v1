'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShieldCheck,
  Zap,
  Repeat,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BarChart2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ProPicksHomeSection() {
  const { language } = useApp();
  const isAr = language === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const strategies = [
    {
      id: 'value',
      nameAr: 'مضاعف القيمة',
      nameEn: 'Value Compounder',
      icon: <ShieldCheck className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
      return2Y: '+52.4%',
      alpha: '+28.6%',
      topPick: 'COMI',
      topPickName: isAr ? 'البنك التجاري الدولي' : 'CIB Egypt',
      risk: 'LOW',
    },
    {
      id: 'momentum',
      nameAr: 'قائد الزخم',
      nameEn: 'Momentum Leader',
      icon: <Zap className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
      return2Y: '+78.6%',
      alpha: '+54.8%',
      topPick: 'SWDY',
      topPickName: isAr ? 'السويدي إليكتريك' : 'Elsewedy Electric',
      risk: 'HIGH',
    },
    {
      id: 'reversal',
      nameAr: 'صائد الانعكاس',
      nameEn: 'Reversal Hunter',
      icon: <Repeat className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
      return2Y: '+68.8%',
      alpha: '+45.0%',
      topPick: 'ABUK',
      topPickName: isAr ? 'أبو قير للأسمدة' : 'Abu Qir Fertilizers',
      risk: 'MODERATE',
    },
    {
      id: 'dividend',
      nameAr: 'أرستقراطي التوزيعات',
      nameEn: 'Dividend Aristocrat',
      icon: <DollarSign className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
      return2Y: '+43.2%',
      alpha: '+19.4%',
      topPick: '2222',
      topPickName: isAr ? 'أرامكو السعودية' : 'Saudi Aramco',
      risk: 'LOW',
    },
    {
      id: 'quality_growth',
      nameAr: 'النمو عالي الجودة',
      nameEn: 'Quality Growth',
      icon: <BarChart2 className="w-4 h-4 text-slate-800 dark:text-slate-200" />,
      return2Y: '+65.2%',
      alpha: '+41.4%',
      topPick: 'NVDA',
      topPickName: isAr ? 'إنفيديا' : 'NVIDIA Corp.',
      risk: 'MODERATE',
    },
  ];

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>QUANTITATIVE PROPICKS</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'نماذج الاستثمار المؤتمتة (ProPicks)' : 'Algorithmic Investment Models'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? '5 استراتيجيات كمية مؤسسية مدعومة بمحركات التحليل الثمانية مع اختبار رجعي مدقق لمدة عامين.'
              : '5 institutional quantitative strategies powered by our 8 analytical engines with 2Y backtesting.'}
          </p>
        </div>

        <Link
          href="/strategies"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <span>{isAr ? 'استعراض كافة النماذج والأداء' : 'Explore All Strategies'}</span>
          <ArrowIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {strategies.map((strat) => (
          <Link
            key={strat.id}
            href={`/strategies/${strat.id}`}
            className="group p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex flex-col justify-between space-y-4 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700 shadow-xs">
                  {strat.icon}
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  {strat.risk}
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-black dark:group-hover:text-white">
                {isAr ? strat.nameAr : strat.nameEn}
              </h3>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#070B14] border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">{isAr ? 'العائد (2Y):' : '2Y Return:'}</span>
                <span className="font-bold text-slate-900 dark:text-white">{strat.return2Y}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-400">{isAr ? 'السهم الأول:' : 'Top Pick:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{strat.topPick}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
