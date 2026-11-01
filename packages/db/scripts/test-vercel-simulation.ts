import { redis } from "../src/providers/redis";
import { circuitBreaker, CircuitOpenError } from "../src/providers/circuit-breaker";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("VERCEL PREVIEW SIMULATION TEST: MULTI-FUNCTION RESILIENCE");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Reset Redis state
  await redis.flushall();
  let passed = 0;
  let failed = 0;

  console.log("Step 1: Baseline Verification");
  const baseline = await circuitBreaker.getState("sahmk");
  if (baseline.state === "CLOSED") {
    console.log("✅ [PASS] SAHMK circuit breaker baseline is CLOSED\n");
    passed++;
  } else {
    console.error("❌ [FAIL] Expected baseline CLOSED, got", baseline.state);
    failed++;
  }

  console.log("Step 2: Simulate 5 Failures on SAHMK from Function A (e.g. /api/admin/simulate-failure)");
  for (let i = 1; i <= 5; i++) {
    try {
      await circuitBreaker.execute("sahmk", async () => {
        throw new Error(`Simulated 500 error #${i} from Function A`);
      });
    } catch {}
  }
  console.log("   5 failures recorded in Redis.\n");

  console.log("Step 3: Call Function B (e.g. GET /api/health/data)");
  // Function B connects to Redis independently to check health
  const healthCheckState = await circuitBreaker.getState("sahmk");
  console.log("   Function B read from Redis:", JSON.stringify(healthCheckState));

  if (healthCheckState.state === "OPEN" && healthCheckState.failures_60s >= 5) {
    console.log(`✅ [PASS] GET /api/health/data correctly reads circuit_state: 'OPEN' (failures_60s: ${healthCheckState.failures_60s}, retry_after: ${healthCheckState.retry_after_s}s)\n`);
    passed++;
  } else {
    console.error("❌ [FAIL] Health check failed to see OPEN state:", healthCheckState);
    failed++;
  }

  console.log("Step 4: Another Call from Function C (e.g. Quote / Provider call)");
  let actualCallAttempted = false;
  try {
    await circuitBreaker.execute("sahmk", async () => {
      actualCallAttempted = true; // Would represent network call to SAHMK
      return "quote_data";
    });
    console.error("❌ [FAIL] Expected call to be blocked while OPEN");
    failed++;
  } catch (err: any) {
    if (err instanceof CircuitOpenError && actualCallAttempted === false) {
      console.log(`✅ [PASS] Call rejected immediately by Circuit Breaker with CircuitOpenError!`);
      console.log(`   actualCallAttempted: false (SAHMK was NOT called).`);
      passed++;
    } else {
      console.error("❌ [FAIL] Unexpected behavior:", err, "actualCallAttempted:", actualCallAttempted);
      failed++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`SIMULATION SUMMARY: ${passed}/3 steps passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
