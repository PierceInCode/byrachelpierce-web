/**
 * ingest-content — bring Rachel's real content into the system (Spec §9.1
 * items 3–4, Architecture §7.3).
 *
 * Reads two operator-filled CSVs from docs/intake/:
 *   - paintings.csv → updates the `paintings` table (availability, location,
 *     series, notes) and parses `physical_size` into numeric width_in/height_in.
 *   - murals.csv    → rewrites the placeholder name/description/year literals in
 *     src/lib/mural-data.ts. Presence of real data un-suppresses the trail UI
 *     (Architecture §4.4) — no render change, the guards already exist.
 *
 * Safety contract:
 *   - `--dry-run` (DEFAULT) prints the full change plan and writes NOTHING to
 *     the DB or to mural-data.ts. `--apply` is required to write.
 *   - A blank CSV cell means "no change" — we never overwrite a value with blank.
 *   - An unparseable size or year is listed in the report and the row is left
 *     untouched — we NEVER guess (Iron Invariant 3).
 *   - Every run writes docs/intake/ingest-report-<date>.md.
 *   - Exit code is non-zero when there are unresolved errors, so the gate
 *     (`--dry-run`, Spec §9.2) is green only on a clean plan.
 *
 * Run: npx tsx scripts/ingest-content.ts [--dry-run|--apply]
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, type Client } from '@libsql/client';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import prettier from 'prettier';
import type { MuralLocation } from '../src/types';
import { MURAL_LOCATIONS } from '../src/lib/mural-data';
import { parseCsv, isBlankRow } from './lib/csv';
import { parseSize } from './lib/parse-size';
import { isMain } from './lib/entrypoint';

const PAINTINGS_CSV = 'docs/intake/paintings.csv';
const MURALS_CSV = 'docs/intake/murals.csv';
const MURAL_DATA_FILE = 'src/lib/mural-data.ts';

// ── Paintings ────────────────────────────────────────────────────────────

/** DB columns the paintings ingest may write, keyed by their CSV header. */
const PAINTING_TEXT_FIELDS = ['availability', 'location', 'series', 'notes'] as const;
type PaintingTextField = (typeof PAINTING_TEXT_FIELDS)[number];

/** DB column name for each writable value (drizzle uses snake_case in SQL). */
const DB_COLUMN: Record<PaintingTextField | 'physical_size', string> = {
  availability: 'availability',
  location: 'location',
  series: 'series',
  notes: 'notes',
  physical_size: 'physical_size',
};

export interface PaintingUpdate {
  slug: string;
  /** column → new value (physical_size parse also fills width_in/height_in) */
  set: Record<string, string | number>;
}

export interface PaintingPlan {
  updates: PaintingUpdate[];
  errors: string[];
  /** rows whose cells were all blank (nothing to do) */
  skipped: number;
}

/**
 * Compute the paintings change plan from CSV rows against the set of known
 * slugs. Pure (no DB, no I/O) so it is directly unit-testable. `rows` includes
 * the header row; `knownSlugs` is every slug currently in the DB.
 */
export function planPaintings(rows: string[][], knownSlugs: ReadonlySet<string>): PaintingPlan {
  const plan: PaintingPlan = { updates: [], errors: [], skipped: 0 };
  if (rows.length === 0) return plan;

  const header = rows[0].map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const idx = {
    slug: col('slug'),
    physical_size: col('physical_size'),
    availability: col('availability'),
    location: col('location'),
    series: col('series'),
    notes: col('notes'),
  };
  if (idx.slug === -1) {
    plan.errors.push(`${PAINTINGS_CSV}: missing required "slug" column`);
    return plan;
  }

  const get = (row: string[], i: number) => (i === -1 ? '' : (row[i] ?? '')).trim();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (isBlankRow(row)) continue;

    const slug = get(row, idx.slug);
    if (slug === '') {
      plan.errors.push(`row ${r + 1}: blank slug`);
      continue;
    }
    if (!knownSlugs.has(slug)) {
      plan.errors.push(`row ${r + 1}: unknown slug "${slug}" (no matching painting)`);
      continue;
    }

    const set: Record<string, string | number> = {};

    const size = get(row, idx.physical_size);
    if (size !== '') {
      const parsed = parseSize(size);
      if (parsed.ok) {
        set[DB_COLUMN.physical_size] = size;
        set.width_in = parsed.widthIn;
        set.height_in = parsed.heightIn;
      } else {
        // Never guess: skip the whole size field, flag it, keep the row's
        // other fields (below) so a bad size doesn't block an availability edit.
        plan.errors.push(`${slug}: could not parse physical_size — ${parsed.reason}`);
      }
    }

    for (const field of PAINTING_TEXT_FIELDS) {
      const value = get(row, idx[field]);
      if (value !== '') set[DB_COLUMN[field]] = value;
    }

    if (Object.keys(set).length === 0) {
      plan.skipped++;
    } else {
      plan.updates.push({ slug, set });
    }
  }

  return plan;
}

/** Apply one painting update via a parameterized UPDATE ... WHERE slug = ?. */
export async function applyPaintingUpdate(client: Client, update: PaintingUpdate): Promise<void> {
  const columns = Object.keys(update.set);
  const assignments = columns.map((c) => `${c} = ?`).join(', ');
  const args = [...columns.map((c) => update.set[c]), update.slug];
  await client.execute({
    sql: `UPDATE paintings SET ${assignments} WHERE slug = ?`,
    args,
  });
}

// ── Murals ───────────────────────────────────────────────────────────────

/** A 4-digit year in a believable range, else an error (never guessed). */
export function parseYear(raw: string): { ok: true; year: number } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (!/^\d{4}$/.test(trimmed)) {
    return { ok: false, reason: `not a 4-digit year: "${trimmed}"` };
  }
  const year = Number(trimmed);
  if (year < 1900 || year > 2100) {
    return { ok: false, reason: `year out of range: "${trimmed}"` };
  }
  return { ok: true, year };
}

export interface MuralPlan {
  /** the full mural list with updates applied (unchanged ones passed through) */
  murals: MuralLocation[];
  /** human-readable descriptions of each applied change, for the report */
  changes: string[];
  errors: string[];
}

/**
 * Compute the murals change plan. Pure. `rows` includes the header;
 * `existing` is the current MURAL_LOCATIONS. Real values overwrite the
 * placeholders; blank cells leave the field as-is.
 */
export function planMurals(rows: string[][], existing: readonly MuralLocation[]): MuralPlan {
  const byId = new Map(existing.map((m) => [m.id, { ...m }]));
  const plan: MuralPlan = { murals: [], changes: [], errors: [] };

  if (rows.length > 0) {
    const header = rows[0].map((h) => h.trim());
    const idx = {
      id: header.indexOf('id'),
      real_name: header.indexOf('real_name'),
      description: header.indexOf('description'),
      year_painted: header.indexOf('year_painted'),
      photo_filename: header.indexOf('photo_filename'),
    };
    const get = (row: string[], i: number) => (i === -1 ? '' : (row[i] ?? '')).trim();

    if (idx.id === -1) {
      plan.errors.push(`${MURALS_CSV}: missing required "id" column`);
    } else {
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (isBlankRow(row)) continue;

        const idText = get(row, idx.id);
        const id = Number(idText);
        const mural = Number.isInteger(id) ? byId.get(id) : undefined;
        if (!mural) {
          plan.errors.push(`row ${r + 1}: unknown mural id "${idText}"`);
          continue;
        }

        const realName = get(row, idx.real_name);
        if (realName !== '' && realName !== mural.name) {
          plan.changes.push(`mural ${id}: name → "${realName}"`);
          mural.name = realName;
        }

        const description = get(row, idx.description);
        if (description !== '') {
          plan.changes.push(`mural ${id}: description set`);
          mural.description = description;
        }

        const yearText = get(row, idx.year_painted);
        if (yearText !== '') {
          const parsed = parseYear(yearText);
          if (parsed.ok) {
            plan.changes.push(`mural ${id}: year → ${parsed.year}`);
            mural.year = parsed.year;
          } else {
            plan.errors.push(`mural ${id}: ${parsed.reason}`);
          }
        }

        // photo_filename has no schema field yet; note it, never silently drop.
        const photo = get(row, idx.photo_filename);
        if (photo !== '') {
          plan.changes.push(
            `mural ${id}: photo "${photo}" noted (manual placement — no data field, DECISIONS 032)`,
          );
        }
      }
    }
  }

  plan.murals = [...byId.values()].sort((a, b) => a.id - b.id);
  return plan;
}

/** Serialize one mural object as TS source (prettier normalizes it after). */
function serializeMural(m: MuralLocation): string {
  const lines = [
    '  {',
    `    id: ${m.id},`,
    `    name: ${JSON.stringify(m.name)},`,
    `    address: ${JSON.stringify(m.address)},`,
    `    lat: ${m.lat},`,
    `    lng: ${m.lng},`,
    `    radius: ${m.radius},`,
  ];
  if (m.description !== undefined) lines.push(`    description: ${JSON.stringify(m.description)},`);
  if (m.year !== undefined) lines.push(`    year: ${m.year},`);
  lines.push('  },');
  return lines.join('\n');
}

/**
 * Replace the MURAL_LOCATIONS array literal in the mural-data.ts source with
 * the updated murals, preserving everything else (the geocoding warning, the
 * import, code after the array). Runs prettier so the result passes
 * format:check. Returns the new file source. Async because prettier v3's
 * format() is Promise-based.
 */
export async function rewriteMuralData(
  source: string,
  murals: readonly MuralLocation[],
): Promise<string> {
  const marker = 'export const MURAL_LOCATIONS: MuralLocation[] = [';
  const start = source.indexOf(marker);
  if (start === -1) throw new Error('MURAL_LOCATIONS array literal not found in mural-data.ts');
  const bodyStart = start + marker.length;
  const end = source.indexOf('\n];', bodyStart);
  if (end === -1) throw new Error('MURAL_LOCATIONS closing "];" not found in mural-data.ts');

  const before = source.slice(0, bodyStart);
  const rest = source.slice(end); // begins with "\n];"
  const body = murals.map(serializeMural).join('\n');
  const rebuilt = `${before}\n${body}${rest}`;

  const options = (await prettier.resolveConfig(MURAL_DATA_FILE)) ?? {};
  return prettier.format(rebuilt, { ...options, parser: 'typescript' });
}

// ── Report ───────────────────────────────────────────────────────────────

export function buildReport(
  paintingPlan: PaintingPlan,
  muralPlan: MuralPlan,
  opts: { apply: boolean; date: string },
): string {
  const mode = opts.apply ? 'APPLY' : 'DRY-RUN';
  const errorCount = paintingPlan.errors.length + muralPlan.errors.length;
  const lines: string[] = [
    `# Ingest report — ${opts.date}`,
    '',
    `Mode: **${mode}**`,
    '',
    '## Paintings',
    `- updates: ${paintingPlan.updates.length}`,
    `- skipped (all cells blank): ${paintingPlan.skipped}`,
    `- errors: ${paintingPlan.errors.length}`,
  ];
  for (const u of paintingPlan.updates) {
    lines.push(`  - ${u.slug}: ${Object.keys(u.set).join(', ')}`);
  }
  for (const e of paintingPlan.errors) lines.push(`  - ⚠ ${e}`);

  lines.push(
    '',
    '## Murals',
    `- changes: ${muralPlan.changes.length}`,
    `- errors: ${muralPlan.errors.length}`,
  );
  for (const c of muralPlan.changes) lines.push(`  - ${c}`);
  for (const e of muralPlan.errors) lines.push(`  - ⚠ ${e}`);

  lines.push('', `## Unresolved errors: ${errorCount}`);
  if (errorCount === 0) lines.push('None — plan is clean.');
  lines.push('');
  return lines.join('\n');
}

// ── Runner ─────────────────────────────────────────────────────────────────

function readCsvFile(path: string): string[][] | null {
  if (!existsSync(path)) return null;
  return parseCsv(readFileSync(path, 'utf-8'));
}

async function main() {
  const apply = process.argv.includes('--apply');
  const date = new Date().toISOString().slice(0, 10);

  // Paintings: only touch the DB if a paintings.csv with data exists.
  const paintingRows = readCsvFile(PAINTINGS_CSV);
  let paintingPlan: PaintingPlan = { updates: [], errors: [], skipped: 0 };
  let client: Client | null = null;
  if (paintingRows && paintingRows.length > 1) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) {
      console.error('TURSO_DATABASE_URL is not set (expected in .env.local).');
      process.exit(1);
    }
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    const existing = await client.execute('SELECT slug FROM paintings');
    const knownSlugs = new Set(existing.rows.map((row) => String(row.slug)));
    paintingPlan = planPaintings(paintingRows, knownSlugs);
  }

  // Murals: pure planning against the checked-in MURAL_LOCATIONS.
  const muralRows = readCsvFile(MURALS_CSV) ?? [];
  const muralPlan = planMurals(muralRows, MURAL_LOCATIONS);

  if (apply) {
    if (client) {
      for (const update of paintingPlan.updates) {
        await applyPaintingUpdate(client, update);
      }
    }
    if (muralPlan.changes.length > 0) {
      const source = readFileSync(MURAL_DATA_FILE, 'utf-8');
      const rewritten = await rewriteMuralData(source, muralPlan.murals);
      writeFileSync(MURAL_DATA_FILE, rewritten, 'utf-8');
    }
  }

  if (client) client.close();

  const report = buildReport(paintingPlan, muralPlan, { apply, date });
  const reportPath = `docs/intake/ingest-report-${date}.md`;
  writeFileSync(reportPath, report, 'utf-8');

  const errorCount = paintingPlan.errors.length + muralPlan.errors.length;
  // Structured one-line log for the mutation run (Spec §3 rule 11).
  console.log(
    JSON.stringify({
      event: 'ingest_content',
      mode: apply ? 'apply' : 'dry-run',
      paintingUpdates: paintingPlan.updates.length,
      muralChanges: muralPlan.changes.length,
      errors: errorCount,
      report: reportPath,
    }),
  );

  if (errorCount > 0) {
    console.error(
      `${errorCount} unresolved error(s) — see ${reportPath}. Nothing was ` +
        `${apply ? 'partially applied beyond clean rows' : 'written'}.`,
    );
    process.exit(1);
  }
}

if (isMain(import.meta.url)) {
  main().catch((err) => {
    console.error('ingest-content failed:', err);
    process.exit(1);
  });
}
