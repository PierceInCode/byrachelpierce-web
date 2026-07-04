import type { Client } from '@libsql/client';

/**
 * Shape of tests/fixtures/catalog.json — matches the ExtractedData
 * interface scripts/migrate-art-data.ts expects from the real data export.
 */
export interface CatalogFixture {
  paintings: {
    sourceId: number;
    title: string;
    slug: string;
    medium: string | null;
    formatType: string | null;
    location: string | null;
    physicalSize: string | null;
    availability: string | null;
    series: string | null;
    notes: string | null;
    widthPx: number | null;
    heightPx: number | null;
    orientation: string | null;
    webImagePath: string;
    thumbPath: string;
    createdAt: string | null;
    updatedAt: string | null;
  }[];
  tagCategories: { id: number; name: string; sort_order: number }[];
  tags: { id: number; category_id: number; name: string; sort_order: number }[];
  paintingTags: {
    paintingId: number;
    tagId: number;
    source: string | null;
    confidence: number | null;
  }[];
}

/**
 * Loads a CatalogFixture into an already-migrated libSQL client.
 * Shared by tests (per-test-file file DBs) and scripts/seed-ci.ts
 * (ci.db) so both build the same rows from the same fixture the same way.
 */
export async function seedCatalog(client: Client, data: CatalogFixture): Promise<void> {
  for (const tc of data.tagCategories) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO tag_categories (id, name, sort_order) VALUES (?, ?, ?)',
      args: [tc.id, tc.name, tc.sort_order],
    });
  }

  for (const t of data.tags) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO tags (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
      args: [t.id, t.category_id, t.name, t.sort_order],
    });
  }

  const sourceIdToNewId = new Map<number, number>();

  for (const p of data.paintings) {
    const result = await client.execute({
      sql: `INSERT INTO paintings (title, slug, medium, format_type, location, physical_size,
            availability, series, notes, width_px, height_px, orientation,
            web_image_path, thumb_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        p.title,
        p.slug,
        p.medium,
        p.formatType,
        p.location,
        p.physicalSize,
        p.availability,
        p.series,
        p.notes,
        p.widthPx,
        p.heightPx,
        p.orientation,
        p.webImagePath,
        p.thumbPath,
        p.createdAt,
        p.updatedAt,
      ],
    });
    sourceIdToNewId.set(p.sourceId, Number(result.lastInsertRowid));
  }

  for (const pt of data.paintingTags) {
    const newPaintingId = sourceIdToNewId.get(pt.paintingId);
    if (!newPaintingId) continue;
    await client.execute({
      sql: 'INSERT OR IGNORE INTO painting_tags (painting_id, tag_id, source, confidence) VALUES (?, ?, ?, ?)',
      args: [newPaintingId, pt.tagId, pt.source, pt.confidence],
    });
  }
}
