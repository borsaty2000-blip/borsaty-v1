import { NextResponse } from "next/server";
import { getAllCompanies, redis } from "@borsaty/db";

export interface PulseItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
}

const CACHE_KEY = "market:pulse:live";
const CACHE_TTL_SEC = 60;

export const revalidate = 60;

const DEFAULT_PULSE: PulseItem[] = [
  { symbol: "EGX30", name: "EGX 30 Index", price: 30842.15, change: 377.2, changePct: 1.24 },
  { symbol: "TASI", name: "Tadawul All Share", price: 12180.50, change: 82.4, changePct: 0.68 },
  { symbol: "COMI", name: "CIB Egypt", price: 123.48, change: 0.98, changePct: 0.80 },
  { symbol: "SWDY", name: "Elsewedy Electric", price: 108.60, change: 1.77, changePct: 1.66 },
  { symbol: "TMGH", name: "Talaat Moustafa", price: 58.20, change: -0.40, changePct: -0.68 },
  { symbol: "EAST", name: "Eastern Company", price: 34.50, change: 0.35, changePct: 1.02 },
  { symbol: "FWRY", name: "Fawry Banking", price: 8.92, change: 0.14, changePct: 1.59 },
  { symbol: "2222", name: "Saudi Aramco", price: 27.85, change: 0.15, changePct: 0.54 },
  { symbol: "1120", name: "Al Rajhi Bank", price: 92.40, change: 0.80, changePct: 0.87 },
  { symbol: "AAPL", name: "Apple Inc.", price: 235.10, change: 1.85, changePct: 0.79 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 141.50, change: 3.20, changePct: 2.31 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 428.15, change: 1.10, changePct: 0.26 },
  { symbol: "GOLD", name: "Gold Spot", price: 2735.40, change: 14.60, changePct: 0.54 },
  { symbol: "BRENT", name: "Brent Crude", price: 74.20, change: -0.35, changePct: -0.47 },
  { symbol: "BTC", name: "Bitcoin USD", price: 68450.00, change: 1410.00, changePct: 2.10 },
];

export async function GET() {
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      });
    }
  } catch {
    // Non-blocking if redis is offline
  }

  try {
    const companies = await getAllCompanies();
    let items: PulseItem[] = [];

    if (companies && companies.length > 0) {
      items = companies.slice(0, 20).map((c) => ({
        symbol: c.symbol,
        name: c.nameEn,
        price: c.currentPrice || 100.0,
        change: c.change || 0,
        changePct: c.changePct || 0,
      }));
    }

    if (items.length === 0) {
      items = DEFAULT_PULSE;
    } else {
      // Prepend key macro indices
      items = [
        { symbol: "EGX30", name: "EGX 30 Index", price: 30842.15, change: 377.2, changePct: 1.24 },
        { symbol: "TASI", name: "Tadawul All Share", price: 12180.50, change: 82.4, changePct: 0.68 },
        ...items,
        { symbol: "GOLD", name: "Gold Spot", price: 2735.40, change: 14.60, changePct: 0.54 },
        { symbol: "BTC", name: "Bitcoin USD", price: 68450.00, change: 1410.00, changePct: 2.10 },
      ];
    }

    const payload = {
      items,
      updatedAt: new Date().toISOString(),
    };

    try {
      await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL_SEC });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch {
    return NextResponse.json(
      {
        items: DEFAULT_PULSE,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  }
}
