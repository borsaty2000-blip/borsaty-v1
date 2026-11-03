import { NextResponse } from 'next/server';

export interface EconomicEvent {
  id: string;
  date: string;
  timeUtc: string;
  country: string;
  countryFlag: string;
  market: 'US' | 'EGX' | 'TASI' | 'EU' | 'GLOBAL';
  eventNameEn: string;
  eventNameAr: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual: string | null;
  forecast: string;
  previous: string;
  unit: string;
  importanceDescriptionEn: string;
  importanceDescriptionAr: string;
}

const ECONOMIC_CALENDAR_EVENTS: EconomicEvent[] = [
  {
    id: 'ev_1',
    date: '2026-11-04',
    timeUtc: '18:00',
    country: 'United States',
    countryFlag: '🇺🇸',
    market: 'US',
    eventNameEn: 'Fed Interest Rate Decision (FOMC)',
    eventNameAr: 'قرار سعر الفائدة للاحتياطي الفيدرالي الأمريكي',
    impact: 'HIGH',
    actual: null,
    forecast: '4.25%',
    previous: '4.50%',
    unit: '%',
    importanceDescriptionEn: 'Highest impact event on global equity, bond, and currency liquidity.',
    importanceDescriptionAr: 'الحدث الأعلى تأثيراً على السيولة العالمية وأسواق الأسهم والعملات.',
  },
  {
    id: 'ev_2',
    date: '2026-11-05',
    timeUtc: '13:30',
    country: 'United States',
    countryFlag: '🇺🇸',
    market: 'US',
    eventNameEn: 'US Non-Farm Payrolls (NFP) & Unemployment Rate',
    eventNameAr: 'تقرير الوظائف غير الزراعية ومعدل البطالة الأمريكي',
    impact: 'HIGH',
    actual: null,
    forecast: '165K',
    previous: '142K',
    unit: 'Jobs',
    importanceDescriptionEn: 'Core measure of labor market strength guiding interest rate trajectory.',
    importanceDescriptionAr: 'مؤشر رئيسي لصلابة سوق العمل يوجه مسار خفض الفائدة.',
  },
  {
    id: 'ev_3',
    date: '2026-11-06',
    timeUtc: '15:00',
    country: 'Egypt',
    countryFlag: '🇪🇬',
    market: 'EGX',
    eventNameEn: 'CBE Monetary Policy Committee Interest Rate Decision',
    eventNameAr: 'اجتماع لجنة السياسة النقدية بالبنك المركزي المصري (سعر الفائدة)',
    impact: 'HIGH',
    actual: null,
    forecast: '27.25%',
    previous: '27.25%',
    unit: '%',
    importanceDescriptionEn: 'Sets domestic cost of capital, banking net interest margin, and Treasury yields.',
    importanceDescriptionAr: 'يحدد تكلفة التمويل وهوامش أرباح البنوك وعوائد أذون الخزانة.',
  },
  {
    id: 'ev_4',
    date: '2026-11-08',
    timeUtc: '08:00',
    country: 'Egypt',
    countryFlag: '🇪🇬',
    market: 'EGX',
    eventNameEn: 'Egypt Urban Headline Inflation (CPI YoY)',
    eventNameAr: 'معدل التضخم السنوي للحضر في مصر (مؤشر أسعار المستهلكين)',
    impact: 'HIGH',
    actual: null,
    forecast: '24.8%',
    previous: '25.6%',
    unit: '%',
    importanceDescriptionEn: 'Crucial determinant of real interest rates and currency valuation.',
    importanceDescriptionAr: 'محدد حاسم لأسعار الفائدة الحقيقية وتقييم العملة المحلية.',
  },
  {
    id: 'ev_5',
    date: '2026-11-10',
    timeUtc: '10:00',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    market: 'TASI',
    eventNameEn: 'Saudi Arabia Industrial Production Index (IPI)',
    eventNameAr: 'مؤشر الإنتاج الصناعي في المملكة العربية السعودية',
    impact: 'MEDIUM',
    actual: null,
    forecast: '+5.4%',
    previous: '+4.9%',
    unit: '%',
    importanceDescriptionEn: 'Tracks non-oil economic momentum under Vision 2030 initiatives.',
    importanceDescriptionAr: 'يقيس زخم النمو الاقتصادي غير النفطي لمبادرات رؤية 2030.',
  },
  {
    id: 'ev_6',
    date: '2026-11-12',
    timeUtc: '13:30',
    country: 'United States',
    countryFlag: '🇺🇸',
    market: 'US',
    eventNameEn: 'US Consumer Price Index (CPI MoM / YoY)',
    eventNameAr: 'مؤشر أسعار المستهلكين الأمريكي (التضخم الشهري والسنوي)',
    impact: 'HIGH',
    actual: null,
    forecast: '2.5%',
    previous: '2.6%',
    unit: '%',
    importanceDescriptionEn: 'The defining benchmark for Federal Reserve policy recalibration.',
    importanceDescriptionAr: 'المعيار الأساسي لقرارات مجلس الاحتياطي الفيدرالي.',
  },
  {
    id: 'ev_7',
    date: '2026-11-15',
    timeUtc: '11:00',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    market: 'TASI',
    eventNameEn: 'OPEC+ Joint Ministerial Monitoring Committee (JMMC)',
    eventNameAr: 'اجتماع اللجنة الوزارية لمراقبة الإنتاج لتحالف أوبك+',
    impact: 'HIGH',
    actual: null,
    forecast: 'Maintain Cuts',
    previous: 'Maintain Cuts',
    unit: 'Policy',
    importanceDescriptionEn: 'Determines global oil supply equilibrium and Brent pricing floor.',
    importanceDescriptionAr: 'يحدد توازن المعروض النفطي العالمي ومستويات دعم خام برنت.',
  },
  {
    id: 'ev_8',
    date: '2026-11-18',
    timeUtc: '09:00',
    country: 'Eurozone',
    countryFlag: '🇪🇺',
    market: 'EU',
    eventNameEn: 'ECB President Christine Lagarde Speech & Policy Stance',
    eventNameAr: 'خطاب رئيسة البنك المركزي الأوروبي كريستين لاغارد',
    impact: 'MEDIUM',
    actual: null,
    forecast: 'Dovish',
    previous: 'Neutral',
    unit: 'Tone',
    importanceDescriptionEn: 'Signals future rate path for the European economy.',
    importanceDescriptionAr: 'يوفر إشارات حول مسار الفائدة المستقبلي للاقتصاد الأوروبي.',
  },
];

export const revalidate = 300;

export async function GET() {
  return NextResponse.json({
    success: true,
    total: ECONOMIC_CALENDAR_EVENTS.length,
    events: ECONOMIC_CALENDAR_EVENTS,
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
