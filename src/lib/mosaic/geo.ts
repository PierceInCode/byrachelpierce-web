/**
 * Geography for the home-page mosaic: latitude/longitude -> the mosaic's
 * world space (Sanibel 1000 units wide, see ./coast).
 *
 * The coastline is the operator's own artwork. Real coordinates are
 * registered onto it with the same bounding-box fit the SanibelTides map uses
 * for the same drawing: the geographic bounding box of the Sanibel/Captiva
 * Gulf shore maps linearly onto the measured land box of the artwork. That
 * fit puts shore points within about half a percent of the island's width of
 * the drawn outline, which is why a pin for a beachfront address can land a
 * few units offshore.
 */

import { COAST_NATIVE_ORIGIN, COAST_SCALE, ISLAND_POLYGON } from './coast';

export type WorldPoint = [x: number, y: number];

/** Geographic bounding box of the drawn shore (west/east/south/north extremes). */
const GEO_BOX = {
  minLon: -82.197058,
  maxLon: -82.013892,
  minLat: 26.421853,
  maxLat: 26.550187,
} as const;

/** Bounding box of the drawn land in the artwork's native 1000 x 700 space. */
const LAND_BOX = { minX: 99.45, maxX: 897.93, minY: 39.51, maxY: 660.33 } as const;

/** Project a latitude/longitude onto the mosaic's world space. */
export function projectLatLng(lat: number, lng: number): WorldPoint {
  const nativeX =
    LAND_BOX.minX +
    ((lng - GEO_BOX.minLon) / (GEO_BOX.maxLon - GEO_BOX.minLon)) * (LAND_BOX.maxX - LAND_BOX.minX);
  const nativeY =
    LAND_BOX.minY +
    ((GEO_BOX.maxLat - lat) / (GEO_BOX.maxLat - GEO_BOX.minLat)) * (LAND_BOX.maxY - LAND_BOX.minY);
  return [
    (nativeX - COAST_NATIVE_ORIGIN.x) * COAST_SCALE,
    (nativeY - COAST_NATIVE_ORIGIN.y) * COAST_SCALE,
  ];
}

/** Whether a world point falls inside Sanibel's drawn outline. */
export function isOnIsland(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ISLAND_POLYGON.length - 1; i < ISLAND_POLYGON.length; j = i++) {
    const [xi, yi] = ISLAND_POLYGON[i];
    const [xj, yj] = ISLAND_POLYGON[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
