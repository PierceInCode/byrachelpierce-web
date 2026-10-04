// M2 gate: backup-before-apply proof (audit F7/F9; refutation R2). Two assertions:
// (1) timing — the newest ingest report's date is covered by a backup taken the same
// day or the day before; (2) fidelity — the covering backup carries one parseable
// JSON-array dump per app table (`backups/<table>-<YYYY-MM-DD>.json`) and the paintings
// dump holds the full expected row count (528, the same constant prod-verify.mjs
// asserts). A dated-but-empty file no longer passes.
import { readdirSync, readFileSync } from 'node:fs';

const TABLES = [
  'users',
  'accounts',
  'sessions',
  'verification_tokens',
  'paintings',
  'tags',
  'tag_categories',
  'painting_tags',
  'trail_progress',
  'trail_completions',
];
const EXPECTED_PAINTINGS = 528;

const dateOf = (name) => name.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;

const reports = readdirSync('docs/intake')
  .filter((f) => f.startsWith('ingest-report-') && f.endsWith('.md'))
  .map(dateOf)
  .filter(Boolean)
  .sort();
if (!reports.length) {
  console.error('BACKUP FAIL: no ingest report found in docs/intake/');
  process.exit(1);
}
const applyDate = reports[reports.length - 1];

const backupDates = [
  ...new Set(
    readdirSync('backups')
      .filter((f) => f.endsWith('.json'))
      .map(dateOf)
      .filter(Boolean),
  ),
].sort();
const dayBefore = new Date(new Date(applyDate + 'T00:00:00Z').getTime() - 86400000)
  .toISOString()
  .slice(0, 10);
const coveringDate = [applyDate, dayBefore].find((d) => backupDates.includes(d));

console.log(`newest ingest report date: ${applyDate}`);
console.log(`backup dates on record: ${backupDates.join(', ') || '(none)'}`);
if (!coveringDate) {
  console.error(`BACKUP FAIL: no backup dated ${dayBefore} or ${applyDate}`);
  process.exit(1);
}

const fails = [];
for (const t of TABLES) {
  const file = `backups/${t}-${coveringDate}.json`;
  try {
    const rows = JSON.parse(readFileSync(file, 'utf8'));
    if (!Array.isArray(rows)) {
      fails.push(`${file}: not a JSON array`);
      continue;
    }
    if (t === 'paintings' && rows.length !== EXPECTED_PAINTINGS)
      fails.push(`${file}: ${rows.length} rows (expected ${EXPECTED_PAINTINGS})`);
  } catch (e) {
    fails.push(`${file}: ${e.code === 'ENOENT' ? 'missing' : 'unparseable: ' + e.message}`);
  }
}
console.log(`covering backup: ${coveringDate} — ${TABLES.length} table dumps checked`);
if (fails.length) {
  console.error('BACKUP FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('BACKUP OK');
