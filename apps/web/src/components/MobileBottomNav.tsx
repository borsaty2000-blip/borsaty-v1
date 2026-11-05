'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  SlidersHorizontal,
  Briefcase,
  Menu,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useBorsaty } from '@/context/BorsatyContext';
import { ROUTES } from '@/lib/route-map';
import { AnimatedIcon } from '@/components/ui/AnimatedIcon';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { language } = useApp();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useBorsaty();
  const [isVisible, setIsVisible] = useState(true);

  const isAr = language === 'ar';

  useEffect(() => {
    let previousY = window.scrollY;
    let lastDirectionChangeY = previousY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - previousY;
      if (Math.abs(delta) >= 8) {
        if (Math.abs(currentY - lastDirectionChangeY) > 24) {
          setIsVisible(currentY < 100 || delta < 0);
          lastDirectionChangeY = currentY;
        }
        previousY = currentY;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      label: isAr ? 'الرئيسية' : 'Home',
      href: ROUTES.home,
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: isAr ? 'الأسواق' : 'Markets',
      href: ROUTES.signals,
      icon: TrendingUp,
      isActive: pathname.startsWith('/signals') || pathname.startsWith('/stock/'),
    },
    {
      label: isAr ? 'المصفي' : 'Screener',
      href: ROUTES.screener,
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/screener'),
    },
    {
      label: isAr ? 'المحفظة' : 'Portfolio',
      href: ROUTES.portfolio,
      icon: Briefcase,
      isActive: pathname.startsWith('/portfolio'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className={`fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1 pb-safe transition-transform duration-200 h-16 ${isVisible || isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ backdropFilter: 'blur(12px)' }}
    >
      <div className="flex items-center justify-between h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center relative focus:outline-none touch-manipulation"
            >
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-0.5 transition-colors ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <AnimatedIcon
                    icon={Icon}
                    size={24}
                    className={active ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}
                  />
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute -bottom-1 inset-x-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-xs tracking-tight truncate max-w-[56px]">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* 5th Item: More (Triggers Clean Full-Screen Slide-In Sheet) */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center relative focus:outline-none touch-manipulation"
          aria-label="Open More Menu"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isMobileMenuOpen
                ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="relative">
              <Menu className={`w-6 h-6 ${isMobileMenuOpen ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
              {isMobileMenuOpen && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute -bottom-1 inset-x-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </div>
            <span className="text-xs tracking-tight truncate max-w-[56px]">
              {isAr ? 'المزيد' : 'More'}
            </span>
          </motion.div>
        </button>
      </div>
    </nav>
  );
}
