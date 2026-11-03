export interface StrategyTag {
  id: string;
  nameAr: string;
  nameEn: string;
}

export const STOCK_STRATEGY_MAP: Record<string, StrategyTag[]> = {
  COMI: [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'momentum', nameAr: 'الزخم المؤسسي', nameEn: 'Alpha Momentum' },
  ],
  SWDY: [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'momentum', nameAr: 'الزخم المؤسسي', nameEn: 'Alpha Momentum' },
  ],
  '2222': [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'dividend', nameAr: 'عوائد التوزيعات', nameEn: 'Dividend Champions' },
  ],
  ABUK: [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'reversal', nameAr: 'قاع انعكاسي', nameEn: 'Harmonic Reversal' },
    { id: 'dividend', nameAr: 'عوائد التوزيعات', nameEn: 'Dividend Champions' },
  ],
  EAST: [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'dividend', nameAr: 'عوائد التوزيعات', nameEn: 'Dividend Champions' },
  ],
  NVDA: [
    { id: 'momentum', nameAr: 'الزخم المؤسسي', nameEn: 'Alpha Momentum' },
  ],
  MSFT: [
    { id: 'momentum', nameAr: 'الزخم المؤسسي', nameEn: 'Alpha Momentum' },
  ],
  '1120': [
    { id: 'value', nameAr: 'القيمة الجوهرية', nameEn: 'Institutional Value' },
    { id: 'momentum', nameAr: 'الزخم المؤسسي', nameEn: 'Alpha Momentum' },
  ],
  '2010': [
    { id: 'reversal', nameAr: 'قاع انعكاسي', nameEn: 'Harmonic Reversal' },
  ],
  AMOC: [
    { id: 'reversal', nameAr: 'قاع انعكاسي', nameEn: 'Harmonic Reversal' },
  ],
  TSLA: [
    { id: 'reversal', nameAr: 'قاع انعكاسي', nameEn: 'Harmonic Reversal' },
  ],
  ETEL: [
    { id: 'dividend', nameAr: 'عوائد التوزيعات', nameEn: 'Dividend Champions' },
  ],
  AAPL: [
    { id: 'dividend', nameAr: 'عوائد التوزيعات', nameEn: 'Dividend Champions' },
  ],
};

export function getStrategyBadges(symbol: string): StrategyTag[] {
  return STOCK_STRATEGY_MAP[symbol?.toUpperCase()] || [];
}
