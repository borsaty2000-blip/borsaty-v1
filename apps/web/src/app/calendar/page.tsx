import { Metadata } from 'next';
import CalendarPage from '@/components/calendar/CalendarPage';

export const metadata: Metadata = {
  title: 'Economic Calendar & Macro Intelligence | Borsaty AI — الأجندة الاقتصادية',
  description: 'Monitor Central Bank interest rate meetings (Federal Reserve, CBE Egypt), CPI inflation reports, and OPEC+ policy announcements on Borsaty AI.',
};

export default function Page() {
  return <CalendarPage />;
}
