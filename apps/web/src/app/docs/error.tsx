"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function DocsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Documentation unavailable" titleAr="التوثيق غير متاح" />;
}
