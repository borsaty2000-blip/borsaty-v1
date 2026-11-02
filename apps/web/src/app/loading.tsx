export default function Loading() {
  return (
    <div className="w-full space-y-6 animate-pulse py-2">
      {/* Top Ticker Skeleton */}
      <div className="flex items-center gap-3 overflow-hidden pb-2 border-b border-slate-100 dark:border-slate-800">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-7 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-md shrink-0"
          />
        ))}
      </div>

      {/* Main Hero / Header Skeleton */}
      <div className="h-24 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800" />

      {/* 2-Column Grid Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 space-y-3">
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-200/60 dark:bg-slate-700/40 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="h-64 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 space-y-3">
          <div className="h-5 w-36 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-slate-200/60 dark:bg-slate-700/40 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Dense Table Skeleton */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-9 bg-slate-200/50 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
