import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BACKUP_TABLES, backupTables, restoreTables } from '../scripts/backup-prod';

/**
 * Proves scripts/backup-prod.ts's backup → restore path end to end (audit
 * F6/F7, refutation R1): seed a local file: DB, dump it, restore into a FRESH
 * file: DB, and assert per-table row counts match. This is the M0
 * `restore-roundtrip` gate. Everything here touches file: databases only.
 */

const DATE = '2026-07-07';
let scratch: string;
let source: Client;
let dest: Client;

/** A fresh, migrated file: libSQL client under a new temp dir. */
async function freshDb(label: string): Promise<Client> {
  const dir = mkdtempSync(join(tmpdir(), `brp-roundtrip-${label}-`));
  const client = createClient({ url: `file:${join(dir, `${label}.db`)}` });
  await migrate(drizzle({ client }), { migrationsFolder: './drizzle' });
  return client;
}

/** Row count for one SQL table. */
async function count(client: Client, sql: string): Promise<number> {
  const r = await client.execute(`SELECT COUNT(*) AS n FROM "${sql}"`);
  return Number(r.rows[0].n);
}

beforeAll(async () => {
  scratch = mkdtempSync(join(tmpdir(), 'brp-roundtrip-backups-'));
  source = await freshDb('source');
  dest = await freshDb('dest');

  // Seed a representative row in every one of the ten tables, respecting FKs.
  const now = '2026-07-07T10:00:00.000Z';
  await source.execute({
    sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
    args: ['user-1', 'Rachel', 'rachel@example.test'],
  });
  await source.execute({
    sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
    args: ['user-2', 'Laciey', 'laciey@example.test'],
  });
  await source.execute({
    sql: 'INSERT INTO accounts (userId, type, provider, providerAccountId) VALUES (?, ?, ?, ?)',
    args: ['user-1', 'email', 'resend', 'rachel@example.test'],
  });
  await source.execute({
    sql: 'INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?)',
    args: ['tok-1', 'user-1', Date.now() + 86400000],
  });
  await source.execute({
    sql: 'INSERT INTO verificationTokens (identifier, token, expires) VALUES (?, ?, ?)',
    args: ['rachel@example.test', 'vt-1', Date.now() + 3600000],
  });
  await source.execute({
    sql: 'INSERT INTO tag_categories (id, name, sort_order) VALUES (?, ?, ?)',
    args: [1, 'Subject', 0],
  });
  await source.execute({
    sql: 'INSERT INTO tags (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
    args: [1, 1, 'Sea Life', 0],
  });
  await source.execute({
    sql: `INSERT INTO paintings (id, title, slug, physical_size, availability, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [1, "Matthew's Turtle", 'matthews-turtle', '24 x 36', 'Available', now, now],
  });
  await source.execute({
    sql: `INSERT INTO paintings (id, title, slug, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)`,
    args: [2, 'Gulf Morning', 'gulf-morning', now, now],
  });
  await source.execute({
    sql: 'INSERT INTO painting_tags (painting_id, tag_id, source, confidence) VALUES (?, ?, ?, ?)',
    args: [1, 1, 'seed', 0.9],
  });
  await source.execute({
    sql: 'INSERT INTO trail_progress (user_id, mural_id, checked_in_at) VALUES (?, ?, ?)',
    args: ['user-1', 3, now],
  });
  await source.execute({
    sql: 'INSERT INTO trail_completions (user_id, redemption_code, completed_at) VALUES (?, ?, ?)',
    args: ['user-2', 'BRP-ABC123', now],
  });
});

afterAll(() => {
  source?.close();
  dest?.close();
  if (scratch) rmSync(scratch, { recursive: true, force: true });
});

describe('backup → restore roundtrip', () => {
  it('dumps one JSON-array file per table into the backup dir', async () => {
    const written = await backupTables(source, scratch, DATE);
    // Every one of the ten tables produced a dump.
    expect(Object.keys(written).sort()).toEqual(BACKUP_TABLES.map((t) => t.file).sort());
  });

  it('restores into a fresh DB with per-table row counts equal to the source', async () => {
    await restoreTables(dest, scratch);

    for (const { sql } of BACKUP_TABLES) {
      const sourceCount = await count(source, sql);
      const destCount = await count(dest, sql);
      expect(destCount, `table ${sql}`).toBe(sourceCount);
    }
  });
});

describe('restoreTables is atomic (F2 — a mid-restore collision rolls everything back)', () => {
  it('throws on a PK collision AND leaves the destination byte-state unchanged', async () => {
    // A conflict DB pre-seeded with a users row whose PK collides with the dump's
    // 'user-1'. Restore inserts parents-first: tag_categories succeeds, then the
    // users INSERT throws on the UNIQUE/PK collision. Non-transactionally, the
    // committed tag_categories row would persist (Bill's proof). Transactionally,
    // the whole restore must roll back — the tag_categories rows must NOT appear.
    const conflict = await freshDb('conflict');
    try {
      await conflict.execute({
        sql: 'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
        args: ['user-1', 'Preexisting', 'preexisting@example.test'],
      });

      const before: Record<string, number> = {};
      for (const { sql } of BACKUP_TABLES) before[sql] = await count(conflict, sql);

      await expect(restoreTables(conflict, scratch)).rejects.toThrow();

      for (const { sql } of BACKUP_TABLES) {
        expect(await count(conflict, sql), `table ${sql} after rollback`).toBe(before[sql]);
      }
    } finally {
      conflict.close();
    }
  });
});
