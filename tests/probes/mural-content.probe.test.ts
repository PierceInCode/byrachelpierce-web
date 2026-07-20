import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { MURAL_LOCATIONS } from '@/lib/mural-data';

/**
 * ITEM 6 (M1): prove the M2 gate probe `.chuck/probes/mural-content.ts` is
 * runnable against the fixture BEFORE M2 lands, WITHOUT modifying its contract.
 *
 * The probe has two halves:
 *   1. A data-presence check over MURAL_LOCATIONS (`MURAL CONTENT: N/14`) — this
 *      is deterministic and network-free; it is the M2 "real content replaced
 *      suppression" signal.
 *   2. A deployed-HTML fetch of /murals/trail.
 *
 * Pre-M2 the mural data honestly carries NO descriptions (Iron Invariant 3,
 * Architecture §4.4), so the probe must report 0/14 and FAIL (exit 1). We run
 * it as a subprocess pointed at an unreachable base URL so the fetch fails fast
 * and deterministically — what we assert is the fixture-derived data line and
 * the correct RED verdict, which together prove the gate executes and fails
 * closed before real content exists.
 */

const require = createRequire(import.meta.url);
const tsxCli = require.resolve('tsx/cli');
const repoRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');
const probePath = path.join(repoRoot, '.chuck', 'probes', 'mural-content.ts');

function runProbe(baseUrl: string) {
  return spawnSync(process.execPath, [tsxCli, probePath], {
    cwd: repoRoot,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
    encoding: 'utf8',
  });
}

describe('mural-content probe (M2 gate, staged at M1)', () => {
  it('fixture data currently carries 0/14 mural descriptions (honest pre-content state)', () => {
    expect(MURAL_LOCATIONS.length).toBe(14);
    const withDescription = MURAL_LOCATIONS.filter(
      (m) => typeof m.description === 'string' && m.description.trim().length > 0,
    );
    expect(withDescription.length).toBe(0);
  });

  it('the probe is runnable and reports the fixture-derived data-presence line', () => {
    const r = runProbe('http://127.0.0.1:9/unreachable');
    expect(r.error).toBeUndefined();
    expect(r.stdout).toContain('MURAL CONTENT: 0/14');
  });

  it('the probe fails closed (exit 1) while real content is absent', () => {
    const r = runProbe('http://127.0.0.1:9/unreachable');
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('MURAL GATE FAIL');
  });
});
