import { validatePriceBar, clearDuplicateCache } from "../src/quality/gates";
import { redis } from "../src/providers/redis";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C5: DATA QUALITY GATES");
  console.log("═══════════════════════════════════════════════════════════════\n");

  clearDuplicateCache();
  await redis.flushall();

  let passed = 0;
  let failed = 0;

  const validBar = {
    symbol: "COMI",
    timeframe: "1D",
    timestamp: "2026-09-15T00:00:00.000Z",
    open: 85.0,
    high: 87.5,
    low: 84.2,
    close: 86.4,
    volume: 1200000,
    durationSeconds: 86400,
  };

  // 1. Valid bar accepted
  const r1 = await validatePriceBar(validBar, "younit");
  if (r1.valid) {
    console.log("✅ [PASS] 1. Valid price bar accepted");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Valid bar rejected:", r1);
    failed++;
  }

  // 2. Bar with high < low rejected
  const badHighLow = {
    ...validBar,
    symbol: "ABUK",
    high: 83.0, // high < low (84.2)
  };
  const r2 = await validatePriceBar(badHighLow, "younit");
  if (!r2.valid && r2.rule === "HIGH_LESS_THAN_LOW") {
    console.log("✅ [PASS] 2. Bar with high < low rejected (rule: HIGH_LESS_THAN_LOW)");
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Expected rejection for high < low, got:", r2);
    failed++;
  }

  // 3. Bar with future timestamp rejected
  const futureBar = {
    ...validBar,
    symbol: "2222",
    timestamp: new Date(Date.now() + 86400 * 1000 * 10).toISOString(), // 10 days in future
  };
  const r3 = await validatePriceBar(futureBar, "sahmk");
  if (!r3.valid && r3.rule === "TIMESTAMP_OUT_OF_BOUNDS") {
    console.log("✅ [PASS] 3. Bar with future timestamp rejected (rule: TIMESTAMP_OUT_OF_BOUNDS)");
    passed++;
  } else {
    console.error("❌ [FAIL] 3. Expected rejection for future timestamp, got:", r3);
    failed++;
  }

  // 4. Duplicate bar rejected
  const duplicateBar = { ...validBar }; // same symbol & date as bar 1
  const r4 = await validatePriceBar(duplicateBar, "younit");
  if (!r4.valid && r4.rule === "DUPLICATE_BAR") {
    console.log("✅ [PASS] 4. Duplicate bar rejected (rule: DUPLICATE_BAR)");
    passed++;
  } else {
    console.error("❌ [FAIL] 4. Expected duplicate rejection, got:", r4);
    failed++;
  }

  // 5. Verify quality_rejections_total metric incremented
  const counterVal = await redis.hget(
    "metrics:counters",
    'quality_rejections_total{rule="HIGH_LESS_THAN_LOW",provider="younit"}'
  );
  if (counterVal === "1") {
    console.log("✅ [PASS] 5. Metric quality_rejections_total incremented in Redis");
    passed++;
  } else {
    console.error("❌ [FAIL] 5. Metric not recorded, got:", counterVal);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C5 SUMMARY: ${passed}/5 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
