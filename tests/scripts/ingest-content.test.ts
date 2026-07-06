import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import prettier from 'prettier';
import type { MuralLocation } from '../../src/types';
import {
  planPaintings,
  planMurals,
  parseYear,
  applyPaintingUpdate,
  rewriteMuralData,
  buildReport,
} from '../../scripts/ingest-content';
import { parseCsv } from '../../scripts/lib/csv';

const PAINTINGS_HEADER = 'slug,physical_size,availability,location,series,notes';
const KNOWN = new Set(['sunset-01', 'gulf-02']);

describe('planPaintings', () => {
  it('skips blank rows and rows with no editable values', () => {
    const rows = parseCsv(`${PAINTINGS_HEADER}\nsunset-01,,,,,\n\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.updates).toHaveLength(0);
    expect(plan.skipped).toBe(1);
    expect(plan.errors).toHaveLength(0);
  });

  it('flags an unknown slug and applies nothing for it', () => {
    const rows = parseCsv(`${PAINTINGS_HEADER}\nnope-99,,Sold,,,\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.updates).toHaveLength(0);
    expect(plan.errors[0]).toContain('unknown slug "nope-99"');
  });

  it('parses physical_size into width_in/height_in and stores the raw text', () => {
    const rows = parseCsv(`${PAINTINGS_HEADER}\nsunset-01,24 x 36,,,,\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.errors).toHaveLength(0);
    expect(plan.updates[0].set).toEqual({
      physical_size: '24 x 36',
      width_in: 24,
      height_in: 36,
    });
  });

  it('handles inch-mark sizes when the cell is properly CSV-quoted', () => {
    // A cell containing " must be quoted and the quotes doubled: 24" x 36"
    // → "24"" x 36""". This is what Excel/Sheets emit; parseCsv decodes it back.
    const rows = parseCsv(`${PAINTINGS_HEADER}\nsunset-01,"24"" x 36""",,,,\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.errors).toHaveLength(0);
    expect(plan.updates[0].set).toEqual({
      physical_size: '24" x 36"',
      width_in: 24,
      height_in: 36,
    });
  });

  it('flags an unparseable size but still applies the row other fields', () => {
    const rows = parseCsv(`${PAINTINGS_HEADER}\nsunset-01,two feet,Sold,,,\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.errors[0]).toContain('could not parse physical_size');
    // availability still applied; no width/height guessed
    expect(plan.updates[0].set).toEqual({ availability: 'Sold' });
  });

  it('treats blank cells as "no change" (only non-blank fields set)', () => {
    const rows = parseCsv(`${PAINTINGS_HEADER}\ngulf-02,,Available,Studio,,\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.updates[0].set).toEqual({ availability: 'Available', location: 'Studio' });
  });

  it('errors on a missing slug column', () => {
    const rows = parseCsv(`physical_size,availability\n24 x 36,Sold\n`);
    const plan = planPaintings(rows, KNOWN);
    expect(plan.errors[0]).toContain('missing required "slug"');
  });
});

describe('parseYear', () => {
  it('accepts a believable 4-digit year', () => {
    expect(parseYear('2023')).toEqual({ ok: true, year: 2023 });
  });

  it.each(['', '23', '20233', 'last year', '1200', '3000'])('rejects %j', (raw) => {
    expect(parseYear(raw).ok).toBe(false);
  });
});

const MURALS: MuralLocation[] = [
  {
    id: 1,
    name: 'Lighthouse Cafe',
    address: 'Lighthouse Cafe, 1 Main St',
    lat: 26.4,
    lng: -82,
    radius: 150,
  },
  {
    id: 2,
    name: 'Tortuga Beach Club',
    address: 'Tortuga, 2 Gulf Dr',
    lat: 26.4,
    lng: -82,
    radius: 150,
  },
];

const MURALS_HEADER = 'id,real_name,description,year_painted,photo_filename';

describe('planMurals', () => {
  it('makes no changes for an all-blank sheet (honest suppression stays)', () => {
    const rows = parseCsv(`${MURALS_HEADER}\n1,,,,\n2,,,,\n`);
    const plan = planMurals(rows, MURALS);
    expect(plan.changes).toHaveLength(0);
    expect(plan.errors).toHaveLength(0);
    expect(plan.murals[0].description).toBeUndefined();
    expect(plan.murals[0].year).toBeUndefined();
  });

  it('un-suppresses name/description/year when real data is present', () => {
    const rows = parseCsv(`${MURALS_HEADER}\n1,Sea Turtle Sunrise,A loggerhead at dawn.,2023,\n`);
    const plan = planMurals(rows, MURALS);
    expect(plan.errors).toHaveLength(0);
    const m1 = plan.murals.find((m) => m.id === 1)!;
    expect(m1.name).toBe('Sea Turtle Sunrise');
    expect(m1.description).toBe('A loggerhead at dawn.');
    expect(m1.year).toBe(2023);
  });

  it('errors on an unknown id and a bad year, leaving the field unset', () => {
    const rows = parseCsv(`${MURALS_HEADER}\n99,Ghost,,,\n2,,,last year,\n`);
    const plan = planMurals(rows, MURALS);
    expect(plan.errors.some((e) => e.includes('unknown mural id "99"'))).toBe(true);
    expect(plan.errors.some((e) => e.includes('not a 4-digit year'))).toBe(true);
    expect(plan.murals.find((m) => m.id === 2)!.year).toBeUndefined();
  });

  it('notes a photo_filename rather than silently dropping it', () => {
    const rows = parseCsv(`${MURALS_HEADER}\n1,,,,turtle.jpg\n`);
    const plan = planMurals(rows, MURALS);
    expect(plan.changes.some((c) => c.includes('turtle.jpg'))).toBe(true);
  });
});

describe('rewriteMuralData', () => {
  const SOURCE = `import type { MuralLocation } from '@/types';

// IMPORTANT: geocoded coordinates — do not fabricate.
export const MURAL_LOCATIONS: MuralLocation[] = [
  {
    id: 1,
    name: 'Lighthouse Cafe',
    address: 'Lighthouse Cafe, 1 Main St',
    lat: 26.4,
    lng: -82,
    radius: 150,
  },
];

export const MURAL_COUNT = MURAL_LOCATIONS.length;
`;

  it('writes real fields, preserves surrounding code, and is prettier-clean', async () => {
    const updated: MuralLocation[] = [
      {
        id: 1,
        name: "Rachel's Sunrise",
        address: 'Lighthouse Cafe, 1 Main St',
        lat: 26.4,
        lng: -82,
        radius: 150,
        description: 'A quiet dawn, with commas, and "quotes".',
        year: 2023,
      },
    ];
    const out = await rewriteMuralData(SOURCE, updated);

    expect(out).toContain('// IMPORTANT: geocoded coordinates');
    expect(out).toContain('export const MURAL_COUNT = MURAL_LOCATIONS.length;');
    expect(out).toContain('year: 2023');
    expect(out).toContain('A quiet dawn, with commas');
    // The apostrophe/quotes survive round-trip escaping.
    expect(out).toContain("Rachel's Sunrise");

    // Gate-critical: the emitted file must already pass prettier --check.
    const isFormatted = await prettier.check(out, {
      ...((await prettier.resolveConfig('src/lib/mural-data.ts')) ?? {}),
      parser: 'typescript',
    });
    expect(isFormatted).toBe(true);
  });

  it('omits description/year for murals without them (stays suppressed)', async () => {
    const out = await rewriteMuralData(SOURCE, [
      {
        id: 1,
        name: 'Lighthouse Cafe',
        address: 'Lighthouse Cafe, 1 Main St',
        lat: 26.4,
        lng: -82,
        radius: 150,
      },
    ]);
    expect(out).not.toContain('description:');
    expect(out).not.toContain('year:');
  });
});

describe('applyPaintingUpdate (DB integration)', () => {
  let client: Client;

  beforeEach(async () => {
    const dir = mkdtempSync(join(tmpdir(), 'brp-ingest-'));
    client = createClient({ url: `file:${join(dir, 'test.db')}` });
    const db = drizzle({ client });
    await migrate(db, { migrationsFolder: './drizzle' });
    await client.execute({
      sql: 'INSERT INTO paintings (title, slug, availability) VALUES (?, ?, ?)',
      args: ['Sunset', 'sunset-01', 'Available'],
    });
  });

  afterEach(() => client.close());

  it('updates only the given columns, leaving others intact', async () => {
    await applyPaintingUpdate(client, {
      slug: 'sunset-01',
      set: { availability: 'Sold', physical_size: '24 x 36', width_in: 24, height_in: 36 },
    });
    const result = await client.execute({
      sql: 'SELECT title, availability, physical_size, width_in, height_in FROM paintings WHERE slug = ?',
      args: ['sunset-01'],
    });
    expect(result.rows[0]).toMatchObject({
      title: 'Sunset', // untouched
      availability: 'Sold',
      physical_size: '24 x 36',
      width_in: 24,
      height_in: 36,
    });
  });
});

describe('buildReport', () => {
  it('reports a clean plan with zero unresolved errors', () => {
    const report = buildReport(
      { updates: [{ slug: 'a', set: { availability: 'Sold' } }], errors: [], skipped: 2 },
      { murals: [], changes: ['mural 1: name → "X"'], errors: [] },
      { apply: false, date: '2026-07-06' },
    );
    expect(report).toContain('Mode: **DRY-RUN**');
    expect(report).toContain('## Unresolved errors: 0');
    expect(report).toContain('None — plan is clean.');
  });

  it('surfaces error counts', () => {
    const report = buildReport(
      { updates: [], errors: ['x: bad size'], skipped: 0 },
      { murals: [], changes: [], errors: ['mural 2: bad year'] },
      { apply: true, date: '2026-07-06' },
    );
    expect(report).toContain('## Unresolved errors: 2');
  });
});
