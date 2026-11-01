import { PrismaClient } from '@prisma/client';
import { SEED_COMPANIES, generateCandles, SeedCompany } from './seed-data';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// In-Memory Cached Seed Store for Instant Zero-Config Execution
const inMemoryStore = {
  companies: new Map<string, SeedCompany>(),
  prices: new Map<string, Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>>()
};

// Initialize In-Memory Store
SEED_COMPANIES.forEach((c) => {
  inMemoryStore.companies.set(c.symbol.toUpperCase(), c);
  inMemoryStore.prices.set(c.symbol.toUpperCase(), generateCandles(c.currentPrice, 120));
});

export async function findCompany(symbolOrQuery: string) {
  const sym = symbolOrQuery.trim().toUpperCase();
  // Check in memory first
  const match = inMemoryStore.companies.get(sym);
  if (match) return match;

  // Search by alias
  for (const c of inMemoryStore.companies.values()) {
    if (c.aliases.some((a) => a.toLowerCase() === symbolOrQuery.trim().toLowerCase())) {
      return c;
    }
  }

  // Try Prisma if configured
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const comp = await client.company.findFirst({
        where: {
          OR: [
            { symbol: sym },
            { aliases: { has: symbolOrQuery.trim() } }
          ]
        },
        include: { fundamentals: true, signals: true }
      });
      if (comp) return comp;
    } catch {
      // Fallback to null
    }
  }

  return null;
}

export async function getAllCompanies(market?: string) {
  const all = Array.from(inMemoryStore.companies.values());
  if (market) {
    return all.filter((c) => c.market.toUpperCase() === market.toUpperCase());
  }
  return all;
}

export async function getStockCandles(symbol: string) {
  const sym = symbol.trim().toUpperCase();
  if (inMemoryStore.prices.has(sym)) {
    return inMemoryStore.prices.get(sym)!;
  }
  const comp = await findCompany(sym);
  const base = comp ? comp.currentPrice : 50;
  const generated = generateCandles(base, 120);
  inMemoryStore.prices.set(sym, generated);
  return generated;
}

export { SEED_COMPANIES, generateCandles };
export * from '@prisma/client';
