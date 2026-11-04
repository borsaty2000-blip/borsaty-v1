"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function CalendarError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Calendar unavailable" titleAr="التقويم غير متاح" />;
}
