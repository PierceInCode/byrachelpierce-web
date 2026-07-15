import { test, expect } from '@playwright/test';

/**
 * SEO surfaces (M1 / R5): the App-Router-generated sitemap and robots files,
 * served by the seeded local build (playwright.config webServer seeds the same
 * 20-painting fixture as CI).
 *
 * - /sitemap.xml must return 200 and enumerate EXACTLY the 20 fixture painting
 *   pages, each shaped /collection/painting/<slug>.
 * - /robots.txt must disallow the Mural Selfie Trail status/check-in API routes.
 */

test.describe('sitemap.xml', () => {
  test('returns 200 and contains exactly the 20 fixture painting URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);

    const xml = await res.text();
    const paintingUrls = new Set(
      [...xml.matchAll(/<loc>([^<]*\/collection\/painting\/[^<]+)<\/loc>/g)].map((m) => m[1]),
    );
    expect(paintingUrls.size).toBe(20);

    // Spot-check the known first fixture slug.
    expect([...paintingUrls].some((u) => u.endsWith('/collection/painting/matthews-turtle'))).toBe(
      true,
    );
  });
});

test.describe('robots.txt', () => {
  test('disallows the trail status/check-in API routes', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);

    const txt = await res.text();
    expect(txt).toContain('Disallow: /api/trail/status');
    expect(txt).toContain('Disallow: /api/trail/checkin');
  });
});
