import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isOnIsland } from '@/lib/mosaic/geo';
import { MOSAIC_LAYOUT } from '@/lib/mosaic/layout';

/**
 * src/lib/mosaic/layout.json is generated (npm run mosaic:build). These
 * tests are the check that the committed file is whole: one tile per
 * painting in the catalogue, every tile on the island, none overlapping.
 */

const catalogue = JSON.parse(readFileSync('scripts/art-data.json', 'utf8')) as {
  paintings: { slug: string; thumbPath: string }[];
};

describe('mosaic layout', () => {
  const { cells, tiles, cellSize, atlasColumns } = MOSAIC_LAYOUT;

  it('has exactly one tile and one cell per painting in the catalogue', () => {
    expect(tiles).toHaveLength(catalogue.paintings.length);
    expect(cells).toHaveLength(tiles.length);
    expect(new Set(tiles.map((tile) => tile.slug)).size).toBe(tiles.length);
    const slugs = new Set(catalogue.paintings.map((p) => p.slug));
    for (const tile of tiles) expect(slugs.has(tile.slug), tile.slug).toBe(true);
  });

  it('names each tile’s image and average colour', () => {
    const files = new Set(catalogue.paintings.map((p) => p.thumbPath.split('/').pop()));
    for (const tile of tiles) {
      expect(files.has(tile.file), tile.file).toBe(true);
      expect(tile.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(tile.title.trim().length, tile.slug).toBeGreaterThan(0);
    }
  });

  it('puts every cell on the island as [x, y] pairs', () => {
    for (const cell of cells) {
      expect(cell).toHaveLength(2);
      expect(isOnIsland(cell[0], cell[1]), cell.join(',')).toBe(true);
    }
  });

  it('never puts two cells closer than one cell apart', () => {
    const seen = new Set<string>();
    for (const [x, y] of cells) {
      // Cell centres sit at (n + 0.5) cells, so flooring gives each its grid square.
      const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it('describes an atlas wide enough to hold every tile', () => {
    expect(atlasColumns * atlasColumns).toBeGreaterThanOrEqual(tiles.length);
  });
});
