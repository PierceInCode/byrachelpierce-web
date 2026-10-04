// M1/M3 gate: the committed LHCI config actually ASSERTS the budgets (refutation R13).
// An LHCI run that collects without asserting exits 0 regardless of score, silently
// de-gating Lighthouse. This probe fails unless lighthouserc.json carries error-level
// assertions at or above the BUILD-SPEC budgets: performance 0.85, accessibility 0.95,
// SEO 0.95.
import { readFileSync } from 'node:fs';

const REQUIRED = {
  'categories:performance': 0.85,
  'categories:accessibility': 0.95,
  'categories:seo': 0.95,
};

let cfg;
try {
  cfg = JSON.parse(readFileSync('lighthouserc.json', 'utf8'));
} catch (e) {
  console.error('LHCI CONFIG FAIL: cannot read lighthouserc.json: ' + e.message);
  process.exit(1);
}

const assertions = cfg?.ci?.assert?.assertions ?? {};
const fails = [];
for (const [key, min] of Object.entries(REQUIRED)) {
  const a = assertions[key];
  const [level, opts] = Array.isArray(a) ? a : [a, undefined];
  if (level !== 'error')
    fails.push(`${key}: assertion level is ${JSON.stringify(level ?? null)}, expected "error"`);
  else if (!(Number(opts?.minScore) >= min))
    fails.push(`${key}: minScore ${opts?.minScore ?? '(none)'} < required ${min}`);
  else console.log(`${key}: error @ minScore ${opts.minScore}`);
}
if (fails.length) {
  console.error('LHCI CONFIG FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('LHCI CONFIG OK');
