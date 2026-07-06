import { describe, expect, it } from 'vitest';
import { buildCatalogCsv, PAINTINGS_CSV_HEADER } from '../../scripts/export-catalog-csv';
import { parseCsv } from '../../scripts/lib/csv';

describe('buildCatalogCsv', () => {
  it('emits just the header for an empty catalog', () => {
    expect(buildCatalogCsv([])).toBe(`${PAINTINGS_CSV_HEADER.join(',')}\n`);
  });

  it('renders null values as empty cells (which mean "no change" on re-ingest)', () => {
    const csv = buildCatalogCsv([
      {
        slug: 'sunset-01',
        physicalSize: '24 x 36',
        availability: 'Sold',
        location: null,
        series: null,
        notes: null,
      },
    ]);
    const rows = parseCsv(csv);
    expect(rows[0]).toEqual([...PAINTINGS_CSV_HEADER]);
    expect(rows[1]).toEqual(['sunset-01', '24 x 36', 'Sold', '', '', '']);
  });

  it('quotes values that contain commas so the sheet round-trips', () => {
    const csv = buildCatalogCsv([
      {
        slug: 'gulf-01',
        physicalSize: null,
        availability: null,
        location: 'Private collection, Sanibel',
        series: null,
        notes: null,
      },
    ]);
    const rows = parseCsv(csv);
    expect(rows[1]).toEqual(['gulf-01', '', '', 'Private collection, Sanibel', '', '']);
  });

  it('keeps one row per painting in the given order', () => {
    const csv = buildCatalogCsv([
      {
        slug: 'a',
        physicalSize: null,
        availability: null,
        location: null,
        series: null,
        notes: null,
      },
      {
        slug: 'b',
        physicalSize: null,
        availability: null,
        location: null,
        series: null,
        notes: null,
      },
    ]);
    const rows = parseCsv(csv);
    expect(rows.map((r) => r[0])).toEqual(['slug', 'a', 'b']);
  });
});
