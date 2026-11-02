import { Metadata } from 'next';
import CalendarPage from '@/components/calendar/CalendarPage';

export const metadata: Metadata = {
  title: 'Economic Calendar & Macro Markets | Borsaty — الأجندة الاقتصادية',
  description: 'Monitor Central Bank interest rate meetings (Federal Reserve, CBE Egypt), CPI inflation reports, and OPEC+ policy announcements on Borsaty.',
};

export default function Page() {
  return <CalendarPage />;
}
