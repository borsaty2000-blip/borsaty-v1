"use client";

import RouteErrorFallback from "@/components/errors/RouteErrorFallback";

export default function SignInError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} titleEn="Sign-in unavailable" titleAr="تسجيل الدخول غير متاح" />;
}
