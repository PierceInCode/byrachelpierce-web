import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrailCompletionEmail } from '@/types';

// Capture what gets sent without hitting Resend. `vi.hoisted` lets the mock
// factory (which is hoisted above imports) reference this shared spy.
const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));
vi.mock('resend', () => ({
  // The module calls `new Resend(...)`, so the mock must be instantiable —
  // a class, not a plain function returning an object.
  Resend: class {
    emails = { send: sendMock };
  },
}));

let emails: typeof import('@/lib/trail-emails');

beforeEach(async () => {
  vi.clearAllMocks();
  sendMock.mockResolvedValue({ data: { id: 'test-id' }, error: null });
  emails = await import('@/lib/trail-emails');
});

describe('sendRedemptionEmail', () => {
  it('renders the code and a count from TRAIL_REQUIRED_CHECKINS (not a hardcoded 3)', async () => {
    const result = await emails.sendRedemptionEmail('visitor@example.test', 'BRP-A2C4KM');

    expect(result.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const html: string = sendMock.mock.calls[0][0].html;
    expect(html).toContain('BRP-A2C4KM');
    // Default TRAIL_REQUIRED_CHECKINS is 3 in the test env.
    expect(html).toContain('You visited 3 of');
  });

  it('reports failure when Resend returns an error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'nope' } });

    const result = await emails.sendRedemptionEmail('visitor@example.test', 'BRP-A2C4KM');

    expect(result.success).toBe(false);
    expect(result.error).toBe('nope');
  });
});

describe('sendGalleryNotification (Architecture §4.2 hole 4 + §4.4 honesty)', () => {
  const payload: TrailCompletionEmail = {
    email: 'winner@example.test',
    code: 'BRP-K7M2QW',
    completedAt: '2026-07-04T18:30:00.000Z',
    checkIns: [
      { muralId: 1, checkedInAt: '2026-07-04T14:00:00.000Z' },
      { muralId: 7, checkedInAt: '2026-07-04T16:15:00.000Z' },
      { muralId: 12, checkedInAt: '2026-07-04T18:20:00.000Z' },
    ],
  };

  it('lists each mural by its real location/address with its OWN stored time', async () => {
    const result = await emails.sendGalleryNotification(payload);

    expect(result.success).toBe(true);
    const html: string = sendMock.mock.calls[0][0].html;

    // Real, verified location strings — never a fabricated mural title.
    expect(html).toContain('Lighthouse Cafe, 1020 Periwinkle Way, Sanibel, FL 33957');
    expect(html).toContain('Rachel Pierce Art Gallery, 1571 Periwinkle Way, Sanibel, FL 33957');
    expect(html).toContain('The SeaShells of Sanibel, 2840 W. Gulf Dr, Sanibel, FL 33957');

    // Per-check-in timestamps rendered in Eastern time (EDT = UTC-4 in July),
    // each from its OWN stored check-in time — not "now".
    expect(html).toContain('Jul 4, 2026');
    expect(html).toContain('10:00 AM'); // mural 1: 14:00 UTC → 10:00 AM EDT
    expect(html).toContain('12:15 PM'); // mural 7: 16:15 UTC → 12:15 PM EDT
    expect(html).toContain('2:30 PM'); // completedAt: 18:30 UTC → 2:30 PM EDT
  });

  it('never leaks "Mural #0" or an unknown-id placeholder', async () => {
    const withUnknown: TrailCompletionEmail = {
      ...payload,
      checkIns: [...payload.checkIns, { muralId: 999, checkedInAt: '2026-07-04T19:00:00.000Z' }],
    };

    await emails.sendGalleryNotification(withUnknown);
    const html: string = sendMock.mock.calls[0][0].html;

    expect(html).not.toContain('Mural #');
    expect(html).not.toContain('unknown');
    expect(html).not.toContain('999');
    expect(html).toContain('BRP-K7M2QW');
  });
});
