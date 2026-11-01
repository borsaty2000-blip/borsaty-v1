import { dlq } from "../src/providers/dlq";
import { redis } from "../src/providers/redis";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C3: DEAD LETTER QUEUE & REPLAY");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await redis.flushall();
  let passed = 0;
  let failed = 0;

  // 1. Push failed calls to DLQ
  const e1 = await dlq.push("sahmk", "quote", { symbol: "2222" }, "HTTP 500 Down");
  const e2 = await dlq.push("sahmk", "historical", { symbol: "1120", timeframe: "1D" }, "Timeout");
  const e3 = await dlq.push("younit", "quote", { symbol: "COMI" }, "Network error");

  if (e1.id && e2.id && e3.id) {
    console.log("✅ [PASS] 1. Successfully pushed 3 failed fetch entries to DLQ");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Push failed");
    failed++;
  }

  // 2. Query DLQ stats
  const stats = await dlq.getStats();
  if (stats.sahmk === 2 && stats.younit === 1 && stats.eodhd === 0) {
    console.log(`✅ [PASS] 2. DLQ stats accurate: sahmk=${stats.sahmk}, younit=${stats.younit}, eodhd=${stats.eodhd}`);
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Unexpected stats:", stats);
    failed++;
  }

  // 3. List DLQ entries with pagination
  const list = await dlq.list("sahmk", 10);
  if (list.total === 2 && list.entries.length === 2 && list.entries[0].provider === "sahmk") {
    console.log(`✅ [PASS] 3. DLQ listing returned ${list.entries.length} entries for sahmk`);
    passed++;
  } else {
    console.error("❌ [FAIL] 3. Unexpected list result:", list);
    failed++;
  }

  // 4. Replay entries successfully
  const replayRes = await dlq.replay("sahmk", 1, async (entry) => {
    return true; // Simulate recovery
  });

  if (replayRes.replayed === 1 && replayRes.succeeded === 1) {
    const remaining = await dlq.list("sahmk");
    if (remaining.total === 1) {
      console.log("✅ [PASS] 4. Replay 1 entry succeeded and removed from queue (1 remaining)");
      passed++;
    } else {
      console.error("❌ [FAIL] 4. Remaining count mismatch:", remaining);
      failed++;
    }
  } else {
    console.error("❌ [FAIL] 4. Replay execution failed:", replayRes);
    failed++;
  }

  // 5. Repeated failures (> 5 attempts) move to dead queue
  let deadEntryMoved = false;
  for (let i = 0; i < 6; i++) {
    await dlq.replay("sahmk", 1, async () => {
      return false; // Fails
    });
  }

  const deadLen = await redis.llen("dlq:dead:sahmk");
  if (deadLen >= 1) {
    console.log(`✅ [PASS] 5. Entry exceeding 5 failed attempts moved to dlq:dead:sahmk`);
    passed++;
  } else {
    console.error(`❌ [FAIL] 5. Entry was not moved to dead letter queue, deadLen=${deadLen}`);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C3 SUMMARY: ${passed}/5 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
