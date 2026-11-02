import HomeClient from "@/components/HomeClient";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function HomePage() {
  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load market overview"
      fallbackTitleAr="تعذر تحميل النظرة العامة للأسواق"
    >
      <HomeClient />
    </ErrorBoundary>
  );
}
