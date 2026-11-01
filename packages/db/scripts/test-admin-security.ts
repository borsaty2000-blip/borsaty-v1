import { validateAdminAuth } from "../../../apps/web/src/lib/admin-auth";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TESTING FAIL-CLOSED ADMIN SECURITY SAFEGUARDS");
  console.log("═══════════════════════════════════════════════════════════════\n");

  let passed = 0;
  let failed = 0;

  const originalEnv = { ...process.env };

  // Test 1: In production without ALLOW_ADMIN_TESTS -> returns 404 Not Found (cloaked)
  process.env.NODE_ENV = "production";
  delete process.env.ALLOW_ADMIN_TESTS;
  process.env.ADMIN_TOKEN = "secret123";

  const req1 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "secret123" },
  });
  const res1 = validateAdminAuth(req1);
  if (!res1.authorized && res1.response?.status === 404) {
    console.log("✅ [PASS] 1. Production without ALLOW_ADMIN_TESTS returns 404 Not Found (endpoints cloaked)");
    passed++;
  } else {
    console.error("❌ [FAIL] 1. Expected 404, got", res1);
    failed++;
  }

  // Test 2: In production with ALLOW_ADMIN_TESTS=true but EMPTY ADMIN_TOKEN -> fail-closed (401)
  process.env.ALLOW_ADMIN_TESTS = "true";
  process.env.ADMIN_TOKEN = "   "; // whitespace/empty
  const req2 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "   " },
  });
  const res2 = validateAdminAuth(req2);
  if (!res2.authorized && res2.response?.status === 401) {
    console.log("✅ [PASS] 2. Empty ADMIN_TOKEN in production fails closed (401 Unauthorized)");
    passed++;
  } else {
    console.error("❌ [FAIL] 2. Expected fail-closed 401, got", res2);
    failed++;
  }

  // Test 3: ALLOW_ADMIN_TESTS=true with valid token configured but wrong client token -> 401
  process.env.ADMIN_TOKEN = "production_super_secret_token";
  const req3 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "invalid_attacker_token" },
  });
  const res3 = validateAdminAuth(req3);
  if (!res3.authorized && res3.response?.status === 401) {
    console.log("✅ [PASS] 3. ALLOW_ADMIN_TESTS=true still strictly requires valid token (401 on wrong token)");
    passed++;
  } else {
    console.error("❌ [FAIL] 3. Expected 401, got", res3);
    failed++;
  }

  // Test 4: ALLOW_ADMIN_TESTS=true with valid token configured and matching client token -> authorized: true
  const req4 = new Request("http://localhost/api/admin/simulate-failure", {
    headers: { "x-admin-token": "production_super_secret_token" },
  });
  const res4 = validateAdminAuth(req4);
  if (res4.authorized) {
    console.log("✅ [PASS] 4. Valid client token allows access when ALLOW_ADMIN_TESTS=true");
    passed++;
  } else {
    console.error("❌ [FAIL] 4. Expected authorized: true, got", res4);
    failed++;
  }

  // Restore env
  process.env = originalEnv;

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`FAIL-CLOSED VERIFICATION: ${passed}/4 tests passed. Failed: ${failed}`);
  console.log("═══════════════════════════════════════════════════════════════");

  if (failed > 0) process.exit(1);
}

main().catch(console.error);
