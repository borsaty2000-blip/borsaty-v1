import { metricsCollector } from "../src/providers/metrics";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING C4: PROMETHEUS METRICS ENDPOINT");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  // 1. Increment sample metrics
  await metricsCollector.incFetchSuccess("sahmk", "quote");
  await metricsCollector.incFetchFailure("eodhd", "historical", "HTTP_500");
  await metricsCollector.incFetchRetry("sahmk", 1);
  await metricsCollector.incDlqReplaySuccess("sahmk");

  // 2. Render Prometheus text
  const output = await metricsCollector.renderPrometheusText();

  // 3. Expected series checklist
  const expectedSeries = [
    /fetch_success_total\{provider="sahmk",operation="quote"\} \d+/,
    /fetch_failure_total\{provider="eodhd",operation="historical",reason="HTTP_500"\} \d+/,
    /fetch_retry_total\{provider="sahmk",attempt="1"\} \d+/,
    /fetch_duration_seconds\{provider="sahmk",operation="quote",quantile="0.5"\} [\d.]+/,
    /circuit_breaker_state\{provider="sahmk"\} [012]/,
    /circuit_breaker_failures_60s\{provider="sahmk"\} \d+/,
    /cache_hit_ratio\{layer="redis"\} [\d.]+/,
    /cache_size_keys\{layer="redis"\} \d+/,
    /dlq_size\{provider="sahmk"\} \d+/,
    /dlq_replay_success_total\{provider="sahmk"\} \d+/,
    /last_successful_fetch_timestamp\{provider="sahmk"\} \d+/,
    /instruments_stale_24h_total \d+/,
    /instruments_total 5120/,
    /price_bars_total 1827840/,
    /markets_total\{market="EGX"\} 241/,
    /markets_total\{market="TASI"\} 321/,
    /markets_total\{market="US"\} 2503/,
  ];

  let allFound = true;
  for (const regex of expectedSeries) {
    if (regex.test(output)) {
      console.log(`✅ [PASS] Found expected series: ${regex}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Missing expected metric series: ${regex}`);
      allFound = false;
      failed++;
    }
  }

  // 4. Rate Limiting test
  const ip = "192.168.1.100";
  let allowedCount = 0;
  for (let i = 0; i < 65; i++) {
    const ok = await metricsCollector.checkRateLimit(ip, 60);
    if (ok) allowedCount++;
  }

  if (allowedCount === 60) {
    console.log("✅ [PASS] Rate limiting strictly blocked requests exceeding 60/min");
    passed++;
  } else {
    console.error(`❌ [FAIL] Rate limiting mismatch, allowed: ${allowedCount} (expected 60)`);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`C4 SUMMARY: ${passed}/${expectedSeries.length + 1} tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
