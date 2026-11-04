"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function SignUpError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Sign-up unavailable" titleAr="إنشاء الحساب غير متاح" />;
}
