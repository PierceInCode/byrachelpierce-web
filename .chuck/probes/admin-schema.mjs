// M3 gate: migration 0004 (is_admin + archived_at) is live at production, verified
// read-only — SELECT/PRAGMA only, no cred output (DECISIONS D8 posture, D16/D17).
// The migrate-production-BEFORE-code ordering (legacy DECISIONS 034) makes this the
// probe that proves the operator ritual actually ran.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createClient } = require('@libsql/client');

const env = readFileSync(new URL('../../.env.local', import.meta.url), 'utf8');
const url = env.match(/^#+\s*TURSO_DATABASE_URL\s*=\s*["']?(libsql:\/\/[^"'\r\n]+)/m)?.[1]?.trim();
const token = env.match(/^#+\s*TURSO_AUTH_TOKEN\s*=\s*["']?([^"'\r\n]+)/m)?.[1]?.trim();
if (!url || !token) {
  console.error('ADMIN SCHEMA FAIL: commented prod creds not found in .env.local');
  process.exit(1);
}

const db = createClient({ url, authToken: token });
const fails = [];
try {
  const userCols = (await db.execute('PRAGMA table_info(users)')).rows.map((r) => r.name);
  if (!userCols.includes('is_admin')) fails.push('users.is_admin missing');
  console.log(`users.is_admin present: ${userCols.includes('is_admin')}`);

  const paintingCols = (await db.execute('PRAGMA table_info(paintings)')).rows.map((r) => r.name);
  if (!paintingCols.includes('archived_at')) fails.push('paintings.archived_at missing');
  console.log(`paintings.archived_at present: ${paintingCols.includes('archived_at')}`);

  const mig = (await db.execute('SELECT COUNT(*) AS n FROM __drizzle_migrations')).rows[0];
  if (Number(mig.n) < 5) fails.push(`migrations tracked: ${mig.n} (expected >= 5 after 0004)`);
  console.log(`migrations tracked: ${mig.n}`);
} catch (e) {
  fails.push(`query error: ${e.message}`);
} finally {
  db.close();
}

if (fails.length) {
  console.error('ADMIN SCHEMA FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('ADMIN SCHEMA OK');
