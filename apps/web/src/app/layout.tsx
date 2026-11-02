import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { TrendingUp } from "lucide-react";
import "./globals.css";
import Header from "@/components/Header";
import CommandPalette from "@/components/CommandPalette";
import MobileBottomNav from "@/components/MobileBottomNav";
import { AppProvider } from "@/context/AppContext";
import { BorsatyProvider } from "@/context/BorsatyContext";
import { ClerkProvider } from "@clerk/nextjs";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Borsaty — Financial Markets & Stock Analysis",
  description: "Real-time market quotes, technical indicators, portfolio tracker, and economic calendar on Borsaty.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" dir="ltr" className={`${cairo.variable} ${inter.variable}`}>
        <head>
          <meta name="theme-color" content="#ffffff" />
        </head>
        <body className="min-h-screen bg-white text-slate-900 dark:bg-[#0B1120] dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
          <AppProvider>
            <BorsatyProvider>
              <CommandPalette />
              <Header />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-6">
                {children}
              </main>
              <MobileBottomNav />
              <footer className="border-t border-slate-800 bg-[#0A0A0A] py-8 px-4 pb-20 md:pb-8 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <div className="relative w-6 h-6 rounded bg-black border border-slate-700 flex items-center justify-center text-white font-black text-xs shadow-sm">
                      <span>B</span>
                      <span className="absolute top-0.5 end-0.5 w-1 h-1 rounded-full bg-[#00D9FF]" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-white">Borsaty</span>
                    <span className="text-slate-400 font-normal">| بورصتي</span>
                  </div>
                  <p className="text-slate-400">Borsaty © 2026 — Real-time financial markets data and quantitative analysis.</p>
                  <div className="flex items-center gap-4 text-slate-400">
                    <span>EGX</span>
                    <span>•</span>
                    <span>TASI</span>
                    <span>•</span>
                    <span>US Markets</span>
                    <span>•</span>
                    <span>Crypto & Forex</span>
                  </div>
                </div>
              </footer>
            </BorsatyProvider>
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
