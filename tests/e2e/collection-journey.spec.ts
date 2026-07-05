import { test, expect } from '@playwright/test';

/**
 * Collection browse/filter/paginate/search journey (Spec §4.4, §8.2).
 *
 * This is the spec that proves the Task 1/2 rendering-mode fix (`/collection`
 * and `/collection/[category]` are `force-dynamic`) actually works end-to-end
 * — Spec §8.2 calls this "the silently-broken risk; verify personally."
 *
 * All counts/tag names below are verified against the real seeded fixture
 * (tests/fixtures/catalog.json, 20 paintings) rather than assumed:
 *
 * - `birds-wildlife` (CATEGORY_TAG_MAP tags: Flamingos, Roseate spoonbills,
 *   Pelicans, Herons, Egrets, Parrots, Shorebirds, Owls, Birds of prey,
 *   Other birds, Dogs, Cats, Longhorn cattle, Other mammals) matches exactly
 *   5 fixture paintings by their seeded paintingTags rows: "ABirder'sDream"
 *   (Pelicans/Herons/Roseate spoonbills/Shorebirds), "A Pair of Roseates"
 *   (Flamingos), "A Surprise Guest" (Other mammals), "All These Cats" (Cats),
 *   "Birds Heading to NYC" (Pelicans/Herons/Shorebirds). (Verified directly
 *   against a live e2e run after an initial manual count of 3 undercounted
 *   two paintings tagged Flamingos/Other mammals — fixed here to match
 *   reality rather than the original guess.)
 * - The "Cats" tag (id 58, category "Wildlife / Other") is seeded on exactly
 *   one painting — "All These Cats" — making it a clean, deterministic
 *   single-result filter.
 * - `sea-life` matches exactly 8 fixture paintings (also documented in
 *   image-budget.spec.ts). With PAGE_SIZE=24 and only 20 paintings total in
 *   the fixture, no category and no all-paintings view will ever have a real
 *   page 2 — a constraint already discovered in Task 2. Rather than fake a
 *   two-page click-through, the pagination test below asserts the actually-
 *   true behavior: an explicit page=2 request against a category that has
 *   real (but too few) results lands on the honest "page doesn't exist"
 *   empty state, not a silent blank/broken page.
 * - Title search for "turtle" matches "Matthew's Turtle", "Courageous
 *   Turtle", and "Deep Water Sea Turtle" — verified against fixture titles.
 */

test.describe('collection browse/filter/paginate/search', () => {
  test('category page: checking a tag filter narrows the rendered grid', async ({ page }) => {
    await page.goto('/collection/birds-wildlife');

    const initialCount = await page.locator('[data-testid="artwork-card"]').count();
    expect(initialCount).toBe(5);

    // The tag filter sidebar groups tags by category inside collapsed
    // <details> elements — expand "Wildlife / Other" (where "Cats" lives)
    // before interacting with its checkbox.
    await page
      .locator('aside.filter-sidebar details', { hasText: 'Wildlife / Other' })
      .locator('summary')
      .click();

    // Clicking the checkbox triggers a client-side navigation (the URL's
    // `tags` search param changes), which re-renders the server-rendered
    // page tree. `.check()` would try to re-verify the checked state on the
    // original DOM node after that render and race the navigation — a plain
    // `.click()` plus waiting on the URL avoids that race.
    await page.getByRole('checkbox', { name: 'Cats' }).click();
    await page.waitForURL(/tags=/);

    await expect(page.locator('[data-testid="artwork-card"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="artwork-title"]')).toHaveText('All These Cats');
  });

  test('category page: an out-of-range page on a real (but small) category shows the honest empty state, not a blank grid', async ({
    page,
  }) => {
    // sea-life has 8 real paintings — well short of PAGE_SIZE (24), so a
    // literal "page 2 has different paintings" assertion can never hold
    // against this fixture. What IS true and worth verifying: requesting
    // page 2 doesn't silently 500 or render an empty grid with no
    // explanation — it renders the same "page doesn't exist" pattern as
    // empty-states.spec.ts's palm-trees case.
    await page.goto('/collection/sea-life');
    const page1Count = await page.locator('[data-testid="artwork-card"]').count();
    expect(page1Count).toBe(8);

    await page.goto('/collection/sea-life?page=2');
    await expect(page.getByText(/doesn't exist/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to page 1' })).toBeVisible();
    expect(await page.locator('[data-testid="artwork-card"]').count()).toBe(0);
  });

  test('search returns results matching the query and changes when the query changes', async ({
    page,
  }) => {
    await page.goto('/collection/sea-life');
    await page.getByPlaceholder('Search paintings...').fill('turtle');
    await page.waitForURL(/q=turtle/);

    // Wait for the DOM to settle on the post-navigation result set before
    // taking a one-shot snapshot with `.allTextContents()` — this removes
    // the same URL/content-swap race the `.check()` -> `.click()` fix above
    // addresses.
    await expect(page.locator('[data-testid="artwork-title"]')).not.toHaveCount(0);
    const titles = await page.locator('[data-testid="artwork-title"]').allTextContents();
    expect(titles.sort()).toEqual([
      'Courageous Turtle',
      'Deep Water Sea Turtle',
      "Matthew's Turtle",
    ]);

    // Changing the query changes the result set.
    await page.getByPlaceholder('Search paintings...').fill('turtlezzznomatch');
    await page.waitForURL(/q=turtlezzznomatch/);
    await expect(page.getByText(/No paintings match those filters/i)).toBeVisible();
  });

  test('all-paintings view is reachable from /collection?view=all and shows every painting', async ({
    page,
  }) => {
    await page.goto('/collection?view=all');
    await expect(page.getByRole('heading', { name: 'All Paintings' })).toBeVisible();
    // Fixture has exactly 20 paintings, all fitting on page 1 (PAGE_SIZE=24) —
    // so no Pagination nav should render at all (Pagination returns null when
    // totalPages <= 1).
    expect(await page.locator('[data-testid="artwork-card"]').count()).toBe(20);
    await expect(page.getByRole('navigation', { name: 'Pagination' })).toHaveCount(0);
  });
});
