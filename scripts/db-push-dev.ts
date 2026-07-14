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

/**
 * True if `content` (a dotenv file body) has an ACTIVE — uncommented —
 * `TURSO_DATABASE_URL` assignment, even one whose value is empty. Under
 * `dotenv` with `override=false`, a key PRESENT in the first-loaded file (`.env`)
 * blocks a later file (`.env.local`) from setting it — regardless of value. This
 * lets the layered resolver mirror that precedence exactly.
 */
function definesUrl(content: string): boolean {
  return Object.prototype.hasOwnProperty.call(parseDotenv(content), 'TURSO_DATABASE_URL');
}

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

/**
 * Resolve the effective TURSO_DATABASE_URL exactly the way `drizzle-kit push`
 * does — across BOTH the sibling plain `.env` and `.env.local`.
 *
 * F-RG-3 (re-gate cycle 3): `drizzle-kit push` does not read `.env.local` alone.
 * Its bin auto-loads a plain `.env` FIRST via `dotenv.config()` with the default
 * path and `override=false`; drizzle.config.ts THEN loads `.env.local`, also with
 * `override=false`. Because a later `override=false` load cannot clobber an
 * already-set key, **`.env` wins over `.env.local`**. The earlier guard read only
 * `.env.local`, so a sibling `.env` holding a remote `libsql:` URL made the guard
 * resolve a safe `file:` value and ALLOW the push while drizzle-kit actually
 * targeted the remote DB — a production-write bypass (Iron Rule 1).
 *
 * This models that full layered resolution, in drizzle-kit's order:
 *   1. a defined `process.env` value is the effective URL (drizzle sees it, and
 *      `override=false` means an already-set process var wins over both files);
 *   2. otherwise the ACTIVE value from `.env` (loaded first);
 *   3. otherwise the ACTIVE value from `.env.local` (loaded second, cannot
 *      override `.env`).
 * Both files are parsed with dotenv ITSELF, so commented (`#`-prefixed) lines —
 * where production creds live — are never surfaced, and the guard's view is
 * byte-identical to what drizzle-kit will target in every `.env`/`.env.local`
 * combination. Precedence verified empirically against dotenv 16.6.1 and a
 * hermetic real-drizzle-kit runtime probe (ledger P4 / RG3-6).
 */
export function resolveLayeredUrl(
  processUrl: string | undefined,
  envContent: string,
  envLocalContent: string,
): string | undefined {
  if (processUrl !== undefined) return processUrl;

  // `.env` is loaded first with override=false, so if it DEFINES the key at all
  // (even to an empty value) it wins over `.env.local` — a later override=false
  // load cannot clobber an already-set key. In that case its parsed value is the
  // effective URL (an empty value stays empty — the F4 empty-is-effective
  // semantics — so it reaches the refusal path, never falls through to a file:
  // in `.env.local`). Only if `.env` does not define the key at all does
  // `.env.local` supply it, via the same dotenv parse.
  if (definesUrl(envContent)) return parseDotenv(envContent).TURSO_DATABASE_URL;
  return resolveEffectiveUrl(undefined, envLocalContent);
}

/** True only for a local `file:` database — the one target push is allowed at. */
export function isLocalFileUrl(url: string | undefined): boolean {
  return typeof url === 'string' && url.startsWith('file:');
}

function readSibling(name: string): string {
  const path = new URL(`../${name}`, import.meta.url);
  try {
    return existsSync(path) ? readFileSync(path, 'utf8') : '';
  } catch {
    return '';
  }
}

function main(): void {
  // Model drizzle-kit's FULL env resolution: process.env, then a sibling `.env`
  // (loaded first, wins), then `.env.local`. See resolveLayeredUrl / F-RG-3.
  const url = resolveLayeredUrl(
    process.env.TURSO_DATABASE_URL,
    readSibling('.env'),
    readSibling('.env.local'),
  );

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
