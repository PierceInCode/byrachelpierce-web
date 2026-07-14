import { describe, expect, it } from 'vitest';
import { REFUSAL_TOKEN, isLocalFileUrl, resolveEffectiveUrl } from '../../scripts/db-push-dev';

describe('resolveEffectiveUrl (db:push:dev guard)', () => {
  const envLocal = [
    'TURSO_DATABASE_URL=file:./dev.db',
    '# Production creds — never uncommented by an agent',
    '# TURSO_DATABASE_URL=libsql://prod.example.turso.io',
    '# TURSO_AUTH_TOKEN=some-token',
  ].join('\n');

  it('prefers a non-empty process env value over .env.local', () => {
    expect(resolveEffectiveUrl('libsql://from-process.invalid', envLocal)).toBe(
      'libsql://from-process.invalid',
    );
  });

  it('falls back to the ACTIVE (uncommented) .env.local value when process env is unset', () => {
    expect(resolveEffectiveUrl(undefined, envLocal)).toBe('file:./dev.db');
  });

  // F4 (audit): a DEFINED env var IS the effective URL, even when empty/whitespace.
  // Falling back to .env.local for a set-but-empty value is fail-open — an empty
  // TURSO_DATABASE_URL must reach the refusal path, not silently resolve to dev.db.
  it('treats a set-but-empty process env value as the effective URL (not unset)', () => {
    expect(resolveEffectiveUrl('', envLocal)).toBe('');
  });

  it('treats a whitespace-only process env value as the effective URL (not unset)', () => {
    expect(resolveEffectiveUrl('   ', envLocal)).toBe('   ');
  });

  it('never reads a commented-out (production) .env.local line', () => {
    const onlyCommented = [
      '# TURSO_DATABASE_URL=libsql://prod.example.turso.io',
      '# TURSO_AUTH_TOKEN=some-token',
    ].join('\n');
    expect(resolveEffectiveUrl(undefined, onlyCommented)).toBeUndefined();
  });

  it('strips surrounding quotes from the active value', () => {
    expect(resolveEffectiveUrl(undefined, 'TURSO_DATABASE_URL="file:./dev.db"')).toBe(
      'file:./dev.db',
    );
  });

  it('returns undefined when neither source supplies a URL', () => {
    expect(resolveEffectiveUrl(undefined, '')).toBeUndefined();
  });

  // F-BINK-2: dotenv (used by drizzle-kit) is LAST-match-wins on a duplicate key.
  // On a .env.local with two active TURSO_DATABASE_URL lines (a local file: line
  // followed by a remote libsql line), the guard must resolve the SAME value
  // drizzle-kit will actually push to — the LAST one, the remote URL — so the
  // guard BLOCKS. First-match resolution reads `file:` and bypasses the guard.
  it('resolves the LAST active TURSO_DATABASE_URL line (mirrors dotenv/drizzle-kit) on a duplicate-key file', () => {
    const duplicate = [
      'TURSO_DATABASE_URL=file:./dev.db',
      'TURSO_DATABASE_URL=libsql://prod.example.turso.io',
    ].join('\n');
    const effective = resolveEffectiveUrl(undefined, duplicate);
    expect(effective).toBe('libsql://prod.example.turso.io');
    // And that effective URL is NOT a local file: DB, so the guard refuses.
    expect(isLocalFileUrl(effective)).toBe(false);
  });

  // F-RG-1 (re-gate cycle 2): the hand-rolled regex diverged from what dotenv
  // (and therefore drizzle-kit) actually resolves. Each shape below is a REAL
  // bypass reproduced against dotenv 16.6.1: the guard must resolve the remote
  // libsql URL (BLOCK), not fall back to the earlier file: line (ALLOW). The
  // guard now parses via dotenv itself so its view is byte-identical to
  // drizzle-kit's.
  it('BLOCKS an export-prefixed remote line (dotenv strips `export`)', () => {
    const content = [
      'TURSO_DATABASE_URL=file:./dev.db',
      'export TURSO_DATABASE_URL=libsql://prod.example.turso.io',
    ].join('\n');
    const effective = resolveEffectiveUrl(undefined, content);
    expect(effective).toBe('libsql://prod.example.turso.io');
    expect(isLocalFileUrl(effective)).toBe(false);
  });

  it('BLOCKS a quoted remote value with an inline comment after it (dotenv strips the comment)', () => {
    const content = [
      'TURSO_DATABASE_URL=file:./dev.db',
      'TURSO_DATABASE_URL="libsql://prod.example.turso.io" # bad merge',
    ].join('\n');
    const effective = resolveEffectiveUrl(undefined, content);
    expect(effective).toBe('libsql://prod.example.turso.io');
    expect(isLocalFileUrl(effective)).toBe(false);
  });

  it('BLOCKS a remote value with spaces around `=`, quotes, and a trailing inline comment', () => {
    const content = [
      'TURSO_DATABASE_URL=file:./dev.db',
      'TURSO_DATABASE_URL = "libsql://prod.example.turso.io"   # oops   ',
    ].join('\n');
    const effective = resolveEffectiveUrl(undefined, content);
    expect(effective).toBe('libsql://prod.example.turso.io');
    expect(isLocalFileUrl(effective)).toBe(false);
  });

  it('ALLOWS a plain duplicate key when the LAST value is file: (dotenv last-wins)', () => {
    const content = [
      'TURSO_DATABASE_URL=libsql://prod.example.turso.io',
      'TURSO_DATABASE_URL=file:./dev.db',
    ].join('\n');
    const effective = resolveEffectiveUrl(undefined, content);
    expect(effective).toBe('file:./dev.db');
    expect(isLocalFileUrl(effective)).toBe(true);
  });
});

describe('isLocalFileUrl', () => {
  it('accepts a file: URL', () => {
    expect(isLocalFileUrl('file:./dev.db')).toBe(true);
  });

  it('rejects a libsql:// URL', () => {
    expect(isLocalFileUrl('libsql://prod.example.turso.io')).toBe(false);
  });

  it('rejects undefined', () => {
    expect(isLocalFileUrl(undefined)).toBe(false);
  });
});

describe('REFUSAL_TOKEN', () => {
  it('is the exact literal the push-guard probe scans for', () => {
    expect(REFUSAL_TOKEN).toBe('DB PUSH REFUSED');
  });
});
