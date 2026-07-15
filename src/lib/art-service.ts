/**
 * Art Service — data access for the painting collection
 *
 * All database queries for paintings, tags, categories, and search.
 * Called by server components and API routes.
 */

import { db } from '@/db';
import { paintings, tags, tagCategories, paintingTags } from '@/db/schema';
import { eq, like, inArray, or, sql, and, desc, asc } from 'drizzle-orm';
import { CATEGORY_TAG_MAP, COLLECTION_CATEGORIES, PAGE_SIZE } from './constants';
import type { Painting, PaintingWithTags, CategoryCardData } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────

function buildCategoryConditions(slug: string) {
  const mapping = CATEGORY_TAG_MAP[slug];
  if (!mapping) return null;
  return mapping;
}

async function getTagIdsByNames(tagNames: string[]): Promise<number[]> {
  if (tagNames.length === 0) return [];
  const rows = await db.select({ id: tags.id }).from(tags).where(inArray(tags.name, tagNames));
  return rows.map((r) => r.id);
}

async function getPaintingIdsByTagIds(tagIds: number[]): Promise<number[]> {
  if (tagIds.length === 0) return [];
  const rows = await db
    .select({ paintingId: paintingTags.paintingId })
    .from(paintingTags)
    .where(inArray(paintingTags.tagId, tagIds));
  return [...new Set(rows.map((r) => r.paintingId))];
}

// ── Public API ───────────────────────────────────────────────────────

export async function getPaintingsByCategory(
  slug: string,
  options: { page?: number; limit?: number } = {},
): Promise<{ paintings: Painting[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? PAGE_SIZE;
  const offset = (page - 1) * limit;

  const mapping = buildCategoryConditions(slug);
  if (!mapping) return { paintings: [], total: 0 };

  let paintingIds: number[] | null = null;

  // Tag-based filtering
  if (mapping.tags && mapping.tags.length > 0) {
    const tagIds = await getTagIdsByNames(mapping.tags);
    paintingIds = await getPaintingIdsByTagIds(tagIds);
    if (paintingIds.length === 0) return { paintings: [], total: 0 };
  }

  // Build WHERE conditions
  const conditions = [];
  if (paintingIds) {
    conditions.push(inArray(paintings.id, paintingIds));
  }
  if (mapping.medium) {
    conditions.push(eq(paintings.medium, mapping.medium));
  }
  if (mapping.formatType) {
    conditions.push(eq(paintings.formatType, mapping.formatType));
  }

  const where =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(paintings)
      .where(where)
      .orderBy(asc(paintings.title))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paintings)
      .where(where),
  ]);

  return { paintings: rows, total: Number(countResult[0].count) };
}

export async function getPaintingBySlug(slug: string): Promise<PaintingWithTags | null> {
  const rows = await db.select().from(paintings).where(eq(paintings.slug, slug)).limit(1);

  if (rows.length === 0) return null;
  const painting = rows[0];

  // Get tags with category names
  const tagRows = await db
    .select({
      tagName: tags.name,
      categoryName: tagCategories.name,
    })
    .from(paintingTags)
    .innerJoin(tags, eq(paintingTags.tagId, tags.id))
    .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
    .where(eq(paintingTags.paintingId, painting.id))
    .orderBy(asc(tagCategories.sortOrder), asc(tags.sortOrder));

  return {
    ...painting,
    tags: tagRows.map((r) => ({
      categoryName: r.categoryName,
      tagName: r.tagName,
    })),
  };
}

export async function searchPaintings(
  query: string,
  filters: { medium?: string; tagIds?: number[] } = {},
  options: { page?: number; limit?: number } = {},
): Promise<{ paintings: Painting[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? PAGE_SIZE;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query) {
    conditions.push(or(like(paintings.title, `%${query}%`), like(paintings.notes, `%${query}%`)));
  }

  if (filters.medium) {
    conditions.push(eq(paintings.medium, filters.medium));
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const paintingIds = await getPaintingIdsByTagIds(filters.tagIds);
    if (paintingIds.length === 0) return { paintings: [], total: 0 };
    conditions.push(inArray(paintings.id, paintingIds));
  }

  const where =
    conditions.length === 1
      ? conditions[0]
      : conditions.length > 1
        ? and(...conditions)
        : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(paintings)
      .where(where)
      .orderBy(asc(paintings.title))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paintings)
      .where(where),
  ]);

  return { paintings: rows, total: Number(countResult[0].count) };
}

export async function getAllPaintings(
  options: { page?: number; limit?: number } = {},
): Promise<{ paintings: Painting[]; total: number }> {
  const page = options.page ?? 1;
  const limit = options.limit ?? PAGE_SIZE;
  const offset = (page - 1) * limit;

  const [rows, countResult] = await Promise.all([
    db.select().from(paintings).orderBy(asc(paintings.title)).limit(limit).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(paintings),
  ]);

  return { paintings: rows, total: Number(countResult[0].count) };
}

/**
 * Every painting slug in the collection, for sitemap enumeration.
 * There is no draft/published split in the schema — every row is a live,
 * public painting page — so this returns all slugs. (The M4 sitemap-vs-db
 * gate compares this count against the live DB; it must not be hardcoded.)
 */
export async function getAllPaintingSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: paintings.slug })
    .from(paintings)
    .orderBy(asc(paintings.slug));
  return rows.map((r) => r.slug);
}

export async function getCategoryCards(): Promise<CategoryCardData[]> {
  const results: CategoryCardData[] = [];

  for (const cat of COLLECTION_CATEGORIES) {
    const { total, paintings: catPaintings } = await getPaintingsByCategory(cat.slug, {
      page: 1,
      limit: 1,
    });

    results.push({
      label: cat.label,
      slug: cat.slug,
      count: total,
      thumbPath: catPaintings[0]?.thumbPath ?? null,
    });
  }

  return results;
}

export async function getRelatedPaintings(
  paintingId: number,
  limit: number = 6,
): Promise<Painting[]> {
  // Get this painting's tag IDs
  const myTags = await db
    .select({ tagId: paintingTags.tagId })
    .from(paintingTags)
    .where(eq(paintingTags.paintingId, paintingId));

  if (myTags.length === 0) return [];

  const tagIds = myTags.map((r) => r.tagId);

  // Find paintings sharing the most tags, excluding the current one
  const related = await db
    .select({
      paintingId: paintingTags.paintingId,
      sharedCount: sql<number>`COUNT(*)`,
    })
    .from(paintingTags)
    .where(
      and(inArray(paintingTags.tagId, tagIds), sql`${paintingTags.paintingId} != ${paintingId}`),
    )
    .groupBy(paintingTags.paintingId)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(limit);

  if (related.length === 0) return [];

  const relatedIds = related.map((r) => r.paintingId);
  return db.select().from(paintings).where(inArray(paintings.id, relatedIds));
}

export async function getFilterOptions() {
  const [mediums, tagRows] = await Promise.all([
    db
      .select({ medium: paintings.medium })
      .from(paintings)
      .where(sql`${paintings.medium} IS NOT NULL AND ${paintings.medium} != ''`)
      .groupBy(paintings.medium)
      .orderBy(asc(paintings.medium)),
    db
      .select({
        tagId: tags.id,
        tagName: tags.name,
        categoryName: tagCategories.name,
        categorySortOrder: tagCategories.sortOrder,
        tagSortOrder: tags.sortOrder,
      })
      .from(tags)
      .innerJoin(tagCategories, eq(tags.categoryId, tagCategories.id))
      .orderBy(asc(tagCategories.sortOrder), asc(tags.sortOrder)),
  ]);

  // Group tags by category
  const tagsByCategory: Record<string, { id: number; name: string }[]> = {};
  for (const row of tagRows) {
    if (!tagsByCategory[row.categoryName]) {
      tagsByCategory[row.categoryName] = [];
    }
    tagsByCategory[row.categoryName].push({
      id: row.tagId,
      name: row.tagName,
    });
  }

  return {
    mediums: mediums.map((r) => r.medium).filter(Boolean) as string[],
    tagsByCategory,
  };
}
