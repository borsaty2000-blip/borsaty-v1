"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function NewsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="News unavailable" titleAr="الأخبار غير متاحة" />;
}
