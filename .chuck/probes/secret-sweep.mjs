// M3 gate: full-history secret sweep (legacy Spec §14: "rotated and never re-leaked").
// Scans every commit's patch text for secret-shaped strings. The two historically
// leaked-and-rotated credentials stay in history by explicit choice (legacy DECISIONS
// 003: rotate, don't rewrite) — hits matching the known-rotated allowlist are reported
// as KNOWN-ROTATED and do not fail the sweep. Anything else fails it.
import { spawnSync } from 'node:child_process';

const PATTERNS = [
  { name: 'resend-key', re: /re_[A-Za-z0-9]{16,}/g },
  { name: 'jwt-like-token', re: /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}/g },
  { name: 'vercel-blob-rw', re: /vercel_blob_rw_[A-Za-z0-9_]{20,}/g },
];
// Known-rotated leak: the Resend key committed in the v1 trail spec (prefix is already
// public in OPERATOR-GUIDE.md; the key was revoked in M0/HT1).
const ALLOW = [/^re_cQuXwBZ1/];
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

let known = 0;
const offenders = new Set();
for (const line of log.stdout.split('\n')) {
  if (SKIP_LINE.test(line)) continue;
  for (const { name, re } of PATTERNS) {
    for (const m of line.matchAll(re)) {
      if (ALLOW.some((a) => a.test(m[0]))) known++;
      else offenders.add(`${name}: ${m[0].slice(0, 12)}… (redacted)`);
    }
  }
}

console.log(`history lines scanned: ${log.stdout.split('\n').length}`);
console.log(`known-rotated hits (allowlisted): ${known}`);
if (offenders.size) {
  console.error('SWEEP FAIL — non-allowlisted secret-shaped strings in history:');
  for (const o of offenders) console.error('- ' + o);
  process.exit(1);
}
console.log('SWEEP CLEAN');
