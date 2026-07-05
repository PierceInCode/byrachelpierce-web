import { test, expect } from '@playwright/test';

/**
 * Painting detail page render (Spec §4.4, Architecture §5.3). Both
 * paintings are real rows in the seeded fixture (tests/fixtures/catalog.json):
 *
 * - `matthews-turtle` ("Matthew's Turtle") has `availability: "Sold - prints
 *   available"` — normalizes to neither "available" nor "sold" in
 *   `getAvailabilityDisplay` (src/lib/availability.ts), so it hits the
 *   `variant: 'literal'` branch and the raw string is rendered verbatim as
 *   plain text (no cta, no "sold" badge styling).
 * - `abirdersdream` ("ABirder'sDream") has `availability: null` —
 *   `getAvailabilityDisplay` returns `null`, so the whole "Availability" `dt`
 *   is omitted entirely (Architecture §5.3: unknown availability shows no
 *   claim at all, not a fabricated default).
 */

test.describe('painting detail page render', () => {
  test('renders title and the literal availability string for a known seeded painting', async ({
    page,
  }) => {
    await page.goto('/collection/painting/matthews-turtle');
    await expect(page.getByRole('heading', { name: "Matthew's Turtle" })).toBeVisible();
    await expect(page.getByText('Sold - prints available')).toBeVisible();
    // Also confirms medium/tags render without crashing.
    await expect(page.getByText('Acrylic on canvas').first()).toBeVisible();
  });

  test('a painting with no availability data shows no availability claim', async ({ page }) => {
    await page.goto('/collection/painting/abirdersdream');
    await expect(page.getByRole('heading', { name: "ABirder'sDream" })).toBeVisible();
    await expect(page.getByText('Availability')).not.toBeVisible();
  });
});
