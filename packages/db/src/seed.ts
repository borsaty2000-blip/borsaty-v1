import { PrismaClient } from '@prisma/client';
import { SEED_COMPANIES, generateCandles } from './seed-data';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Borsaty database...");

  for (const c of SEED_COMPANIES) {
    console.log(`Upserting company: ${c.symbol} - ${c.nameAr}`);
    const company = await prisma.company.upsert({
      where: { symbol: c.symbol },
      update: {
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        aliases: c.aliases,
        market: c.market as any,
        currency: c.currency,
        sector: c.sector,
        industry: c.industry
      },
      create: {
        symbol: c.symbol,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        aliases: c.aliases,
        market: c.market as any,
        currency: c.currency,
        sector: c.sector,
        industry: c.industry
      }
    });

    // Seed Fundamental
    await prisma.fundamental.upsert({
      where: {
        companyId_period: {
          companyId: company.id,
          period: "FY2025"
        }
      },
      update: {
        revenue: c.revenue,
        netIncome: c.netIncome,
        peRatio: c.peRatio,
        pbRatio: c.pbRatio,
        dividendYield: c.dividendYield,
        marketCap: c.marketCap
      },
      create: {
        companyId: company.id,
        period: "FY2025",
        revenue: c.revenue,
        netIncome: c.netIncome,
        peRatio: c.peRatio,
        pbRatio: c.pbRatio,
        dividendYield: c.dividendYield,
        marketCap: c.marketCap
      }
    });

    // Seed Sample Signal with Verified Explainability
    if (c.symbol === "COMI") {
      await prisma.signal.create({
        data: {
          companyId: company.id,
          timeframe: "1d",
          type: "BULLISH",
          entry: 86.00,
          stopLoss: 82.50,
          targets: [92.50, 96.00, 100.00],
          confluenceScore: 78,
          reasons: [
            "Structure: BOS صاعد فوق 84.50 مع Retest ناجح",
            "Elliott: الموجة 3 من Impulse (متوافق مع Weekly)",
            "Gann: السعر فوق 1x1 Angle + Square of 9 Support at 84.77",
            "Volume: كسر المقاومة بحجم 150% من المتوسط"
          ],
          contradicting: [
            "MACD لا يزال تحت Signal Line",
            "4H Trend: Neutral (لا تأكيد)"
          ],
          dataQuality: {
            provider: "Younit/EGX_NEWS",
            isRealtime: false,
            isDelayed: true,
            delayMinutes: 15,
            hasOrderBook: false,
            orderBookProxyUsed: true,
            warnings: ["Order Book حقيقي غير متوفر، تم استخدام Proxy لحجم السيولة"],
            missingFields: ["Bid/Ask Depth"]
          },
          status: "ACTIVE"
        }
      });
    }
  }

  console.log("✅ Borsaty database seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
