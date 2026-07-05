import { test, expect } from '@playwright/test';

/**
 * Contact page (Spec §8.1.4, Architecture Appendix A.5). The dead
 * "Coming Soon" contact form was removed in favor of honest, direct
 * contact details (gallery address + social links). This guards against
 * a regression that re-introduces the placeholder form or drops the
 * honest details.
 */

test.describe('contact page (Spec §8.1.4)', () => {
  test('shows honest contact details, not the dead "Coming Soon" form', async ({ page }) => {
    await page.goto('/contact');

    // Honest contact details render (scoped to main content — the same
    // address also appears in the site footer, so scope avoids ambiguity).
    const main = page.locator('#main-content');
    await expect(main.getByRole('heading', { name: 'Find Us' })).toBeVisible();
    await expect(main.getByText('1571 Periwinkle Way, Sanibel Island, FL 33957')).toBeVisible();

    // No dead "Coming Soon" form markup remains anywhere on the page.
    await expect(page.getByText(/form coming soon/i)).toHaveCount(0);
    await expect(page.getByPlaceholder('Your Name')).toHaveCount(0);
    await expect(page.getByPlaceholder('Email Address')).toHaveCount(0);
    await expect(page.getByPlaceholder('Subject')).toHaveCount(0);
    expect(await page.locator('form').count()).toBe(0);
  });
});
