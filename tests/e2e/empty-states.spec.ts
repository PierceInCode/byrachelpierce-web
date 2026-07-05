import { test, expect } from '@playwright/test';

/**
 * Empty states (Architecture §12.6, Spec §4.4). Both scenarios verified
 * against the real seeded fixture (tests/fixtures/catalog.json):
 *
 * - `sea-life?q=zzznotarealquery` — zero title/notes matches anywhere in the
 *   20-row fixture, and `hasSearchFilters` is true (query present), so
 *   `total` is 0 and the "no paintings match those filters" branch renders
 *   (not the out-of-range branch, which requires `total > 0`).
 * - `palm-trees?page=999` — `CATEGORY_TAG_MAP['palm-trees'].tags` is just
 *   `['Palm trees']` (tag id 48), seeded on exactly 3 fixture paintings
 *   ("A Surprise Guest", "A Vision of Paradise", "Beach Palms 2"). With
 *   PAGE_SIZE=24, totalPages=1, so page=999 is unambiguously out of range
 *   (total > 0 && page > totalPages) — this exercises the "page doesn't
 *   exist" branch distinctly from the "genuinely empty category" branch.
 */

test.describe('empty states (Architecture §12.6)', () => {
  test('zero-hit search shows the empty-state pattern, not a blank grid', async ({ page }) => {
    await page.goto('/collection/sea-life?q=zzznotarealquery');
    await expect(page.getByText(/No paintings match those filters/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clear filters' })).toBeVisible();
    expect(await page.locator('[data-testid="artwork-card"]').count()).toBe(0);
  });

  test('page number out of range shows a distinct message with a way back', async ({ page }) => {
    await page.goto('/collection/palm-trees?page=999');
    await expect(page.getByText(/doesn't exist/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to page 1' })).toBeVisible();
    expect(await page.locator('[data-testid="artwork-card"]').count()).toBe(0);
  });
});
