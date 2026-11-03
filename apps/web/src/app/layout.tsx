import type { Metadata } from "next";
import Link from "next/link";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import CommandPalette from "@/components/CommandPalette";
import MobileBottomNav from "@/components/MobileBottomNav";
import ThePulse from "@/components/ThePulse";
import Logo from "@/components/branding/Logo";
import { AppProvider } from "@/context/AppContext";
import { BorsatyProvider } from "@/context/BorsatyContext";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import DevToolsGuard from "@/components/DevToolsGuard";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Borsaty — Financial Markets & Stock Analysis",
  description: "Real-time market quotes, technical indicators, portfolio tracker, and economic calendar on Borsaty.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
              <ServiceWorkerRegister />
              <DevToolsGuard />
              <CommandPalette />
              <Toaster position="top-right" richColors closeButton />
              <Header />
              <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-28 md:pb-16">
                {children}
              </main>
              <ThePulse />
              <MobileBottomNav />
              <footer className="border-t border-slate-800 bg-[#0A0A0A] py-10 px-4 pb-24 md:pb-10 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto space-y-6">
                  {/* Top Row: Logo, Status Indicator, Exchange tags */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                    <Link href="/" className="flex items-center gap-2 whitespace-nowrap group">
                      <Logo variant="white" size={24} showText={true} />
                      <span className="text-slate-400 font-normal ms-1">| بورصتي</span>
                    </Link>

                    {/* Operational Health Badge */}
                    <Link
                      href="/status"
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm group"
                      title="View Live System Telemetry & Engine Health"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse group-hover:scale-125 transition-transform" />
                      <span>Status: All Systems Operational (99.98%)</span>
                    </Link>

                    {/* Market Coverage Badges */}
                    <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                      <span className="hover:text-white transition-colors">EGX</span>
                      <span>•</span>
                      <span className="hover:text-white transition-colors">TASI</span>
                      <span>•</span>
                      <span className="hover:text-white transition-colors">US Equities</span>
                      <span>•</span>
                      <span className="hover:text-white transition-colors">Crypto & Forex</span>
                    </div>
                  </div>

                  {/* Middle Row: Institutional Links */}
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
                    <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
                    <Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link>
                    <Link href="/docs" className="hover:text-white transition-colors">Developer API</Link>
                    <Link href="/compare" className="hover:text-white transition-colors">Compare Tool</Link>
                    <Link href="/status" className="hover:text-white transition-colors">System Telemetry</Link>
                    <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                  </div>

                  {/* Bottom Row: Copyright & Legal */}
                  <p className="text-[11px] text-slate-500 max-w-2xl mx-auto leading-relaxed">
                    Borsaty © 2026. Institutional Quantitative & Technical Financial Terminal. All calculations are mathematical and educational research.
                  </p>
                </div>
              </footer>
            </BorsatyProvider>
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
