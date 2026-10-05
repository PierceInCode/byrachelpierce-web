/**
 * Build the home-page mosaic: lay every painting in the catalogue out as one
 * square tile inside Sanibel's outline, and stitch a small atlas image of all
 * the tiles.
 *
 * Placement: where a painting's title names its subject, it goes where that
 * subject lives (lighthouse paintings at the point, mangroves by SCCF, birds
 * by the refuge, turtles and shells along the Gulf shore). Everything else is
 * ordered by colour from west to east.
 *
 * Inputs:  scripts/art-data.json (the catalogue), public/art/thumbs/ (local
 *          thumbnails, gitignored), src/lib/mosaic/coast.ts (the outline).
 * Outputs: src/lib/mosaic/layout.json (committed data) and
 *          public/art/mosaic/atlas.jpg (an image, so gitignored like the rest
 *          of public/art; it is synced to Blob with the other art).
 *
 * It reads the catalogue file, not the database, so it never touches Turso.
 * Re-run it after the catalogue changes: npm run mosaic:build
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { WORLD_HEIGHT } from '../../src/lib/mosaic/coast';
import { isOnIsland, projectLatLng, type WorldPoint } from '../../src/lib/mosaic/geo';
import { PLACES } from '../../src/lib/mosaic/places';
import { spaceTitle } from '../../src/lib/mosaic/titles';
import type { MosaicLayout } from '../../src/lib/mosaic/types';

const CATALOGUE = 'scripts/art-data.json';
const THUMBS = 'public/art/thumbs';
const LAYOUT_OUT = 'src/lib/mosaic/layout.json';
const ATLAS_OUT = 'public/art/mosaic/atlas.jpg';
const ATLAS_TILE = 64;

interface CataloguePainting {
  title: string;
  slug: string;
  thumbPath: string;
}

interface Item {
  title: string;
  slug: string;
  file: string;
  hue: number;
  light: number;
  color: string;
}

/** Cell centres, on a square grid of side `size`, that fall inside the island. */
function cellsFor(size: number): WorldPoint[] {
  const cells: WorldPoint[] = [];
  for (let y = size / 2; y < WORLD_HEIGHT + size; y += size) {
    for (let x = size / 2; x < 1010; x += size) {
      // Test the rounded centre, since that is what gets written to layout.json.
      const cell: WorldPoint = [Number(x.toFixed(1)), Number(y.toFixed(1))];
      if (isOnIsland(cell[0], cell[1])) cells.push(cell);
    }
  }
  return cells;
}

/** The cell size that yields exactly `count` cells, trimming stragglers from the most exposed spots. */
function fitCells(count: number): { size: number; cells: WorldPoint[] } {
  let lo = 8;
  let hi = 30;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (cellsFor(mid).length >= count) lo = mid;
    else hi = mid;
  }
  const size = lo;
  const cells = cellsFor(size);
  const key = (c: WorldPoint): string => `${Math.round(c[0] / size)},${Math.round(c[1] / size)}`;
  while (cells.length > count) {
    const taken = new Set(cells.map(key));
    let worst = 0;
    let fewest = 9;
    cells.forEach((c, i) => {
      let neighbours = 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        if (taken.has(key([c[0] + dx * size, c[1] + dy * size]))) neighbours++;
      }
      if (neighbours < fewest) {
        fewest = neighbours;
        worst = i;
      }
    });
    cells.splice(worst, 1);
  }
  return { size, cells };
}

async function main(): Promise<void> {
  // sharp ships with Next.js; it is not a direct dependency of this repo.
  const sharp = (await import('sharp')).default;
  const catalogue = JSON.parse(readFileSync(CATALOGUE, 'utf8')) as {
    paintings: CataloguePainting[];
  };
  const paintings = catalogue.paintings;
  const { size, cells } = fitCells(paintings.length);

  const items: Item[] = [];
  for (const p of paintings) {
    const file = path.basename(p.thumbPath);
    const { data } = await sharp(path.join(THUMBS, file))
      .resize(1, 1)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const [r, g, b] = data;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let hue = 0;
    if (max !== min) {
      const span = max - min;
      hue = max === r ? ((g - b) / span) % 6 : max === g ? (b - r) / span + 2 : (r - g) / span + 4;
      hue = (hue * 60 + 360) % 360;
    }
    items.push({
      title: spaceTitle(p.title),
      slug: p.slug,
      file,
      hue,
      light: (max + min) / 510,
      color: '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''),
    });
  }

  // Subject placement: each group claims the free cells that score lowest.
  const southmost: Record<number, number> = {};
  for (const c of cells) {
    const column = Math.round(c[0] / size);
    southmost[column] = Math.max(southmost[column] ?? 0, c[1]);
  }
  const distanceTo =
    (place: { lat: number; lng: number }) =>
    (c: WorldPoint): number => {
      const [px, py] = projectLatLng(place.lat, place.lng);
      return Math.hypot(c[0] - px, c[1] - py);
    };
  const groups: [RegExp, (c: WorldPoint) => number][] = [
    [/light\s?house/i, distanceTo(PLACES.lighthouse)],
    [/sccf|mangrove/i, distanceTo(PLACES.sccf)],
    [
      /spoonbill|roseate|heron|egret|ibis|pelican|bird|flamingo|owl|eagle|osprey|sandpiper|plover/i,
      distanceTo(PLACES.refuge),
    ],
    [
      /turtle|hatchling|shell|whelk|conch|sand ?dollar|starfish|crab/i,
      (c) => southmost[Math.round(c[0] / size)] - c[1] + Math.abs(c[0] - 560) * 0.02,
    ],
  ];
  const free = new Set(cells.map((_, i) => i));
  const cellOf = new Array<number>(items.length).fill(-1);
  const placed: number[] = [];
  for (const [pattern, score] of groups) {
    const mine = items
      .map((_, i) => i)
      .filter((i) => cellOf[i] < 0 && pattern.test(`${items[i].title} ${items[i].slug}`));
    const claimed = [...free]
      .sort((a, b) => score(cells[a]) - score(cells[b]))
      .slice(0, mine.length);
    mine.sort((a, b) => items[a].hue - items[b].hue);
    claimed.forEach((cell, k) => {
      cellOf[mine[k]] = cell;
      free.delete(cell);
    });
    placed.push(mine.length);
  }
  const rest = items
    .map((_, i) => i)
    .filter((i) => cellOf[i] < 0)
    .sort((a, b) => items[a].hue - items[b].hue || items[a].light - items[b].light);
  const westToEast = [...free].sort(
    (a, b) => cells[a][0] + cells[a][1] * 0.35 - (cells[b][0] + cells[b][1] * 0.35),
  );
  rest.forEach((i, k) => {
    cellOf[i] = westToEast[k];
  });

  const byCell = new Array<Item>(items.length);
  items.forEach((item, i) => {
    byCell[cellOf[i]] = item;
  });

  const columns = Math.ceil(Math.sqrt(items.length));
  const composites = await Promise.all(
    byCell.map(async (item, i) => ({
      input: await sharp(path.join(THUMBS, item.file))
        .resize(ATLAS_TILE, ATLAS_TILE, { fit: 'cover' })
        .toBuffer(),
      left: (i % columns) * ATLAS_TILE,
      top: Math.floor(i / columns) * ATLAS_TILE,
    })),
  );
  mkdirSync(path.dirname(ATLAS_OUT), { recursive: true });
  await sharp({
    create: {
      width: columns * ATLAS_TILE,
      height: Math.ceil(items.length / columns) * ATLAS_TILE,
      channels: 3,
      background: '#0b2f3d',
    },
  })
    .composite(composites)
    .jpeg({ quality: 82 })
    .toFile(ATLAS_OUT);

  const layout: MosaicLayout = {
    cellSize: Number(size.toFixed(3)),
    atlasColumns: columns,
    atlasTile: ATLAS_TILE,
    cells,
    tiles: byCell.map(({ title, slug, file, color }) => ({ title, slug, file, color })),
  };
  writeFileSync(LAYOUT_OUT, JSON.stringify(layout) + '\n');
  console.log(
    `mosaic: ${items.length} paintings, cell ${size.toFixed(2)} units; placed by subject ` +
      `${placed.join('/')} (lighthouse/mangrove/birds/shore), ${rest.length} by colour ` +
      `-> ${LAYOUT_OUT}, ${ATLAS_OUT}`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
