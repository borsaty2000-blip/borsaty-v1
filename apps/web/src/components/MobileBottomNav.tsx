'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  SlidersHorizontal,
  Search,
  BarChart3,
  Star,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { useBorsaty } from '@/context/BorsatyContext';
import { useApp } from '@/context/AppContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { language } = useApp();
  const { setIsCommandPaletteOpen } = useBorsaty();

  const isAr = language === 'ar';

  const navItems = [
    {
      label: isAr ? 'الأسواق' : 'Markets',
      href: '/',
      icon: TrendingUp,
      isActive: pathname === '/',
    },
    {
      label: isAr ? 'الفلتر' : 'Screener',
      href: '/screener',
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/screener'),
    },
    {
      label: isAr ? 'بحث' : 'Search',
      isAction: true,
      onClick: () => setIsCommandPaletteOpen(true),
      icon: Search,
    },
    {
      label: isAr ? 'المحفظة' : 'Portfolio',
      href: '/portfolio',
      icon: Briefcase,
      isActive: pathname.startsWith('/portfolio'),
    },
    {
      label: isAr ? 'الأجندة' : 'Calendar',
      href: '/calendar',
      icon: Calendar,
      isActive: pathname.startsWith('/calendar'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-2 py-1 pb-safe transition-colors"
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <motion.button
                key="action-search"
                whileTap={{ scale: 0.88 }}
                onClick={item.onClick}
                className="flex flex-col items-center justify-center -mt-5 cursor-pointer focus:outline-none"
                aria-label="Search and Command Palette"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border-2 border-white dark:border-[#0B1120] transition-transform">
                  <Search className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 mt-0.5">
                  {item.label}
                </span>
              </motion.button>
            );
          }

          const active = item.isActive;

          return (
            <Link
              key={item.href || idx}
              href={item.href!}
              className="flex flex-col items-center justify-center w-14 py-1 relative focus:outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-0.5 transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute -bottom-1 inset-x-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-[52px]">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
