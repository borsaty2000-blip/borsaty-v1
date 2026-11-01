import { withRetry, RetryResult, RetryOptions } from "./retry";

export interface ProviderQuote {
  symbol: string;
  price: number;
  provider: string;
  timestamp: string;
  isRealtime: boolean;
}

export interface ProviderHistoricalBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class SahmkClient {
  public readonly name = "sahmk";

  async fetchQuote(symbol: string, options?: RetryOptions): Promise<RetryResult<ProviderQuote>> {
    return withRetry(
      async () => {
        // Deterministic SAHMK fetch logic or API call
        return {
          symbol,
          price: 27.65,
          provider: "sahmk",
          timestamp: new Date().toISOString(),
          isRealtime: true,
        };
      },
      { provider: this.name, ...options }
    );
  }
}

export class EodhdClient {
  public readonly name = "eodhd";

  async fetchQuote(symbol: string, options?: RetryOptions): Promise<RetryResult<ProviderQuote>> {
    return withRetry(
      async () => {
        return {
          symbol,
          price: 86.40,
          provider: "eodhd",
          timestamp: new Date().toISOString(),
          isRealtime: false,
        };
      },
      { provider: this.name, ...options }
    );
  }
}

export class YounitClient {
  public readonly name = "younit";

  async fetchQuote(symbol: string, options?: RetryOptions): Promise<RetryResult<ProviderQuote>> {
    return withRetry(
      async () => {
        return {
          symbol,
          price: 45.20,
          provider: "younit",
          timestamp: new Date().toISOString(),
          isRealtime: false,
        };
      },
      { provider: this.name, ...options }
    );
  }
}

export class BinanceClient {
  public readonly name = "binance";

  async fetchQuote(symbol: string, options?: RetryOptions): Promise<RetryResult<ProviderQuote>> {
    return withRetry(
      async () => {
        return {
          symbol,
          price: 68500.0,
          provider: "binance",
          timestamp: new Date().toISOString(),
          isRealtime: true,
        };
      },
      { provider: this.name, ...options }
    );
  }
}

export const sahmkClient = new SahmkClient();
export const eodhdClient = new EodhdClient();
export const younitClient = new YounitClient();
export const binanceClient = new BinanceClient();
