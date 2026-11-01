import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "بورصتي | Borsaty — Arabic-First Global Financial Markets Platform",
  description: "المنصة العربية الأولى للأسواق المالية العالمية مدعومة بالذكاء الاصطناعي ومحركات التحليل الحتمية",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#0b0f19] text-gray-100 flex flex-col font-arabic">
        <Header />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
          {children}
        </main>
        <footer className="border-t border-[#1a2234] py-6 px-4 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <p>بورصتي (Borsaty) © 2026 — جميع البيانات والتحليلات لأغراض تعليمية وبحثية كمية وليست توصية مالية أو استثمارية.</p>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                محرك التحليل الحتمي متصل
              </span>
              <span>•</span>
              <span>RTL Arabic-First v1.0</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
