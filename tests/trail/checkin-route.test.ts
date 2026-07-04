import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { setupTestDb } from '../helpers/db';

// Auth is mocked so we control the signed-in / signed-out state per test.
vi.mock('@/auth', () => ({ auth: vi.fn() }));

// Email senders are mocked: tests never send real mail (Invariant 4) and we
// assert on the call arguments. They resolve success by default.
vi.mock('@/lib/trail-emails', () => ({
  sendRedemptionEmail: vi.fn().mockResolvedValue({ success: true }),
  sendGalleryNotification: vi.fn().mockResolvedValue({ success: true }),
}));

const CODE_RE = /^BRP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

let route: typeof import('@/app/api/trail/checkin/route');
let authMock: ReturnType<typeof vi.fn>;
let emails: typeof import('@/lib/trail-emails');
let dbModule: typeof import('@/db');
let schema: typeof import('@/db/schema');

async function makeUser(email: string): Promise<string> {
  const [row] = await dbModule.db
    .insert(schema.users)
    .values({ email })
    .returning({ id: schema.users.id });
  return row.id;
}

function signIn(userId: string, email: string): void {
  authMock.mockResolvedValue({
    user: { id: userId, email },
    expires: '2999-01-01T00:00:00.000Z',
  } as Session);
}

function post(bodyText: string): Promise<Response> {
  return route.POST(
    new Request('http://localhost/api/trail/checkin', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: bodyText,
    }),
  ) as unknown as Promise<Response>;
}

const checkIn = (muralId: unknown) => post(JSON.stringify({ muralId }));

beforeAll(async () => {
  await setupTestDb();
  route = await import('@/app/api/trail/checkin/route');
  const auth = await import('@/auth');
  authMock = vi.mocked(auth.auth);
  emails = await import('@/lib/trail-emails');
  dbModule = await import('@/db');
  schema = await import('@/db/schema');
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/trail/checkin — auth + validation', () => {
  it('returns 401 when signed out and sends no email', async () => {
    authMock.mockResolvedValue(null);

    const res = await checkIn(1);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(emails.sendRedemptionEmail).not.toHaveBeenCalled();
  });

  it('returns 400 on an unparseable body', async () => {
    signIn(await makeUser('badbody@example.test'), 'badbody@example.test');

    const res = await post('this is not json');

    expect(res.status).toBe(400);
  });

  it('returns 400 on an out-of-range mural id', async () => {
    signIn(await makeUser('badid@example.test'), 'badid@example.test');

    expect((await checkIn(0)).status).toBe(400);
    expect((await checkIn(99)).status).toBe(400);
    expect((await checkIn(2.5)).status).toBe(400);
  });
});

describe('POST /api/trail/checkin — check-in + completion', () => {
  it('records a non-completing check-in without sending email', async () => {
    signIn(await makeUser('progress@example.test'), 'progress@example.test');

    const res = await checkIn(1);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.questComplete).toBe(false);
    expect(body.newTotal).toBe(1);
    expect(emails.sendRedemptionEmail).not.toHaveBeenCalled();
    expect(emails.sendGalleryNotification).not.toHaveBeenCalled();
  });

  it('on completion, sends both emails once with the real code and stored timestamps', async () => {
    const email = 'finisher@example.test';
    signIn(await makeUser(email), email);

    await checkIn(1);
    await checkIn(2);
    const res = await checkIn(3);
    const body = await res.json();

    expect(body.questComplete).toBe(true);
    expect(body.redemptionCode).toMatch(CODE_RE);

    expect(emails.sendRedemptionEmail).toHaveBeenCalledTimes(1);
    expect(emails.sendRedemptionEmail).toHaveBeenCalledWith(email, expect.stringMatching(CODE_RE));

    expect(emails.sendGalleryNotification).toHaveBeenCalledTimes(1);
    const payload = vi.mocked(emails.sendGalleryNotification).mock.calls[0][0];
    expect(payload.email).toBe(email);
    expect(payload.code).toMatch(CODE_RE);
    expect(payload.checkIns).toHaveLength(3);
    for (const c of payload.checkIns) {
      expect(typeof c.muralId).toBe('number');
      expect(() => new Date(c.checkedInAt).toISOString()).not.toThrow();
    }
    expect(payload.completedAt).toBeTruthy();
  });

  it('does not resend email when an already-completed user checks in again', async () => {
    const email = 'again@example.test';
    signIn(await makeUser(email), email);
    await checkIn(1);
    await checkIn(2);
    await checkIn(3); // completes — emails fire here
    vi.clearAllMocks();
    signIn(
      (
        await dbModule.db.select({ id: schema.users.id }).from(schema.users).where(eqEmail(email))
      )[0].id,
      email,
    );

    const res = await checkIn(4); // already complete
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.questComplete).toBe(true);
    expect(emails.sendRedemptionEmail).not.toHaveBeenCalled();
    expect(emails.sendGalleryNotification).not.toHaveBeenCalled();
  });
});

function eqEmail(email: string) {
  return eq(schema.users.email, email);
}
