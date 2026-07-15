import { beforeAll, describe, expect, it } from 'vitest';
import type { Metadata } from 'next';
import { createClient } from '@libsql/client';
import { setupTestDb } from '../helpers/db';
import { seedCatalog } from '../helpers/seed-catalog';
import catalogFixture from '../fixtures/catalog.json';
import { COLLECTION_CATEGORIES } from '@/lib/constants';

/**
 * SEO metadata uniqueness (M1 / R5): every public page must present a UNIQUE
 * title AND a unique description. Duplicate titles/descriptions across pages
 * hurt SEO and confuse search-result snippets.
 *
 * Static pages export `metadata`; the two dynamic routes export
 * `generateMetadata`, which we resolve against every real fixture
 * category (9) and every fixture painting slug (20). Titles here are the
 * per-page base strings — the root layout's shared "%s | by Rachel Pierce"
 * template suffix is common to all, so unique base titles ⇒ unique rendered
 * titles.
 */

type Resolved = { page: string; title: string; description: string };

const titleString = (t: Metadata['title']): string => {
  if (typeof t === 'string') return t;
  // Painting/category dynamic metadata always sets a plain string title.
  if (t && typeof t === 'object' && 'default' in t && typeof t.default === 'string') {
    return t.default;
  }
  throw new Error(`unexpected title shape: ${JSON.stringify(t)}`);
};

let resolved: Resolved[];

beforeAll(async () => {
  await setupTestDb();
  const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
  await seedCatalog(client, catalogFixture);
  client.close();

  const staticModules: { page: string; path: string }[] = [
    { page: '/', path: '@/app/page' },
    { page: '/collection', path: '@/app/collection/page' },
    { page: '/murals', path: '@/app/murals/page' },
    { page: '/murals/trail', path: '@/app/murals/trail/page' },
    { page: '/ar', path: '@/app/ar/page' },
    { page: '/contact', path: '@/app/contact/page' },
    { page: '/custom', path: '@/app/custom/page' },
    { page: '/press', path: '@/app/press/page' },
    { page: '/story', path: '@/app/story/page' },
    { page: '/visit', path: '@/app/visit/page' },
  ];

  const out: Resolved[] = [];

  for (const m of staticModules) {
    const mod = (await import(/* @vite-ignore */ m.path)) as { metadata: Metadata };
    out.push({
      page: m.page,
      title: titleString(mod.metadata.title),
      description: String(mod.metadata.description ?? ''),
    });
  }

  // Dynamic: /collection/[category]
  const catMod = (await import('@/app/collection/[category]/page')) as {
    generateMetadata: (args: { params: Promise<{ category: string }> }) => Promise<Metadata>;
  };
  for (const c of COLLECTION_CATEGORIES) {
    const md = await catMod.generateMetadata({ params: Promise.resolve({ category: c.slug }) });
    out.push({
      page: `/collection/${c.slug}`,
      title: titleString(md.title),
      description: String(md.description ?? ''),
    });
  }

  // Dynamic: /collection/painting/[slug]
  const paintMod = (await import('@/app/collection/painting/[slug]/page')) as {
    generateMetadata: (args: { params: Promise<{ slug: string }> }) => Promise<Metadata>;
  };
  for (const p of catalogFixture.paintings) {
    const md = await paintMod.generateMetadata({ params: Promise.resolve({ slug: p.slug }) });
    out.push({
      page: `/collection/painting/${p.slug}`,
      title: titleString(md.title),
      description: String(md.description ?? ''),
    });
  }

  resolved = out;
});

describe('public metadata uniqueness', () => {
  it('every public page has a non-empty title and description', () => {
    for (const r of resolved) {
      expect(r.title.trim().length, `title for ${r.page}`).toBeGreaterThan(0);
      expect(r.description.trim().length, `description for ${r.page}`).toBeGreaterThan(0);
    }
  });

  it('no two public pages share a title', () => {
    const byTitle = new Map<string, string[]>();
    for (const r of resolved) {
      byTitle.set(r.title, [...(byTitle.get(r.title) ?? []), r.page]);
    }
    const dupes = [...byTitle.entries()].filter(([, pages]) => pages.length > 1);
    expect(dupes, `duplicate titles: ${JSON.stringify(dupes)}`).toEqual([]);
  });

  it('no two public pages share a description', () => {
    const byDesc = new Map<string, string[]>();
    for (const r of resolved) {
      byDesc.set(r.description, [...(byDesc.get(r.description) ?? []), r.page]);
    }
    const dupes = [...byDesc.entries()].filter(([, pages]) => pages.length > 1);
    expect(dupes, `duplicate descriptions: ${JSON.stringify(dupes)}`).toEqual([]);
  });
});
