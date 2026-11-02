export * from './types/api';
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
    time: string | number;
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
    method: string;
    hit: boolean;
}
export interface StopLoss {
    price: number;
    method: string;
}
export interface ConfluenceBreakdown {
    gannSquareOfNine: number;
    gannAngles: number;
    gannTimeCycles: number;
    fibonacci: number;
    harmonics: number;
    volume: number;
    totalScore: number;
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
export declare const ARABIC_STOCK_ALIASES: Record<string, {
    symbol: string;
    market: Market;
    nameAr: string;
    nameEn: string;
}>;
export declare function resolveStockAlias(query: string): {
    symbol: string;
    market: Market;
    nameAr: string;
    nameEn: string;
} | null;
export * from "./aliases/arabic-aliases";
