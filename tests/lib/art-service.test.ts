import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { setupTestDb } from '../helpers/db';
import { seedCatalog } from '../helpers/seed-catalog';
import catalogFixture from '../fixtures/catalog.json';

let artService: typeof import('@/lib/art-service');

beforeAll(async () => {
  await setupTestDb();

  const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
  await seedCatalog(client, catalogFixture);
  client.close();

  artService = await import('@/lib/art-service');
});

describe('getPaintingsByCategory', () => {
  it('filters by medium (watercolors)', async () => {
    const { paintings, total } = await artService.getPaintingsByCategory('watercolors');

    expect(total).toBe(6);
    expect(paintings).toHaveLength(6);
    expect(paintings.every((p) => p.medium === 'Watercolor')).toBe(true);
  });

  it('filters by formatType (abstracts)', async () => {
    const { paintings, total } = await artService.getPaintingsByCategory('abstracts');

    expect(total).toBe(2);
    expect(paintings.every((p) => p.formatType === 'Abstract')).toBe(true);
  });

  it('filters by tag membership (sea-life)', async () => {
    const { paintings, total } = await artService.getPaintingsByCategory('sea-life');

    expect(total).toBe(8);
    expect(paintings).toHaveLength(8);
  });

  it('paginates results', async () => {
    const page1 = await artService.getPaintingsByCategory('watercolors', { page: 1, limit: 2 });
    const page2 = await artService.getPaintingsByCategory('watercolors', { page: 2, limit: 2 });

    expect(page1.total).toBe(6);
    expect(page1.paintings).toHaveLength(2);
    expect(page2.paintings).toHaveLength(2);
    expect(page1.paintings[0].slug).not.toBe(page2.paintings[0].slug);
  });

  it('returns an empty result for a category whose tags have no matches', async () => {
    const { paintings, total } = await artService.getPaintingsByCategory('mermaids-whimsy');

    expect(total).toBe(0);
    expect(paintings).toEqual([]);
  });

  it('returns an empty result for an unknown category slug', async () => {
    const { paintings, total } = await artService.getPaintingsByCategory('not-a-real-category');

    expect(total).toBe(0);
    expect(paintings).toEqual([]);
  });
});

describe('searchPaintings', () => {
  it('matches a substring of the title, case-insensitively', async () => {
    const { paintings, total } = await artService.searchPaintings('turtle');

    expect(total).toBe(3);
    expect(paintings.map((p) => p.slug).sort()).toEqual(
      ['courageous-turtle', 'deep-water-sea-turtle', 'matthews-turtle'].sort(),
    );
  });

  it('combines a text query with a medium filter', async () => {
    const { paintings, total } = await artService.searchPaintings(
      'turtle',
      { medium: 'Acrylic on canvas' },
      {},
    );

    expect(total).toBe(1);
    expect(paintings[0].slug).toBe('matthews-turtle');
  });

  it('returns everything when the query is empty and no filters are set', async () => {
    const { total } = await artService.searchPaintings('');

    expect(total).toBe(20);
  });

  it('returns an empty result for a query with no matches', async () => {
    const { paintings, total } = await artService.searchPaintings('zzz-no-such-painting');

    expect(total).toBe(0);
    expect(paintings).toEqual([]);
  });
});

describe('getAllPaintings', () => {
  it('returns the full catalog with pagination', async () => {
    const { paintings, total } = await artService.getAllPaintings({ page: 1, limit: 5 });

    expect(total).toBe(20);
    expect(paintings).toHaveLength(5);
  });
});

describe('getPaintingBySlug', () => {
  it('returns the painting with its tags, grouped by category', async () => {
    const painting = await artService.getPaintingBySlug('matthews-turtle');

    expect(painting).not.toBeNull();
    expect(painting?.title).toBe("Matthew's Turtle");
    expect(painting?.tags.length).toBeGreaterThan(0);
    expect(painting?.tags[0]).toHaveProperty('categoryName');
    expect(painting?.tags[0]).toHaveProperty('tagName');
  });

  it('returns null for a slug that does not exist', async () => {
    const painting = await artService.getPaintingBySlug('no-such-slug');

    expect(painting).toBeNull();
  });
});

describe('getFilterOptions', () => {
  it('returns the distinct mediums and tags grouped by category', async () => {
    const { mediums, tagsByCategory } = await artService.getFilterOptions();

    expect(mediums).toEqual(
      expect.arrayContaining(['Acrylic on canvas', 'Mixed media', 'Oil on canvas', 'Watercolor']),
    );
    expect(Object.keys(tagsByCategory).length).toBeGreaterThan(0);
  });
});

describe('getCategoryCards', () => {
  it('returns one card per collection category with a painting count', async () => {
    const cards = await artService.getCategoryCards();

    const watercolors = cards.find((c) => c.slug === 'watercolors');
    expect(watercolors?.count).toBe(6);
  });
});

describe('getRelatedPaintings', () => {
  it('returns paintings sharing tags, excluding the source painting', async () => {
    const source = await artService.getPaintingBySlug('matthews-turtle');
    expect(source).not.toBeNull();

    const related = await artService.getRelatedPaintings(source!.id);

    expect(related.every((p) => p.id !== source!.id)).toBe(true);
  });

  it('returns an empty array for a painting with no tags', async () => {
    const related = await artService.getRelatedPaintings(-1);

    expect(related).toEqual([]);
  });
});
