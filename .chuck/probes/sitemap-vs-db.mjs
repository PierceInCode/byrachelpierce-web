// M4 gate: the live sitemap enumerates exactly the non-archived paintings
// (refutation R6, upgraded per DECISIONS D17: once the admin panel exists the
// collection count is no longer a constant, so the gate compares two live
// sources instead of asserting 528). DB side is read-only (D8 posture).
// Base URL: env SITEMAP_BASE_URL, default the post-cutover domain.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@libsql/client');

const BASE = process.env.SITEMAP_BASE_URL || 'https://byrachelpierce.com';

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const url = env.match(/^#+\s*TURSO_DATABASE_URL\s*=\s*["']?(libsql:\/\/[^"'\r\n]+)/m)?.[1]?.trim();
const token = env.match(/^#+\s*TURSO_AUTH_TOKEN\s*=\s*["']?([^"'\r\n]+)/m)?.[1]?.trim();
if (!url || !token) {
  console.error('SITEMAP-DB FAIL: commented prod creds not found in .env.local');
  process.exit(1);
}

const db = createClient({ url, authToken: token });
let live;
try {
  const row = (await db.execute('SELECT COUNT(*) AS n FROM paintings WHERE archived_at IS NULL'))
    .rows[0];
  live = Number(row.n);
} catch (e) {
  console.error('SITEMAP-DB FAIL: query error: ' + e.message);
  db.close();
  process.exit(1);
} finally {
  db.close();
}
console.log(`live non-archived paintings: ${live}`);

try {
  const res = await fetch(BASE + '/sitemap.xml', {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (res.status !== 200) {
    console.error(`SITEMAP-DB FAIL: HTTP ${res.status} for ${BASE}/sitemap.xml`);
    process.exit(1);
  }
  const xml = await res.text();
  const found = new Set(
    [...xml.matchAll(/<loc>([^<]*\/collection\/painting\/[^<]+)<\/loc>/g)].map((m) => m[1]),
  ).size;
  console.log(`painting URLs in ${BASE}/sitemap.xml: ${found}`);
  if (found !== live) {
    console.error(`SITEMAP-DB FAIL: sitemap ${found} !== live ${live}`);
    process.exit(1);
  }
  console.log(`SITEMAP-DB OK: ${found} sitemap URLs === ${live} live paintings`);
} catch (e) {
  console.error('SITEMAP-DB FAIL: ' + e.message);
  process.exit(1);
}
