"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function SignalsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Signals unavailable" titleAr="الإشارات غير متاحة" />;
}
