import { describe, expect, it } from 'vitest';
import { MURAL_LOCATIONS } from '@/lib/mural-data';

/**
 * Content-honesty guard (Architecture §4.4, DECISIONS 007 / 022).
 *
 * Until R4 supplies Rachel's real mural titles/descriptions/years, the public
 * site must not present any invented facts (Iron Invariant 3). These assertions
 * fail if fabricated content is re-introduced. When R4 lands real content,
 * these flip (like the R0 sentinel `it.fails` did) to assert the real values.
 */
describe('mural-data honesty', () => {
  it('every mural has real coordinates and an address (verified data)', () => {
    expect(MURAL_LOCATIONS.length).toBeGreaterThanOrEqual(14);
    for (const m of MURAL_LOCATIONS) {
      expect(m.address).toMatch(/Sanibel, FL/);
      expect(Number.isFinite(m.lat)).toBe(true);
      expect(Number.isFinite(m.lng)).toBe(true);
    }
  });

  it('the displayed name is the REAL location name (the prefix of its address)', () => {
    for (const m of MURAL_LOCATIONS) {
      expect(m.name.length).toBeGreaterThan(0);
      // A fabricated mural title (e.g. "Sea Turtle Sanctuary") would not be the
      // start of the verified address; the real business name always is.
      expect(m.address.startsWith(m.name)).toBe(true);
    }
  });

  it('carries no fabricated descriptions or years (removed until real content, R4)', () => {
    for (const m of MURAL_LOCATIONS) {
      expect(m.description).toBeUndefined();
      expect(m.year).toBeUndefined();
    }
  });
});
