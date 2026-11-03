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

// Watchlist in-memory store for fallback/dev
const inMemoryWatchlist = new Map<
  string,
  Array<{ id: string; userId: string; symbol: string; nameEn: string; nameAr: string; createdAt: Date }>
>();

export async function getWatchlist(userId: string) {
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const list = await client.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return list;
    } catch {
      // Non-blocking fallback
    }
  }
  return inMemoryWatchlist.get(userId) || [];
}

export async function addToWatchlist(item: {
  userId: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
}) {
  const sym = item.symbol.toUpperCase();
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      return await client.watchlist.upsert({
        where: {
          userId_symbol: {
            userId: item.userId,
            symbol: sym,
          },
        },
        create: {
          userId: item.userId,
          symbol: sym,
          nameEn: item.nameEn,
          nameAr: item.nameAr,
        },
        update: {
          nameEn: item.nameEn,
          nameAr: item.nameAr,
        },
      });
    } catch {
      // Non-blocking fallback
    }
  }

  const userItems = inMemoryWatchlist.get(item.userId) || [];
  const existingIdx = userItems.findIndex((w) => w.symbol === sym);
  const entry = {
    id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: item.userId,
    symbol: sym,
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    createdAt: new Date(),
  };
  if (existingIdx >= 0) {
    userItems[existingIdx] = entry;
  } else {
    userItems.unshift(entry);
  }
  inMemoryWatchlist.set(item.userId, userItems);
  return entry;
}

export async function removeFromWatchlist(userId: string, symbol: string) {
  const sym = symbol.toUpperCase();
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      await client.watchlist.deleteMany({
        where: { userId, symbol: sym },
      });
      return true;
    } catch {
      // Non-blocking fallback
    }
  }

  const userItems = inMemoryWatchlist.get(userId) || [];
  inMemoryWatchlist.set(userId, userItems.filter((w) => w.symbol !== sym));
  return true;
}

export async function isInWatchlist(userId: string, symbol: string): Promise<boolean> {
  const sym = symbol.toUpperCase();
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const count = await client.watchlist.count({
        where: { userId, symbol: sym },
      });
      return count > 0;
    } catch {
      // Non-blocking fallback
    }
  }

  const userItems = inMemoryWatchlist.get(userId) || [];
  return userItems.some((w) => w.symbol === sym);
}

// ─────────────────────────────────────────────────────────────────────────────
// Alert Center Store & Helpers
// ─────────────────────────────────────────────────────────────────────────────
export interface AlertRecord {
  id: string;
  userId: string;
  symbol: string;
  type: 'PRICE' | 'RSI' | 'FAIR_VALUE' | 'HARMONIC';
  condition: 'ABOVE' | 'BELOW' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';
  threshold: number;
  note?: string;
  triggered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryAlerts = new Map<string, AlertRecord[]>();

export async function getAlerts(userId: string): Promise<AlertRecord[]> {
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const list = await (client as any).alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return list;
    } catch {
      // Fallback
    }
  }
  return inMemoryAlerts.get(userId) || [];
}

export async function createAlert(item: {
  userId: string;
  symbol: string;
  type?: 'PRICE' | 'RSI' | 'FAIR_VALUE' | 'HARMONIC';
  condition?: 'ABOVE' | 'BELOW' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';
  threshold: number;
  note?: string;
}): Promise<AlertRecord> {
  const sym = item.symbol.toUpperCase();
  const alertType = item.type || 'PRICE';
  const cond = item.condition || 'ABOVE';

  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      return await (client as any).alert.create({
        data: {
          userId: item.userId,
          symbol: sym,
          type: alertType,
          condition: cond,
          threshold: item.threshold,
          note: item.note || null,
        },
      });
    } catch {
      // Fallback
    }
  }

  const userAlerts = inMemoryAlerts.get(item.userId) || [];
  const entry: AlertRecord = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: item.userId,
    symbol: sym,
    type: alertType,
    condition: cond,
    threshold: item.threshold,
    note: item.note,
    triggered: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  userAlerts.unshift(entry);
  inMemoryAlerts.set(item.userId, userAlerts);
  return entry;
}

export async function deleteAlert(alertId: string, userId: string): Promise<boolean> {
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      await (client as any).alert.deleteMany({
        where: { id: alertId, userId },
      });
      return true;
    } catch {
      // Fallback
    }
  }

  const userAlerts = inMemoryAlerts.get(userId) || [];
  inMemoryAlerts.set(userId, userAlerts.filter((a) => a.id !== alertId));
  return true;
}

export async function checkAndTriggerAlerts(userId: string): Promise<AlertRecord[]> {
  const alerts = await getAlerts(userId);
  const activeAlerts = alerts.filter((a) => !a.triggered);
  const newlyTriggered: AlertRecord[] = [];

  for (const alert of activeAlerts) {
    const comp = inMemoryStore.companies.get(alert.symbol);
    const price = comp?.currentPrice || 100;

    let isTriggered = false;
    if (alert.type === 'PRICE') {
      if (alert.condition === 'ABOVE' || alert.condition === 'CROSSES_ABOVE') {
        if (price >= alert.threshold) isTriggered = true;
      } else if (alert.condition === 'BELOW' || alert.condition === 'CROSSES_BELOW') {
        if (price <= alert.threshold) isTriggered = true;
      }
    }

    if (isTriggered) {
      alert.triggered = true;
      alert.updatedAt = new Date();
      newlyTriggered.push(alert);
      if (process.env.DATABASE_URL) {
        try {
          const client = getPrismaClient();
          await (client as any).alert.update({
            where: { id: alert.id },
            data: { triggered: true },
          });
        } catch {
          // ignore
        }
      }
    }
  }

  return newlyTriggered;
}

// Portfolio Transactions Store & Helpers
export interface TransactionRecord {
  id: string;
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inMemoryTransactions = new Map<string, TransactionRecord[]>();

export async function getTransactions(userId: string): Promise<TransactionRecord[]> {
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const list = await client.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });
      return list as TransactionRecord[];
    } catch {
      // Non-blocking fallback
    }
  }
  return inMemoryTransactions.get(userId) || [];
}

export async function addTransaction(item: {
  userId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date?: Date;
}): Promise<TransactionRecord> {
  const sym = item.symbol.toUpperCase();
  const txDate = item.date || new Date();

  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      const record = await client.transaction.create({
        data: {
          userId: item.userId,
          symbol: sym,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          date: txDate,
        },
      });
      return record as TransactionRecord;
    } catch {
      // Non-blocking fallback
    }
  }

  const userTx = inMemoryTransactions.get(item.userId) || [];
  const record: TransactionRecord = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: item.userId,
    symbol: sym,
    type: item.type,
    quantity: item.quantity,
    price: item.price,
    date: txDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  userTx.unshift(record);
  inMemoryTransactions.set(item.userId, userTx);
  return record;
}

export async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  if (process.env.DATABASE_URL) {
    try {
      const client = getPrismaClient();
      await client.transaction.deleteMany({
        where: { id, userId },
      });
      return true;
    } catch {
      // Non-blocking fallback
    }
  }

  const userTx = inMemoryTransactions.get(userId) || [];
  inMemoryTransactions.set(
    userId,
    userTx.filter((t) => t.id !== id)
  );
  return true;
}

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
export * from "./providers/dlq";
export * from "./providers/metrics";
export * from "./quality/gates";
export * from "./providers/clients";
export * from "@prisma/client";
