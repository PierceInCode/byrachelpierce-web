// M3/M4 gate: /admin is never served to anonymous traffic (Architecture v1 §11,
// DECISIONS D16). Fetches /admin unauthenticated with redirects disabled; the
// contract is notFound() (404), and any non-200 counts as locked out. A 200 —
// panel content reaching an anonymous client — fails the gate.
// Base URL: env ADMIN_BASE_URL (M4 runs it against https://byrachelpierce.com);
// defaults to the pre-cutover alias.
const BASE = process.env.ADMIN_BASE_URL || 'https://byrachelpierce-web.vercel.app';

try {
  const res = await fetch(BASE + '/admin', {
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  });
  console.log(`GET ${BASE}/admin (unauthenticated) -> HTTP ${res.status}`);
  if (res.status === 200) {
    console.error('LOCKOUT FAIL: anonymous /admin returned 200');
    process.exit(1);
  }
  console.log('LOCKOUT OK');
} catch (e) {
  console.error('LOCKOUT FAIL: ' + e.message);
  process.exit(1);
}
