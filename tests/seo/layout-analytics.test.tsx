// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * ITEM 4 (M1 / R5): the root layout renders Vercel's <Analytics /> component
 * so production page-view telemetry is collected. We mock next/font/google
 * (not callable under vitest's esbuild transform) and stub @vercel/analytics
 * with a sentinel-emitting component, then assert the layout's rendered tree
 * contains it.
 */

vi.mock('next/font/google', () => ({
  Playfair_Display: () => ({ variable: '--font-playfair', className: 'pf' }),
  Jura: () => ({ variable: '--font-jura', className: 'jura' }),
}));

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <div data-testid="vercel-analytics-sentinel" />,
}));

// Header/Footer pull in client-only bits; stub them to keep this a layout test.
vi.mock('@/components/Header', () => ({ default: () => <header /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));

describe('root layout analytics', () => {
  it('renders the Vercel <Analytics /> component', async () => {
    const RootLayout = (await import('@/app/layout')).default;
    const html = renderToStaticMarkup(
      <RootLayout>
        <p>child</p>
      </RootLayout>,
    );
    expect(html).toContain('vercel-analytics-sentinel');
  });
});
