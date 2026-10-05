import { test, expect, type Page } from '@playwright/test';

/**
 * Home page: the island mosaic (DECISIONS: mosaic home page). The page is one
 * full-screen canvas plus a tabbed panel, driven by
 * src/components/mosaic/engine.ts. These tests cover what a visitor can do
 * with it: read the panel, switch tabs, open a painting, and leave for the
 * rest of the site and come back.
 *
 * The artwork images live in gitignored public/art/, so they may be absent
 * here (CI). Nothing below depends on an image loading: tiles fall back to
 * their average colour.
 */

async function openHome(page: Page): Promise<string[]> {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');
  // engine.ts publishes this handle once the map is running.
  await page.waitForFunction(() => '__mosaic' in window);
  return pageErrors;
}

test.describe('home page mosaic', () => {
  test('shows the map, the opening panel and all seven tabs', async ({ page }) => {
    const pageErrors = await openHome(page);

    await expect(page.locator('canvas[data-m="map"]')).toBeVisible();
    await expect(
      page.getByRole('heading', { level: 1, name: 'Hundreds of paintings, one island.' }),
    ).toBeVisible();
    await expect(page.getByRole('tab')).toHaveText([
      'Paintings',
      'Murals',
      'Giving',
      'Watch',
      'Visit',
      'Contact',
      'About',
    ]);
    // The home page stands alone: no site header or footer around it.
    await expect(page.locator('#main-content')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('switching tabs swaps the panel content', async ({ page }) => {
    await openHome(page);

    await page.getByRole('tab', { name: 'Murals' }).click();
    await expect(page.getByRole('tab', { name: 'Murals' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(
      page.getByRole('heading', { name: 'Fourteen walls she has painted.' }),
    ).toBeVisible();
    await expect(page.locator('[data-pane="paintings"]')).toBeHidden();

    await page.getByRole('tab', { name: 'Visit' }).click();
    await expect(page.getByRole('heading', { name: 'Come and say hello.' })).toBeVisible();
    await expect(page.locator('[data-pane="murals"]')).toBeHidden();
  });

  test('the contact form says plainly that it sends nothing, and sends nothing', async ({
    page,
  }) => {
    await openHome(page);
    await page.getByRole('tab', { name: 'Contact' }).click();

    const requests: string[] = [];
    page.on('request', (request) => {
      if (request.method() !== 'GET') requests.push(`${request.method()} ${request.url()}`);
    });
    const form = page.locator('form[data-m="contact"]');
    await form.getByLabel('Name').fill('Test Visitor');
    await form.getByLabel('Email').fill('visitor@example.invalid');
    await form.getByLabel('Message').fill('Hello');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(form.getByText(/not connected yet and nothing was sent/)).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('tapping a tile opens that painting with a link to its page', async ({ page }) => {
    await openHome(page);
    const dialog = page.locator('[data-m="look"]');
    await expect(dialog).not.toHaveAttribute('data-open', '');

    // Wait for the opening animation to hand control to the visitor, then
    // click the screen position of a tile the panel does not cover.
    await expect(page.locator('[data-m="sheet"]')).toBeVisible();
    await page.waitForTimeout(6000);
    const [x, y, slug] = await page.evaluate(() => {
      const mosaic = (
        window as unknown as {
          __mosaic: {
            toScreen: (x: number, y: number) => [number, number];
            layout: { cells: [number, number][]; tiles: { slug: string }[] };
          };
        }
      ).__mosaic;
      const sheet = document.querySelector('[data-m="sheet"]')?.getBoundingClientRect();
      for (let i = mosaic.layout.cells.length - 1; i >= 0; i--) {
        const [sx, sy] = mosaic.toScreen(mosaic.layout.cells[i][0], mosaic.layout.cells[i][1]);
        const covered =
          sheet && sx > sheet.left && sx < sheet.right && sy > sheet.top && sy < sheet.bottom;
        const hit = document.elementFromPoint(sx, sy);
        if (!covered && hit instanceof HTMLCanvasElement) {
          return [sx, sy, mosaic.layout.tiles[i].slug] as const;
        }
      }
      throw new Error('no uncovered tile on screen');
    });
    await page.mouse.click(x, y);

    await expect(dialog).toHaveAttribute('data-open', '');
    await expect(dialog.getByRole('link', { name: 'See it in the collection' })).toHaveAttribute(
      'href',
      `/collection/painting/${slug}`,
    );

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).not.toHaveAttribute('data-open', '');
  });

  test('leaving for the collection and coming back restores each page', async ({ page }) => {
    const pageErrors = await openHome(page);

    await page.getByRole('link', { name: 'Browse the whole collection' }).click();
    await expect(page).toHaveURL(/\/collection$/);
    await expect(page.getByRole('heading', { level: 1, name: 'The Collection' })).toBeVisible();
    // The full-screen lock the home page puts on <html> is gone, so this page scrolls.
    await expect(page.locator('html')).not.toHaveClass(/mosaic-page/);

    await page.goBack();
    await expect(page.locator('canvas[data-m="map"]')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/mosaic-page/);
    expect(pageErrors).toEqual([]);
  });
});
