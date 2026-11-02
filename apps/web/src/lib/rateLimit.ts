/**
 * Enterprise Rate Limiter & Security Firewall
 * Supports Upstash Redis with zero-dependency in-memory sliding-window fallback.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// In-memory sliding window stores
const memoryStore = new Map<string, { timestamps: number[] }>();
const blockedIps = new Set<string>();

// Periodic memory cleanup (every 2 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < 120000);
      if (record.timestamps.length === 0) {
        memoryStore.delete(key);
      }
    }
  }, 120000);
}

export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip);
}

export function blockIp(ip: string, reason = 'Honeypot trigger'): void {
  blockedIps.add(ip);
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[Security Alert] IP permanently blocked: ${ip}. Reason: ${reason}`);
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Use Upstash Redis REST if configured
  if (upstashUrl && upstashToken) {
    try {
      const now = Date.now();
      const windowSec = Math.ceil(config.windowMs / 1000);
      const key = `ratelimit:${identifier}`;

      // Increment counter with TTL
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSec],
        ]),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = Number(data[0]?.result || 1);
        if (currentCount > config.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            retryAfter: windowSec,
          };
        }
        return {
          allowed: true,
          remaining: Math.max(0, config.maxRequests - currentCount),
        };
      }
    } catch {
      // Fallback to in-memory store if Redis REST fails
    }
  }

  // High-performance in-memory sliding window fallback
  const now = Date.now();
  let record = memoryStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(identifier, record);
  }

  // Filter timestamps within window
  record.timestamps = record.timestamps.filter((t) => now - t < config.windowMs);

  if (record.timestamps.length >= config.maxRequests) {
    const oldestTimestamp = record.timestamps[0] || now;
    const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, retryAfter),
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - record.timestamps.length,
  };
}
