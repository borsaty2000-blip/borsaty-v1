/**
 * Market Data types and defaults for the Omni-Navigation Mega Menu
 */

export interface MiniSparklineData {
  symbol: string;
  nameEn: string;
  nameAr: string;
  price: number;
  change: number;
  changePct: number;
  currency?: string;
  sparkline: number[];
}

export interface MegaMenuData {
  indices: MiniSparklineData[];
  commodities: MiniSparklineData[];
  crypto: MiniSparklineData[];
  topGainers: {
    symbol: string;
    nameEn: string;
    nameAr: string;
    market: string;
    price: number;
    changePct: number;
  }[];
  topLosers: {
    symbol: string;
    nameEn: string;
    nameAr: string;
    market: string;
    price: number;
    changePct: number;
  }[];
}

export const DEFAULT_MEGA_MENU_DATA: MegaMenuData = {
  indices: [
    {
      symbol: 'S&P 500',
      nameEn: 'S&P 500',
      nameAr: 'إس آند بي 500',
      price: 5864.2,
      change: 20.5,
      changePct: 0.35,
      sparkline: [5820, 5835, 5810, 5845, 5850, 5855, 5864],
    },
    {
      symbol: 'EGX30',
      nameEn: 'EGX 30',
      nameAr: 'البورصة المصرية 30',
      price: 30850.4,
      change: 378.2,
      changePct: 1.24,
      sparkline: [30100, 30250, 30400, 30300, 30600, 30750, 30850],
    },
    {
      symbol: 'TASI',
      nameEn: 'TASI',
      nameAr: 'تاسي السعودي',
      price: 12150.8,
      change: 82.3,
      changePct: 0.68,
      sparkline: [11950, 12020, 12080, 12040, 12100, 12120, 12150],
    },
    {
      symbol: 'DAX',
      nameEn: 'DAX 40',
      nameAr: 'داكس الألماني',
      price: 19425.1,
      change: 81.2,
      changePct: 0.42,
      sparkline: [19200, 19280, 19310, 19290, 19370, 19400, 19425],
    },
  ],
  commodities: [
    {
      symbol: 'GOLD',
      nameEn: 'Gold (Oz)',
      nameAr: 'الذهب أونصة',
      price: 2735.6,
      change: 14.8,
      changePct: 0.54,
      currency: 'USD',
      sparkline: [2710, 2715, 2728, 2720, 2730, 2725, 2735],
    },
    {
      symbol: 'SILVER',
      nameEn: 'Silver (Oz)',
      nameAr: 'الفضة أونصة',
      price: 33.8,
      change: 0.37,
      changePct: 1.12,
      currency: 'USD',
      sparkline: [32.5, 32.8, 33.1, 33.0, 33.4, 33.6, 33.8],
    },
    {
      symbol: 'BRENT',
      nameEn: 'Brent Crude',
      nameAr: 'نفط خام برنت',
      price: 74.2,
      change: -0.64,
      changePct: -0.85,
      currency: 'USD',
      sparkline: [76.5, 75.8, 75.2, 74.9, 75.1, 74.6, 74.2],
    },
    {
      symbol: 'COPPER',
      nameEn: 'Copper (Lb)',
      nameAr: 'النحاس رطل',
      price: 4.38,
      change: 0.01,
      changePct: 0.25,
      currency: 'USD',
      sparkline: [4.32, 4.34, 4.33, 4.35, 4.37, 4.36, 4.38],
    },
  ],
  crypto: [
    {
      symbol: 'BTC',
      nameEn: 'Bitcoin',
      nameAr: 'بيتكوين',
      price: 68420.0,
      change: 1410.0,
      changePct: 2.1,
      currency: 'USD',
      sparkline: [66200, 66800, 67100, 66900, 67500, 68000, 68420],
    },
    {
      symbol: 'ETH',
      nameEn: 'Ethereum',
      nameAr: 'إيثيريوم',
      price: 2640.5,
      change: 37.8,
      changePct: 1.45,
      currency: 'USD',
      sparkline: [2560, 2580, 2605, 2590, 2620, 2630, 2640],
    },
    {
      symbol: 'SOL',
      nameEn: 'Solana',
      nameAr: 'سولانا',
      price: 182.3,
      change: 8.35,
      changePct: 4.8,
      currency: 'USD',
      sparkline: [170, 172, 175, 174, 178, 180, 182],
    },
    {
      symbol: 'BNB',
      nameEn: 'BNB Chain',
      nameAr: 'بينانس كوين',
      price: 595.0,
      change: 5.3,
      changePct: 0.9,
      currency: 'USD',
      sparkline: [584, 587, 590, 589, 592, 593, 595],
    },
  ],
  topGainers: [
    {
      symbol: 'COMI',
      nameEn: 'Commercial Int. Bank',
      nameAr: 'البنك التجاري الدولي',
      market: 'EGX',
      price: 123.50,
      changePct: 2.49,
    },
    {
      symbol: 'FWRY',
      nameEn: 'Fawry E-Payments',
      nameAr: 'فوري لتكنولوجيا البنوك',
      market: 'EGX',
      price: 9.15,
      changePct: 3.12,
    },
    {
      symbol: '2222',
      nameEn: 'Saudi Aramco',
      nameAr: 'أرامكو السعودية',
      market: 'TASI',
      price: 28.5,
      changePct: 0.71,
    },
  ],
  topLosers: [
    {
      symbol: 'EAST',
      nameEn: 'Eastern Tobacco',
      nameAr: 'الشرقية للدخان',
      market: 'EGX',
      price: 34.2,
      changePct: -1.2,
    },
    {
      symbol: 'SWDY',
      nameEn: 'Elsewedy Electric',
      nameAr: 'السويدي إليكتريك',
      market: 'EGX',
      price: 108.60,
      changePct: -0.75,
    },
    {
      symbol: '1120',
      nameEn: 'Al Rajhi Bank',
      nameAr: 'مصرف الراجحي',
      market: 'TASI',
      price: 88.4,
      changePct: -0.45,
    },
  ],
};
