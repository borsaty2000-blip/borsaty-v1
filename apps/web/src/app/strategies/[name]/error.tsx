"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function StrategyError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Strategy unavailable" titleAr="الاستراتيجية غير متاحة" />;
}
