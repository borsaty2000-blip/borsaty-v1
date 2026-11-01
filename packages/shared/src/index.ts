// Markets
export type Market = 'EGX' | 'TASI' | 'NOMU' | 'DFM' | 'ADX' | 'QE' | 'KW' | 'US' | 'UK' | 'DE' | 'JP' | 'GLOBAL';
export type AssetClass = 'EQUITY' | 'FOREX' | 'CRYPTO' | 'COMMODITY' | 'INDEX';

export type SignalType = 'STRONG_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG_BEARISH';
export type SignalStatus = 'ACTIVE' | 'HIT_T1' | 'HIT_T2' | 'HIT_T3' | 'STOPPED' | 'INVALIDATED';
export type CertaintyLevel = 'Confirmed' | 'Probable' | 'Potential' | 'Unconfirmed';

export interface DataQuality {
  provider: 'SAHMK' | 'Younit' | 'EGX_NEWS' | 'EODHD' | 'MOCK_PROXY';
  isRealtime: boolean;
  isDelayed: boolean;
  delayMinutes: number;
  hasOrderBook: boolean;
  orderBookProxyUsed: boolean;
  warnings: string[];
  missingFields: string[];
  verifiedAt: string;
}

export interface OHLCV {
  time: string | number; // YYYY-MM-DD or Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Company {
  id: string;
  symbol: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
  market: Market;
  currency: string;
  sector?: string;
  industry?: string;
  logoUrl?: string;
}

export interface Target {
  level: number;
  price: number;
  method: string; // e.g. "Fibonacci 1.618 Extension", "Gann 2x1 Angle", "Elliott Wave 3 Projection"
  hit: boolean;
}

export interface StopLoss {
  price: number;
  method: string; // e.g. "Structural Low / Pivot", "ATR 1.5x Multiplier", "Elliott Wave 1 Invalidation"
}

export interface ConfluenceBreakdown {
  gannSquareOfNine: number; // weight 20%
  gannAngles: number; // weight 15%
  gannTimeCycles: number; // weight 10%
  fibonacci: number; // weight 20%
  harmonics: number; // weight 25%
  volume: number; // weight 10%
  totalScore: number; // 0-100
}

export interface SignalExplainability {
  headline: string;
  certainty: CertaintyLevel;
  confluenceScore: number;
  confidencePct: number;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  primaryScenario: string;
  alternativeScenario: string;
  invalidationCriteria: string;
  dataQualityNotes: string[];
  targets: Target[];
  stopLoss: StopLoss;
}

export interface TechnicalSignal {
  id: string;
  symbol: string;
  market: Market;
  timeframe: string;
  type: SignalType;
  entry: number;
  stopLoss: number;
  targets: number[];
  confluenceScore: number;
  reasons: string[];
  contradicting: string[];
  dataQuality: DataQuality;
  status: SignalStatus;
  createdAt: string;
  closedAt?: string;
  resultPct?: number;
  explainability: SignalExplainability;
}

export interface IndicatorPoint {
  time: string | number;
  value?: number;
  // Specific indicators
  sma20?: number;
  sma50?: number;
  sma200?: number;
  ema20?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

// Arabic Stock Aliases Map
export const ARABIC_STOCK_ALIASES: Record<string, { symbol: string; market: Market; nameAr: string; nameEn: string }> = {
  // EGX Stocks
  "comi": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
  "التجاري الدولي": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
  "البنك التجاري الدولي": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },
  "cib": { symbol: "COMI", market: "EGX", nameAr: "البنك التجاري الدولي", nameEn: "Commercial International Bank" },

  "abuk": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
  "أبو قير": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
  "ابو قير": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },
  "أبو قير للأسمدة": { symbol: "ABUK", market: "EGX", nameAr: "أبو قير للأسمدة", nameEn: "Abu Qir Fertilizers" },

  "fwrx": { symbol: "FWRX", market: "EGX", nameAr: "فوري لتكنولوجيا البنوك", nameEn: "Fawry Banking & Payment" },
  "فوري": { symbol: "FWRX", market: "EGX", nameAr: "فوري لتكنولوجيا البنوك", nameEn: "Fawry Banking & Payment" },

  "esrs": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },
  "حديد عز": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },
  "عز": { symbol: "ESRS", market: "EGX", nameAr: "حديد عز", nameEn: "Ezz Steel" },

  "hrho": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },
  "هيرميس": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },
  "اي اف جي": { symbol: "HRHO", market: "EGX", nameAr: "إي إف جي القابضة (هيرميس)", nameEn: "EFG Holding" },

  "tmgh": { symbol: "TMGH", market: "EGX", nameAr: "مجموعة طلعت مصطفى القابضة", nameEn: "Talaat Moustafa Group" },
  "طلعت مصطفى": { symbol: "TMGH", market: "EGX", nameAr: "مجموعة طلعت مصطفى القابضة", nameEn: "Talaat Moustafa Group" },

  "ekho": { symbol: "EKHO", market: "EGX", nameAr: "الشركة المصرية الكويتية القابضة", nameEn: "Egypt Kuwait Holding" },
  "المصرية الكويتية": { symbol: "EKHO", market: "EGX", nameAr: "الشركة المصرية الكويتية القابضة", nameEn: "Egypt Kuwait Holding" },

  "swdy": { symbol: "SWDY", market: "EGX", nameAr: "السويدي إليكتريك", nameEn: "Elsewedy Electric" },
  "السويدي": { symbol: "SWDY", market: "EGX", nameAr: "السويدي إليكتريك", nameEn: "Elsewedy Electric" },

  "etel": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },
  "المصرية للاتصالات": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },
  "وي": { symbol: "ETEL", market: "EGX", nameAr: "المصرية للاتصالات (وي)", nameEn: "Telecom Egypt" },

  "mnhd": { symbol: "MNHD", market: "EGX", nameAr: "مدينة مصر للإسكان والتعمير", nameEn: "Madinet Masr Housing" },
  "مدينة مصر": { symbol: "MNHD", market: "EGX", nameAr: "مدينة مصر للإسكان والتعمير", nameEn: "Madinet Masr Housing" },

  // TASI Stocks
  "2222": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
  "أرامكو": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
  "ارامكو": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },
  "aramco": { symbol: "2222", market: "TASI", nameAr: "أرامكو السعودية", nameEn: "Saudi Aramco" },

  "1120": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
  "الراجحي": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
  "مصرف الراجحي": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },
  "alrajhi": { symbol: "1120", market: "TASI", nameAr: "مصرف الراجحي", nameEn: "Al Rajhi Bank" },

  "1180": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },
  "الأهلي السعودي": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },
  "snb": { symbol: "1180", market: "TASI", nameAr: "البنك الأهلي السعودي (SNB)", nameEn: "Saudi National Bank" },

  "2010": { symbol: "2010", market: "TASI", nameAr: "شركة سابك (سابك)", nameEn: "SABIC" },
  "سابك": { symbol: "2010", market: "TASI", nameAr: "شركة سابك (سابك)", nameEn: "SABIC" },

  "7010": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },
  "الاتصالات السعودية": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },
  "stc": { symbol: "7010", market: "TASI", nameAr: "إس تي سي (الاتصالات السعودية)", nameEn: "stc" },

  "1150": { symbol: "1150", market: "TASI", nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },
  "الإنماء": { symbol: "1150", market: "TASI", nameAr: "مصرف الإنماء", nameEn: "Alinma Bank" },

  "2380": { symbol: "2380", market: "TASI", nameAr: "بترو رابغ", nameEn: "Petro Rabigh" },
  "بترو رابغ": { symbol: "2380", market: "TASI", nameAr: "بترو رابغ", nameEn: "Petro Rabigh" },

  "2020": { symbol: "2020", market: "TASI", nameAr: "سافكو / سابك للمغذيات الزراعية", nameEn: "SABIC Agri-Nutrients" },
  "سابك للمغذيات": { symbol: "2020", market: "TASI", nameAr: "سافكو / سابك للمغذيات الزراعية", nameEn: "SABIC Agri-Nutrients" },

  "2280": { symbol: "2280", market: "TASI", nameAr: "شركة المراعي", nameEn: "Almarai" },
  "المراعي": { symbol: "2280", market: "TASI", nameAr: "شركة المراعي", nameEn: "Almarai" },

  "1010": { symbol: "1010", market: "TASI", nameAr: "بنك الرياض", nameEn: "Riyad Bank" },
  "بنك الرياض": { symbol: "1010", market: "TASI", nameAr: "بنك الرياض", nameEn: "Riyad Bank" },

  // Regional / Global test stocks
  "qnbk": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" },
  "بنك قطر الوطني": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" },
  "qnb": { symbol: "QNBK", market: "QE", nameAr: "مجموعة بنك قطر الوطني", nameEn: "Qatar National Bank" }
};

export function resolveStockAlias(query: string): { symbol: string; market: Market; nameAr: string; nameEn: string } | null {
  const normalized = query.trim().toLowerCase();
  return ARABIC_STOCK_ALIASES[normalized] || null;
}

export * from "./aliases/arabic-aliases";
