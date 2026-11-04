"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function PortfolioError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Portfolio unavailable" titleAr="المحفظة غير متاحة" />;
}
