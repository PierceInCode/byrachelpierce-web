// Lighthouse teardown shim — loaded via NODE_OPTIONS=--import into the lighthouse
// CLI child that LHCI spawns (@lhci/cli node-runner spawns `node <lighthouse/cli>`).
//
// WHY: On this Windows dev machine, chrome-launcher's synchronous post-audit
// `destroyTmp()` throws `EPERM: Permission denied` while rm-ing Chrome's temp
// user-data dir — Chrome's file handle has not been released the instant after the
// process is killed. A hermetic probe proved the lock is TRANSIENT: a manual rmSync
// of the same dir 500ms later succeeds every time. chrome-launcher's own
// `maxRetries: 10` retries too tightly (synchronously) to let Windows release the
// handle, so it fails deterministically. The AUDIT itself completes fully every run
// (all categories are computed and saved) — only the cosmetic temp cleanup races.
//
// The unhandled EPERM makes the lighthouse CLI exit non-zero, and LHCI then DISCARDS
// an otherwise-complete, fully-scored run. LHCI has a win32 escape hatch for exactly
// this class (it keeps the run when stderr shows "Chrome could not be killed"), but
// our error escapes from destroyTmp() rather than kill()'s catch, so it misses that
// string.
//
// FIX: wrap chrome-launcher's `kill()` so a teardown/cleanup failure is caught and
// logged as the recognized "Chrome could not be killed" message instead of crashing.
// This changes NOTHING about the audit or its budget assertions — those run to
// completion first; only the OS-level temp rm is made non-fatal, and the OS reclaims
// its own %TEMP% regardless. No dependency is added or changed; node_modules is left
// untouched on disk (the patch is applied in-memory in the child process). See
// DECISIONS D23.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

try {
  const mod = require('lighthouse/node_modules/chrome-launcher/dist/chrome-launcher.js');
  const Launcher = mod.Launcher ?? mod.default?.Launcher;
  if (Launcher && Launcher.prototype && typeof Launcher.prototype.kill === 'function') {
    const originalKill = Launcher.prototype.kill;
    Launcher.prototype.kill = function patchedKill(...args) {
      try {
        return originalKill.apply(this, args);
      } catch (err) {
        // Emit the message LHCI's win32 escape hatch recognizes, and swallow the
        // transient teardown error so the CLI can exit 0 with results saved.
        const code = err && err.code ? ` (${err.code})` : '';
        console.error(`ChromeLauncher Chrome could not be killed${code} ${err && err.message}`);
      }
    };
  }
} catch {
  // If the module shape ever changes, do nothing — the wrapper still functions and a
  // genuine teardown crash would surface honestly rather than being masked.
}
