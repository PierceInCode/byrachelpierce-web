import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Points this test file's `@/db` singleton at a fresh, migrated,
 * file-backed libSQL database and returns nothing — call it from a
 * `beforeAll`, before dynamically importing anything that imports
 * `@/db` (the singleton reads TURSO_DATABASE_URL at import time, so
 * import order matters). Each test file gets its own DB file; tests
 * never share one (Spec §4.4).
 *
 * No `@/*` imports here on purpose: this module is also run directly
 * via `tsx` from `scripts/seed-ci.ts`, which doesn't resolve the
 * tsconfig path alias the way vitest and Next do.
 */
export async function setupTestDb(): Promise<void> {
  const dir = mkdtempSync(join(tmpdir(), 'brp-test-'));
  const dbPath = join(dir, 'test.db');
  process.env.TURSO_DATABASE_URL = `file:${dbPath}`;
  delete process.env.TURSO_AUTH_TOKEN;

  const client = createClient({ url: process.env.TURSO_DATABASE_URL });
  const db = drizzle({ client });
  await migrate(db, { migrationsFolder: './drizzle' });
  client.close();
}
