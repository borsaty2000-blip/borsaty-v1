"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function WatchlistError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Watchlist unavailable" titleAr="قائمة المتابعة غير متاحة" />;
}
