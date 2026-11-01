import { IRedisClient, redis } from "./redis";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitOpenError extends Error {
  public readonly provider: string;
  public readonly retryAfterSeconds: number;

  constructor(provider: string, retryAfterSeconds: number) {
    super(`Circuit breaker for provider '${provider}' is OPEN. Retry after ${retryAfterSeconds}s.`);
    this.name = "CircuitOpenError";
    this.provider = provider;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number; // 5 failures
  failureWindowSeconds?: number; // 60s
  cooldownSeconds?: number; // 30s
  halfOpenSuccessThreshold?: number; // 3 consecutive successes
}

export interface CircuitStateInfo {
  state: CircuitState;
  since: string;
  failures_60s: number;
  retry_after_s: number;
}

export class CircuitBreaker {
  private redis: IRedisClient;
  private failureThreshold: number;
  private failureWindowSeconds: number;
  private cooldownSeconds: number;
  private halfOpenSuccessThreshold: number;

  constructor(client: IRedisClient = redis, options: CircuitBreakerOptions = {}) {
    this.redis = client;
    this.failureThreshold = options.failureThreshold ?? 5;
    this.failureWindowSeconds = options.failureWindowSeconds ?? 60;
    this.cooldownSeconds = options.cooldownSeconds ?? 30;
    this.halfOpenSuccessThreshold = options.halfOpenSuccessThreshold ?? 3;
  }

  private keyState(provider: string) {
    return `cb:${provider}:state`;
  }
  private keyFailures(provider: string) {
    return `cb:${provider}:failures`;
  }
  private keyLastFailure(provider: string) {
    return `cb:${provider}:last_failure`;
  }
  private keyOpenedAt(provider: string) {
    return `cb:${provider}:opened_at`;
  }
  private keyHalfOpenSuccesses(provider: string) {
    return `cb:${provider}:half_open_successes`;
  }

  async getState(provider: string): Promise<CircuitStateInfo> {
    const rawState = (await this.redis.get(this.keyState(provider))) as CircuitState | null;
    const openedAtStr = await this.redis.get(this.keyOpenedAt(provider));
    const failuresStr = await this.redis.get(this.keyFailures(provider));
    const failures_60s = failuresStr ? parseInt(failuresStr, 10) : 0;

    const openedAt = openedAtStr ? parseInt(openedAtStr, 10) : Date.now();
    const elapsedSeconds = Math.floor((Date.now() - openedAt) / 1000);

    let state: CircuitState = rawState || "CLOSED";
    let retry_after_s = 0;

    // Check transition from OPEN to HALF_OPEN after cooldown
    if (state === "OPEN") {
      if (elapsedSeconds >= this.cooldownSeconds) {
        state = "HALF_OPEN";
        await this.redis.set(this.keyState(provider), "HALF_OPEN");
        await this.redis.set(this.keyHalfOpenSuccesses(provider), "0");
        retry_after_s = 0;
      } else {
        retry_after_s = Math.max(1, this.cooldownSeconds - elapsedSeconds);
      }
    }

    return {
      state,
      since: new Date(openedAt).toISOString(),
      failures_60s,
      retry_after_s,
    };
  }

  async recordSuccess(provider: string): Promise<void> {
    const stateInfo = await this.getState(provider);

    if (stateInfo.state === "HALF_OPEN") {
      const successes = await this.redis.incr(this.keyHalfOpenSuccesses(provider));
      if (successes >= this.halfOpenSuccessThreshold) {
        // Transition HALF_OPEN -> CLOSED
        await this.redis.set(this.keyState(provider), "CLOSED");
        await this.redis.del(this.keyFailures(provider));
        await this.redis.del(this.keyHalfOpenSuccesses(provider));
      }
    } else if (stateInfo.state === "CLOSED") {
      // Clear or leave failures
    }
  }

  async recordFailure(provider: string): Promise<void> {
    const now = Date.now();
    await this.redis.set(this.keyLastFailure(provider), String(now));

    const stateInfo = await this.getState(provider);

    if (stateInfo.state === "HALF_OPEN") {
      // 1 failure in HALF_OPEN -> immediately back to OPEN
      await this.redis.set(this.keyState(provider), "OPEN");
      await this.redis.set(this.keyOpenedAt(provider), String(now));
      await this.redis.del(this.keyHalfOpenSuccesses(provider));
      return;
    }

    if (stateInfo.state === "CLOSED") {
      const failures = await this.redis.incr(this.keyFailures(provider));
      if (failures === 1) {
        await this.redis.expire(this.keyFailures(provider), this.failureWindowSeconds);
      }

      if (failures >= this.failureThreshold) {
        // Transition CLOSED -> OPEN
        await this.redis.set(this.keyState(provider), "OPEN");
        await this.redis.set(this.keyOpenedAt(provider), String(now));
      }
    }
  }

  async execute<T>(provider: string, fn: () => Promise<T>): Promise<T> {
    const stateInfo = await this.getState(provider);

    if (stateInfo.state === "OPEN") {
      throw new CircuitOpenError(provider, stateInfo.retry_after_s);
    }

    try {
      const result = await fn();
      await this.recordSuccess(provider);
      return result;
    } catch (err) {
      await this.recordFailure(provider);
      throw err;
    }
  }
}

export const circuitBreaker = new CircuitBreaker();
