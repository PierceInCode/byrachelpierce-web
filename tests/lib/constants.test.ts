import { beforeAll, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { setupTestDb } from '../helpers/db';
import { CATEGORY_TAG_MAP } from '@/lib/constants';

/**
 * Frozen, deliberately-reviewed list of every tag name CATEGORY_TAG_MAP is
 * allowed to reference. This is NOT derived from CATEGORY_TAG_MAP itself --
 * it's an independent snapshot of the names confirmed against the real
 * `tags` table (florals' `Lily` / `Other plants` split was verified by the
 * operator against production, see DECISIONS.md 029). Deriving the seed set
 * from CATEGORY_TAG_MAP would make this test circular (any string the map
 * contains would always "exist" because it seeded itself); keeping it
 * independent means adding a brand-new, unverified tag name to
 * CATEGORY_TAG_MAP fails this test loudly instead of silently shipping an
 * unverified/mistyped reference. Growing this list is a deliberate edit that
 * should follow the same verify-against-production discipline that caught
 * the original `'LillyOther plants'` bug.
 */
const KNOWN_GOOD_TAG_NAMES = [
  // beach-coastal
  'Beach / shore',
  'Ocean / open water',
  'Sunset / sunrise',
  'Dock / harbor',
  // sea-life
  'Sea turtles',
  'Dolphins',
  'Manatees',
  'Octopus',
  'Seahorses',
  'Jellyfish',
  'Stingrays',
  'Sharks',
  'Tropical / reef fish',
  'Mahi-mahi',
  'Tarpon',
  'Snook',
  'Black Drum',
  'Barracuda',
  'Amber Jack',
  'Flounder',
  'Mackerel',
  'Permit',
  'Pompano',
  'Red Fish',
  'Sea trout',
  'Sheephead',
  'Mullet',
  'Other game fish',
  'Lionfish',
  'Coral / reef',
  'Shells',
  'Starfish',
  'Sea grass',
  // birds-wildlife
  'Flamingos',
  'Roseate spoonbills',
  'Pelicans',
  'Herons',
  'Egrets',
  'Parrots',
  'Shorebirds',
  'Owls',
  'Birds of prey',
  'Other birds',
  'Dogs',
  'Cats',
  'Longhorn cattle',
  'Other mammals',
  // florals (post-fix; the fused 'LillyOther plants' string is deliberately
  // NOT in this list -- if the fix ever regresses, this test must fail)
  'Tropical flowers',
  'Hibiscus',
  'Plumeria',
  'Mangroves',
  'Sea oats / dune grass',
  'Bougainvillea',
  'Bird of Paradise',
  'Lily',
  'Other plants',
  // palm-trees
  'Palm trees',
  // mermaids-whimsy
  'Mermaids',
  'Beach umbrellas / chairs',
  'Lighthouses',
];

describe('CATEGORY_TAG_MAP integrity', () => {
  beforeAll(async () => {
    await setupTestDb();

    const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
    await client.execute({
      sql: 'INSERT INTO tag_categories (id, name, sort_order) VALUES (?, ?, ?)',
      args: [1, 'test-category', 0],
    });

    let id = 1;
    for (const name of KNOWN_GOOD_TAG_NAMES) {
      await client.execute({
        sql: 'INSERT INTO tags (id, category_id, name, sort_order) VALUES (?, ?, ?, ?)',
        args: [id++, 1, name, 0],
      });
    }
    client.close();
  });

  it('every tag name CATEGORY_TAG_MAP references exists in the known-good tags table', async () => {
    const client = createClient({ url: process.env.TURSO_DATABASE_URL! });
    const rows = await client.execute('SELECT name FROM tags');
    client.close();
    const existingNames = new Set(rows.rows.map((r) => r.name as string));

    for (const [slug, mapping] of Object.entries(CATEGORY_TAG_MAP)) {
      for (const tagName of mapping.tags ?? []) {
        expect(
          existingNames.has(tagName),
          `category "${slug}" references tag "${tagName}", which is not in the reviewed known-good list -- verify it against the real tags table before adding it here`,
        ).toBe(true);
      }
    }
  });

  it('florals no longer contains the fused "LillyOther plants" string', () => {
    expect(CATEGORY_TAG_MAP.florals.tags).not.toContain('LillyOther plants');
    expect(CATEGORY_TAG_MAP.florals.tags).toContain('Lily');
    expect(CATEGORY_TAG_MAP.florals.tags).toContain('Other plants');
  });
});
