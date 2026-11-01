import { redis } from "../providers/redis";

export interface RawPriceBar {
  symbol: string;
  timeframe?: string;
  timestamp: string | number | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  durationSeconds?: number;
}

export interface ValidationResult {
  valid: boolean;
  rule?: string;
  error?: string;
}

const seenBarKeys = new Set<string>();

export function getExpectedDurationSeconds(timeframe: string = "1D"): number {
  const tf = timeframe.toUpperCase();
  if (tf === "1M") return 60;
  if (tf === "5M") return 300;
  if (tf === "15M") return 900;
  if (tf === "1H") return 3600;
  if (tf === "4H") return 14400;
  if (tf === "1D") return 86400;
  if (tf === "1W") return 604800;
  return 86400;
}

export async function validatePriceBar(
  bar: RawPriceBar,
  provider: string = "generic",
  options?: { skipDuplicateCheck?: boolean }
): Promise<ValidationResult> {
  const tf = bar.timeframe || "1D";

  // 1. high >= low
  if (bar.high < bar.low) {
    return handleRejection("HIGH_LESS_THAN_LOW", `high (${bar.high}) < low (${bar.low})`, provider, bar);
  }

  // 2. high >= close >= low
  if (bar.close > bar.high || bar.close < bar.low) {
    return handleRejection(
      "CLOSE_OUT_OF_RANGE",
      `close (${bar.close}) not in range [${bar.low}, ${bar.high}]`,
      provider,
      bar
    );
  }

  // 3. high >= open >= low
  if (bar.open > bar.high || bar.open < bar.low) {
    return handleRejection(
      "OPEN_OUT_OF_RANGE",
      `open (${bar.open}) not in range [${bar.low}, ${bar.high}]`,
      provider,
      bar
    );
  }

  // 4. volume >= 0
  if (bar.volume !== undefined && bar.volume < 0) {
    return handleRejection("NEGATIVE_VOLUME", `volume (${bar.volume}) < 0`, provider, bar);
  }

  // 5. price > 0
  if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) {
    return handleRejection(
      "NON_POSITIVE_PRICE",
      `One or more prices <= 0 (O:${bar.open}, H:${bar.high}, L:${bar.low}, C:${bar.close})`,
      provider,
      bar
    );
  }

  // 6. timestamp within [now - 5y, now + 1h]
  const barTime = new Date(bar.timestamp).getTime();
  if (isNaN(barTime)) {
    return handleRejection("INVALID_TIMESTAMP", `Timestamp cannot be parsed: ${bar.timestamp}`, provider, bar);
  }

  const now = Date.now();
  const fiveYearsAgo = now - 5 * 365.25 * 86400 * 1000;
  const oneHourFuture = now + 3600 * 1000;

  if (barTime < fiveYearsAgo || barTime > oneHourFuture) {
    return handleRejection(
      "TIMESTAMP_OUT_OF_BOUNDS",
      `Timestamp ${new Date(barTime).toISOString()} outside allowable window [5y ago, 1h future]`,
      provider,
      bar
    );
  }

  // 7. bar duration matches timeframe (±10%)
  if (bar.durationSeconds !== undefined && bar.durationSeconds > 0) {
    const expected = getExpectedDurationSeconds(tf);
    const minDur = expected * 0.9;
    const maxDur = expected * 1.1;
    if (bar.durationSeconds < minDur || bar.durationSeconds > maxDur) {
      return handleRejection(
        "INVALID_BAR_DURATION",
        `Duration ${bar.durationSeconds}s deviates > 10% from expected ${expected}s for ${tf}`,
        provider,
        bar
      );
    }
  }

  // 8. Not a duplicate (same symbol + timeframe + timestamp)
  const timeKey = new Date(barTime).toISOString().slice(0, 10);
  const dedupKey = `${bar.symbol.toUpperCase()}:${tf}:${timeKey}`;

  if (!options?.skipDuplicateCheck) {
    if (seenBarKeys.has(dedupKey)) {
      return handleRejection(
        "DUPLICATE_BAR",
        `Bar with symbol ${bar.symbol}, tf ${tf}, date ${timeKey} already processed`,
        provider,
        bar
      );
    }
    seenBarKeys.add(dedupKey);
  }

  return { valid: true };
}

async function handleRejection(
  rule: string,
  error: string,
  provider: string,
  bar: RawPriceBar
): Promise<ValidationResult> {
  const metricKey = `quality_rejections_total{rule="${rule}",provider="${provider}"}`;
  await redis.hincrby("metrics:counters", metricKey, 1);
  await redis.hincrby("dlq:stats", "quality_rejections", 1);

  // Structured console log
  console.warn(
    JSON.stringify({
      level: "WARN",
      event: "DATA_QUALITY_GATE_REJECTION",
      rule,
      provider,
      symbol: bar.symbol,
      error,
      timestamp: new Date().toISOString(),
    })
  );

  return {
    valid: false,
    rule,
    error,
  };
}

export function filterValidBars(
  bars: RawPriceBar[],
  provider: string = "generic"
): Promise<RawPriceBar[]> {
  return Promise.all(
    bars.map(async (bar) => {
      const res = await validatePriceBar(bar, provider);
      return res.valid ? bar : null;
    })
  ).then((results) => results.filter((b): b is RawPriceBar => b !== null));
}

export function clearDuplicateCache(): void {
  seenBarKeys.clear();
}
