export interface SeedCompany {
  symbol: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  market: 'EGX' | 'TASI' | 'QE';
  currency: string;
  sector: string;
  industry: string;
  currentPrice: number;
  change: number;
  changePct: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  peRatio: number;
  pbRatio: number;
  dividendYield: number;
  revenue: number;
  netIncome: number;
}

export const SEED_COMPANIES: SeedCompany[] = [
  // 10 EGX Stocks
  {
    symbol: "COMI",
    nameAr: "البنك التجاري الدولي",
    nameEn: "Commercial International Bank",
    aliases: ["البنك التجاري الدولي", "CIB", "التجاري الدولي", "comi"],
    market: "EGX",
    currency: "EGP",
    sector: "الخدمات المالية والبنوك",
    industry: "بنوك",
    currentPrice: 123.50,
    change: 1.20,
    changePct: 1.41,
    high52w: 130.00,
    low52w: 78.00,
    marketCap: 259200000000,
    peRatio: 7.4,
    pbRatio: 1.85,
    dividendYield: 4.8,
    revenue: 55400000000,
    netIncome: 35000000000
  },
  {
    symbol: "ABUK",
    nameAr: "أبو قير للأسمدة والصناعات الكيماوية",
    nameEn: "Abu Qir Fertilizers",
    aliases: ["أبو قير للأسمدة", "ابو قير", "abuk"],
    market: "EGX",
    currency: "EGP",
    sector: "المواد الأساسية",
    industry: "أسمدة وكيماويات",
    currentPrice: 77.70,
    change: -0.45,
    changePct: -0.58,
    high52w: 88.00,
    low52w: 52.00,
    marketCap: 78500000000,
    peRatio: 8.9,
    pbRatio: 2.3,
    dividendYield: 6.2,
    revenue: 21300000000,
    netIncome: 8800000000
  },
  {
    symbol: "FWRX",
    nameAr: "فوري لتكنولوجيا البنوك والمدفوعات الإلكترونية",
    nameEn: "Fawry Banking & Payment",
    aliases: ["فوري", "fawry", "fwrx"],
    market: "EGX",
    currency: "EGP",
    sector: "التكنولوجيا",
    industry: "مدفوعات رقمية",
    currentPrice: 6.85,
    change: 0.15,
    changePct: 2.24,
    high52w: 8.90,
    low52w: 4.80,
    marketCap: 24000000000,
    peRatio: 24.5,
    pbRatio: 3.1,
    dividendYield: 0.0,
    revenue: 4200000000,
    netIncome: 980000000
  },
  {
    symbol: "ESRS",
    nameAr: "حديد عز",
    nameEn: "Ezz Steel",
    aliases: ["حديد عز", "عز", "esrs"],
    market: "EGX",
    currency: "EGP",
    sector: "المواد الأساسية",
    industry: "حديد وصلب",
    currentPrice: 104.50,
    change: 2.10,
    changePct: 2.05,
    high52w: 122.00,
    low52w: 75.00,
    marketCap: 56700000000,
    peRatio: 6.2,
    pbRatio: 1.6,
    dividendYield: 3.5,
    revenue: 142000000000,
    netIncome: 9140000000
  },
  {
    symbol: "HRHO",
    nameAr: "مجموعة إي إف جي القابضة",
    nameEn: "EFG Holding",
    aliases: ["هيرميس", "اي اف جي", "hrho"],
    market: "EGX",
    currency: "EGP",
    sector: "الخدمات المالية",
    industry: "بنوك استثمارية",
    currentPrice: 22.80,
    change: 0.30,
    changePct: 1.33,
    high52w: 26.50,
    low52w: 16.50,
    marketCap: 33400000000,
    peRatio: 9.1,
    pbRatio: 1.1,
    dividendYield: 5.0,
    revenue: 16800000000,
    netIncome: 3670000000
  },
  {
    symbol: "TMGH",
    nameAr: "مجموعة طلعت مصطفى القابضة",
    nameEn: "Talaat Moustafa Group",
    aliases: ["طلعت مصطفى", "tmgh"],
    market: "EGX",
    currency: "EGP",
    sector: "العقارات",
    industry: "تطوير عقاري",
    currentPrice: 58.70,
    change: 1.10,
    changePct: 1.91,
    high52w: 88.00,
    low52w: 28.00,
    marketCap: 121000000000,
    peRatio: 12.8,
    pbRatio: 2.4,
    dividendYield: 2.2,
    revenue: 38500000000,
    netIncome: 9450000000
  },
  {
    symbol: "EKHO",
    nameAr: "الشركة المصرية الكويتية القابضة",
    nameEn: "Egypt Kuwait Holding",
    aliases: ["المصرية الكويتية", "ekho"],
    market: "EGX",
    currency: "EGP",
    sector: "استثمار متعدد",
    industry: "قابضة",
    currentPrice: 42.10,
    change: -0.20,
    changePct: -0.47,
    high52w: 52.00,
    low52w: 36.00,
    marketCap: 47000000000,
    peRatio: 7.8,
    pbRatio: 1.4,
    dividendYield: 6.8,
    revenue: 31000000000,
    netIncome: 6020000000
  },
  {
    symbol: "SWDY",
    nameAr: "السويدي إليكتريك",
    nameEn: "Elsewedy Electric",
    aliases: ["السويدي", "swdy"],
    market: "EGX",
    currency: "EGP",
    sector: "الصناعة والكهرباء",
    industry: "كابلات ومعدات",
    currentPrice: 108.60,
    change: 0.80,
    changePct: 0.74,
    high52w: 115.00,
    low52w: 42.00,
    marketCap: 106000000000,
    peRatio: 8.4,
    pbRatio: 2.0,
    dividendYield: 4.1,
    revenue: 152000000000,
    netIncome: 12600000000
  },
  {
    symbol: "ETEL",
    nameAr: "الشركة المصرية للاتصالات",
    nameEn: "Telecom Egypt",
    aliases: ["المصرية للاتصالات", "وي", "we", "etel"],
    market: "EGX",
    currency: "EGP",
    sector: "الاتصالات",
    industry: "اتصالات",
    currentPrice: 38.25,
    change: -0.15,
    changePct: -0.39,
    high52w: 46.00,
    low52w: 29.00,
    marketCap: 65300000000,
    peRatio: 6.9,
    pbRatio: 1.05,
    dividendYield: 5.5,
    revenue: 62000000000,
    netIncome: 9460000000
  },
  {
    symbol: "MNHD",
    nameAr: "مدينة مصر للإسكان والتعمير",
    nameEn: "Madinet Masr Housing",
    aliases: ["مدينة مصر", "مدينة نصر سابقاً", "mnhd"],
    market: "EGX",
    currency: "EGP",
    sector: "العقارات",
    industry: "تطوير عقاري",
    currentPrice: 4.35,
    change: 0.05,
    changePct: 1.16,
    high52w: 5.40,
    low52w: 3.10,
    marketCap: 9350000000,
    peRatio: 7.2,
    pbRatio: 1.3,
    dividendYield: 4.6,
    revenue: 7800000000,
    netIncome: 1300000000
  },

  // 10 TASI Stocks
  {
    symbol: "2222",
    nameAr: "شركة الزيت العربية السعودية (أرامكو السعودية)",
    nameEn: "Saudi Aramco",
    aliases: ["أرامكو", "ارامكو", "aramco", "2222"],
    market: "TASI",
    currency: "SAR",
    sector: "الطاقة",
    industry: "النفط والغاز",
    currentPrice: 26.16,
    change: 0.25,
    changePct: 0.96,
    high52w: 34.50,
    low52w: 25.50,
    marketCap: 6690000000000,
    peRatio: 15.2,
    pbRatio: 3.8,
    dividendYield: 6.9,
    revenue: 1850000000000,
    netIncome: 440000000000
  },
  {
    symbol: "1120",
    nameAr: "مصرف الراجحي",
    nameEn: "Al Rajhi Bank",
    aliases: ["الراجحي", "مصرف الراجحي", "alrajhi", "1120"],
    market: "TASI",
    currency: "SAR",
    sector: "البنوك والخدمات المالية",
    industry: "بنوك إسلامية",
    currentPrice: 60.15,
    change: 0.80,
    changePct: 1.35,
    high52w: 96.00,
    low52w: 58.00,
    marketCap: 353200000000,
    peRatio: 18.5,
    pbRatio: 3.4,
    dividendYield: 3.2,
    revenue: 37500000000,
    netIncome: 19100000000
  },
  {
    symbol: "1180",
    nameAr: "البنك الأهلي السعودي (SNB)",
    nameEn: "Saudi National Bank",
    aliases: ["الأهلي السعودي", "snb", "1180"],
    market: "TASI",
    currency: "SAR",
    sector: "البنوك",
    industry: "بنوك تجارية",
    currentPrice: 35.80,
    change: 0.40,
    changePct: 1.13,
    high52w: 43.50,
    low52w: 32.00,
    marketCap: 214800000000,
    peRatio: 11.2,
    pbRatio: 1.35,
    dividendYield: 4.8,
    revenue: 34000000000,
    netIncome: 19200000000
  },
  {
    symbol: "2010",
    nameAr: "الشركة السعودية للصناعات الأساسية (سابك)",
    nameEn: "SABIC",
    aliases: ["سابك", "sabic", "2010"],
    market: "TASI",
    currency: "SAR",
    sector: "المواد الأساسية",
    industry: "بتروكيماويات",
    currentPrice: 71.40,
    change: -0.60,
    changePct: -0.83,
    high52w: 86.00,
    low52w: 68.50,
    marketCap: 214200000000,
    peRatio: 22.0,
    pbRatio: 1.3,
    dividendYield: 4.5,
    revenue: 141000000000,
    netIncome: 9740000000
  },
  {
    symbol: "7010",
    nameAr: "شركة الاتصالات السعودية (إس تي سي)",
    nameEn: "stc",
    aliases: ["stc", "الاتصالات السعودية", "7010"],
    market: "TASI",
    currency: "SAR",
    sector: "الاتصالات",
    industry: "خدمات الاتصالات",
    currentPrice: 41.20,
    change: 0.35,
    changePct: 0.86,
    high52w: 46.80,
    low52w: 36.50,
    marketCap: 206000000000,
    peRatio: 15.6,
    pbRatio: 2.7,
    dividendYield: 4.9,
    revenue: 72000000000,
    netIncome: 13200000000
  },
  {
    symbol: "1150",
    nameAr: "مصرف الإنماء",
    nameEn: "Alinma Bank",
    aliases: ["الإنماء", "alinma", "1150"],
    market: "TASI",
    currency: "SAR",
    sector: "البنوك",
    industry: "بنوك إسلامية",
    currentPrice: 32.10,
    change: 0.30,
    changePct: 0.94,
    high52w: 37.00,
    low52w: 28.00,
    marketCap: 80250000000,
    peRatio: 14.8,
    pbRatio: 2.1,
    dividendYield: 3.9,
    revenue: 10500000000,
    netIncome: 5420000000
  },
  {
    symbol: "2380",
    nameAr: "شركة رابغ للتكرير والبتروكيماويات (بترو رابغ)",
    nameEn: "Petro Rabigh",
    aliases: ["بترو رابغ", "2380"],
    market: "TASI",
    currency: "SAR",
    sector: "الطاقة",
    industry: "تكرير وبتروكيماويات",
    currentPrice: 8.12,
    change: -0.08,
    changePct: -0.98,
    high52w: 11.20,
    low52w: 7.20,
    marketCap: 13560000000,
    peRatio: 19.5,
    pbRatio: 0.9,
    dividendYield: 0.0,
    revenue: 44000000000,
    netIncome: 695000000
  },
  {
    symbol: "2020",
    nameAr: "شركة سابك للمغذيات الزراعية",
    nameEn: "SABIC Agri-Nutrients",
    aliases: ["سافكو", "سابك للمغذيات", "2020"],
    market: "TASI",
    currency: "SAR",
    sector: "المواد الأساسية",
    industry: "أسمدة زراعية",
    currentPrice: 116.80,
    change: 1.40,
    changePct: 1.21,
    high52w: 139.00,
    low52w: 104.00,
    marketCap: 55600000000,
    peRatio: 16.4,
    pbRatio: 3.1,
    dividendYield: 5.6,
    revenue: 11800000000,
    netIncome: 3390000000
  },
  {
    symbol: "2280",
    nameAr: "شركة المراعي",
    nameEn: "Almarai",
    aliases: ["المراعي", "almarai", "2280"],
    market: "TASI",
    currency: "SAR",
    sector: "إنتاج الأغذية",
    industry: "منتجات ألبان وأغذية",
    currentPrice: 56.40,
    change: 0.20,
    changePct: 0.36,
    high52w: 64.00,
    low52w: 50.00,
    marketCap: 56400000000,
    peRatio: 22.8,
    pbRatio: 3.0,
    dividendYield: 2.1,
    revenue: 19600000000,
    netIncome: 2470000000
  },
  {
    symbol: "1010",
    nameAr: "بنك الرياض",
    nameEn: "Riyad Bank",
    aliases: ["بنك الرياض", "riyad bank", "1010"],
    market: "TASI",
    currency: "SAR",
    sector: "البنوك",
    industry: "بنوك تجارية",
    currentPrice: 28.95,
    change: 0.35,
    changePct: 1.22,
    high52w: 32.50,
    low52w: 24.50,
    marketCap: 86850000000,
    peRatio: 10.9,
    pbRatio: 1.4,
    dividendYield: 4.7,
    revenue: 16200000000,
    netIncome: 7960000000
  },

  // Regional benchmark: QNBK (Qatar)
  {
    symbol: "QNBK",
    nameAr: "مجموعة بنك قطر الوطني",
    nameEn: "Qatar National Bank",
    aliases: ["QNB", "بنك قطر الوطني", "qnbk"],
    market: "QE",
    currency: "QAR",
    sector: "البنوك والخدمات المالية",
    industry: "بنوك",
    currentPrice: 15.60,
    change: 0.12,
    changePct: 0.78,
    high52w: 17.80,
    low52w: 13.90,
    marketCap: 144000000000,
    peRatio: 9.3,
    pbRatio: 1.3,
    dividendYield: 4.2,
    revenue: 38000000000,
    netIncome: 15500000000
  }
];

// Helper to generate 90 daily bars of realistic historical candles
export function generateCandles(basePrice: number, days: number = 90): Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }> {
  const candles = [];
  let price = basePrice * 0.88;
  const now = new Date('2026-11-01');

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    // skip weekends (Fri & Sat for MENA or Sat & Sun)
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const trend = (days - i) / days; // gentle upward drift
    const noise = (Math.random() - 0.48) * (price * 0.024);
    const open = Number((price).toFixed(2));
    const close = Number((price + noise + (trend * 0.1)).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (price * 0.012)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (price * 0.012)).toFixed(2));
    const volume = Math.floor(1500000 + Math.random() * 3500000);

    candles.push({ time: dateStr, open, high, low, close, volume });
    price = close;
  }
  return candles;
}
