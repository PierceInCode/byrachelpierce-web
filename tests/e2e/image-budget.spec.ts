import { test, expect, type Response } from '@playwright/test';

/**
 * Architecture §6 budgets (Spec §7.2 gate). Real image bytes matter here —
 * `npm run db:seed-ci` (run by playwright.config.ts's webServer) loads the
 * 20-painting fixture, whose web_image_path/thumb_path values point at real
 * files under the local public/art/ (verified to exist for all 20 rows).
 *
 * Matched against a fixture painting with a real, deterministic filename
 * (tests/fixtures/catalog.json) rather than something invented here.
 */
const GRID_URL = '/collection/sea-life'; // 8 fixture paintings tagged sea-life
const PAINTING_URL = '/collection/painting/matthews-turtle';
const HERO_FILENAME = 'matthews-turtle-7bb2b9a6.jpg';

function isImageResponse(res: Response): boolean {
  const url = res.url();
  const contentType = res.headers()['content-type'] ?? '';
  return contentType.startsWith('image/') || url.includes('/_next/image') || url.includes('/art/');
}

async function responseByteSize(res: Response): Promise<number> {
  const lengthHeader = res.headers()['content-length'];
  if (lengthHeader) return Number(lengthHeader);
  try {
    return (await res.body()).length;
  } catch {
    // Body unavailable (e.g. served from disk cache) — not counted.
    return 0;
  }
}

test.describe('image budget (Architecture §6)', () => {
  test('collection grid transfers under 1.5MB of images on first viewport at 390px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const imageResponses: Response[] = [];
    page.on('response', (res) => {
      if (isImageResponse(res)) imageResponses.push(res);
    });

    await page.goto(GRID_URL, { waitUntil: 'networkidle' });

    // Guards the next/image migration itself, not just the byte budget —
    // thumbs must be optimizer-served, not raw <img src="/art/..."> (which
    // would also pass the budget on this small fixture and hide a regression).
    expect(imageResponses.some((res) => res.url().includes('/_next/image'))).toBe(true);

    let totalBytes = 0;
    for (const res of imageResponses) {
      totalBytes += await responseByteSize(res);
    }

    expect(totalBytes).toBeLessThan(1.5 * 1024 * 1024);
  });

  test('painting detail hero image transfers under 600KB', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const imageResponses: Response[] = [];
    page.on('response', (res) => {
      if (isImageResponse(res)) imageResponses.push(res);
    });

    await page.goto(PAINTING_URL, { waitUntil: 'networkidle' });

    const heroResponses = imageResponses.filter((res) => res.url().includes(HERO_FILENAME));
    expect(heroResponses.length).toBeGreaterThan(0);

    let heroBytes = 0;
    for (const res of heroResponses) {
      heroBytes += await responseByteSize(res);
    }

    expect(heroBytes).toBeLessThan(600 * 1024);
  });
});
