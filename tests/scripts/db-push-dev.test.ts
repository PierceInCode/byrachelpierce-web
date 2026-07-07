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

  it('treats an empty-string process env value as unset', () => {
    expect(resolveEffectiveUrl('', envLocal)).toBe('file:./dev.db');
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
