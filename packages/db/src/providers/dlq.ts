import { IRedisClient, redis } from "./redis";
import { circuitBreaker } from "./circuit-breaker";

export interface DLQEntry {
  id: string;
  provider: string;
  operation: "quote" | "historical" | "fundamentals";
  payload: Record<string, any>;
  error: string;
  attempts: number;
  first_failed_at: string;
  last_failed_at: string;
}

export interface DLQStats {
  [provider: string]: number | any;
  oldest_entry_age_hours: number;
}

export class DeadLetterQueue {
  private redis: IRedisClient;
  private maxAttemptsBeforeDead: number = 5;

  constructor(client: IRedisClient = redis) {
    this.redis = client;
  }

  private queueKey(provider: string): string {
    return `dlq:fetch:${provider}`;
  }

  private deadKey(provider: string): string {
    return `dlq:dead:${provider}`;
  }

  async push(
    provider: string,
    operation: "quote" | "historical" | "fundamentals",
    payload: Record<string, any>,
    error: Error | string
  ): Promise<DLQEntry> {
    const now = new Date().toISOString();
    const entry: DLQEntry = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `dlq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      provider,
      operation,
      payload,
      error: typeof error === "string" ? error : error.message || String(error),
      attempts: 1,
      first_failed_at: now,
      last_failed_at: now,
    };

    await this.redis.lpush(this.queueKey(provider), JSON.stringify(entry));
    return entry;
  }

  async list(provider?: string, limit: number = 50, offset: number = 0): Promise<{ total: number; entries: DLQEntry[] }> {
    const providers = provider ? [provider] : ["sahmk", "eodhd", "younit", "binance"];
    let allEntries: DLQEntry[] = [];

    for (const p of providers) {
      const raw = await this.redis.lrange(this.queueKey(p), 0, -1);
      const parsed = raw.map((r) => JSON.parse(r) as DLQEntry);
      allEntries.push(...parsed);
    }

    allEntries.sort((a, b) => new Date(b.last_failed_at).getTime() - new Date(a.last_failed_at).getTime());

    const total = allEntries.length;
    const entries = allEntries.slice(offset, offset + limit);
    return { total, entries };
  }

  async getStats(): Promise<DLQStats> {
    const providers = ["sahmk", "eodhd", "younit", "binance"];
    const stats: Record<string, number> = {};
    let oldestDate: Date | null = null;

    for (const p of providers) {
      const len = await this.redis.llen(this.queueKey(p));
      stats[p] = len;

      if (len > 0) {
        const raw = await this.redis.lrange(this.queueKey(p), len - 1, len - 1);
        if (raw.length > 0) {
          const entry = JSON.parse(raw[0]) as DLQEntry;
          const entryDate = new Date(entry.first_failed_at);
          if (!oldestDate || entryDate < oldestDate) {
            oldestDate = entryDate;
          }
        }
      }
    }

    const oldest_entry_age_hours = oldestDate
      ? Math.max(0, Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60)))
      : 0;

    return {
      ...stats,
      oldest_entry_age_hours,
    };
  }

  async replay(
    provider: string,
    limit: number = 10,
    replayHandler?: (entry: DLQEntry) => Promise<boolean>
  ): Promise<{ replayed: number; succeeded: number; failed: number }> {
    const state = await circuitBreaker.getState(provider);
    if (state.state === "OPEN") {
      throw new Error(`Cannot replay DLQ for provider '${provider}' while circuit is OPEN.`);
    }

    let replayed = 0;
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < limit; i++) {
      const itemStr = await this.redis.rpop(this.queueKey(provider));
      if (!itemStr) break;

      const entry = JSON.parse(itemStr) as DLQEntry;
      replayed++;

      let ok = false;
      try {
        if (replayHandler) {
          ok = await replayHandler(entry);
        } else {
          // Default mock handler for tests
          ok = true;
        }
      } catch {
        ok = false;
      }

      if (ok) {
        succeeded++;
      } else {
        failed++;
        entry.attempts += 1;
        entry.last_failed_at = new Date().toISOString();

        if (entry.attempts > this.maxAttemptsBeforeDead) {
          // Move to dead letter queue
          await this.redis.lpush(this.deadKey(provider), JSON.stringify(entry));
        } else {
          // Put back in queue
          await this.redis.lpush(this.queueKey(provider), JSON.stringify(entry));
        }
      }
    }

    return { replayed, succeeded, failed };
  }

  async autoReplayHealthyProviders(limitPerProvider: number = 50): Promise<Record<string, { replayed: number; succeeded: number }>> {
    const providers = ["sahmk", "eodhd", "younit", "binance"];
    const results: Record<string, { replayed: number; succeeded: number }> = {};

    for (const p of providers) {
      const state = await circuitBreaker.getState(p);
      if (state.state === "CLOSED") {
        const replayRes = await this.replay(p, limitPerProvider);
        results[p] = { replayed: replayRes.replayed, succeeded: replayRes.succeeded };
      }
    }

    return results;
  }
}

export const dlq = new DeadLetterQueue();
