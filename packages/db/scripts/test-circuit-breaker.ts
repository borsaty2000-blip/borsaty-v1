import { CircuitBreaker, CircuitOpenError } from "../src/providers/circuit-breaker";
import { redis } from "../src/providers/redis";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C2: REDIS-BACKED CIRCUIT BREAKER");
  console.log("═══════════════════════════════════════════════════════════════\n");

  await redis.flushall();

  // Initialize circuit breaker with short cooldown for test speed (1s cooldown instead of 30s)
  const cb = new CircuitBreaker(redis, {
    failureThreshold: 5,
    failureWindowSeconds: 60,
    cooldownSeconds: 1, // 1s for fast deterministic testing
    halfOpenSuccessThreshold: 3,
  });

  const provider = "sahmk";
  let passed = 0;
  let failed = 0;

  // 1. Initial State should be CLOSED
  const s1 = await cb.getState(provider);
  if (s1.state === "CLOSED") {
    console.log("✅ [PASS] 1. Initial provider circuit state is CLOSED");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Expected CLOSED, got", s1.state);
    failed++;
  }

  // 2. Simulate 5 consecutive failures
  for (let i = 1; i <= 5; i++) {
    try {
      await cb.execute(provider, async () => {
        throw new Error(`Simulated 500 error #${i}`);
      });
    } catch {}
  }

  const s2 = await cb.getState(provider);
  if (s2.state === "OPEN") {
    console.log("✅ [PASS] 2. 5 failures within 60s → state transitioned to OPEN");
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Expected OPEN after 5 failures, got", s2.state);
    failed++;
  }

  // 3. Calls while OPEN must throw CircuitOpenError immediately
  try {
    let callExecuted = false;
    await cb.execute(provider, async () => {
      callExecuted = true;
      return "should_not_run";
    });
    console.error("❌ [FAIL] 3. Expected call to be rejected while OPEN");
    failed++;
  } catch (err: any) {
    if (err instanceof CircuitOpenError && err.provider === provider && err.retryAfterSeconds > 0) {
      console.log(`✅ [PASS] 3. Call while OPEN rejected immediately with CircuitOpenError (retryAfter: ${err.retryAfterSeconds}s)`);
      passed++;
    } else {
      console.error("❌ [FAIL] 3. Unexpected error while OPEN:", err);
      failed++;
    }
  }

  // 4. Wait for cooldown (1 second) → state transitions to HALF_OPEN
  console.log("   Waiting 1.1s for cooldown transition...");
  await new Promise((r) => setTimeout(r, 1100));

  const s3 = await cb.getState(provider);
  if (s3.state === "HALF_OPEN") {
    console.log("✅ [PASS] 4. After cooldown elapsed → state transitioned to HALF_OPEN");
    passed++;
  } else {
    console.error("❌ [FAIL] 4. Expected HALF_OPEN after cooldown, got", s3.state);
    failed++;
  }

  // 5. 3 consecutive successes in HALF_OPEN → transitions to CLOSED
  for (let i = 1; i <= 3; i++) {
    await cb.execute(provider, async () => `success_${i}`);
  }

  const s4 = await cb.getState(provider);
  if (s4.state === "CLOSED") {
    console.log("✅ [PASS] 5. 3 consecutive successes in HALF_OPEN → state transitioned back to CLOSED");
    passed++;
  } else {
    console.error("❌ [FAIL] 5. Expected CLOSED after 3 successes, got", s4.state);
    failed++;
  }

  // 6. Test HALF_OPEN failure transition: Cause circuit to OPEN again, wait cooldown, fail once in HALF_OPEN
  for (let i = 1; i <= 5; i++) {
    try {
      await cb.execute(provider, async () => {
        throw new Error("Trigger OPEN again");
      });
    } catch {}
  }
  await new Promise((r) => setTimeout(r, 1100)); // wait for HALF_OPEN
  const s5 = await cb.getState(provider);
  if (s5.state === "HALF_OPEN") {
    // 1 failure in HALF_OPEN must immediately send it back to OPEN
    try {
      await cb.execute(provider, async () => {
        throw new Error("Failure in HALF_OPEN");
      });
    } catch {}

    const s6 = await cb.getState(provider);
    if (s6.state === "OPEN") {
      console.log("✅ [PASS] 6. 1 failure in HALF_OPEN → state immediately transitioned back to OPEN");
      passed++;
    } else {
      console.error("❌ [FAIL] 6. Expected OPEN after failure in HALF_OPEN, got", s6.state);
      failed++;
    }
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C2 SUMMARY: ${passed}/6 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
