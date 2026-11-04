"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function ChangelogError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Changelog unavailable" titleAr="سجل التغييرات غير متاح" />;
}
