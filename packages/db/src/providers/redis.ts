export interface IRedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, options?: { ex?: number }): Promise<string>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  decr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  lpush(key: string, ...values: string[]): Promise<number>;
  rpop(key: string): Promise<string | null>;
  lrange(key: string, start: number, stop: number): Promise<string[]>;
  llen(key: string): Promise<number>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hincrby(key: string, field: string, increment: number): Promise<number>;
  flushall(): Promise<void>;
}

// Global persistent Redis state for serverless simulation & local resilience
const globalStore = (globalThis as any).__borsaty_redis_store || {
  strings: new Map<string, { value: string; expiresAt?: number }>(),
  lists: new Map<string, string[]>(),
  hashes: new Map<string, Map<string, string>>(),
};
(globalThis as any).__borsaty_redis_store = globalStore;

export class RedisClient implements IRedisClient {
  private restUrl?: string;
  private restToken?: string;

  constructor() {
    this.restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    this.restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  }

  private cleanExpired(key: string): boolean {
    const item = globalStore.strings.get(key);
    if (!item) return false;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      globalStore.strings.delete(key);
      return false;
    }
    return true;
  }

  async get(key: string): Promise<string | null> {
    if (this.restUrl && this.restToken) {
      try {
        const res = await fetch(`${this.restUrl}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${this.restToken}` },
        });
        const json = await res.json();
        return json.result ?? null;
      } catch {
        // Fallback to local store
      }
    }
    if (!this.cleanExpired(key)) return null;
    return globalStore.strings.get(key)?.value ?? null;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<string> {
    const expiresAt = options?.ex ? Date.now() + options.ex * 1000 : undefined;
    globalStore.strings.set(key, { value: String(value), expiresAt });

    if (this.restUrl && this.restToken) {
      try {
        const url = options?.ex
          ? `${this.restUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?ex=${options.ex}`
          : `${this.restUrl}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`;
        await fetch(url, { headers: { Authorization: `Bearer ${this.restToken}` } });
      } catch {
        // Fallback
      }
    }
    return "OK";
  }

  async del(key: string): Promise<number> {
    let deleted = 0;
    if (globalStore.strings.delete(key)) deleted = 1;
    if (globalStore.lists.delete(key)) deleted = 1;
    if (globalStore.hashes.delete(key)) deleted = 1;

    if (this.restUrl && this.restToken) {
      try {
        await fetch(`${this.restUrl}/del/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${this.restToken}` },
        });
      } catch {}
    }
    return deleted;
  }

  async incr(key: string): Promise<number> {
    const cur = await this.get(key);
    const num = cur ? parseInt(cur, 10) + 1 : 1;
    const item = globalStore.strings.get(key);
    globalStore.strings.set(key, { value: String(num), expiresAt: item?.expiresAt });
    return num;
  }

  async decr(key: string): Promise<number> {
    const cur = await this.get(key);
    const num = cur ? parseInt(cur, 10) - 1 : -1;
    const item = globalStore.strings.get(key);
    globalStore.strings.set(key, { value: String(num), expiresAt: item?.expiresAt });
    return num;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const item = globalStore.strings.get(key);
    if (!item) return 0;
    item.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const item = globalStore.strings.get(key);
    if (!item) return -2;
    if (!item.expiresAt) return -1;
    const remaining = Math.floor((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!globalStore.lists.has(key)) {
      globalStore.lists.set(key, []);
    }
    const list = globalStore.lists.get(key)!;
    list.unshift(...values);
    return list.length;
  }

  async rpop(key: string): Promise<string | null> {
    const list = globalStore.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.pop() ?? null;
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = globalStore.lists.get(key) || [];
    if (stop === -1) {
      return list.slice(start);
    }
    return list.slice(start, stop + 1);
  }

  async llen(key: string): Promise<number> {
    const list = globalStore.lists.get(key);
    return list ? list.length : 0;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    if (!globalStore.hashes.has(key)) {
      globalStore.hashes.set(key, new Map());
    }
    const map = globalStore.hashes.get(key)!;
    const isNew = !map.has(field);
    map.set(field, String(value));
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const map = globalStore.hashes.get(key);
    return map?.get(field) ?? null;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const map = globalStore.hashes.get(key);
    const obj: Record<string, string> = {};
    if (map) {
      map.forEach((v: string, k: string) => {
        obj[k] = v;
      });
    }
    return obj;
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!globalStore.hashes.has(key)) {
      globalStore.hashes.set(key, new Map());
    }
    const map = globalStore.hashes.get(key)!;
    const cur = map.get(field);
    const num = (cur ? parseInt(cur, 10) : 0) + increment;
    map.set(field, String(num));
    return num;
  }

  async flushall(): Promise<void> {
    globalStore.strings.clear();
    globalStore.lists.clear();
    globalStore.hashes.clear();
  }
}

export const redis = new RedisClient();
