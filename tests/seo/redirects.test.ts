import { describe, expect, it } from 'vitest';
import { redirectRules } from '../../next.config';
import nextConfig from '../../next.config';
import { SHOP_URL } from '@/lib/constants';

/**
 * Wix → new-site redirect map (M1 item 3). The operator-approved map
 * (ESCALATIONS E6, 2026-07-19) is encoded here as the single source of
 * truth for the test. Every rule is a permanent (308) redirect. Identity
 * paths that the new site serves under the same URL MUST have no rule.
 *
 * The four external store rules point at the Lightspeed store; we assert
 * their destination equals SHOP_URL so drift between next.config's
 * hardcoded literal and src/lib/constants is caught without importing
 * constants into next.config.ts.
 */

const EXPECTED_INTERNAL: Array<[string, string]> = [
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
  ['/blog/:path*', '/press'],
  ['/post/:slug*', '/press'],
];

const EXPECTED_EXTERNAL_SOURCES = ['/shop', '/online-store', '/items', '/jewelry'];

// New-site served paths that must NOT be redirect sources (no self-shadow).
const IDENTITY_PATHS = ['/murals', '/contact', '/press', '/collection'];

describe('Wix → new-site redirect map (M1 item 3)', () => {
  it('has 34 internal + 4 external enumerated expectations (map fixture sanity)', () => {
    expect(new Set(EXPECTED_INTERNAL.map(([s]) => s)).size).toBe(34);
    expect(new Set(EXPECTED_EXTERNAL_SOURCES).size).toBe(4);
  });

  it('exposes an exact rule count: 34 internal + 4 external = 38', () => {
    // NOTE: the dispatch summary said "33 internal + 4 external = 37", but the
    // enumerated approved map (ESCALATIONS E6) actually lists 34 internal
    // sources (/custom-orders … /post/:slug*). All are distinct, none is a
    // served identity path. We implement every enumerated rule (dropping one
    // to hit 37 would 404 a live Wix path) and flag the arithmetic discrepancy
    // for DECISIONS. See EXPECTED_INTERNAL above (34 entries).
    expect(redirectRules).toHaveLength(38);
    expect(EXPECTED_INTERNAL).toHaveLength(34);
    expect(EXPECTED_EXTERNAL_SOURCES).toHaveLength(4);
  });

  it('marks every rule permanent (HTTP 308)', () => {
    for (const rule of redirectRules) {
      expect(rule.permanent).toBe(true);
    }
  });

  it('maps every approved internal source → destination exactly', () => {
    for (const [source, destination] of EXPECTED_INTERNAL) {
      const rule = redirectRules.find((r) => r.source === source);
      expect(rule, `missing rule for source ${source}`).toBeDefined();
      expect(rule?.destination).toBe(destination);
    }
  });

  it('points every external store source at SHOP_URL (drift guard)', () => {
    for (const source of EXPECTED_EXTERNAL_SOURCES) {
      const rule = redirectRules.find((r) => r.source === source);
      expect(rule, `missing rule for source ${source}`).toBeDefined();
      expect(rule?.destination).toBe(SHOP_URL);
    }
  });

  it('has no rule for identity paths the new site serves', () => {
    for (const path of IDENTITY_PATHS) {
      expect(
        redirectRules.some((r) => r.source === path),
        `identity path ${path} must not be a redirect source`,
      ).toBe(false);
    }
  });

  it('contains no source not present in the approved map', () => {
    const approvedSources = new Set([
      ...EXPECTED_INTERNAL.map(([s]) => s),
      ...EXPECTED_EXTERNAL_SOURCES,
    ]);
    for (const rule of redirectRules) {
      expect(approvedSources.has(rule.source), `unexpected source ${rule.source}`).toBe(true);
    }
  });

  it('returns the same rules from the async redirects() config hook', async () => {
    expect(nextConfig.redirects).toBeTypeOf('function');
    const rules = await nextConfig.redirects!();
    expect(rules).toEqual(redirectRules);
  });
});
