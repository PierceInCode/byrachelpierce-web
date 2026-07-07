/**
 * backup-prod — dated, read-only JSON backup of every app table (audit F6/F7,
 * refutation R1). Closes the "no backup before a production mutation" gap: the
 * M2 content-loop ritual and any additive migration run this FIRST.
 *
 * WHAT IT WRITES
 *   One file per table: backups/<file>-<YYYY-MM-DD>.json, each a JSON array of
 *   row objects (column name → value). This is the exact shape the
 *   `.chuck/probes/backup-check.mjs` gate reads. Ten tables are dumped:
 *   tag_categories, users, tags, paintings, accounts, sessions,
 *   verification_tokens, painting_tags, trail_progress, trail_completions.
 *   (The verification_tokens dump comes from the camelCase `verificationTokens`
 *   SQL table — schema.ts names it that way for the Auth.js adapter.)
 *
 * READ-ONLY
 *   The backup path issues SELECT only. It never writes the source DB and never
 *   prints a credential. Production credentials are read from the COMMENTED
 *   lines of `.env.local` (same pattern as `.chuck/probes/prod-verify.mjs`) and
 *   used only to open the client.
 *
 * ── RESTORE PROCEDURE ──────────────────────────────────────────────────────
 *   The dumps are a full logical snapshot; restore replays them into a target
 *   DB in foreign-key-safe order (parents before children). BACKUP_TABLES is
 *   already ordered for this. To restore:
 *
 *     1. Prepare the TARGET database with the schema applied (run the drizzle
 *        migrations, e.g. `npx drizzle-kit migrate`, or restore into a fresh
 *        migrated DB). Restore assumes the tables already exist.
 *     2. Ensure the target's affected tables are empty (restore INSERTs rows;
 *        it does not upsert or clear). Restoring over existing rows can collide
 *        on primary keys.
 *     3. Run the restore against the target:
 *          import { restoreTables } from 'scripts/backup-prod';
 *          await restoreTables(targetClient, 'backups');
 *        restoreTables reads the newest dated dump per table and INSERTs every
 *        row, parents first, so foreign keys resolve.
 *     4. Verify with expected counts (compare against the source's known row
 *        counts — e.g. 528 paintings) before trusting the target.
 *
 *   Restoring PRODUCTION is an operator-only, backup-verified ritual (Invariant
 *   1); this module provides the mechanism, not the authority to run it there.
 *
 * Run (backup): npx tsx scripts/backup-prod.ts
 */

import type { Client, ResultSet } from '@libsql/client';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isMain } from './lib/entrypoint';

/**
 * The ten app tables, in foreign-key-safe order (referenced tables first) so a
 * sequential restore never violates a constraint. `file` is the dump's base
 * name (what backup-check.mjs reads); `sql` is the real table name in SQLite.
 */
export const BACKUP_TABLES: readonly { file: string; sql: string }[] = [
  { file: 'tag_categories', sql: 'tag_categories' },
  { file: 'users', sql: 'users' },
  { file: 'tags', sql: 'tags' },
  { file: 'paintings', sql: 'paintings' },
  { file: 'accounts', sql: 'accounts' },
  { file: 'sessions', sql: 'sessions' },
  { file: 'verification_tokens', sql: 'verificationTokens' },
  { file: 'painting_tags', sql: 'painting_tags' },
  { file: 'trail_progress', sql: 'trail_progress' },
  { file: 'trail_completions', sql: 'trail_completions' },
];

/** `<file>-<date>.json` — the dump filename convention the gate reads. */
export function backupFileName(file: string, date: string): string {
  return `${file}-${date}.json`;
}

/** Today (or the given date) as YYYY-MM-DD, matching the dump filename. */
export function resolveBackupDate(date?: string): string {
  return date ?? new Date().toISOString().slice(0, 10);
}

/** Minimal structural view of a libSQL result — column names plus row tuples. */
interface ColumnarResult {
  columns: readonly string[];
  rows: readonly ArrayLike<unknown>[];
}

/**
 * Project a libSQL result into an array of plain, column-keyed objects. A raw
 * libSQL Row is array-like, which JSON.stringify would serialise as an array;
 * this rebuilds each row as `{ column: value }` so the dump is self-describing.
 */
export function toPlainRows(result: ColumnarResult): Record<string, unknown>[] {
  const { columns, rows } = result;
  return Array.from(rows, (row) => {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < columns.length; i++) obj[columns[i]] = row[i];
    return obj;
  });
}

/**
 * Dump every app table (SELECT only) to `outDir/<file>-<date>.json`. Returns a
 * map of dump base name → row count written. Read-only against `client`.
 */
export async function backupTables(
  client: Client,
  outDir: string,
  date?: string,
): Promise<Record<string, number>> {
  const stamp = resolveBackupDate(date);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  const counts: Record<string, number> = {};
  for (const { file, sql } of BACKUP_TABLES) {
    const result = (await client.execute(`SELECT * FROM "${sql}"`)) as ResultSet;
    const rows = toPlainRows(result);
    writeFileSync(join(outDir, backupFileName(file, stamp)), JSON.stringify(rows, null, 2), 'utf8');
    counts[file] = rows.length;
  }
  return counts;
}

/** The newest dated dump for a table in `inDir`, or null if none exists. */
function newestDumpFor(inDir: string, file: string): string | null {
  const pattern = new RegExp(`^${file}-(\\d{4}-\\d{2}-\\d{2})\\.json$`);
  const dated = readdirSync(inDir)
    .map((name) => ({ name, date: name.match(pattern)?.[1] }))
    .filter((e): e is { name: string; date: string } => Boolean(e.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  return dated.length ? dated[dated.length - 1].name : null;
}

/**
 * Restore the newest dump per table from `inDir` into `client`, INSERTing rows
 * parents-first (BACKUP_TABLES order) so foreign keys resolve. Returns a map of
 * dump base name → row count restored. The target's tables must already exist
 * (schema applied) and should be empty.
 */
export async function restoreTables(
  client: Client,
  inDir: string,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const { file, sql } of BACKUP_TABLES) {
    const dump = newestDumpFor(inDir, file);
    if (!dump) {
      counts[file] = 0;
      continue;
    }
    const rows = JSON.parse(readFileSync(join(inDir, dump), 'utf8')) as Record<string, unknown>[];
    for (const row of rows) {
      const columns = Object.keys(row);
      if (columns.length === 0) continue;
      const placeholders = columns.map(() => '?').join(', ');
      const colList = columns.map((c) => `"${c}"`).join(', ');
      await client.execute({
        sql: `INSERT INTO "${sql}" (${colList}) VALUES (${placeholders})`,
        args: columns.map((c) => row[c] as never),
      });
    }
    counts[file] = rows.length;
  }
  return counts;
}

/** Parse the COMMENTED production creds from .env.local (never printed). */
function readProdCreds(): { url: string; token: string } {
  const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
  const url = env
    .match(/^#+\s*TURSO_DATABASE_URL\s*=\s*["']?(libsql:\/\/[^"'\r\n]+)/m)?.[1]
    ?.trim();
  const token = env.match(/^#+\s*TURSO_AUTH_TOKEN\s*=\s*["']?([^"'\r\n]+)/m)?.[1]?.trim();
  if (!url || !token) {
    console.error('backup-prod: commented production creds not found in .env.local');
    process.exit(1);
  }
  return { url, token };
}

async function main(): Promise<void> {
  const { createClient } = await import('@libsql/client');
  const { url, token } = readProdCreds();
  const client = createClient({ url, authToken: token });
  try {
    const counts = await backupTables(client, 'backups');
    console.log(
      JSON.stringify({ event: 'backup_prod', date: resolveBackupDate(), counts, out: 'backups/' }),
    );
  } finally {
    client.close();
  }
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error('backup-prod failed:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
