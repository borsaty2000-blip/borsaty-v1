import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { buildInstrumentUniverse, SeedInstrument } from "../src/instruments-data";
import { generateCandles } from "../src/seed-data";

const prisma = new PrismaClient();

// Helper to generate 2 years of daily OHLCV (approx 500 bars per instrument)
function generateTwoYearsDailyBars(symbol: string, basePrice: number): Array<{
  timeframe: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: bigint;
}> {
  const bars = [];
  const days = 500; // 2 years of trading days
  let current = basePrice * 0.85;
  const now = new Date("2026-11-01T00:00:00Z");

  for (let i = days; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const day = d.getUTCDay();
    if (day === 5 || day === 6) continue; // skip weekends

    const drift = (days - i) / days;
    const noise = (Math.random() - 0.49) * (current * 0.022);
    const open = Number(current.toFixed(2));
    const close = Number((current + noise + drift * 0.05).toFixed(2));
    const high = Number((Math.max(open, close) + Math.random() * (current * 0.01)).toFixed(2));
    const low = Number((Math.min(open, close) - Math.random() * (current * 0.01)).toFixed(2));
    const volume = BigInt(Math.floor(1000000 + Math.random() * 4000000));

    bars.push({
      timeframe: "1d",
      timestamp: d,
      open,
      high,
      low,
      close,
      volume,
    });
    current = close;
  }
  return bars;
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 BORSATY INSTRUMENT UNIVERSE BULK SEED (5,000+ INSTRUMENTS)");
  console.log("═══════════════════════════════════════════════════════════════");

  const startTime = Date.now();
  const universe = buildInstrumentUniverse();
  console.log(`📦 Loaded ${universe.length} canonical instruments across 12 markets.`);

  let totalInstrumentsProcessed = 0;
  let totalInstrumentsUpserted = 0;
  let totalPriceBarsInserted = 0;
  const failures: Array<{ symbol: string; reason: string }> = [];
  const dataQualityRejections: Array<{ symbol: string; reason: string }> = [];

  const arabMarkets = ["EGX", "TASI", "NOMU", "DFM", "ADX", "QE", "KW"];

  // Check if DATABASE_URL is accessible
  let dbAvailable = false;
  try {
    if (process.env.DATABASE_URL) {
      await prisma.$connect();
      dbAvailable = true;
      console.log("🔌 Connected to PostgreSQL Database.");
    } else {
      console.log("ℹ️ DATABASE_URL not set in env; running dry-run / in-memory verification mode.");
    }
  } catch (err: any) {
    console.log("⚠️ DB connection unavailable, running in-memory simulation:", err.message);
    dbAvailable = false;
  }

  // Process in concurrent batches of 10
  const BATCH_SIZE = 10;
  for (let i = 0; i < universe.length; i += BATCH_SIZE) {
    const batch = universe.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (inst) => {
        totalInstrumentsProcessed++;

        // Step 1: Validate mandatory fields (nameAr for Arab markets)
        if (arabMarkets.includes(inst.market)) {
          if (!inst.nameAr || inst.nameAr.trim() === "") {
            const err = `Validation Failure: Missing mandatory Arabic name for Arab market ${inst.market}`;
            failures.push({ symbol: inst.symbol, reason: err });
            dataQualityRejections.push({ symbol: inst.symbol, reason: err });
            return;
          }
        }

        // Step 2: Database Upsert (if DB connected)
        let instrumentId = `inst-${inst.symbol}`;
        if (dbAvailable) {
          try {
            const upserted = await prisma.instrument.upsert({
              where: { symbol: inst.symbol },
              update: {
                providerSymbol: inst.providerSymbol,
                nameAr: inst.nameAr,
                nameEn: inst.nameEn,
                aliases: inst.aliases,
                assetClass: inst.assetClass as any,
                market: inst.market as any,
                sector: inst.sector,
                industry: inst.industry,
                currency: inst.currency,
                isActive: inst.isActive,
                dataSources: inst.dataSources,
              },
              create: {
                symbol: inst.symbol,
                providerSymbol: inst.providerSymbol,
                nameAr: inst.nameAr,
                nameEn: inst.nameEn,
                aliases: inst.aliases,
                assetClass: inst.assetClass as any,
                market: inst.market as any,
                sector: inst.sector,
                industry: inst.industry,
                currency: inst.currency,
                isActive: inst.isActive,
                dataSources: inst.dataSources,
              },
            });
            instrumentId = upserted.id;
          } catch (err: any) {
            failures.push({ symbol: inst.symbol, reason: `DB Upsert Error: ${err.message}` });
            return;
          }
        }

        totalInstrumentsUpserted++;

        // Step 3: Generate 2 years daily OHLCV (approx 500 bars per instrument)
        const bars = generateTwoYearsDailyBars(inst.symbol, inst.currentPrice);
        totalPriceBarsInserted += bars.length;

        // Step 4: Bulk insert Price rows (batched 500/transaction if DB available)
        if (dbAvailable) {
          try {
            const priceRows = bars.map((b) => ({
              instrumentId,
              timeframe: b.timeframe,
              timestamp: b.timestamp,
              open: b.open,
              high: b.high,
              low: b.low,
              close: b.close,
              volume: b.volume,
            }));

            await prisma.price.createMany({
              data: priceRows,
              skipDuplicates: true,
            });
          } catch (err: any) {
            failures.push({ symbol: inst.symbol, reason: `Price Insert Error: ${err.message}` });
          }
        }
      })
    );

    // Progress logging every 50 instruments
    if (totalInstrumentsProcessed % 50 === 0 || totalInstrumentsProcessed === universe.length) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `⏳ Processed ${totalInstrumentsProcessed} / ${universe.length} instruments (${(
          (totalInstrumentsProcessed / universe.length) *
          100
        ).toFixed(1)}%) | Price Bars: ${totalPriceBarsInserted.toLocaleString()} | Elapsed: ${elapsed}s`
      );
    }
  }

  // Write failures log if any
  if (failures.length > 0) {
    const logsDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `seed-failures-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(failures, null, 2), "utf-8");
    console.log(`⚠️ Logged ${failures.length} failures to ${logPath}`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✅ BULK SEED SUMMARY:");
  console.log(`- Total Instruments Processed: ${totalInstrumentsProcessed}`);
  console.log(`- Total Instruments Upserted:  ${totalInstrumentsUpserted}`);
  console.log(`- Total Price Bars Generated:  ${totalPriceBarsInserted.toLocaleString()}`);
  console.log(`- Failed Instruments:          ${failures.length}`);
  console.log(`- Data Quality Rejections:     ${dataQualityRejections.length}`);
  console.log(`- Total Execution Time:        ${durationSec}s`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (dbAvailable) {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
