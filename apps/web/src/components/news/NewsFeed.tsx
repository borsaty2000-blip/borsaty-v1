"use client";

import { AlertCircle, Clock, ExternalLink, Newspaper } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NewsArticle } from "@/lib/schemas";

export type NewsFeedVariant = "compact" | "full" | "horizontal-scroll";

interface NewsFeedProps {
  articles: NewsArticle[];
  variant: NewsFeedVariant;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function timeAgo(value: string, isAr: boolean): string {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "";
  const elapsedSeconds = Math.round((timestamp - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const relative = new Intl.RelativeTimeFormat(isAr ? "ar" : "en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(elapsedSeconds) >= seconds) {
      return relative.format(Math.round(elapsedSeconds / seconds), unit);
    }
  }
  return relative.format(elapsedSeconds, "second");
}

function SentimentDot({ label }: { label: NewsArticle["sentiment"]["label"] }) {
  const color =
    label === "positive" ? "bg-emerald-500" : label === "negative" ? "bg-rose-500" : "bg-slate-400";
  return <span aria-label={`${label} sentiment`} title={label} className={`inline-block h-2 w-2 shrink-0 rounded-full ${color}`} />;
}

function Skeleton({ variant }: { variant: NewsFeedVariant }) {
  if (variant === "compact") {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="space-y-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={variant === "full" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" : "flex gap-4 overflow-hidden"}>
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className={`animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${variant === "horizontal-scroll" ? "h-[200px] w-[300px] shrink-0" : ""}`}>
          <div className="mb-4 aspect-video rounded-lg bg-slate-100 dark:bg-slate-800" />
          <div className="mb-3 h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mb-2 h-4 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/60" />
        </div>
      ))}
    </div>
  );
}

export default function NewsFeed({
  articles,
  variant,
  loading = false,
  error = false,
  onRetry,
}: NewsFeedProps) {
  const { language } = useApp();
  const isAr = language === "ar";

  if (loading) return <Skeleton variant={variant} />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <AlertCircle className="h-5 w-5 text-slate-500" />
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {isAr ? "تعذر تحميل الأخبار. حاول مرة أخرى." : "Could not load news. Retry?"}
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        )}
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Newspaper className="h-5 w-5" />
        <p>{isAr ? "لا توجد أخبار متاحة في الوقت الحالي" : "No news available at the moment"}</p>
      </div>
    );
  }

  const visibleArticles = articles.slice(0, variant === "compact" || variant === "horizontal-scroll" ? 5 : 12);

  if (variant === "compact") {
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {visibleArticles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            dir={article.language === "ar" ? "rtl" : "ltr"}
            className="group flex gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="pt-1.5"><SentimentDot label={article.sentiment.label} /></div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-black dark:text-slate-100 dark:group-hover:text-white">
                {article.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-slate-500">
                <span className="font-medium uppercase tracking-wide">{article.source}</span>
                <span>{timeAgo(article.published_at, article.language === "ar" || isAr)}</span>
              </div>
            </div>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
          </a>
        ))}
      </div>
    );
  }

  if (variant === "horizontal-scroll") {
    return (
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
        {visibleArticles.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            dir={article.language === "ar" ? "rtl" : "ltr"}
            className="group flex h-[200px] w-[300px] shrink-0 snap-start flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
          >
            <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="truncate">{article.source}</span>
              <SentimentDot label={article.sentiment.label} />
            </div>
            <h3 className="line-clamp-4 text-sm font-bold leading-relaxed text-slate-900 group-hover:text-black dark:text-white dark:group-hover:text-slate-200">
              {article.title}
            </h3>
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo(article.published_at, article.language === "ar" || isAr)}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </div>
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {visibleArticles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          dir={article.language === "ar" ? "rtl" : "ltr"}
          className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white hover:border-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600"
        >
          {article.image_url ? (
            <img src={article.image_url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-slate-50 text-slate-300 dark:bg-slate-950 dark:text-slate-700">
              <Newspaper className="h-7 w-7" />
            </div>
          )}
          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="truncate">{article.source}</span>
              <SentimentDot label={article.sentiment.label} />
            </div>
            <h3 className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 group-hover:text-black dark:text-white dark:group-hover:text-slate-200">
              {article.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {article.summary}
            </p>
            <div className="mt-auto flex items-center gap-1 pt-4 text-[11px] text-slate-500">
              <Clock className="h-3 w-3" />
              <span>{timeAgo(article.published_at, article.language === "ar" || isAr)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
