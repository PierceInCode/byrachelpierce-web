import { describe, expect, it } from 'vitest';

// NOTE: this file intentionally does NOT mock `resend`, so it exercises the
// real module against the real SDK — the faithful reproduction of the
// DECISIONS 019 build failure.
describe('trail-emails module import safety', () => {
  it('imports cleanly with RESEND_API_KEY unset (Invariant 4 / CI build)', async () => {
    // CI and `next build`'s page-data collection import this module with no
    // RESEND_API_KEY set. The real Resend constructor throws immediately if
    // the key is missing, so the client MUST be built lazily (on first send)
    // to keep the import side-effect-free. This asserts the import resolves.
    const original = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;

    await expect(import('@/lib/trail-emails')).resolves.toBeDefined();

    if (original !== undefined) process.env.RESEND_API_KEY = original;
  });
});
