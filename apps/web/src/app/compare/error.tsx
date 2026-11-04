"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function CompareError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Comparison unavailable" titleAr="المقارنة غير متاحة" />;
}
