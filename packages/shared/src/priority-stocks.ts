export interface PriorityStock {
  symbol: string;
  market: 'EGX' | 'TASI' | 'US';
  nameAr: string;
  currency: string;
}

export const PRIORITY_STOCKS: PriorityStock[] = [
  // Egypt (10)
  { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", currency: "EGP" },
  { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", currency: "EGP" },
  { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات", currency: "EGP" },
  { symbol: "HRHO", market: "EGX", nameAr: "المجموعة المالية هيرميس", currency: "EGP" },
  { symbol: "SWDY", market: "EGX", nameAr: "السويدي إليكتريك", currency: "EGP" },
  { symbol: "EAST", market: "EGX", nameAr: "الشرقية إيسترن كومباني", currency: "EGP" },
  { symbol: "TMGH", market: "EGX", nameAr: "طلعت مصطفى", currency: "EGP" },
  { symbol: "SKPC", market: "EGX", nameAr: "سيدي كرير للبتروكيماويات", currency: "EGP" },
  { symbol: "JUFO", market: "EGX", nameAr: "جهينة للصناعات الغذائية", currency: "EGP" },
  { symbol: "ORAS", market: "EGX", nameAr: "أوراسكوم للإنشاءات", currency: "EGP" },

  // Saudi (10)
  { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", currency: "SAR" },
  { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", currency: "SAR" },
  { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي", currency: "SAR" },
  { symbol: "2010", market: "TASI", nameAr: "سابك", currency: "SAR" },
  { symbol: "7010", market: "TASI", nameAr: "الاتصالات السعودية", currency: "SAR" },
  { symbol: "2350", market: "TASI", nameAr: "كيان السعودية", currency: "SAR" },
  { symbol: "4013", market: "TASI", nameAr: "الدواء العربية", currency: "SAR" },
  { symbol: "4300", market: "TASI", nameAr: "دار الأركان", currency: "SAR" },
  { symbol: "1211", market: "TASI", nameAr: "معادن", currency: "SAR" },
  { symbol: "8010", market: "TASI", nameAr: "التعاونية للتأمين", currency: "SAR" },

  // US (5)
  { symbol: "AAPL", market: "US", nameAr: "آبل", currency: "USD" },
  { symbol: "MSFT", market: "US", nameAr: "مايكروسوفت", currency: "USD" },
  { symbol: "NVDA", market: "US", nameAr: "نيفيديا", currency: "USD" },
  { symbol: "TSLA", market: "US", nameAr: "تسلا", currency: "USD" },
  { symbol: "GOOGL", market: "US", nameAr: "جوجل", currency: "USD" },
];
