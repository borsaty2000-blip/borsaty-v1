import { PrismaClient } from "@prisma/client";
import { SEED_COMPANIES, generateCandles, SeedCompany } from "./seed-data";
import { buildInstrumentUniverse, SeedInstrument } from "./instruments-data";

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

// 5,000+ Instruments Store for Blazing-Fast Unified Execution
const universeData = buildInstrumentUniverse();

const inMemoryStore = {
  companies: new Map<string, SeedCompany>(),
  instruments: new Map<string, SeedInstrument>(),
  instrumentsByProvider: new Map<string, SeedInstrument>(),
  prices: new Map<string, Array<{ time: string; open: number; high: number; low: number; close: number; volume: number }>>(),
};

// Index companies
SEED_COMPANIES.forEach((c) => {
  inMemoryStore.companies.set(c.symbol.toUpperCase(), c);
  inMemoryStore.prices.set(c.symbol.toUpperCase(), generateCandles(c.currentPrice, 120));
});

// Index 5,000+ instruments
universeData.forEach((inst) => {
  inMemoryStore.instruments.set(inst.symbol.toUpperCase(), inst);
  inMemoryStore.instrumentsByProvider.set(inst.providerSymbol.toUpperCase(), inst);
});

export async function findCompany(symbolOrQuery: string) {
  const sym = symbolOrQuery.trim().toUpperCase();
  const match = inMemoryStore.companies.get(sym);
  if (match) return match;

  // Search in instruments if not in seed companies
  const inst = inMemoryStore.instruments.get(sym);
  if (inst) {
    return {
      symbol: inst.symbol,
      nameAr: inst.nameAr,
      nameEn: inst.nameEn,
      aliases: inst.aliases,
      market: inst.market,
      currency: inst.currency,
      sector: inst.sector,
      industry: inst.industry,
      currentPrice: inst.currentPrice,
      change: 0.5,
      changePct: 1.1,
      high52w: inst.currentPrice * 1.25,
      low52w: inst.currentPrice * 0.75,
      marketCap: inst.currentPrice * 100000000,
      peRatio: 12.5,
      pbRatio: 1.8,
      dividendYield: 3.5,
      revenue: 5000000000,
      netIncome: 800000000,
      historyStartDate: inst.historyStartDate || "2024-11-01T00:00:00.000Z",
    };
  }

  for (const c of inMemoryStore.companies.values()) {
    if (c.aliases.some((a) => a.toLowerCase() === symbolOrQuery.trim().toLowerCase())) {
      return c;
    }
  }

  // Try Prisma
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const comp = await client.company.findFirst({
        where: {
          OR: [{ symbol: sym }, { aliases: { has: symbolOrQuery.trim() } }],
        },
        include: { fundamentals: true, signals: true },
      });
      if (comp) {
        const fund = comp.fundamentals[0];
        return {
          symbol: comp.symbol,
          nameAr: comp.nameAr,
          nameEn: comp.nameEn,
          aliases: comp.aliases,
          market: comp.market as any,
          currency: comp.currency,
          sector: comp.sector || undefined,
          industry: comp.industry || undefined,
          currentPrice: 50.0,
          change: 0.5,
          changePct: 1.1,
          high52w: 60.0,
          low52w: 40.0,
          marketCap: fund?.marketCap || 5000000000,
          peRatio: fund?.peRatio || 12.5,
          pbRatio: fund?.pbRatio || 1.8,
          dividendYield: fund?.dividendYield || 3.5,
          revenue: fund?.revenue || 1000000000,
          netIncome: fund?.netIncome || 100000000,
        };
      }
    } catch {
      // Fallback
    }
  }

  return null;
}

export async function findInstrument(symbolOrQuery: string): Promise<SeedInstrument | null> {
  const query = symbolOrQuery.trim();
  const sym = query.toUpperCase();

  // 1. By canonical symbol
  if (inMemoryStore.instruments.has(sym)) {
    return inMemoryStore.instruments.get(sym)!;
  }

  // 2. By provider symbol
  if (inMemoryStore.instrumentsByProvider.has(sym)) {
    return inMemoryStore.instrumentsByProvider.get(sym)!;
  }

  // 3. By aliases or names
  const lowerQuery = query.toLowerCase();
  for (const inst of inMemoryStore.instruments.values()) {
    if (inst.nameAr.toLowerCase() === lowerQuery || inst.nameEn.toLowerCase() === lowerQuery) {
      return inst;
    }
    if (inst.aliases.some((a) => a.toLowerCase() === lowerQuery)) {
      return inst;
    }
  }

  // 4. Try Prisma if configured
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const dbInst = await client.instrument.findFirst({
        where: {
          OR: [
            { symbol: sym },
            { providerSymbol: sym },
            { nameAr: query },
            { nameEn: { equals: query, mode: "insensitive" } },
            { aliases: { has: query } },
          ],
        },
      });
      if (dbInst) return dbInst as any;
    } catch {
      // Ignore
    }
  }

  return null;
}

export async function getAllInstruments(filters?: { market?: string; assetClass?: string; limit?: number }) {
  let list = Array.from(inMemoryStore.instruments.values());
  if (filters?.market) {
    list = list.filter((i) => i.market.toUpperCase() === filters.market!.toUpperCase());
  }
  if (filters?.assetClass) {
    list = list.filter((i) => i.assetClass.toUpperCase() === filters.assetClass!.toUpperCase());
  }
  if (filters?.limit) {
    list = list.slice(0, filters.limit);
  }
  return list;
}

export async function countInstruments(): Promise<number> {
  return inMemoryStore.instruments.size;
}

export async function countDistinctMarkets(): Promise<number> {
  const markets = new Set(Array.from(inMemoryStore.instruments.values()).map((i) => i.market));
  return markets.size;
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
  const base = comp ? (comp as any).currentPrice : 50;
  const generated = generateCandles(base, 120);
  inMemoryStore.prices.set(sym, generated);
  return generated;
}

export { SEED_COMPANIES, generateCandles, buildInstrumentUniverse };
export * from "./resolution";
export * from "./providers/redis";
export * from "./providers/retry";
export * from "./providers/circuit-breaker";
export * from "./providers/clients";
export * from "@prisma/client";
