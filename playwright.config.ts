import { defineConfig, devices } from '@playwright/test';

/**
 * Minimal Playwright scaffold (Spec §7.1) — just enough for R2's
 * image-budget gate. The full e2e suite (collection browse/filter/paginate,
 * trail page, etc.) lands in R3.
 *
 * Iron Invariant 1: the web server never touches production Turso. Its env
 * is set explicitly below (a fresh `file:` DB seeded from the same
 * 20-painting fixture `npm run db:seed-ci` uses in CI) rather than inherited
 * from `.env.local`, whose TURSO_DATABASE_URL currently points at
 * production — Next.js never overwrites an already-set process env var from
 * a `.env` file, so this override is guaranteed to win.
 */

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: BASE_URL,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run db:seed-ci && npm run build && npx next start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      TURSO_DATABASE_URL: 'file:./e2e-test.db',
      TURSO_AUTH_TOKEN: '',
      AUTH_SECRET: 'e2e-only-not-a-real-secret',
      NEXTAUTH_URL: BASE_URL,
      EMAIL_FROM: 'e2e@example.invalid',
      GALLERY_EMAIL: 'e2e-gallery@example.invalid',
    },
  },
});
