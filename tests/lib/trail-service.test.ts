import { beforeAll, describe, expect, it } from 'vitest';
import { setupTestDb } from '../helpers/db';

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

beforeAll(async () => {
  await setupTestDb();
  trailService = await import('@/lib/trail-service');
  dbModule = await import('@/db');
  schema = await import('@/db/schema');
});

describe('trail-service (current behavior — R0 baseline)', () => {
  it('getTrailStatus returns an empty status for a user with no check-ins', async () => {
    const userId = await makeUser('empty@example.test');

    const status = await trailService.getTrailStatus(userId);

    expect(status).toEqual({
      checkedInMurals: [],
      totalCheckIns: 0,
      requiredCheckIns: 3,
      isComplete: false,
      redemptionCode: null,
    });
  });

  it('recordCheckIn adds a mural and is reflected in status', async () => {
    const userId = await makeUser('single-checkin@example.test');

    const status = await trailService.recordCheckIn(userId, 1);

    expect(status.checkedInMurals).toEqual([1]);
    expect(status.totalCheckIns).toBe(1);
    expect(status.isComplete).toBe(false);
    expect(status.redemptionCode).toBeNull();
  });

  it('checking in at the same mural twice does not create a duplicate', async () => {
    const userId = await makeUser('duplicate-checkin@example.test');

    await trailService.recordCheckIn(userId, 5);
    const status = await trailService.recordCheckIn(userId, 5);

    expect(status.checkedInMurals).toEqual([5]);
    expect(status.totalCheckIns).toBe(1);
  });

  it('completing the quest (3 unique murals) returns a redemption code', async () => {
    const userId = await makeUser('completer@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const status = await trailService.recordCheckIn(userId, 3);

    expect(status.isComplete).toBe(true);
    expect(status.redemptionCode).toMatch(/^BRP-[A-Z0-9]{6}$/);
  });

  it('re-fetching status after completion returns the same code (not regenerated)', async () => {
    const userId = await makeUser('recomplete@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const completed = await trailService.recordCheckIn(userId, 3);

    const status = await trailService.getTrailStatus(userId);

    expect(status.redemptionCode).toBe(completed.redemptionCode);
  });

  // ── Known bug (Architecture §4.2, fixed in R1) ──────────────────────
  //
  // recordCheckIn stores the redemption code on a sentinel row with
  // muralId = 0 (see trail-service.ts). getTrailStatus derives
  // totalCheckIns from the COUNT of *unique* muralIds across all rows —
  // including that sentinel row. So immediately after completion, a
  // user who visited exactly 3 murals shows totalCheckIns = 4, not 3.
  //
  // it.fails documents this as CURRENT, WRONG behavior: the assertion
  // below states what SHOULD be true and is expected to fail today.
  // R1 replaces the sentinel row with a dedicated trail_completions
  // table (DECISIONS 004) and this test flips from it.fails to it.
  it.fails('BUG: totalCheckIns is inflated by the sentinel row after completion', async () => {
    const userId = await makeUser('sentinel-bug@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    await trailService.recordCheckIn(userId, 3);
    const status = await trailService.getTrailStatus(userId);

    expect(status.totalCheckIns).toBe(3);
  });

  it('getUserEmail returns the email for a known user', async () => {
    const userId = await makeUser('lookup@example.test');

    const email = await trailService.getUserEmail(userId);

    expect(email).toBe('lookup@example.test');
  });

  it('getUserEmail returns null for an unknown user id', async () => {
    const email = await trailService.getUserEmail('00000000-0000-0000-0000-000000000000');

    expect(email).toBeNull();
  });
});
