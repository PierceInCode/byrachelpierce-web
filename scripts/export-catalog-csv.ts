/**
 * export-catalog-csv — pre-fill the painting intake sheet (Spec §9.1 item 1,
 * Architecture §7.2).
 *
 * Reads every painting from the database and writes docs/intake/paintings.csv
 * with the current slug + editable values already filled in, so the operator
 * edits an existing sheet instead of retyping 528 rows.
 *
 * DB source: whatever TURSO_DATABASE_URL points at (loaded from .env.local,
 * same as drizzle-kit). Locally that is file:./dev.db; the AUTHORITATIVE export
 * for real content is operator-run against production Turso (a read-only query,
 * permitted by Spec §2.1's "R4 ingest" carve-out). DECISIONS 031.
 *
 * This OVERWRITES docs/intake/paintings.csv, so it refuses to run if that file
 * already exists (it may hold the operator's hand edits) unless --force is
 * given. Protecting entered content beats convenience (Spec §0 Default Rules).
 *
 * Run: npx tsx scripts/export-catalog-csv.ts [--force]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { asc } from 'drizzle-orm';
import { existsSync, writeFileSync } from 'node:fs';
import { paintings } from '../src/db/schema';
import { formatCsv } from './lib/csv';
import { isMain } from './lib/entrypoint';

/** Columns of paintings.csv, in exact order (Architecture §7.2). */
export const PAINTINGS_CSV_HEADER = [
  'slug',
  'physical_size',
  'availability',
  'location',
  'series',
  'notes',
] as const;

const OUTPUT_PATH = 'docs/intake/paintings.csv';

/** A DB null/undefined becomes an empty cell ("no change" on re-ingest). */
function cell(value: string | null | undefined): string {
  return value ?? '';
}

/**
 * Build the CSV text (header + one row per painting) from painting rows.
 * Split out from I/O so it is directly unit-testable.
 */
export function buildCatalogCsv(
  rows: readonly {
    slug: string;
    physicalSize: string | null;
    availability: string | null;
    location: string | null;
    series: string | null;
    notes: string | null;
  }[],
): string {
  const table: string[][] = [[...PAINTINGS_CSV_HEADER]];
  for (const r of rows) {
    table.push([
      r.slug,
      cell(r.physicalSize),
      cell(r.availability),
      cell(r.location),
      cell(r.series),
      cell(r.notes),
    ]);
  }
  return formatCsv(table);
}

async function main() {
  const force = process.argv.includes('--force');
  if (existsSync(OUTPUT_PATH) && !force) {
    console.error(
      `${OUTPUT_PATH} already exists — it may hold hand edits. ` +
        `Re-run with --force to overwrite it from the database.`,
    );
    process.exit(1);
  }

  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.error('TURSO_DATABASE_URL is not set (expected in .env.local).');
    process.exit(1);
  }

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const db = drizzle({ client });

  const rows = await db
    .select({
      slug: paintings.slug,
      physicalSize: paintings.physicalSize,
      availability: paintings.availability,
      location: paintings.location,
      series: paintings.series,
      notes: paintings.notes,
    })
    .from(paintings)
    .orderBy(asc(paintings.slug));

  client.close();

  writeFileSync(OUTPUT_PATH, buildCatalogCsv(rows), 'utf-8');
  // Structured one-line log for the mutation-adjacent run (Spec §3 rule 11).
  console.log(JSON.stringify({ event: 'export_catalog_csv', rows: rows.length, out: OUTPUT_PATH }));
}

// Only run when invoked directly (not when a test imports buildCatalogCsv).
if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error('export-catalog-csv failed:', err);
    process.exit(1);
  });
}
