export interface PriorityStock {
    symbol: string;
    market: 'EGX' | 'TASI' | 'US';
    nameAr: string;
    currency: string;
}
export declare const PRIORITY_STOCKS: PriorityStock[];
