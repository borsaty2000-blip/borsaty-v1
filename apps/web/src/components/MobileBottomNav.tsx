'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  SlidersHorizontal,
  Briefcase,
  User,
} from 'lucide-react';
import { useAuth, UserButton, SignInButton } from '@clerk/nextjs';
import { useApp } from '@/context/AppContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { language } = useApp();
  const { isSignedIn, isLoaded } = useAuth();

  const isAr = language === 'ar';

  const navItems = [
    {
      label: isAr ? 'الرئيسية' : 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: isAr ? 'الأسواق' : 'Markets',
      href: '/signals',
      icon: TrendingUp,
      isActive: pathname.startsWith('/signals'),
    },
    {
      label: isAr ? 'المصفي' : 'Screener',
      href: '/screener',
      icon: SlidersHorizontal,
      isActive: pathname.startsWith('/screener'),
    },
    {
      label: isAr ? 'المحفظة' : 'Portfolio',
      href: '/portfolio',
      icon: Briefcase,
      isActive: pathname.startsWith('/portfolio'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-1 pb-safe transition-colors h-14"
    >
      <div className="flex items-center justify-between h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center relative focus:outline-none"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-0.5 transition-colors ${
                  active
                    ? 'text-black dark:text-white font-extrabold'
                    : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute -bottom-1 inset-x-0 h-0.5 bg-black dark:bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] tracking-tight truncate max-w-[56px]">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}

        {/* 5th Item: Profile / Sign In */}
        <div className="flex-1 min-w-[44px] min-h-[44px] flex flex-col items-center justify-center">
          {!isLoaded ? (
            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
          ) : isSignedIn ? (
            <div className="flex flex-col items-center gap-0.5">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-5 h-5 rounded-full ring-1 ring-emerald-500/40',
                  },
                }}
              />
              <span className="text-[10px] tracking-tight text-slate-500 dark:text-slate-400 font-medium">
                {isAr ? 'حسابي' : 'Profile'}
              </span>
            </div>
          ) : (
            <SignInButton mode="modal">
              <button
                className="flex flex-col items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                aria-label="Sign in"
              >
                <User className="w-5 h-5 stroke-[1.8px]" />
                <span className="text-[10px] tracking-tight">
                  {isAr ? 'دخول' : 'Sign In'}
                </span>
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
