import { resolveInstrument } from "../src/resolution";

interface TestCase {
  query: string;
  expectedSymbol: string | null;
  expectedMethod?: string;
  minConfidence?: number;
  expectedConfidence?: number;
  market?: string;
}

const testCases: TestCase[] = [
  {
    query: "البنك الأهلي",
    expectedSymbol: "COMI",
    expectedMethod: "alias_ar_exact",
    expectedConfidence: 0.98,
    market: "EGX",
  },
  {
    query: "أرامكو",
    expectedSymbol: "2222",
    expectedMethod: "alias_ar_exact",
    expectedConfidence: 0.98,
    market: "TASI",
  },
  {
    query: "COMI",
    expectedSymbol: "COMI",
    expectedMethod: "symbol_exact",
    expectedConfidence: 1.0,
    market: "EGX",
  },
  {
    query: "cib",
    expectedSymbol: "COMI",
    expectedMethod: "alias_en_exact",
    expectedConfidence: 0.98,
    market: "EGX",
  },
  {
    query: "البنك التجارى الدولى",
    expectedSymbol: "COMI",
    expectedMethod: "name_ar_fuzzy",
    expectedConfidence: 0.85,
    market: "EGX",
  },
  {
    query: "ابو قير",
    expectedSymbol: "ABUK",
    expectedMethod: "alias_ar_exact",
    expectedConfidence: 0.98,
    market: "EGX",
  },
  {
    query: "AAPL",
    expectedSymbol: "AAPL",
    expectedMethod: "symbol_exact",
    expectedConfidence: 1.0,
    market: "US",
  },
  {
    query: "Apple",
    expectedSymbol: "AAPL",
    expectedMethod: "name_en_exact",
    expectedConfidence: 0.99,
    market: "US",
  },
  {
    query: "شركة غير موجودة",
    expectedSymbol: null,
  },
  {
    query: "ciib",
    expectedSymbol: "COMI",
    expectedMethod: "alias_en_fuzzy",
    expectedConfidence: 0.85,
    market: "EGX",
  },
];

console.log("═══════════════════════════════════════════════════════════════");
console.log("RUNNING SYMBOL RESOLUTION TEST SUITE (WITH EXACT METHOD LABELS)");
console.log("═══════════════════════════════════════════════════════════════\n");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = resolveInstrument(tc.query);
  const resolved = result.resolved;

  let testPassed = true;
  const reasons: string[] = [];

  if (tc.expectedSymbol === null) {
    if (resolved !== null) {
      testPassed = false;
      reasons.push(`Expected null, got ${resolved.symbol}`);
    }
    if (!result.alternatives || result.alternatives.length === 0) {
      testPassed = false;
      reasons.push(`Expected alternatives, got 0`);
    }
  } else {
    if (!resolved) {
      testPassed = false;
      reasons.push(`Expected ${tc.expectedSymbol}, got null`);
    } else {
      if (resolved.symbol !== tc.expectedSymbol) {
        testPassed = false;
        reasons.push(`Symbol mismatch: expected ${tc.expectedSymbol}, got ${resolved.symbol}`);
      }
      if (tc.market && resolved.market !== tc.market) {
        testPassed = false;
        reasons.push(`Market mismatch: expected ${tc.market}, got ${resolved.market}`);
      }
      if (tc.expectedMethod && resolved.method !== tc.expectedMethod) {
        testPassed = false;
        reasons.push(`Method mismatch: expected ${tc.expectedMethod}, got ${resolved.method}`);
      }
      if (tc.expectedConfidence !== undefined && resolved.confidence !== tc.expectedConfidence) {
        testPassed = false;
        reasons.push(`Confidence mismatch: expected ${tc.expectedConfidence}, got ${resolved.confidence}`);
      }
      if (tc.minConfidence !== undefined && resolved.confidence < tc.minConfidence) {
        testPassed = false;
        reasons.push(`Confidence too low: expected >= ${tc.minConfidence}, got ${resolved.confidence}`);
      }
    }
  }

  if (testPassed) {
    passed++;
    console.log(`✅ [PASS] "${tc.query}" → ${resolved ? `${resolved.symbol} (${resolved.method}, ${resolved.confidence})` : `null (alternatives: ${result.alternatives.length})`}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] "${tc.query}" → ${reasons.join(", ")}`);
    console.error("   Result:", JSON.stringify(result, null, 2));
  }
}

console.log("\n═══════════════════════════════════════════════════════════════");
console.log(`SUMMARY: ${passed}/${testCases.length} tests passed. Failed: ${failed}`);
console.log("═══════════════════════════════════════════════════════════════");

if (failed > 0) {
  process.exit(1);
}
