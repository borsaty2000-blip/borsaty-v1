"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function AboutError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="About page unavailable" titleAr="صفحة من نحن غير متاحة" />;
}
