"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Newspaper } from "lucide-react";
import { useApp } from "@/context/AppContext";
import NewsFeed from "@/components/news/NewsFeed";
import { NewsArticle, NewsResponseSchema } from "@/lib/schemas";

const CATEGORIES = [
  { value: "all", en: "All", ar: "الكل" },
  { value: "Egypt", en: "Egypt", ar: "مصر" },
  { value: "Saudi", en: "Saudi", ar: "السعودية" },
  { value: "US", en: "US", ar: "أمريكا" },
  { value: "crypto", en: "Crypto", ar: "العملات الرقمية" },
  { value: "forex", en: "Forex", ar: "الفوركس" },
  { value: "commodities", en: "Commodities", ar: "السلع" },
];

const PAGE_SIZE = 12;

export default function NewsPage() {
  const { language } = useApp();
  const isAr = language === "ar";
  const [category, setCategory] = useState("all");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [retry, setRetry] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const limit = Math.min(page * PAGE_SIZE, 100);
      const query = new URLSearchParams({ category, limit: String(limit) });
      const response = await fetch(`/api/news/market?${query.toString()}`);
      if (!response.ok) throw new Error(`News request failed: ${response.status}`);
      const parsed = NewsResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid news response");
      if (parsed.data.data_quality.error) throw new Error(parsed.data.data_quality.error);
      setArticles(parsed.data.articles);
      setHasMore(parsed.data.articles.length >= limit && limit < 100);
    } catch {
      setError(true);
      setArticles([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [category, page, retry]);

  useEffect(() => {
    void fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setPage((current) => current + 1);
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const chooseCategory = (value: string) => {
    setCategory(value);
    setArticles([]);
    setPage(1);
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8" dir={isAr ? "rtl" : "ltr"}>
      <header className="space-y-2 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2 text-slate-500">
          <Newspaper className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">{isAr ? "موجز الأسواق" : "Market coverage"}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {isAr ? "أخبار السوق" : "Market News"}
        </h1>
      </header>

      <nav aria-label={isAr ? "تصفية الأخبار حسب السوق" : "Filter news by market"} className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => chooseCategory(item.value)}
            className={`shrink-0 rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
              category === item.value
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {isAr ? item.ar : item.en}
          </button>
        ))}
      </nav>

      <NewsFeed
        articles={articles}
        variant="full"
        loading={loading && articles.length === 0}
        error={error}
        onRetry={() => setRetry((value) => value + 1)}
      />
      {loading && articles.length > 0 && <div className="py-4 text-center text-xs text-slate-500">{isAr ? "جارٍ تحميل المزيد..." : "Loading more news..."}</div>}
      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
    </main>
  );
}
