import { describe, expect, it } from 'vitest';
import { WORLD_HEIGHT } from '@/lib/mosaic/coast';
import { isOnIsland, projectLatLng } from '@/lib/mosaic/geo';
import { PLACES } from '@/lib/mosaic/places';
import { MURAL_LOCATIONS } from '@/lib/mural-data';

/**
 * The mosaic registers real latitude/longitude onto the operator's coastline
 * artwork. These tests pin the properties the home page relies on: north is
 * up, east is right, and the real places land on the drawn island.
 */

describe('projectLatLng', () => {
  it('puts east to the right and north at the top', () => {
    const [westX] = projectLatLng(26.44, -82.15);
    const [eastX] = projectLatLng(26.44, -82.03);
    expect(eastX).toBeGreaterThan(westX);

    const [, southY] = projectLatLng(26.425, -82.08);
    const [, northY] = projectLatLng(26.455, -82.08);
    expect(northY).toBeLessThan(southY);
  });

  it('puts the lighthouse at the island’s east tip', () => {
    const [x, y] = projectLatLng(PLACES.lighthouse.lat, PLACES.lighthouse.lng);
    expect(x).toBeGreaterThan(960);
    expect(x).toBeLessThan(1010);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(WORLD_HEIGHT);
  });

  it('lands the gallery and the community places on the drawn island', () => {
    for (const name of ['gallery', 'sccf', 'dingDarling', 'recCenter'] as const) {
      const [x, y] = projectLatLng(PLACES[name].lat, PLACES[name].lng);
      expect(isOnIsland(x, y), name).toBe(true);
    }
  });

  it('lands every mural on or right beside the drawn island', () => {
    const offshore = MURAL_LOCATIONS.filter((mural) => {
      const [x, y] = projectLatLng(mural.lat, mural.lng);
      // Inside the island's bounding box in every case.
      expect(x, mural.name).toBeGreaterThan(0);
      expect(x, mural.name).toBeLessThan(1000);
      expect(y, mural.name).toBeGreaterThan(0);
      expect(y, mural.name).toBeLessThan(WORLD_HEIGHT);
      return !isOnIsland(x, y);
    });
    // The bounding-box fit is good to about half a percent of the island's
    // width, so a beachfront address may sit just off the drawn shore.
    expect(offshore.length).toBeLessThanOrEqual(1);
  });
});

describe('isOnIsland', () => {
  it('is false out in the Gulf and in the bay', () => {
    expect(isOnIsland(500, WORLD_HEIGHT + 50)).toBe(false);
    expect(isOnIsland(900, 20)).toBe(false);
  });
});
