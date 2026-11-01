import { validateAdminAuth } from "../../../apps/web/src/lib/admin-auth";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING ADMIN SECURITY & PRODUCTION SAFEGUARDS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  const originalEnv = { ...process.env };

  // Test 1: In production without ALLOW_ADMIN_TESTS -> returns 404 Not Found
  process.env.NODE_ENV = "production";
  delete process.env.ALLOW_ADMIN_TESTS;
  process.env.ADMIN_TOKEN = "secret123";

  const req1 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "secret123" },
  });
  const res1 = validateAdminAuth(req1);
  if (!res1.authorized && res1.response?.status === 404) {
    console.log("✅ [PASS] 1. Production without ALLOW_ADMIN_TESTS returns 404 Not Found (endpoints hidden)");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Expected 404, got", res1);
    failed++;
  }

  // Test 2: In production with ALLOW_ADMIN_TESTS=true but wrong token -> returns 401 Unauthorized
  process.env.ALLOW_ADMIN_TESTS = "true";
  const req2 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "wrong_token" },
  });
  const res2 = validateAdminAuth(req2);
  if (!res2.authorized && res2.response?.status === 401) {
    console.log("✅ [PASS] 2. Invalid token returns 401 Unauthorized");
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Expected 401, got", res2);
    failed++;
  }

  // Test 3: In production with ALLOW_ADMIN_TESTS=true and valid token -> authorized: true
  const req3 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "secret123" },
  });
  const res3 = validateAdminAuth(req3);
  if (res3.authorized) {
    console.log("✅ [PASS] 3. Valid token allows access (authorized: true)");
    passed++;
  } else {
    console.error("❌ [FAIL] 3. Expected authorized: true, got", res3);
    failed++;
  }

  // Restore env
  process.env = originalEnv;

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`SECURITY SUMMARY: ${passed}/3 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
