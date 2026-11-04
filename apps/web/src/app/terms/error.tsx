"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function TermsError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Terms unavailable" titleAr="الشروط غير متاحة" />;
}
