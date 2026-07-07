// M2 gate: backup-before-apply proof (audit F7/F9). The newest ingest report's date
// must be covered by a production backup taken the same day or the day before —
// the recorded evidence that the backup-first ritual actually preceded --apply.
import { readdirSync } from 'node:fs';

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

const backups = readdirSync('backups').map(dateOf).filter(Boolean).sort();
const dayBefore = new Date(new Date(applyDate + 'T00:00:00Z').getTime() - 86400000)
  .toISOString()
  .slice(0, 10);
const covered = backups.some((b) => b === applyDate || b === dayBefore);

console.log(`newest ingest report date: ${applyDate}`);
console.log(`backup dates on record: ${backups.join(', ') || '(none)'}`);
if (!covered) {
  console.error(`BACKUP FAIL: no backup dated ${dayBefore} or ${applyDate}`);
  process.exit(1);
}
console.log('BACKUP OK');
