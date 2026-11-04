"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function StrategiesError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Strategies unavailable" titleAr="الاستراتيجيات غير متاحة" />;
}
