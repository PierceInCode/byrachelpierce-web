import { beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { setupTestDb } from '../helpers/db';

const CODE_RE = /^BRP-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

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

/** Complete the quest for a fresh user and return their code. */
async function completeQuest(email: string): Promise<string | null> {
  const userId = await makeUser(email);
  await trailService.recordCheckIn(userId, 1);
  await trailService.recordCheckIn(userId, 2);
  const result = await trailService.recordCheckIn(userId, 3);
  return result.status.redemptionCode;
}

async function countCompletions(userId: string): Promise<number> {
  const rows = await dbModule.db
    .select()
    .from(schema.trailCompletions)
    .where(eq(schema.trailCompletions.userId, userId));
  return rows.length;
}

beforeAll(async () => {
  await setupTestDb();
  trailService = await import('@/lib/trail-service');
  dbModule = await import('@/db');
  schema = await import('@/db/schema');
});

describe('getTrailStatus', () => {
  it('returns an empty status for a user with no check-ins', async () => {
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
});

describe('recordCheckIn', () => {
  it('adds a mural and reflects it in status', async () => {
    const userId = await makeUser('single-checkin@example.test');

    const { status, completionInserted } = await trailService.recordCheckIn(userId, 1);

    expect(status.checkedInMurals).toEqual([1]);
    expect(status.totalCheckIns).toBe(1);
    expect(status.isComplete).toBe(false);
    expect(status.redemptionCode).toBeNull();
    expect(completionInserted).toBe(false);
  });

  it('is idempotent — checking in at the same mural twice makes no duplicate', async () => {
    const userId = await makeUser('duplicate-checkin@example.test');

    await trailService.recordCheckIn(userId, 5);
    const { status } = await trailService.recordCheckIn(userId, 5);

    expect(status.checkedInMurals).toEqual([5]);
    expect(status.totalCheckIns).toBe(1);
  });

  it('returns a code and completionInserted=true when the quest completes', async () => {
    const userId = await makeUser('completer@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const { status, completionInserted } = await trailService.recordCheckIn(userId, 3);

    expect(status.isComplete).toBe(true);
    expect(status.redemptionCode).toMatch(CODE_RE);
    expect(completionInserted).toBe(true);
  });

  it('BUG FIX (Architecture §4.2 hole 1): totalCheckIns is NOT inflated after completion', async () => {
    // Was: completion wrote a mural_id=0 sentinel row that getTrailStatus
    // counted, reporting 4/3. Now the code lives in trail_completions and
    // status counts only murals 1..N, so exactly-3 visits reads as 3.
    const userId = await makeUser('no-inflation@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    await trailService.recordCheckIn(userId, 3);
    const status = await trailService.getTrailStatus(userId);

    expect(status.totalCheckIns).toBe(3);
    expect(status.checkedInMurals).not.toContain(0);
  });

  it('re-fetching status after completion returns the same code (not regenerated)', async () => {
    const userId = await makeUser('recomplete@example.test');

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const { status: completed } = await trailService.recordCheckIn(userId, 3);

    const status = await trailService.getTrailStatus(userId);

    expect(status.redemptionCode).toBe(completed.redemptionCode);
  });

  it('extra murals after completion keep the same code and insert no new completion', async () => {
    const userId = await makeUser('over-achiever@example.test');
    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const { status: completed } = await trailService.recordCheckIn(userId, 3);

    // A 4th mural — already complete, so no new completion row/code, no email.
    const { status, completionInserted } = await trailService.recordCheckIn(userId, 4);

    expect(completionInserted).toBe(false);
    expect(status.redemptionCode).toBe(completed.redemptionCode);
    expect(status.totalCheckIns).toBe(4);
    expect(await countCompletions(userId)).toBe(1);
  });
});

describe('completion race (Architecture §4.2 hole 3)', () => {
  it('two concurrent completing check-ins yield exactly one completion + one code', async () => {
    const userId = await makeUser('racer@example.test');
    // Prime with 2 murals so either concurrent call is the completing one.
    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);

    const [a, b] = await Promise.all([
      trailService.recordCheckIn(userId, 3),
      trailService.recordCheckIn(userId, 4),
    ]);

    // Exactly one request inserted the completion row.
    const winners = [a.completionInserted, b.completionInserted].filter(Boolean);
    expect(winners).toHaveLength(1);

    // Both observe the same canonical code.
    expect(a.status.redemptionCode).toBe(b.status.redemptionCode);
    expect(a.status.redemptionCode).toMatch(CODE_RE);

    // And the DB holds exactly one completion for the user.
    expect(await countCompletions(userId)).toBe(1);
  });
});

describe('redemption code generation (Architecture §4.2 hole 2)', () => {
  it('every generated code uses only the unambiguous alphabet (no I/L/O/0/1)', async () => {
    const codes: (string | null)[] = [];
    for (let i = 0; i < 40; i++) {
      codes.push(await completeQuest(`code-prop-${i}@example.test`));
    }

    for (const code of codes) {
      expect(code).toMatch(CODE_RE);
      expect(code?.slice(4)).not.toMatch(/[ILO01]/);
    }
    // Sanity: the CSPRNG isn't emitting a constant (astronomically unlikely).
    expect(new Set(codes).size).toBeGreaterThan(1);
  });
});

describe('getCheckIns + getCompletion', () => {
  it('getCheckIns returns each mural once, chronologically, with stored timestamps', async () => {
    const userId = await makeUser('checkins@example.test');
    await trailService.recordCheckIn(userId, 2);
    await trailService.recordCheckIn(userId, 2); // duplicate ignored
    await trailService.recordCheckIn(userId, 7);

    const checkIns = await trailService.getCheckIns(userId);

    expect(checkIns.map((c) => c.muralId)).toEqual([2, 7]);
    for (const c of checkIns) {
      expect(() => new Date(c.checkedInAt).toISOString()).not.toThrow();
    }
  });

  it('getCompletion returns null before completion, the row after', async () => {
    const userId = await makeUser('completion-lookup@example.test');
    expect(await trailService.getCompletion(userId)).toBeNull();

    await trailService.recordCheckIn(userId, 1);
    await trailService.recordCheckIn(userId, 2);
    const { status } = await trailService.recordCheckIn(userId, 3);

    const completion = await trailService.getCompletion(userId);
    expect(completion?.code).toBe(status.redemptionCode);
    expect(completion?.completedAt).toBeTruthy();
  });
});

describe('getUserEmail', () => {
  it('returns the email for a known user', async () => {
    const userId = await makeUser('lookup@example.test');
    expect(await trailService.getUserEmail(userId)).toBe('lookup@example.test');
  });

  it('returns null for an unknown user id', async () => {
    expect(await trailService.getUserEmail('00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
