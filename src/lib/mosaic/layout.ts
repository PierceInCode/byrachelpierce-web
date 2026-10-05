/**
 * The generated mosaic layout (which painting sits in which cell), typed.
 *
 * `layout.json` is written by scripts/mosaic/build-mosaic.ts; TypeScript
 * reads its cells as number[][], so this module is the one place that says
 * they are [x, y] pairs. tests/mosaic/layout.test.ts checks that claim.
 */

import raw from './layout.json';
import type { MosaicLayout } from './types';

export const MOSAIC_LAYOUT = raw as unknown as MosaicLayout;
