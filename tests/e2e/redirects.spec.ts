import { test, expect } from '@playwright/test';

/**
 * Wix → new-site redirect map (M1 item 3, operator-approved ESCALATIONS E6).
 * next.config.ts redirects() serves every mapped old Wix URL as an HTTP 308
 * (permanent). This spec asserts, per mapped source, that the live build
 * returns 308 with a Location resolving to the mapped destination.
 *
 * We disable Playwright's automatic redirect following (maxRedirects: 0) so
 * we can observe the 308 status and Location header directly rather than the
 * followed 200. Location for internal rules is a path; for the four external
 * store rules it is the absolute Lightspeed store URL.
 */

const LIGHTSPEED = 'https://store33134078.company.site/';

// Internal Wix source → new-site path. Mirrors the enumerated approved map.
const INTERNAL: Array<[string, string]> = [
  ['/custom-orders', '/custom'],
  ['/about-rachel-pierce', '/story'],
  ['/bio', '/story'],
  ['/events', '/visit'],
  ['/retail-locations', '/visit'],
  ['/social-media', '/'],
  ['/category/all-products', '/collection'],
  ['/watercolors', '/collection/watercolors'],
  ['/copy-of-2019', '/collection/abstracts'],
  ['/copy-of-2019-1', '/collection/beach-coastal'],
  ['/copy-of-2019-2', '/collection/birds-wildlife'],
  ['/copy-of-2019-3', '/collection/birds-wildlife'],
  ['/copy-of-2019-4', '/collection/sea-life'],
  ['/copy-of-2019-5', '/collection/florals'],
  ['/copy-of-2019-6', '/collection'],
  ['/copy-of-2019-7', '/collection/sea-life'],
  ['/copy-of-2019-8', '/collection/mermaids-whimsy'],
  ['/copy-of-2019-9', '/collection/sea-life'],
  ['/copy-of-2019-10', '/collection/palm-trees'],
  ['/copy-of-2019-11', '/collection/sea-life'],
  ['/copy-of-2019-12', '/collection/sea-life'],
  ['/copy-of-2019-13', '/collection/sea-life'],
  ['/copy-of-2019-14', '/collection/sea-life'],
  ['/copy-of-2019-15', '/collection/birds-wildlife'],
  ['/copy-of-octopus', '/collection/line-art'],
  ['/2018', '/collection'],
  ['/2019', '/collection'],
  ['/2020', '/collection'],
  ['/privacy-policy', '/'],
  ['/return-policy', '/'],
  ['/shipping-policy', '/'],
  ['/blog', '/press'],
];

// External Wix source → Lightspeed store (absolute URL destination).
const EXTERNAL = ['/shop', '/online-store', '/items', '/jewelry'];

// Representative wildcard samples (/blog/:path* and /post/:slug* → /press).
const WILDCARD_SAMPLES: Array<[string, string]> = [
  ['/post/some-post', '/press'],
  ['/blog/categories/in-the-news', '/press'],
  ['/post/deeply/nested/slug', '/press'],
  ['/blog/2019/some-old-post', '/press'],
];

test.describe('Wix → new-site 308 redirects (M1 item 3)', () => {
  for (const [source, destination] of INTERNAL) {
    test(`308 ${source} → ${destination}`, async ({ request }) => {
      const res = await request.get(source, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      const location = res.headers()['location'];
      expect(new URL(location, 'http://localhost').pathname).toBe(destination);
    });
  }

  for (const source of EXTERNAL) {
    test(`308 ${source} → Lightspeed store`, async ({ request }) => {
      const res = await request.get(source, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(res.headers()['location']).toBe(LIGHTSPEED);
    });
  }

  for (const [source, destination] of WILDCARD_SAMPLES) {
    test(`308 (wildcard) ${source} → ${destination}`, async ({ request }) => {
      const res = await request.get(source, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      const location = res.headers()['location'];
      expect(new URL(location, 'http://localhost').pathname).toBe(destination);
    });
  }
});
