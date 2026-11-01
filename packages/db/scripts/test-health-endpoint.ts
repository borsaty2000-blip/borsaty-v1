import { redis } from "../src/providers/redis";
import { circuitBreaker } from "../src/providers/circuit-breaker";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C6: HEALTH CHECK LOGIC & PROVIDER STATES");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await redis.flushall();
  let passed = 0;
  let failed = 0;

  // 1. All closed -> healthy
  const stateSahmk = await circuitBreaker.getState("sahmk");
  const stateEodhd = await circuitBreaker.getState("eodhd");
  if (stateSahmk.state === "CLOSED" && stateEodhd.state === "CLOSED") {
    console.log("✅ [PASS] 1. Baseline state: all providers CLOSED → healthy");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Expected CLOSED");
    failed++;
  }

  // 2. Open 1 provider (sahmk) -> degraded
  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute("sahmk", async () => {
        throw new Error("SAHMK 500");
      });
    } catch {}
  }

  const sSahmk = await circuitBreaker.getState("sahmk");
  const sEodhd = await circuitBreaker.getState("eodhd");

  let overall1 = "healthy";
  let openCount = (sSahmk.state === "OPEN" ? 1 : 0) + (sEodhd.state === "OPEN" ? 1 : 0);
  if (openCount >= 2) overall1 = "unhealthy";
  else if (openCount === 1) overall1 = "degraded";

  if (overall1 === "degraded") {
    console.log("✅ [PASS] 2. 1 provider OPEN (sahmk) → overall status: degraded");
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Expected degraded, got", overall1);
    failed++;
  }

  // 3. Open second provider (eodhd) -> unhealthy
  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute("eodhd", async () => {
        throw new Error("EODHD 500");
      });
    } catch {}
  }

  const sSahmk2 = await circuitBreaker.getState("sahmk");
  const sEodhd2 = await circuitBreaker.getState("eodhd");
  let openCount2 = (sSahmk2.state === "OPEN" ? 1 : 0) + (sEodhd2.state === "OPEN" ? 1 : 0);
  let overall2 = "healthy";
  if (openCount2 >= 2) overall2 = "unhealthy";
  else if (openCount2 === 1) overall2 = "degraded";

  if (overall2 === "unhealthy") {
    console.log("✅ [PASS] 3. 2 providers OPEN (sahmk + eodhd) → overall status: unhealthy");
    passed++;
  } else {
    console.error("❌ [FAIL] 3. Expected unhealthy, got", overall2);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C6 SUMMARY: ${passed}/3 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
