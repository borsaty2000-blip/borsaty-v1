import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AppProvider } from "@/context/AppContext";
import { ClerkProvider } from "@clerk/nextjs";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "بورصتي | Borsaty — Arabic-First Global Financial Markets Platform",
  description: "المنصة العربية الأولى للأسواق المالية العالمية مدعومة بالذكاء الاصطناعي ومحركات التحليل الحتمية",
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
        <body className="min-h-screen bg-white text-slate-900 dark:bg-[#0b0f19] dark:text-gray-100 flex flex-col font-sans transition-colors duration-200">
          <AppProvider>
            <Header />
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
              {children}
            </main>
            <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19]/80 py-6 px-4 text-center text-xs text-slate-500 dark:text-gray-500">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <p>بورصتي (Borsaty) © 2026 — جميع البيانات والتحليلات لأغراض تعليمية وبحثية كمية وليست توصية مالية أو استثمارية.</p>
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
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
