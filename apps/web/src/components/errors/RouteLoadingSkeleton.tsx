export default function RouteLoadingSkeleton() {
  return (
    <main
      aria-label="Loading page"
      aria-busy="true"
      className="mx-auto min-h-[60vh] w-full max-w-7xl animate-pulse space-y-6 px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="h-8 w-56 rounded bg-slate-200" />
      <div className="h-4 w-80 max-w-full rounded bg-slate-100" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 rounded-xl border border-slate-200 bg-slate-50" />
        <div className="h-52 rounded-xl border border-slate-200 bg-slate-50" />
      </div>
      <div className="h-64 rounded-xl border border-slate-200 bg-slate-50" />
    </main>
  );
}
