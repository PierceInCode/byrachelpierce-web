import { describe, expect, it } from 'vitest';
import {
  BACKUP_TABLES,
  backupFileName,
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
