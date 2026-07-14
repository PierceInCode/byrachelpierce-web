/**
 * db-push-dev — the guarded replacement for the raw `drizzle-kit push` script
 * (audit F8, DECISIONS D7, refutation R1).
 *
 * `drizzle-kit push` diffs the schema straight onto whatever database
 * TURSO_DATABASE_URL points at, with no migration file and no review. Pointed
 * at production, that is the loaded gun the takeover audit flagged. This wrapper
 * disarms it: it resolves the EFFECTIVE database URL (process env first, then the
 * ACTIVE — uncommented — value in `.env.local`) and refuses, non-zero, printing
 * the literal token `DB PUSH REFUSED`, unless that URL is a local `file:` DB.
 * On the success path it execs `npx drizzle-kit push` with inherited stdio.
 *
 * The production credentials in `.env.local` live on COMMENTED lines; this
 * wrapper never reads them (dotenv, which parses `.env.local`, ignores
 * `#`-prefixed lines) and never prints any env value.
 *
 * Run: npm run db:push:dev
 */

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parse as parseDotenv } from 'dotenv';
import { isMain } from './lib/entrypoint';

/** The exact literal the `push-guard` probe scans for on the refusal path. */
export const REFUSAL_TOKEN = 'DB PUSH REFUSED';

/**
 * Resolve the effective TURSO_DATABASE_URL the way drizzle-kit would see it.
 *
 * F4 (audit): a DEFINED `process.env` value IS the effective URL — even when it
 * is empty or whitespace-only. drizzle-kit would see that empty value and act on
 * it, so a set-but-empty `TURSO_DATABASE_URL` must fall through to the refusal
 * path (it does not start with `file:`), NOT silently resolve to dev.db. Only an
 * UNDEFINED env var falls back to the ACTIVE (uncommented) assignment in
 * `.env.local`. Commented (`#`-prefixed) lines — where the production creds
 * live — can never match, so this never surfaces them.
 *
 * F-BINK-2 / F-RG-1: drizzle-kit loads `.env.local` via dotenv. A hand-rolled
 * regex cannot fully model dotenv's grammar — it strips an `export` prefix,
 * strips inline `#` comments after a (quoted) value, tolerates spaces around
 * `=` and trailing whitespace, and is LAST-match-wins on a duplicate key. Any
 * divergence is a guard bypass: the earlier regex read a safe `file:` value and
 * ALLOWED the push while drizzle-kit's dotenv resolved a remote `libsql:` URL
 * (a bad merge or half-reverted edit). So the guard parses `.env.local` with
 * dotenv ITSELF — the exact parser drizzle-kit uses — making the guard's view
 * byte-identical to the URL drizzle-kit will actually target. Commented
 * (`#`-prefixed) lines are ignored by dotenv, so the production creds that live
 * commented in `.env.local` are never surfaced.
 */
export function resolveEffectiveUrl(
  processUrl: string | undefined,
  envLocalContent: string,
): string | undefined {
  if (processUrl !== undefined) return processUrl;

  // Parse with dotenv itself so the resolved value is identical to what
  // drizzle-kit (which calls `dotenv.config({ path: '.env.local' })`) will use.
  const parsed = parseDotenv(envLocalContent);
  const value = parsed.TURSO_DATABASE_URL;
  return value !== undefined && value.length > 0 ? value : undefined;
}

/** True only for a local `file:` database — the one target push is allowed at. */
export function isLocalFileUrl(url: string | undefined): boolean {
  return typeof url === 'string' && url.startsWith('file:');
}

function readEnvLocal(): string {
  const path = new URL('../.env.local', import.meta.url);
  try {
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
  } catch {
    return '';
  }
}

function main(): void {
  const url = resolveEffectiveUrl(process.env.TURSO_DATABASE_URL, readEnvLocal());

  if (!isLocalFileUrl(url)) {
    // No env value is printed — only the fact that the target is non-local.
    console.error(
      `${REFUSAL_TOKEN}: db:push:dev only runs against a local file: database. ` +
        `The effective TURSO_DATABASE_URL is not a file: URL, so no schema push was performed. ` +
        `Use a reviewed additive migration for any non-local database.`,
    );
    process.exit(1);
  }

  const child = spawn('npx', ['drizzle-kit', 'push'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('exit', (code) => process.exit(code ?? 1));
  child.on('error', (err) => {
    console.error('db:push:dev failed to launch drizzle-kit:', err.message);
    process.exit(1);
  });
}

// Only run when invoked directly (not when a test imports the pure helpers).
if (isMain(import.meta.url)) {
  main();
}
