const http = require('http');

async function testFetch(path, options = {}) {
  const url = `http://localhost:3001${path}`;
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    text,
    json,
  };
}

async function run() {
  console.log('--- STARTING E2E SMOKE TESTS ---');
  let passed = 0;
  let failed = 0;

  // 1. Home page
  const home = await testFetch('/');
  if (home.status === 200 && home.headers['x-borsaty-origin'] === 'proprietary') {
    console.log('✓ [PASS] Home Page (/) returned 200 with X-Borsaty-Origin: proprietary');
    passed++;
  } else {
    console.error('✗ [FAIL] Home Page failed:', home.status, home.headers);
    failed++;
  }

  // 2. Security Headers check
  if (home.headers['x-frame-options'] === 'DENY' && home.headers['x-content-type-options'] === 'nosniff') {
    console.log('✓ [PASS] Security Headers (X-Frame-Options, X-Content-Type-Options) verified');
    passed++;
  } else {
    console.error('✗ [FAIL] Missing security headers:', home.headers);
    failed++;
  }

  // 3. Institutional Pages
  for (const page of ['/about', '/docs', '/status', '/changelog', '/terms', '/privacy', '/compare']) {
    const r = await testFetch(page);
    if (r.status === 200) {
      console.log(`✓ [PASS] Institutional page ${page} returned 200 OK`);
      passed++;
    } else {
      console.error(`✗ [FAIL] Institutional page ${page} returned ${r.status}`);
      failed++;
    }
  }

  // 4. API Quotes
  const quoteComi = await testFetch('/api/quotes?symbol=COMI');
  if (quoteComi.status === 200 && quoteComi.json?.symbol === 'COMI') {
    console.log('✓ [PASS] /api/quotes?symbol=COMI returned valid quote');
    passed++;
  } else {
    console.error('✗ [FAIL] /api/quotes COMI failed:', quoteComi.status, quoteComi.text);
    failed++;
  }

  // 5. API Calendar
  const cal = await testFetch('/api/calendar');
  if (cal.status === 200 && Array.isArray(cal.json?.events)) {
    console.log('✓ [PASS] /api/calendar returned events array');
    passed++;
  } else {
    console.error('✗ [FAIL] /api/calendar failed:', cal.status);
    failed++;
  }

  // 6. Screener Query with Arabic text
  const screener = await testFetch('/api/screener/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'أسهم مصرية فوق 200 يوم' }),
  });
  if (screener.status === 200 && screener.json?.results) {
    console.log('✓ [PASS] /api/screener/query executed and returned results');
    passed++;
  } else {
    console.error('✗ [FAIL] /api/screener/query failed:', screener.status, screener.text);
    failed++;
  }

  // 7. Anti-Reverse Engineering: Honeypot Trap
  // We send a custom header to simulate an attacker IP
  const attackerIp = '198.51.100.77';
  const honeypot = await testFetch('/api/admin/secret-endpoint-do-not-use', {
    headers: { 'x-forwarded-for': attackerIp },
  });
  if (honeypot.status === 403 && honeypot.json?.error?.includes('permanently')) {
    console.log('✓ [PASS] Honeypot endpoint triggered 403 Forbidden with permanent block');
    passed++;
  } else {
    console.error('✗ [FAIL] Honeypot failed:', honeypot.status, honeypot.text);
    failed++;
  }

  // 8. Blocked IP verification: subsequent request from attacker IP must return 403
  const blockedReq = await testFetch('/api/quotes?symbol=COMI', {
    headers: { 'x-forwarded-for': attackerIp },
  });
  if (blockedReq.status === 403) {
    console.log('✓ [PASS] Security Firewall actively blocks subsequent requests from honeypot IP (403)');
    passed++;
  } else {
    console.error('✗ [FAIL] Attacker was not blocked:', blockedReq.status);
    failed++;
  }

  // 9. Rate Limiting verification
  const spammerIp = '203.0.113.88';
  let rateLimited = false;
  for (let i = 0; i < 15; i++) {
    const res = await testFetch('/api/screener/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': spammerIp,
      },
      body: JSON.stringify({ query: 'أسهم' }),
    });
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  if (rateLimited) {
    console.log('✓ [PASS] Rate Limiting triggered 429 Too Many Requests when threshold exceeded');
    passed++;
  } else {
    console.error('✗ [FAIL] Rate Limiting did not trigger 429');
    failed++;
  }

  console.log(`\n--- SMOKE TEST SUMMARY: ${passed} passed, ${failed} failed ---`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
