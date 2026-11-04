"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function PrivacyError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Privacy page unavailable" titleAr="صفحة الخصوصية غير متاحة" />;
}
