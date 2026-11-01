export interface RetryAttempt {
  attempt: number;
  reason: string;
  nextDelayMs: number;
  timestamp: string;
}

export class RetryExhaustedError extends Error {
  public readonly attempts: RetryAttempt[];
  public readonly provider?: string;
  public readonly lastError: Error;

  constructor(message: string, attempts: RetryAttempt[], lastError: Error, provider?: string) {
    super(message);
    this.name = "RetryExhaustedError";
    this.attempts = attempts;
    this.lastError = lastError;
    this.provider = provider;
  }
}

export interface RetryOptions {
  provider?: string;
  maxRetries?: number;
  baseDelayMs?: number;
  jitterMs?: number;
  retryOn?: number[];
  doNotRetryOn?: number[];
  logger?: (log: { provider?: string; attempt: number; reason: string; next_delay_ms: number }) => void;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface RetryResult<T> {
  result: T;
  attempts: number;
  total_time_ms: number;
}

export function extractStatusCode(error: any): number | null {
  if (!error) return null;
  if (typeof error.status === "number") return error.status;
  if (typeof error.statusCode === "number") return error.statusCode;
  if (error.response && typeof error.response.status === "number") return error.response.status;

  const match = String(error.message || "").match(/\b(4\d\d|5\d\d)\b/);
  if (match) return parseInt(match[1], 10);
  return null;
}

export function isRetryableError(
  error: any,
  retryOn: number[] = [500, 502, 503, 504, 429],
  doNotRetryOn: number[] = [400, 401, 403, 404]
): { retryable: boolean; reason: string } {
  const code = extractStatusCode(error);

  if (code !== null) {
    if (doNotRetryOn.includes(code)) {
      return { retryable: false, reason: `HTTP_${code}_CLIENT_ERROR` };
    }
    if (retryOn.includes(code) || (code >= 500 && code <= 599) || code === 429) {
      return { retryable: true, reason: `HTTP_${code}_RETRYABLE` };
    }
  }

  const msg = String(error.message || "").toLowerCase();
  if (
    msg.includes("timeout") ||
    msg.includes("etimedout") ||
    msg.includes("econnreset") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("econnrefused")
  ) {
    return { retryable: true, reason: "NETWORK_OR_TIMEOUT_ERROR" };
  }

  return { retryable: false, reason: "NON_RETRYABLE_ERROR" };
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const jitterMs = options.jitterMs ?? 500;
  const retryOn = options.retryOn ?? [500, 502, 503, 504, 429];
  const doNotRetryOn = options.doNotRetryOn ?? [400, 401, 403, 404];
  const sleep = options.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const provider = options.provider || "generic";

  const attemptsHistory: RetryAttempt[] = [];
  const startTime = Date.now();

  let attempt = 0;

  while (true) {
    attempt++;
    try {
      const result = await fn();
      return {
        result,
        attempts: attempt,
        total_time_ms: Date.now() - startTime,
      };
    } catch (err: any) {
      const { retryable, reason } = isRetryableError(err, retryOn, doNotRetryOn);

      if (!retryable || attempt > maxRetries) {
        if (!retryable) {
          throw err;
        }

        attemptsHistory.push({
          attempt,
          reason,
          nextDelayMs: 0,
          timestamp: new Date().toISOString(),
        });

        if (options.logger) {
          options.logger({
            provider,
            attempt,
            reason: `${reason} (Exhausted max retries ${maxRetries})`,
            next_delay_ms: 0,
          });
        }

        throw new RetryExhaustedError(
          `Provider '${provider}' exhausted ${maxRetries} retries: ${err.message}`,
          attemptsHistory,
          err,
          provider
        );
      }

      // Exponential backoff + jitter
      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * (jitterMs + 1));
      const nextDelayMs = exponential + jitter;

      attemptsHistory.push({
        attempt,
        reason,
        nextDelayMs,
        timestamp: new Date().toISOString(),
      });

      if (options.logger) {
        options.logger({
          provider,
          attempt,
          reason,
          next_delay_ms: nextDelayMs,
        });
      }

      await sleep(nextDelayMs);
    }
  }
}
