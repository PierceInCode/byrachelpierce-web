#!/usr/bin/env node
// M1 Lighthouse Chrome-resolution wrapper.
//
// `lhci autorun` needs a Chrome binary. The sole sanctioned dev machine (Windows)
// has NO standalone Chrome — only Microsoft Edge — so `lhci autorun` fails with
// "Chrome installation not found". A Playwright chromium IS committed as a project
// dependency, so we resolve Chrome from it and hand LHCI a CHROME_PATH.
//
// Precedence: an ambient CHROME_PATH (e.g. a CI runner that provides real Chrome)
// wins; otherwise we fall back to Playwright's chromium executablePath(). See
// DECISIONS D23. No new dependency is introduced — playwright is already present.
//
// Any argv passed to this wrapper is forwarded verbatim to `lhci autorun`, which is
// how the prod variant injects its --collect.* overrides.

import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

// Resolve the lhci binary directly from node_modules/.bin so the wrapper does not
// depend on the caller having injected node_modules/.bin into PATH (npm run does;
// a bare `node scripts/run-lighthouse.mjs` does not).
function resolveLhciBin() {
  const binDir = join(repoRoot, 'node_modules', '.bin');
  const candidates = process.platform === 'win32' ? ['lhci.cmd', 'lhci.CMD', 'lhci'] : ['lhci'];
  for (const name of candidates) {
    const p = join(binDir, name);
    if (existsSync(p)) return p;
  }
  // Fall back to PATH resolution via the shell.
  return 'lhci';
}

function resolveChromePath() {
  if (process.env.CHROME_PATH && process.env.CHROME_PATH.trim() !== '') {
    return process.env.CHROME_PATH;
  }
  // playwright is a project dependency (@playwright/test pulls it in); its committed
  // chromium download is the Chrome we drive LHCI with.
  const { chromium } = require('playwright');
  return chromium.executablePath();
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error(
    'run-lighthouse: could not resolve a Chrome binary (no ambient CHROME_PATH and Playwright chromium executablePath() was empty). Run `npx playwright install chromium`.',
  );
  process.exit(1);
}

const lhciBin = resolveLhciBin();

// Load the teardown shim into every lighthouse CLI child LHCI spawns (they inherit
// NODE_OPTIONS). It makes chrome-launcher's transient win32 EPERM at temp cleanup
// non-fatal so a fully-audited, fully-asserted run is not discarded. See the shim
// file and DECISIONS D23. The `--import` URL must be a file: URL on win32.
const shimUrl = pathToFileURL(join(here, 'lighthouse-teardown-shim.mjs')).href;
const priorNodeOptions = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : '';
const env = {
  ...process.env,
  CHROME_PATH: chromePath,
  NODE_OPTIONS: `${priorNodeOptions}--import ${JSON.stringify(shimUrl)}`,
};
console.log(`run-lighthouse: CHROME_PATH=${chromePath}`);
console.log(`run-lighthouse: lhci=${lhciBin}`);

const passthrough = process.argv.slice(2);
const args = ['autorun', ...passthrough];

// Run `lhci autorun` EXACTLY ONCE and propagate its real exit code.
//
// A whole-autorun retry used to live here to survive chrome-launcher's transient
// win32 EPERM at post-audit temp cleanup. That transient is now handled at its
// source by lighthouse-teardown-shim.mjs (loaded via NODE_OPTIONS above), which makes
// the cleanup EPERM non-fatal so a fully-audited run is never discarded. With the shim
// in place a retry has no legitimate transient left to cover — its only remaining
// effect would be to MASK a genuine sub-budget miss on a flaky run (e.g. an
// accessibility median that dips to the 0.95 floor). We therefore do not retry:
// autorun runs once and its exit code decides the gate. Score misses fail honestly.
const result = spawnSync(lhciBin, args, { stdio: 'inherit', env, shell: true });
if (result.error) {
  console.error(`run-lighthouse: failed to launch lhci: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
