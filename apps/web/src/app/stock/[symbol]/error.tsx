"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function StockError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Stock analysis unavailable" titleAr="تحليل السهم غير متاح" />;
}
