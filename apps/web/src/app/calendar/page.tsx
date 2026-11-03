import { Metadata } from 'next';
import CalendarPage from '@/components/calendar/CalendarPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title: 'Borsaty | Economic Calendar',
  description: 'Monitor Central Bank interest rate meetings (Federal Reserve, CBE Egypt), CPI inflation reports, and OPEC+ policy announcements on Borsaty.',
};

export default function Page() {
  return (
    <ErrorBoundary
      fallbackTitleEn="Unable to load Economic Calendar"
      fallbackTitleAr="تعذر تحميل الأجندة الاقتصادية"
    >
      <CalendarPage />
    </ErrorBoundary>
  );
}
