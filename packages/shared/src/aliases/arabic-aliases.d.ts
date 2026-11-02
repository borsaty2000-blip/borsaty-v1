import { Market } from "../index";
export interface ArabicStockMapping {
    symbol: string;
    providerSymbol: string;
    market: Market;
    nameAr: string;
    nameEn: string;
    aliases: string[];
    sector?: string;
    currency: string;
}
export declare const ARABIC_STOCK_MAPPINGS: ArabicStockMapping[];
export declare function findArabStockMapping(query: string): ArabicStockMapping | null;
