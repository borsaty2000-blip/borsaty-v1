"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function ReportError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Report unavailable" titleAr="التقرير غير متاح" />;
}
