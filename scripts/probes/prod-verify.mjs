// M0 gate: read-only production DB verification (audit L7). SELECT/PRAGMA only — zero
// writes. Prints no credentials. Sanctioned by DECISIONS D8. Asserts the state legacy
// DECISIONS 035 recorded: 4 tracked migrations, dimension columns, 528 paintings,
// trail_completions present, zero sentinel rows.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@libsql/client');

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const url = env.match(/^#+\s*TURSO_DATABASE_URL\s*=\s*["']?(libsql:\/\/[^"'\r\n]+)/m)?.[1]?.trim();
const token = env.match(/^#+\s*TURSO_AUTH_TOKEN\s*=\s*["']?([^"'\r\n]+)/m)?.[1]?.trim();
if (!url || !token) {
  console.error('PROD-VERIFY FAIL: commented prod creds not found in .env.local');
  process.exit(1);
}

const db = createClient({ url, authToken: token });
const one = async (sql) => (await db.execute(sql)).rows[0];
const fails = [];
try {
  const mig = await one('SELECT COUNT(*) AS n FROM __drizzle_migrations');
  if (Number(mig.n) < 4) fails.push(`migrations tracked: ${mig.n} (expected >= 4)`);
  console.log(`migrations tracked: ${mig.n}`);

  const cols = (await db.execute('PRAGMA table_info(paintings)')).rows.map((r) => r.name);
  for (const c of ['width_in', 'height_in', 'depth_in'])
    if (!cols.includes(c)) fails.push(`paintings missing column ${c}`);
  console.log(
    `dimension columns present: ${['width_in', 'height_in', 'depth_in'].every((c) => cols.includes(c))}`,
  );

  const p = await one('SELECT COUNT(*) AS n FROM paintings');
  if (Number(p.n) !== 528) fails.push(`paintings count: ${p.n} (expected 528)`);
  console.log(`paintings: ${p.n}`);

  const tc = await one('SELECT COUNT(*) AS n FROM trail_completions');
  console.log(
    `trail_completions rows: ${tc.n} (existence is the assertion; count grows with real users)`,
  );

  const s = await one('SELECT COUNT(*) AS n FROM trail_progress WHERE mural_id = 0');
  if (Number(s.n) !== 0) fails.push(`sentinel rows: ${s.n} (expected 0)`);
  console.log(`sentinel rows: ${s.n}`);
} catch (e) {
  fails.push(`query error: ${e.message}`);
} finally {
  db.close();
}

if (fails.length) {
  console.error('PROD-VERIFY FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('PROD-VERIFY OK');
