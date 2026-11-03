'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper,
  ExternalLink,
  Clock,
  TrendingUp,
  Minus,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface NewsItem {
  id: string;
  titleEn: string;
  titleAr: string;
  source: string;
  timeAgoEn: string;
  timeAgoAr: string;
  url: string;
  sentiment: 'bullish' | 'neutral' | 'caution';
  category: string;
}

interface NewsFeedProps {
  symbol: string;
}

export default function NewsFeed({ symbol }: NewsFeedProps) {
  const { language } = useApp();
  const isAr = language === 'ar';

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/news/${symbol}`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.news || []);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol]);

  const getSentimentBadge = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>{isAr ? 'إيجابي' : 'Bullish'}</span>
          </span>
        );
      case 'caution':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>{isAr ? 'حذر' : 'Caution'}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <Minus className="w-3 h-3" />
            <span>{isAr ? 'محايد' : 'Neutral'}</span>
          </span>
        );
    }
  };

  return (
    <div className="p-6 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-slate-500" />
            <span>{isAr ? `آخر الأخبار والتقارير المالية (${symbol})` : `FINANCIAL NEWS WIRE (${symbol})`}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr ? 'تغطية لحظية من رويترز، بلومبرغ، وإنتربرايز' : 'Live headlines from Bloomberg, Reuters & Enterprise'}
          </p>
        </div>

        <button
          onClick={fetchNews}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Refresh headlines"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Headlines List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            <span>{isAr ? 'جاري تحميل الأخبار الحية...' : 'Fetching live financial wires...'}</span>
          </div>
        ) : news.length > 0 ? (
          news.map((item, idx) => (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: isAr ? -3 : 3 }}
              className="block p-3.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                      {item.source}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {isAr ? item.timeAgoAr : item.timeAgoEn}
                    </span>
                    <span>•</span>
                    <span className="text-slate-500">{item.category}</span>
                  </div>

                  <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {isAr ? item.titleAr : item.titleEn}
                  </h4>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  {getSentimentBadge(item.sentiment)}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </motion.a>
          ))
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs font-semibold">
            {isAr ? 'لا توجد أخبار متاحة حالياً' : 'No news available at the moment.'}
          </div>
        )}
      </div>
    </div>
  );
}
