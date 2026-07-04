import { describe, expect, it } from 'vitest';

describe('trail-emails (module import safety)', () => {
  it('imports cleanly with RESEND_API_KEY unset (Invariant 4 / CI build)', async () => {
    // CI and `next build`'s page-data collection both import this module
    // with no RESEND_API_KEY set. The Resend client used to be
    // constructed eagerly at module scope, which threw immediately and
    // broke the build (`Error: Missing API key`). Regression test for
    // that exact failure — the fix made construction lazy.
    const original = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    await expect(import('@/lib/trail-emails')).resolves.toBeDefined();

    if (original !== undefined) process.env.RESEND_API_KEY = original;
  });
});
