'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

export default function ShareStockButton({ symbol }: { symbol: string }) {
  const { language } = useApp();
  const isAr = language === 'ar';
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://borsatyai.com/stock/${symbol}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success(
          isAr
            ? `تم نسخ رابط تحليل سهم ${symbol} بنجاح`
            : `Analysis link for ${symbol} copied to clipboard`
        );
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast.info(url);
      }
    } catch {
      toast.error(isAr ? 'فشل نسخ الرابط' : 'Failed to copy link');
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={isAr ? 'مشاركة السهم' : 'Share stock'}
      title={isAr ? 'نسخ ومشاركة رابط التحليل' : 'Copy and share stock analysis link'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{isAr ? 'مشاركة' : 'Share'}</span>
    </button>
  );
}
