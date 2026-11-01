"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, ShieldCheck, BarChart2, Bell } from "lucide-react";
import { resolveStockAlias } from "@borsaty/shared";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check alias first
    const alias = resolveStockAlias(searchQuery);
    if (alias) {
      router.push(`/stock/${alias.symbol}`);
    } else {
      router.push(`/stock/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0e1424]/90 backdrop-blur-md border-b border-[#1f293d]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight bg-gradient-to-l from-white to-gray-300 bg-clip-text text-transparent flex items-center gap-1.5">
                بورصتي
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Borsaty 1.0
                </span>
              </div>
              <div className="text-[10px] text-gray-400">نظام دعم القرار الاستثماري</div>
            </div>
          </Link>

          {/* Quick Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2337] transition-colors"
            >
              الرئيسية
            </Link>
            <Link
              href="/stock/COMI"
              className="px-3 py-1.5 rounded-lg text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              COMI (التجاري الدولي)
            </Link>
            <Link
              href="/stock/2222"
              className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2337] transition-colors"
            >
              2222 (أرامكو)
            </Link>
            <Link
              href="/stock/ABUK"
              className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2337] transition-colors"
            >
              ABUK (أبو قير)
            </Link>
            <Link
              href="/stock/1120"
              className="px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1a2337] transition-colors"
            >
              1120 (الراجحي)
            </Link>
            <Link
              href="/signals"
              className="px-3 py-1.5 rounded-lg text-emerald-400 hover:text-white hover:bg-[#1a2337] transition-colors flex items-center gap-1 font-semibold"
            >
              سجل الإشارات (Hit Rate)
            </Link>
          </nav>
        </div>

        {/* Search Bar with Arabic Stock Aliases Resolution */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالرمز أو الاسم: COMI، أرامكو، الراجحي، أبو قير..."
              className="w-full pl-4 pr-10 py-2 rounded-xl bg-[#141c2e] border border-[#232e48] text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </form>

        {/* Status / Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141c2e] border border-[#232e48] text-xs text-gray-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>محركات حتمية 100%</span>
          </div>
        </div>
      </div>
    </header>
  );
}
