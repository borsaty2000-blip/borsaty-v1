"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function ScreenerError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Screener unavailable" titleAr="الماسح غير متاح" />;
}
