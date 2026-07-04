import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { and, eq } from 'drizzle-orm';
import { readFileSync } from 'node:fs';
import { setupTestDb } from '../helpers/db';

let dbModule: typeof import('@/db');
let schema: typeof import('@/db/schema');

/** Run the 0002 data migration against the current test DB. */
async function runDataMigration(): Promise<void> {
  const sql = readFileSync('drizzle/0002_migrate_sentinels.sql', 'utf8');
  const client = createClient({ url: process.env.TURSO_DATABASE_URL as string });
  await client.executeMultiple(sql);
  client.close();
}

beforeAll(async () => {
  await setupTestDb();
  dbModule = await import('@/db');
  schema = await import('@/db/schema');
});

describe('sentinel → completions data migration (drizzle/0002_migrate_sentinels)', () => {
  it('moves mural_id=0 rows into trail_completions, deletes them, and preserves the code', async () => {
    const [user] = await dbModule.db
      .insert(schema.users)
      .values({ email: 'legacy@example.test' })
      .returning({ id: schema.users.id });

    // Three real check-ins plus one legacy sentinel row carrying the code —
    // exactly the shape the old completion mechanism left behind.
    await dbModule.db.insert(schema.trailProgress).values([
      { userId: user.id, muralId: 1, checkedInAt: '2026-06-01T10:00:00.000Z' },
      { userId: user.id, muralId: 2, checkedInAt: '2026-06-01T10:05:00.000Z' },
      { userId: user.id, muralId: 3, checkedInAt: '2026-06-01T10:10:00.000Z' },
      {
        userId: user.id,
        muralId: 0,
        checkedInAt: '2026-06-01T10:10:01.000Z',
        redemptionCode: 'BRP-LEGACY',
      },
    ]);

    await runDataMigration();

    // The legacy code now lives in trail_completions, with the sentinel's
    // checked_in_at carried over as completed_at.
    const completions = await dbModule.db
      .select()
      .from(schema.trailCompletions)
      .where(eq(schema.trailCompletions.userId, user.id));
    expect(completions).toHaveLength(1);
    expect(completions[0].redemptionCode).toBe('BRP-LEGACY');
    expect(completions[0].completedAt).toBe('2026-06-01T10:10:01.000Z');

    // No sentinel rows remain...
    const sentinels = await dbModule.db
      .select()
      .from(schema.trailProgress)
      .where(and(eq(schema.trailProgress.userId, user.id), eq(schema.trailProgress.muralId, 0)));
    expect(sentinels).toHaveLength(0);

    // ...but the three real check-ins are untouched.
    const real = await dbModule.db
      .select()
      .from(schema.trailProgress)
      .where(eq(schema.trailProgress.userId, user.id));
    expect(real).toHaveLength(3);
  });

  it('is idempotent — running it again changes nothing', async () => {
    const [user] = await dbModule.db
      .insert(schema.users)
      .values({ email: 'idempotent@example.test' })
      .returning({ id: schema.users.id });
    await dbModule.db.insert(schema.trailProgress).values({
      userId: user.id,
      muralId: 0,
      checkedInAt: '2026-06-02T12:00:00.000Z',
      redemptionCode: 'BRP-ONCE99',
    });

    await runDataMigration();
    await runDataMigration(); // second run must not throw or duplicate

    const completions = await dbModule.db
      .select()
      .from(schema.trailCompletions)
      .where(eq(schema.trailCompletions.userId, user.id));
    expect(completions).toHaveLength(1);
    expect(completions[0].redemptionCode).toBe('BRP-ONCE99');
  });
});
