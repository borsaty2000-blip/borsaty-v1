'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Keyboard, X, Search, Compass, ShieldCheck, Briefcase, Star, Bell, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function KeyboardShortcutsModal() {
  const router = useRouter();
  const { language } = useApp();
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let pendingG = false;
    let gTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('role') === 'textbox'
      ) {
        return;
      }

      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      // 'g' prefix navigation shortcuts
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !pendingG) {
        pendingG = true;
        gTimeout = setTimeout(() => {
          pendingG = false;
        }, 1200);
        return;
      }

      if (pendingG) {
        pendingG = false;
        if (gTimeout) clearTimeout(gTimeout);

        switch (e.key.toLowerCase()) {
          case 'h':
            router.push('/');
            break;
          case 's':
            router.push('/screener');
            break;
          case 'p':
            router.push('/portfolio');
            break;
          case 'w':
            router.push('/watchlist');
            break;
          case 'a':
            router.push('/alerts');
            break;
          case 'c':
            router.push('/calendar');
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimeout) clearTimeout(gTimeout);
    };
  }, [isOpen, router]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '⌘ K / Ctrl+K', labelAr: 'البحث الشامل والتنقل الفوري', labelEn: 'Command palette & search' },
    { key: '?', labelAr: 'فتح / إغلاق دليل الاختصارات', labelEn: 'Toggle shortcuts cheatsheet' },
    { key: 'Esc', labelAr: 'إغلاق النوافذ والقوائم المنبثقة', labelEn: 'Close open dialogs & menus' },
    { key: 'G then H', labelAr: 'الانتقال إلى الرئيسية', labelEn: 'Navigate to Home' },
    { key: 'G then S', labelAr: 'الانتقال إلى الماسح الفني', labelEn: 'Navigate to Screener' },
    { key: 'G then P', labelAr: 'الانتقال إلى المحفظة الاستثمارية', labelEn: 'Navigate to Portfolio' },
    { key: 'G then W', labelAr: 'الانتقال إلى قائمة المتابعة', labelEn: 'Navigate to Watchlist' },
    { key: 'G then A', labelAr: 'الانتقال إلى مركز التنبيهات', labelEn: 'Navigate to Alerts' },
    { key: 'G then C', labelAr: 'الانتقال إلى المفكرة الاقتصادية', labelEn: 'Navigate to Calendar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isAr ? 'اختصارات لوحة المفاتيح المؤسسية' : 'Terminal Keyboard Shortcuts'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr ? 'تنقل بسرعة وسلاسة تماماً كمنصات بلومبرغ ورويترز' : 'Navigate at institutional speed'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 my-2">
          {shortcuts.map((s, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {isAr ? s.labelAr : s.labelEn}
              </span>
              <kbd className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-400">
            {isAr ? 'اضغط Esc في أي وقت لإغلاق هذه النافذة' : 'Press Esc anytime to exit'}
          </span>
        </div>
      </div>
    </div>
  );
}
