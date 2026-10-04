// M3 gate: full-history secret sweep (legacy Spec §14: "rotated and never re-leaked").
// Scans every commit's patch text for secret-shaped strings; ANY hit fails the sweep.
// Refutation R4 (2026-07-07): an executed all-branch scan proved the historically leaked
// credentials are NOT in this repo's history (the leak predates the repo — only an
// unusable 11-char prefix appears, in two committed docs), so the former known-rotated
// allowlist matched nothing and was removed. The sweep is now absolute.
import { spawnSync } from 'node:child_process';

const PATTERNS = [
  { name: 'resend-key', re: /re_[A-Za-z0-9]{16,}/g },
  { name: 'jwt-like-token', re: /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'vercel-blob-rw', re: /vercel_blob_rw_[A-Za-z0-9_]{20,}/g },
];
// Lines that legitimately carry long base64ish runs:
const SKIP_LINE = /integrity|sha512-|sha256-/;

const log = spawnSync('git', ['log', '--all', '-p', '--no-color'], {
  encoding: 'utf8',
  maxBuffer: 1024 * 1024 * 512,
});
if (log.status !== 0) {
  console.error('SWEEP FAIL: git log did not run: ' + log.stderr);
  process.exit(1);
}

const offenders = new Set();
for (const line of log.stdout.split('\n')) {
  if (SKIP_LINE.test(line)) continue;
  for (const { name, re } of PATTERNS) {
    for (const m of line.matchAll(re)) {
      offenders.add(`${name}: ${m[0].slice(0, 12)}… (redacted)`);
    }
  }
}

console.log(`history lines scanned: ${log.stdout.split('\n').length}`);
if (offenders.size) {
  console.error('SWEEP FAIL — secret-shaped strings in history:');
  for (const o of offenders) console.error('- ' + o);
  process.exit(1);
}
console.log('SWEEP CLEAN');
