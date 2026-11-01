export interface StoredSignal {
  id: string;
  symbol: string;
  nameAr: string;
  market: "EGX" | "TASI" | "QE" | "US";
  timeframe: string;
  type: "STRONG_BULLISH" | "BULLISH" | "NEUTRAL" | "BEARISH" | "STRONG_BEARISH";
  entry: number;
  stopLoss: number;
  targets: number[];
  confluenceScore: number;
  reasons: string[];
  contradicting: string[];
  dataQuality: {
    provider: string;
    isRealtime: boolean;
    isDelayed: boolean;
    orderBookProxyUsed: boolean;
  };
  status: "ACTIVE" | "HIT_T1" | "HIT_T2" | "HIT_T3" | "STOPPED" | "INVALIDATED";
  resultPct: number | null;
  createdAt: string;
  closedAt: string | null;
}

export const SIGNALS_STORE: StoredSignal[] = [
  {
    id: "SIG-COMI-2026-1001",
    symbol: "COMI",
    nameAr: "البنك التجاري الدولي",
    market: "EGX",
    timeframe: "1D",
    type: "BULLISH",
    entry: 81.50,
    stopLoss: 78.00,
    targets: [86.80, 90.00, 94.50],
    confluenceScore: 82,
    reasons: [
      "Elliott: بداية الموجة 3 الدافعة الصاعدة",
      "Gann: ارتداد مباشر من دعم Square of 9 عند 81.00",
      "Fibonacci: استقرار كامل فوق نسبة 61.8%"
    ],
    contradicting: ["حجم التداول اليومي أقل بنسبة 5% من المتوسط الأسبوعي"],
    dataQuality: {
      provider: "Younit/EGX_NEWS",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "HIT_T1",
    resultPct: 6.5,
    createdAt: "2026-10-12T09:30:00Z",
    closedAt: "2026-10-24T14:30:00Z",
  },
  {
    id: "SIG-2222-2026-1002",
    symbol: "2222",
    nameAr: "أرامكو السعودية",
    market: "TASI",
    timeframe: "1D",
    type: "STRONG_BULLISH",
    entry: 26.80,
    stopLoss: 25.90,
    targets: [28.50, 29.80, 31.00],
    confluenceScore: 88,
    reasons: [
      "Harmonic: نموذج Bullish Gartley عند منطقة PRZ",
      "Gann Angles: السعر فوق زاوية 1x1 مع تدفق سيولة مؤسسية",
      "RSI: دايفرجنس إيجابي صاعد على الفريم اليومي"
    ],
    contradicting: ["مؤشر النفط العالمي يشهد تذبذباً عرضياً"],
    dataQuality: {
      provider: "SAHMK",
      isRealtime: true,
      isDelayed: false,
      orderBookProxyUsed: false,
    },
    status: "HIT_T2",
    resultPct: 11.2,
    createdAt: "2026-10-05T07:15:00Z",
    closedAt: "2026-10-28T12:00:00Z",
  },
  {
    id: "SIG-1120-2026-1003",
    symbol: "1120",
    nameAr: "مصرف الراجحي",
    market: "TASI",
    timeframe: "4H",
    type: "BULLISH",
    entry: 85.00,
    stopLoss: 82.50,
    targets: [89.50, 93.00],
    confluenceScore: 76,
    reasons: [
      "Structure: كسر هيكلي صاعد BOS فوق 84.80",
      "SMA: ارتداد ناجح من متوسط 50 يوماً"
    ],
    contradicting: ["Stochastic تشبع شرائي لحظي"],
    dataQuality: {
      provider: "SAHMK",
      isRealtime: true,
      isDelayed: false,
      orderBookProxyUsed: false,
    },
    status: "ACTIVE",
    resultPct: 3.9,
    createdAt: "2026-10-28T08:00:00Z",
    closedAt: null,
  },
  {
    id: "SIG-ABUK-2026-1004",
    symbol: "ABUK",
    nameAr: "أبو قير للأسمدة",
    market: "EGX",
    timeframe: "1D",
    type: "NEUTRAL",
    entry: 62.50,
    stopLoss: 59.80,
    targets: [66.00, 69.50],
    confluenceScore: 54,
    reasons: ["تداول داخل قناة سعرية متوازية"],
    contradicting: [
      "ضعف عزم الماكد MACD",
      "تعارض بين فريم 4 ساعات والفريم اليومي"
    ],
    dataQuality: {
      provider: "Younit/EGX_NEWS",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "ACTIVE",
    resultPct: -0.6,
    createdAt: "2026-10-29T10:00:00Z",
    closedAt: null,
  },
  {
    id: "SIG-ESRS-2026-1005",
    symbol: "ESRS",
    nameAr: "حديد عز",
    market: "EGX",
    timeframe: "1D",
    type: "STRONG_BULLISH",
    entry: 96.00,
    stopLoss: 91.50,
    targets: [104.00, 110.00],
    confluenceScore: 84,
    reasons: [
      "اختراق قمة سابقة بحجم تداول قياسي",
      "Elliott: امتداد الموجة 3",
      "Gann: اختراق زاوية 2x1"
    ],
    contradicting: ["RSI تجاوز 72"],
    dataQuality: {
      provider: "Younit/EGX_NEWS",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "HIT_T1",
    resultPct: 8.3,
    createdAt: "2026-10-18T09:45:00Z",
    closedAt: "2026-10-31T13:00:00Z",
  },
  {
    id: "SIG-SWDY-2026-1006",
    symbol: "SWDY",
    nameAr: "السويدي إليكتريك",
    market: "EGX",
    timeframe: "1D",
    type: "BEARISH",
    entry: 51.00,
    stopLoss: 53.20,
    targets: [47.50, 45.00],
    confluenceScore: 71,
    reasons: [
      "كسر خط اتجاه صاعد رئيسي",
      "دايفرجنس سلبي مزدوج على RSI"
    ],
    contradicting: ["النتائج المالية للشركة قوية جداً"],
    dataQuality: {
      provider: "Younit/EGX_NEWS",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "HIT_T1",
    resultPct: 6.8,
    createdAt: "2026-10-10T10:30:00Z",
    closedAt: "2026-10-20T11:00:00Z",
  },
  {
    id: "SIG-FWRX-2026-1007",
    symbol: "FWRX",
    nameAr: "فوري",
    market: "EGX",
    timeframe: "1D",
    type: "BULLISH",
    entry: 6.90,
    stopLoss: 6.45,
    targets: [7.50, 8.00],
    confluenceScore: 68,
    reasons: ["محاولة ارتداد من خط دعم أفقي"],
    contradicting: ["السيولة السوقية العامة منخفضة"],
    dataQuality: {
      provider: "Younit/EGX_NEWS",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "STOPPED",
    resultPct: -6.5,
    createdAt: "2026-10-08T09:30:00Z",
    closedAt: "2026-10-15T12:00:00Z",
  },
  {
    id: "SIG-QNBK-2026-1008",
    symbol: "QNBK",
    nameAr: "بنك قطر الوطني",
    market: "QE",
    timeframe: "1D",
    type: "BULLISH",
    entry: 14.80,
    stopLoss: 14.20,
    targets: [15.60, 16.20],
    confluenceScore: 79,
    reasons: ["ارتداد من قاع مزدوج Double Bottom", "Gann Square of 9 support"],
    contradicting: ["حجم تداول ضعيف في جلسة الاختراق"],
    dataQuality: {
      provider: "EODHD",
      isRealtime: false,
      isDelayed: true,
      orderBookProxyUsed: true,
    },
    status: "HIT_T1",
    resultPct: 5.4,
    createdAt: "2026-10-14T08:00:00Z",
    closedAt: "2026-10-27T10:00:00Z",
  }
];

export function calculateSignalMetrics(signals: StoredSignal[]) {
  const closedSignals = signals.filter((s) => s.status !== "ACTIVE");
  const successfulSignals = closedSignals.filter(
    (s) => s.status === "HIT_T1" || s.status === "HIT_T2" || s.status === "HIT_T3"
  );

  const overallHitRate = closedSignals.length > 0
    ? Math.round((successfulSignals.length / closedSignals.length) * 100)
    : 0;

  const types = ["STRONG_BULLISH", "BULLISH", "NEUTRAL", "BEARISH", "STRONG_BEARISH"] as const;
  const breakdown: Record<string, { total: number; closed: number; hits: number; hitRate: number; avgReturn: number }> = {};

  types.forEach((t) => {
    const ofType = signals.filter((s) => s.type === t);
    const closedOfType = ofType.filter((s) => s.status !== "ACTIVE");
    const hits = closedOfType.filter(
      (s) => s.status === "HIT_T1" || s.status === "HIT_T2" || s.status === "HIT_T3"
    );
    const returns = closedOfType.map((s) => s.resultPct || 0);
    const avgReturn = returns.length > 0 ? Number((returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(1)) : 0;

    breakdown[t] = {
      total: ofType.length,
      closed: closedOfType.length,
      hits: hits.length,
      hitRate: closedOfType.length > 0 ? Math.round((hits.length / closedOfType.length) * 100) : 0,
      avgReturn,
    };
  });

  return {
    totalSignals: signals.length,
    activeSignals: signals.filter((s) => s.status === "ACTIVE").length,
    closedSignals: closedSignals.length,
    overallHitRate,
    avgReturnOverall: closedSignals.length > 0
      ? Number((closedSignals.reduce((acc, s) => acc + (s.resultPct || 0), 0) / closedSignals.length).toFixed(1))
      : 0,
    breakdown,
  };
}
