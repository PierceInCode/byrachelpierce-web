/**
 * Build the island geometry for the home-page mosaic from the operator's own
 * coastline artwork (scripts/mosaic/source/SanibelCapSil.svg).
 *
 * The artwork draws Sanibel and Captiva as ONE outline (plus interior ponds as
 * further subpaths). This script flattens the outline's curves, splits it at
 * the artwork's own Blind Pass mark (<path id="pass-blind-pass">) so Sanibel
 * stands alone, and re-bases Sanibel into the mosaic's "world" space: x runs
 * 0..1000 across the island, y uses the same scale.
 *
 * Output: src/lib/mosaic/coast.ts (generated; do not edit by hand).
 * Nothing here comes from OpenStreetMap; the outline is the operator's
 * copyrighted drawing, so the page needs no map-data credit.
 *
 * Run: npm run mosaic:coast
 */

import { readFileSync, writeFileSync } from 'node:fs';

type Pt = [number, number];

const SOURCE = 'scripts/mosaic/source/SanibelCapSil.svg';
const OUTPUT = 'src/lib/mosaic/coast.ts';
/** Segments per cubic curve when flattening. */
const CURVE_STEPS = 10;
/** Width of Sanibel in world units. */
const WORLD_WIDTH = 1000;

/** Flatten an SVG path `d` (M L H V C S Z, absolute or relative) into one polyline per subpath. */
export function flattenPath(d: string): Pt[][] {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const rings: Pt[][] = [];
  let ring: Pt[] = [];
  let i = 0;
  let cmd = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let prevCtrl: Pt | null = null;
  let prevQuad: Pt | null = null;
  const num = (): number => Number(tokens[i++]);
  const isCommand = (t: string): boolean => /^[a-zA-Z]$/.test(t);

  while (i < tokens.length) {
    if (isCommand(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    // A smooth quadratic (T) only reflects a control point left by a quadratic.
    if (cmd.toUpperCase() !== 'Q' && cmd.toUpperCase() !== 'T') prevQuad = null;
    switch (cmd.toUpperCase()) {
      case 'M': {
        const nx = num() + (rel ? x : 0);
        const ny = num() + (rel ? y : 0);
        if (ring.length) rings.push(ring);
        ring = [[nx, ny]];
        x = startX = nx;
        y = startY = ny;
        // Further coordinate pairs after a moveto are implicit linetos.
        cmd = rel ? 'l' : 'L';
        prevCtrl = null;
        break;
      }
      case 'L': {
        x = num() + (rel ? x : 0);
        y = num() + (rel ? y : 0);
        ring.push([x, y]);
        prevCtrl = null;
        break;
      }
      case 'H': {
        x = num() + (rel ? x : 0);
        ring.push([x, y]);
        prevCtrl = null;
        break;
      }
      case 'V': {
        y = num() + (rel ? y : 0);
        ring.push([x, y]);
        prevCtrl = null;
        break;
      }
      case 'C':
      case 'S': {
        const ox = rel ? x : 0;
        const oy = rel ? y : 0;
        let c1: Pt;
        if (cmd.toUpperCase() === 'C') {
          c1 = [num() + ox, num() + oy];
        } else {
          c1 = prevCtrl ? [2 * x - prevCtrl[0], 2 * y - prevCtrl[1]] : [x, y];
        }
        const c2: Pt = [num() + ox, num() + oy];
        const end: Pt = [num() + ox, num() + oy];
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS;
          const u = 1 - t;
          ring.push([
            u * u * u * x + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * end[0],
            u * u * u * y + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * end[1],
          ]);
        }
        prevCtrl = c2;
        [x, y] = end;
        break;
      }
      case 'Q':
      case 'T': {
        const ox = rel ? x : 0;
        const oy = rel ? y : 0;
        let c: Pt;
        if (cmd.toUpperCase() === 'Q') {
          c = [num() + ox, num() + oy];
        } else {
          c = prevQuad ? [2 * x - prevQuad[0], 2 * y - prevQuad[1]] : [x, y];
        }
        const end: Pt = [num() + ox, num() + oy];
        for (let s = 1; s <= CURVE_STEPS; s++) {
          const t = s / CURVE_STEPS;
          const u = 1 - t;
          ring.push([
            u * u * x + 2 * u * t * c[0] + t * t * end[0],
            u * u * y + 2 * u * t * c[1] + t * t * end[1],
          ]);
        }
        [x, y] = end;
        prevCtrl = null;
        prevQuad = c;
        continue;
      }
      case 'Z': {
        x = startX;
        y = startY;
        prevCtrl = null;
        break;
      }
      default:
        throw new Error(`build-coast: unsupported path command "${cmd}"`);
    }
  }
  if (ring.length) rings.push(ring);
  return rings;
}

export function ringArea(r: Pt[]): number {
  let a = 0;
  for (let k = 0; k < r.length; k++) {
    const [x1, y1] = r[k];
    const [x2, y2] = r[(k + 1) % r.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

/** Douglas-Peucker simplification of an open polyline. */
function simplifyLine(pts: Pt[], tol: number): Pt[] {
  if (pts.length < 3) return pts;
  const a = pts[0];
  const b = pts[pts.length - 1];
  let max = 0;
  let index = 0;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1e-9;
  for (let k = 1; k < pts.length - 1; k++) {
    const dist = Math.abs(dy * pts[k][0] - dx * pts[k][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (dist > max) {
      max = dist;
      index = k;
    }
  }
  if (max <= tol) return [a, b];
  return simplifyLine(pts.slice(0, index + 1), tol)
    .slice(0, -1)
    .concat(simplifyLine(pts.slice(index), tol));
}

/** Simplify a closed ring by simplifying its two halves, so the seam survives. */
function simplifyRing(r: Pt[], tol: number): Pt[] {
  const half = Math.floor(r.length / 2);
  return simplifyLine(r.slice(0, half + 1), tol)
    .slice(0, -1)
    .concat(simplifyLine(r.slice(half), tol));
}

function attr(svg: string, id: string, name: string): string {
  const tag = svg.match(new RegExp(`<[^>]*\\bid="${id}"[^>]*>`));
  const value = tag?.[0].match(new RegExp(`\\b${name}="([^"]+)"`));
  if (!value) throw new Error(`build-coast: ${SOURCE} has no ${name} on #${id}`);
  return value[1];
}

function main(): void {
  const svg = readFileSync(SOURCE, 'utf8');
  const rings = flattenPath(attr(svg, 'island-silhouette', 'd'));
  const outer = rings.reduce((a, b) => (ringArea(b) > ringArea(a) ? b : a));

  // The Blind Pass mark is a short line drawn across the neck between the two islands.
  const pass = flattenPath(attr(svg, 'pass-blind-pass', 'd'))[0];
  const nearest = (p: Pt): number => {
    let best = 0;
    let bestDist = Infinity;
    outer.forEach((q, k) => {
      const dist = Math.hypot(q[0] - p[0], q[1] - p[1]);
      if (dist < bestDist) {
        bestDist = dist;
        best = k;
      }
    });
    return best;
  };
  let cutA = nearest(pass[0]);
  let cutB = nearest(pass[pass.length - 1]);
  if (cutA > cutB) [cutA, cutB] = [cutB, cutA];
  const partOne = outer.slice(cutA, cutB + 1);
  const partTwo = outer.slice(cutB).concat(outer.slice(0, cutA + 1));
  const [sanibel, captiva] =
    ringArea(partOne) > ringArea(partTwo) ? [partOne, partTwo] : [partTwo, partOne];

  const xs = sanibel.map((p) => p[0]);
  const ys = sanibel.map((p) => p[1]);
  const originX = Math.min(...xs);
  const originY = Math.min(...ys);
  const scale = WORLD_WIDTH / (Math.max(...xs) - originX);
  const toWorld = (p: Pt): Pt => [(p[0] - originX) * scale, (p[1] - originY) * scale];
  const island = sanibel.map(toWorld);
  const worldHeight = Math.max(...island.map((p) => p[1]));

  const toD = (r: Pt[]): string =>
    'M' + r.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L') + 'Z';
  const outline = simplifyRing(island, 0.35);
  const captivaOutline = simplifyRing(captiva.map(toWorld), 0.35);
  const polygon = simplifyRing(island, 0.8).map((p) => [
    Number(p[0].toFixed(1)),
    Number(p[1].toFixed(1)),
  ]);

  const out = `/**
 * GENERATED by scripts/mosaic/build-coast.ts from the operator's coastline
 * artwork (scripts/mosaic/source/SanibelCapSil.svg). Do not edit by hand;
 * run \`npm run mosaic:coast\`.
 *
 * World space: Sanibel is ${WORLD_WIDTH} units wide, x east, y south. Captiva, from the
 * same artwork, is cut off at the Blind Pass mark and kept only as a faint
 * neighbouring outline.
 */

/** Where Sanibel's top-left corner sits in the artwork's native 1000 x 700 space. */
export const COAST_NATIVE_ORIGIN = { x: ${originX.toFixed(3)}, y: ${originY.toFixed(3)} } as const;

/** Native artwork units to world units. */
export const COAST_SCALE = ${scale.toFixed(6)};

/** Height of Sanibel in world units (its width is ${WORLD_WIDTH}). */
export const WORLD_HEIGHT = ${worldHeight.toFixed(1)};

/** Sanibel's outline as an SVG path in world units. */
export const ISLAND_PATH =
  '${toD(outline)}';

/** Captiva's outline as an SVG path in world units. */
export const CAPTIVA_PATH =
  '${toD(captivaOutline)}';

/** A lighter version of Sanibel's outline, for point-in-polygon tests. */
export const ISLAND_POLYGON: ReadonlyArray<readonly [number, number]> = ${JSON.stringify(polygon)};
`;
  writeFileSync(OUTPUT, out);
  console.log(
    `coast: ${rings.length} shapes in the artwork; Sanibel ${outline.length} points, ` +
      `Captiva ${captivaOutline.length} points, world ${WORLD_WIDTH} x ${worldHeight.toFixed(0)} -> ${OUTPUT}`,
  );
}

// Run only when executed directly, so the helpers stay importable from tests.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/mosaic/build-coast.ts')) {
  main();
}
