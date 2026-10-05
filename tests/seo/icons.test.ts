import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The site's tab icon. The site shipped without one, so a browser showed
 * whatever icon it had last cached for the address. The icon images are
 * image binaries, so they live with the artwork (gitignored public/art/,
 * Blob in deployed environments) and the root layout points at them through
 * artUrl() rather than a favicon.ico committed to the repo.
 */

vi.mock('next/font/google', () => ({
  Playfair_Display: () => ({ variable: '--font-playfair', className: 'pf' }),
  Jura: () => ({ variable: '--font-jura', className: 'jura' }),
}));

async function loadIcons() {
  vi.resetModules();
  const { metadata } = await import('@/app/layout');
  return metadata.icons;
}

describe('site icons', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('declares a tab icon at two sizes and an Apple touch icon', async () => {
    vi.stubEnv('NEXT_PUBLIC_ART_BASE_URL', '');
    expect(await loadIcons()).toEqual({
      icon: [
        { url: '/art/site/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/art/site/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/art/site/apple-icon-180.png', sizes: '180x180', type: 'image/png' }],
    });
  });

  it('serves them from the art base URL in a deployed environment', async () => {
    vi.stubEnv('NEXT_PUBLIC_ART_BASE_URL', 'https://blob.example.invalid/art/');
    const icons = await loadIcons();
    expect(JSON.stringify(icons)).toContain('https://blob.example.invalid/art/site/icon-32.png');
    expect(JSON.stringify(icons)).not.toContain('"/art/');
  });
});
