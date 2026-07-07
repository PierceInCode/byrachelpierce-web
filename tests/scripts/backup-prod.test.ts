import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Client } from '@libsql/client';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BACKUP_TABLES,
  assertSafeIdentifier,
  backupFileName,
  backupTables,
  resolveBackupDate,
  toPlainRows,
} from '../../scripts/backup-prod';

describe('BACKUP_TABLES', () => {
  it('covers exactly the ten app tables the backup-check gate expects', () => {
    // The `file` names are the exact base names backup-check.mjs reads:
    // backups/<file>-<date>.json.
    expect(BACKUP_TABLES.map((t) => t.file)).toEqual([
      'tag_categories',
      'users',
      'tags',
      'paintings',
      'accounts',
      'sessions',
      'verification_tokens',
      'painting_tags',
      'trail_progress',
      'trail_completions',
    ]);
  });

  it('maps the verification_tokens dump to the actual camelCase SQL table', () => {
    // schema.ts declares sqliteTable('verificationTokens', ...) — the dump file
    // name and the SQL table name differ, so the mapping must be explicit.
    const vt = BACKUP_TABLES.find((t) => t.file === 'verification_tokens');
    expect(vt?.sql).toBe('verificationTokens');
  });
});

describe('backupFileName', () => {
  it('builds <file>-<date>.json', () => {
    expect(backupFileName('paintings', '2026-07-07')).toBe('paintings-2026-07-07.json');
  });
});

describe('resolveBackupDate', () => {
  it('passes an explicit date through unchanged', () => {
    expect(resolveBackupDate('2026-01-02')).toBe('2026-01-02');
  });

  it('defaults to today in YYYY-MM-DD form', () => {
    expect(resolveBackupDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('toPlainRows', () => {
  it('projects a libSQL result into an array of column-keyed plain objects', () => {
    const rows = toPlainRows({
      columns: ['id', 'title', 'width_in'],
      rows: [
        [1, 'Turtle', 24],
        [2, 'Gulf', null],
      ],
    });
    expect(rows).toEqual([
      { id: 1, title: 'Turtle', width_in: 24 },
      { id: 2, title: 'Gulf', width_in: null },
    ]);
  });

  it('returns an empty array for an empty result', () => {
    expect(toPlainRows({ columns: ['id'], rows: [] })).toEqual([]);
  });
});

describe('assertSafeIdentifier (F6 — defensive SQL identifier check)', () => {
  it('accepts every table identifier in BACKUP_TABLES', () => {
    for (const { sql } of BACKUP_TABLES) {
      expect(() => assertSafeIdentifier(sql)).not.toThrow();
      expect(assertSafeIdentifier(sql)).toBe(sql);
    }
  });

  it('accepts a bare letters/underscore identifier', () => {
    expect(assertSafeIdentifier('painting_tags')).toBe('painting_tags');
  });

  it('throws on an identifier containing anything outside [A-Za-z_]', () => {
    expect(() => assertSafeIdentifier('paintings; DROP TABLE users')).toThrow();
    expect(() => assertSafeIdentifier('paintings"')).toThrow();
    expect(() => assertSafeIdentifier('painting1')).toThrow();
    expect(() => assertSafeIdentifier('')).toThrow();
  });
});

describe('backupTables (F3 — same-day re-run preserves the earlier snapshot)', () => {
  let dir: string;
  let currentRows: unknown[][];
  // A minimal read-only stand-in for a libSQL Client: SELECT returns whatever
  // `currentRows` currently holds. No real database is touched.
  const client = {
    execute: async () => ({ columns: ['id'], rows: currentRows }),
  } as unknown as Client;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'brp-supersede-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('keeps the primary <table>-<date>.json on the NEWEST dump and preserves the earlier one as -superseded-', async () => {
    const DATE = '2026-07-07';
    const primary = join(dir, backupFileName('paintings', DATE));

    currentRows = [[1]]; // first backup: one row
    await backupTables(client, dir, DATE);
    expect(JSON.parse(readFileSync(primary, 'utf8'))).toHaveLength(1);

    currentRows = [[1], [2]]; // same-day re-run: two rows
    await backupTables(client, dir, DATE);

    // The primary filename (the one the gate probe reads) holds the NEWEST snapshot.
    expect(existsSync(primary)).toBe(true);
    expect(JSON.parse(readFileSync(primary, 'utf8'))).toHaveLength(2);

    // The earlier snapshot survives under a -superseded-<HHmmss> name, not destroyed.
    const superseded = readdirSync(dir).filter((f) =>
      /^paintings-2026-07-07-superseded-\d{6}\.json$/.test(f),
    );
    expect(superseded).toHaveLength(1);
    expect(JSON.parse(readFileSync(join(dir, superseded[0]), 'utf8'))).toHaveLength(1);
  });
});
