import { test, expect } from '@playwright/test';

/**
 * Trail page signed-out state (Spec §4.4). `TrailClient` (a client
 * component) starts in a `LOADING` state, fetches `/api/auth/session` and
 * `/api/trail/status`, and — with no session cookie present, as is the case
 * for a fresh Playwright browser context — transitions to `SIGNED_OUT`,
 * rendering `EmailSignInForm`. Playwright's `expect().toBeVisible()`
 * auto-waits across that async transition.
 */

test.describe('trail page signed-out state', () => {
  test('shows the email sign-in form when not authenticated', async ({ page }) => {
    await page.goto('/murals/trail');
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start My Trail →' })).toBeVisible();
  });
});
