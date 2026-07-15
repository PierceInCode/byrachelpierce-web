/**
 * sitemap.ts — App Router sitemap convention (emits /sitemap.xml).
 *
 * Enumerates every public page plus every published painting detail page.
 * Painting URLs are shaped `/collection/painting/<slug>`, with slugs read
 * live from the DB (never hardcoded — the M4 sitemap-vs-db gate compares
 * this count against the live database).
 *
 * The trail status/check-in API routes are intentionally absent (they are
 * disallowed in robots.ts); this file lists crawlable public content only.
 */

import type { MetadataRoute } from 'next';
import { COLLECTION_CATEGORIES } from '@/lib/constants';
import { getAllPaintingSlugs } from '@/lib/art-service';

const BASE = 'https://byrachelpierce.com';

// Public, statically-routed pages (no dynamic segment).
const STATIC_PATHS = [
  '/',
  '/collection',
  '/murals',
  '/murals/trail',
  '/ar',
  '/contact',
  '/custom',
  '/press',
  '/story',
  '/visit',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllPaintingSlugs();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: path === '/' ? BASE : `${BASE}${path}`,
  }));

  const categoryEntries: MetadataRoute.Sitemap = COLLECTION_CATEGORIES.map((c) => ({
    url: `${BASE}/collection/${c.slug}`,
  }));

  const paintingEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/collection/painting/${slug}`,
  }));

  return [...staticEntries, ...categoryEntries, ...paintingEntries];
}
