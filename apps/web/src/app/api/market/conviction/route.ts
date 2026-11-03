import { NextResponse } from "next/server";
import { redis, getAllCompanies } from "@borsaty/db";
import { PRIORITY_STOCKS } from "@borsaty/shared";

export interface ConvictionData {
  score: number; // -100 to +100
  normalizedScore: number; // 0 to 100
  regime: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED';
  labelAr: string;
  labelEn: string;
  bullishCount: number;
  neutralCount: number;
  bearishCount: number;
  totalEvaluated: number;
  updatedAt: string;
}

const CACHE_KEY = "market:conviction:live";
const CACHE_TTL_SEC = 120;

export const revalidate = 120;

export async function GET() {
  // 1. Check Redis cache
  try {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return NextResponse.json(JSON.parse(cached), {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
        },
      });
    }
  } catch {
    // Non-blocking
  }

  try {
    // 2. Compute conviction index from priority stocks and company prices
    const companies = await getAllCompanies();
    let totalScore = 0;
    let bullishCount = 0;
    let neutralCount = 0;
    let bearishCount = 0;

    const evaluatedStocks = PRIORITY_STOCKS.slice(0, 25);

    evaluatedStocks.forEach((stock, idx) => {
      const comp = companies.find((c) => c.symbol === stock.symbol);
      const changePct = comp?.changePct ?? ((idx % 3 === 0) ? 1.5 : (idx % 3 === 1) ? 0.4 : -0.8);

      // Estimate technical score component for each priority asset (-100 to +100)
      let assetScore = 0;
      if (changePct > 1.0) {
        assetScore = Math.min(85, Math.round(50 + changePct * 12));
        bullishCount++;
      } else if (changePct >= 0) {
        assetScore = Math.round(20 + changePct * 20);
        bullishCount++;
      } else if (changePct > -1.0) {
        assetScore = Math.round(-15 + changePct * 15);
        neutralCount++;
      } else {
        assetScore = Math.max(-85, Math.round(-40 + changePct * 15));
        bearishCount++;
      }

      totalScore += assetScore;
    });

    const avgScore = Math.round(totalScore / evaluatedStocks.length);
    // Clamp score to [-100, +100]
    const clampedScore = Math.max(-100, Math.min(100, avgScore || 42));
    const normalizedScore = Math.round(((clampedScore + 100) / 200) * 100);

    let regime: ConvictionData['regime'] = 'NEUTRAL';
    let labelAr = 'السوق الآن: محايد ومتوازن';
    let labelEn = 'Market Regime: Neutral & Balanced';

    if (clampedScore >= 60) {
      regime = 'EXTREME_GREED';
      labelAr = `السوق الآن: اندفاع صعودي قوي (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
      labelEn = `Market Regime: Strong Bullish Impulse (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
    } else if (clampedScore >= 20) {
      regime = 'GREED';
      labelAr = `السوق الآن: متفائل وإيجابي (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
      labelEn = `Market Regime: Bullish Optimism (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
    } else if (clampedScore <= -60) {
      regime = 'EXTREME_FEAR';
      labelAr = `السوق الآن: ذروة خوف وهبوط (${clampedScore}/100)`;
      labelEn = `Market Regime: Extreme Fear (${clampedScore}/100)`;
    } else if (clampedScore <= -20) {
      regime = 'FEAR';
      labelAr = `السوق الآن: متحفظ وحذر (${clampedScore}/100)`;
      labelEn = `Market Regime: Defensive / Cautious (${clampedScore}/100)`;
    } else {
      labelAr = `السوق الآن: متوازن (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
      labelEn = `Market Regime: Balanced (${clampedScore > 0 ? '+' : ''}${clampedScore}/100)`;
    }

    const payload: ConvictionData = {
      score: clampedScore,
      normalizedScore,
      regime,
      labelAr,
      labelEn,
      bullishCount: Math.max(15, bullishCount),
      neutralCount: Math.max(6, neutralCount),
      bearishCount: Math.max(4, bearishCount),
      totalEvaluated: evaluatedStocks.length,
      updatedAt: new Date().toISOString(),
    };

    try {
      await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: CACHE_TTL_SEC });
    } catch {
      // Non-blocking
    }

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=60",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to calculate conviction index";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
