import { withRetry, RetryExhaustedError } from "../src/providers/retry";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C1: RETRY WITH EXPONENTIAL BACKOFF");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  // Mock sleep to run tests in milliseconds rather than seconds
  const recordedSleeps: number[] = [];
  const mockSleep = async (ms: number) => {
    recordedSleeps.push(ms);
  };

  // Test 1: Mock 500 twice then 200 -> succeeds after 2 retries
  try {
    let callCount = 0;
    recordedSleeps.length = 0;
    const res = await withRetry(
      async () => {
        callCount++;
        if (callCount <= 2) {
          const err: any = new Error("HTTP 500 Internal Server Error");
          err.status = 500;
          throw err;
        }
        return { data: "success_after_500" };
      },
      {
        provider: "sahmk",
        baseDelayMs: 1000,
        jitterMs: 0,
        sleepFn: mockSleep,
      }
    );

    if (res.attempts === 3 && res.result.data === "success_after_500" && recordedSleeps.length === 2) {
      console.log(`✅ [PASS] Test 1: Mock 500 twice then 200 → succeeded on attempt 3 (retries: 2, delays: ${recordedSleeps.join("ms, ")}ms)`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test 1: Unexpected result`, res, recordedSleeps);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [FAIL] Test 1 threw unexpected error:`, err);
    failed++;
  }

  // Test 2: Mock 400 -> fails immediately (no retry)
  try {
    let callCount = 0;
    recordedSleeps.length = 0;
    await withRetry(
      async () => {
        callCount++;
        const err: any = new Error("HTTP 400 Bad Request");
        err.status = 400;
        throw err;
      },
      {
        provider: "eodhd",
        baseDelayMs: 1000,
        sleepFn: mockSleep,
      }
    );
    console.error(`❌ [FAIL] Test 2: Should have failed on 400`);
    failed++;
  } catch (err: any) {
    if (err.status === 400 && recordedSleeps.length === 0) {
      console.log(`✅ [PASS] Test 2: Mock 400 → failed immediately without retrying`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test 2: Retried when it shouldn't have:`, err, recordedSleeps);
      failed++;
    }
  }

  // Test 3: Mock timeout 4 times -> RetryExhaustedError
  try {
    let callCount = 0;
    recordedSleeps.length = 0;
    await withRetry(
      async () => {
        callCount++;
        throw new Error("ETIMEDOUT: Connection to provider timed out");
      },
      {
        provider: "sahmk",
        maxRetries: 3,
        baseDelayMs: 1000,
        jitterMs: 0,
        sleepFn: mockSleep,
      }
    );
    console.error(`❌ [FAIL] Test 3: Should have thrown RetryExhaustedError`);
    failed++;
  } catch (err: any) {
    if (err instanceof RetryExhaustedError && err.attempts.length === 4 && recordedSleeps.length === 3) {
      console.log(`✅ [PASS] Test 3: Mock timeout 4 times → threw RetryExhaustedError with 4 attempts history`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test 3: Unexpected error structure:`, err);
      failed++;
    }
  }

  // Test 4: Mock 429 -> retries with exponential backoff (1000ms, 2000ms)
  try {
    let callCount = 0;
    recordedSleeps.length = 0;
    const res = await withRetry(
      async () => {
        callCount++;
        if (callCount <= 2) {
          const err: any = new Error("HTTP 429 Too Many Requests");
          err.status = 429;
          throw err;
        }
        return { data: "rate_limit_recovered" };
      },
      {
        provider: "binance",
        baseDelayMs: 1000,
        jitterMs: 0, // 0 jitter to test exact backoff
        sleepFn: mockSleep,
      }
    );

    if (res.attempts === 3 && recordedSleeps[0] === 1000 && recordedSleeps[1] === 2000) {
      console.log(`✅ [PASS] Test 4: Mock 429 → retried with exponential backoff (${recordedSleeps.join("ms, ")}ms)`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test 4: Incorrect backoff delays:`, recordedSleeps);
      failed++;
    }
  } catch (err) {
    console.error(`❌ [FAIL] Test 4: Unexpected error:`, err);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C1 SUMMARY: ${passed}/4 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
