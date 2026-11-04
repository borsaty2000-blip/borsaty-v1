"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, ExternalLink, Newspaper, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NewsResponse, NewsResponseSchema } from "@/lib/schemas";
import NewsFeed from "@/components/news/NewsFeed";

interface NewsTabProps {
  symbol: string;
  market: string;
}

function relativeTime(date: string, isAr: boolean): string {
  const timestamp = new Date(date).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const intervals: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(isAr ? "ar" : "en", { numeric: "auto" });
  for (const [unit, interval] of intervals) {
    if (Math.abs(seconds) >= interval) return formatter.format(Math.round(seconds / interval), unit);
  }
  return formatter.format(seconds, "second");
}

export default function NewsTab({ symbol, market }: NewsTabProps) {
  const { language } = useApp();
  const isAr = language === "ar";
  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requestNumber, setRequestNumber] = useState(0);

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const query = new URLSearchParams({ market, limit: "10" });
      const response = await fetch(`/api/news/${encodeURIComponent(symbol)}?${query.toString()}`);
      if (!response.ok) throw new Error(`News request failed: ${response.status}`);
      const parsed = NewsResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid news response");
      if (parsed.data.data_quality.error) throw new Error(parsed.data.data_quality.error);
      setData(parsed.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [market, symbol]);

  useEffect(() => {
    void loadNews();
  }, [loadNews, requestNumber]);

  const articles = data?.articles || [];
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6" dir={isAr ? "rtl" : "ltr"}>
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-slate-500" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isAr ? `آخر أخبار ${symbol}` : `${symbol} news`}
            </h2>
            <p className="text-xs text-slate-500">
              {data?.count ? (isAr ? `${data.count} خبر` : `${data.count} articles`) : isAr ? "أخبار من مصادر RSS" : "News from RSS sources"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRequestNumber((value) => value + 1)}
          disabled={loading}
          aria-label={isAr ? "تحديث الأخبار" : "Refresh news"}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {loading || error || articles.length === 0 ? (
        <NewsFeed
          articles={[]}
          variant="compact"
          loading={loading}
          error={error}
          onRetry={() => setRequestNumber((value) => value + 1)}
        />
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {articles.slice(0, 10).map((article) => {
            const sentimentColor =
              article.sentiment.label === "positive"
                ? "bg-emerald-500"
                : article.sentiment.label === "negative"
                  ? "bg-rose-500"
                  : "bg-slate-400";
            return (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                dir={article.language === "ar" ? "rtl" : "ltr"}
                className="group block py-4 first:pt-1 last:pb-1"
              >
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  <span className="font-semibold uppercase tracking-wide">{article.source}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{relativeTime(article.published_at, article.language === "ar" || isAr)}</span>
                  <span aria-hidden="true">·</span>
                  <span className={`inline-block h-2 w-2 rounded-full ${sentimentColor}`} title={article.sentiment.label} aria-label={`${article.sentiment.label} sentiment`} />
                </div>
                <h3 className="text-sm font-bold leading-relaxed text-slate-900 group-hover:text-slate-600 dark:text-white dark:group-hover:text-slate-300">
                  {article.title}
                </h3>
                {article.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{article.summary}</p>}
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-400">
                  {isAr ? "قراءة المقال" : "Read article"} <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}
