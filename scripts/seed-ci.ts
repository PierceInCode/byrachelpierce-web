/**
 * CI/local database seeding script
 *
 * Builds a fresh file-backed libSQL database from drizzle/ migrations,
 * then loads tests/fixtures/catalog.json (the 20-painting subset) into it.
 * Used by CI (`TURSO_DATABASE_URL=file:./ci.db`) and locally before
 * `npm run build` to prove the SSG path without production credentials.
 *
 * Run: npm run db:seed-ci
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { seedCatalog, type CatalogFixture } from '../tests/helpers/seed-catalog';

const dbPath = (process.env.TURSO_DATABASE_URL ?? 'file:./ci.db').replace(/^file:/, '');

async function main() {
  // Start from a clean file each run — seedCatalog isn't idempotent for
  // paintings (plain INSERT, no dedup), so re-seeding an existing db would
  // duplicate rows.
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    if (existsSync(dbPath + suffix)) rmSync(dbPath + suffix);
  }

  const client = createClient({ url: `file:${dbPath}` });
  const db = drizzle({ client });
  await migrate(db, { migrationsFolder: './drizzle' });

  const catalogFixture: CatalogFixture = JSON.parse(
    readFileSync('./tests/fixtures/catalog.json', 'utf-8'),
  );
  await seedCatalog(client, catalogFixture);

  client.close();
  console.log(`Seeded ${dbPath} from drizzle/ migrations + tests/fixtures/catalog.json`);
}

main().catch((err) => {
  console.error('db:seed-ci failed:', err);
  process.exit(1);
});
