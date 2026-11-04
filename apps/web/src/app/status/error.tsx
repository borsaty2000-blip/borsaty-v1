"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function StatusError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Status unavailable" titleAr="حالة النظام غير متاحة" />;
}
