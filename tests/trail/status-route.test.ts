import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session } from 'next-auth';
import { setupTestDb } from '../helpers/db';

vi.mock('@/auth', () => ({ auth: vi.fn() }));

const CODE_RE = /^BRP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

let route: typeof import('@/app/api/trail/status/route');
let authMock: ReturnType<typeof vi.fn>;
let trailService: typeof import('@/lib/trail-service');
let dbModule: typeof import('@/db');
let schema: typeof import('@/db/schema');

async function makeUser(email: string): Promise<string> {
  const [row] = await dbModule.db
    .insert(schema.users)
    .values({ email })
    .returning({ id: schema.users.id });
  return row.id;
}

function signIn(userId: string): void {
  authMock.mockResolvedValue({
    user: { id: userId, email: `${userId}@example.test` },
    expires: '2999-01-01T00:00:00.000Z',
  } as Session);
}

beforeAll(async () => {
  await setupTestDb();
  route = await import('@/app/api/trail/status/route');
  const auth = await import('@/auth');
  authMock = vi.mocked(auth.auth);
  trailService = await import('@/lib/trail-service');
  dbModule = await import('@/db');
  schema = await import('@/db/schema');
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/trail/status', () => {
  it('returns 200 with authenticated:false when signed out (not an error)', async () => {
    authMock.mockResolvedValue(null);

    const res = await route.GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ authenticated: false, progress: null });
  });

  it('returns an empty-but-authenticated progress for a signed-in user with no check-ins', async () => {
    signIn(await makeUser('newuser@example.test'));

    const body = await (await route.GET()).json();

    expect(body.authenticated).toBe(true);
    expect(body.progress).toEqual({
      totalCheckIns: 0,
      requiredCheckIns: 3,
      checkedInMuralIds: [],
      questComplete: false,
      redemptionCode: null,
    });
  });

  it('reflects in-progress check-ins (ids are a subset of 1..14)', async () => {
    const userId = await makeUser('midway@example.test');
    await trailService.recordCheckIn(userId, 4);
    await trailService.recordCheckIn(userId, 9);
    signIn(userId);

    const body = await (await route.GET()).json();

    expect(body.progress.totalCheckIns).toBe(2);
    expect(body.progress.checkedInMuralIds.sort((a: number, b: number) => a - b)).toEqual([4, 9]);
    expect(body.progress.questComplete).toBe(false);
    body.progress.checkedInMuralIds.forEach((id: number) => {
      expect(id).toBeGreaterThanOrEqual(1);
      expect(id).toBeLessThanOrEqual(14);
    });
  });

  it('exposes the redemption code once the quest is complete', async () => {
    const userId = await makeUser('done@example.test');
    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    await trailService.recordCheckIn(userId, 3);
    signIn(userId);

    const body = await (await route.GET()).json();

    expect(body.progress.questComplete).toBe(true);
    expect(body.progress.redemptionCode).toMatch(CODE_RE);
    expect(body.progress.checkedInMuralIds).not.toContain(0);
  });
});
