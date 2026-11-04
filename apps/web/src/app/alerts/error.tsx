"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function AlertsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Alerts unavailable" titleAr="التنبيهات غير متاحة" />;
}
