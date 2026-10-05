import { describe, expect, it } from 'vitest';
import { flattenPath, ringArea } from '../../scripts/mosaic/build-coast';

/**
 * build-coast.ts turns the coastline artwork's SVG path into polylines. The
 * artwork uses relative commands and both cubic and quadratic curves, so
 * those are the cases worth pinning.
 */

describe('flattenPath', () => {
  it('reads absolute and relative straight lines', () => {
    expect(flattenPath('M0 0L10 0L10 10L0 10Z')).toEqual([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    ]);
    expect(flattenPath('m5 5l10 0l0 10z')).toEqual([
      [
        [5, 5],
        [15, 5],
        [15, 15],
      ],
    ]);
  });

  it('treats extra coordinate pairs after a moveto as lines, and reads h and v', () => {
    expect(flattenPath('m1 1 2 0 0 2')[0]).toEqual([
      [1, 1],
      [3, 1],
      [3, 3],
    ]);
    expect(flattenPath('M0 0h4v3')[0]).toEqual([
      [0, 0],
      [4, 0],
      [4, 3],
    ]);
  });

  it('starts a new shape at each moveto, relative to where the last one closed', () => {
    const shapes = flattenPath('m0 0l4 0l0 4zm10 10l1 0l0 1z');
    expect(shapes).toHaveLength(2);
    expect(shapes[1][0]).toEqual([10, 10]);
  });

  it('ends a cubic curve exactly on its end point', () => {
    const ring = flattenPath('M0 0C0 10 10 10 10 0')[0];
    expect(ring[ring.length - 1][0]).toBeCloseTo(10);
    expect(ring[ring.length - 1][1]).toBeCloseTo(0);
    // The curve bulges toward its control points.
    expect(Math.max(...ring.map((p) => p[1]))).toBeCloseTo(7.5);
  });

  it('ends a quadratic curve exactly on its end point', () => {
    const ring = flattenPath('m0 0q5 10 10 0')[0];
    expect(ring[ring.length - 1][0]).toBeCloseTo(10);
    expect(ring[ring.length - 1][1]).toBeCloseTo(0);
    expect(Math.max(...ring.map((p) => p[1]))).toBeCloseTo(5);
  });

  it('refuses a command it does not understand', () => {
    expect(() => flattenPath('M0 0A5 5 0 0 1 10 10')).toThrow(/unsupported path command/);
  });
});

describe('ringArea', () => {
  it('measures a square whichever way it is wound', () => {
    const square: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
    ];
    expect(ringArea(square)).toBe(100);
    expect(ringArea([...square].reverse())).toBe(100);
  });
});
