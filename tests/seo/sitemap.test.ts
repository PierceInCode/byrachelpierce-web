import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { setupTestDb } from '../helpers/db';
import { seedCatalog } from '../helpers/seed-catalog';
import catalogFixture from '../fixtures/catalog.json';

let sitemap: typeof import('@/app/sitemap').default;

beforeAll(async () => {
  await setupTestDb();

  const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
  await seedCatalog(client, catalogFixture);
  client.close();

  sitemap = (await import('@/app/sitemap')).default;
});

const BASE = 'https://byrachelpierce.com';

describe('sitemap', () => {
  it('enumerates every public static page', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    const expectedStatic = [
      `${BASE}`,
      `${BASE}/collection`,
      `${BASE}/murals`,
      `${BASE}/murals/trail`,
      `${BASE}/ar`,
      `${BASE}/contact`,
      `${BASE}/custom`,
      `${BASE}/press`,
      `${BASE}/story`,
      `${BASE}/visit`,
    ];
    for (const u of expectedStatic) {
      expect(urls).toContain(u);
    }
  });

  it('includes every collection category page', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    // 9 marketing categories (constants COLLECTION_CATEGORIES)
    const categoryUrls = urls.filter(
      (u) => u.startsWith(`${BASE}/collection/`) && !u.includes('/painting/'),
    );
    expect(categoryUrls.length).toBe(9);
  });

  it('enumerates exactly the 20 fixture painting pages, shaped /collection/painting/<slug>', async () => {
    const entries = await sitemap();
    const paintingUrls = entries
      .map((e) => e.url)
      .filter((u) => u.startsWith(`${BASE}/collection/painting/`));

    expect(paintingUrls.length).toBe(20);
    // shape check + the known first fixture slug
    expect(paintingUrls).toContain(`${BASE}/collection/painting/matthews-turtle`);
    for (const u of paintingUrls) {
      expect(u).toMatch(
        new RegExp(`^${BASE.replace(/[.]/g, '\\.')}/collection/painting/[a-z0-9._-]+$`),
      );
    }
  });

  it('produces no duplicate URLs', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('every entry carries a well-formed url', async () => {
    const entries = await sitemap();
    for (const e of entries) {
      expect(e.url.startsWith(`${BASE}/`) || e.url === BASE).toBe(true);
    }
  });
});
