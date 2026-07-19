import type { NextConfig } from 'next';

/**
 * Wix → new-site redirect map (M1 item 3, operator-approved ESCALATIONS E6,
 * 2026-07-19). Every rule is a permanent redirect, which Next.js serves as
 * HTTP 308. External store rules point at the Lightspeed store; the literal
 * below is intentionally duplicated (Next config cannot import from
 * src/lib/constants without an alias resolver in the config context) — the
 * seo redirects unit test asserts it stays equal to SHOP_URL.
 *
 * Exported so tests/seo/redirects.test.ts can assert the exact map without
 * ESM/TS-config interop friction; redirects() below returns this same array,
 * keeping the config the single source.
 */

// keep in sync with SHOP_URL in src/lib/constants.ts
const SHOP_URL = 'https://store33134078.company.site/';

export const redirectRules = [
  // ── Internal Wix path → new-site path ──────────────────────────────────
  { source: '/custom-orders', destination: '/custom', permanent: true },
  { source: '/about-rachel-pierce', destination: '/story', permanent: true },
  { source: '/bio', destination: '/story', permanent: true },
  { source: '/events', destination: '/visit', permanent: true },
  { source: '/retail-locations', destination: '/visit', permanent: true },
  { source: '/social-media', destination: '/', permanent: true },
  { source: '/category/all-products', destination: '/collection', permanent: true },
  { source: '/watercolors', destination: '/collection/watercolors', permanent: true },
  { source: '/copy-of-2019', destination: '/collection/abstracts', permanent: true },
  { source: '/copy-of-2019-1', destination: '/collection/beach-coastal', permanent: true },
  { source: '/copy-of-2019-2', destination: '/collection/birds-wildlife', permanent: true },
  { source: '/copy-of-2019-3', destination: '/collection/birds-wildlife', permanent: true },
  { source: '/copy-of-2019-4', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-5', destination: '/collection/florals', permanent: true },
  { source: '/copy-of-2019-6', destination: '/collection', permanent: true },
  { source: '/copy-of-2019-7', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-8', destination: '/collection/mermaids-whimsy', permanent: true },
  { source: '/copy-of-2019-9', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-10', destination: '/collection/palm-trees', permanent: true },
  { source: '/copy-of-2019-11', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-12', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-13', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-14', destination: '/collection/sea-life', permanent: true },
  { source: '/copy-of-2019-15', destination: '/collection/birds-wildlife', permanent: true },
  { source: '/copy-of-octopus', destination: '/collection/line-art', permanent: true },
  { source: '/2018', destination: '/collection', permanent: true },
  { source: '/2019', destination: '/collection', permanent: true },
  { source: '/2020', destination: '/collection', permanent: true },
  { source: '/privacy-policy', destination: '/', permanent: true },
  { source: '/return-policy', destination: '/', permanent: true },
  { source: '/shipping-policy', destination: '/', permanent: true },
  { source: '/blog', destination: '/press', permanent: true },
  // Wildcard: any blog subpath (categories, individual posts) → press.
  { source: '/blog/:path*', destination: '/press', permanent: true },
  // Wildcard: blanket for all 55 old Wix blog posts under /post/*.
  { source: '/post/:slug*', destination: '/press', permanent: true },

  // ── External Wix path → Lightspeed store ───────────────────────────────
  { source: '/shop', destination: SHOP_URL, permanent: true },
  { source: '/online-store', destination: SHOP_URL, permanent: true },
  { source: '/items', destination: SHOP_URL, permanent: true },
  { source: '/jewelry', destination: SHOP_URL, permanent: true },
] as const;

const nextConfig: NextConfig = {
  // Image optimization — artwork serves from Vercel Blob in deployed
  // environments (Architecture §6); the store subdomain is assigned per
  // project, so the pattern wildcards it.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
  // Strict mode for catching React issues early
  reactStrictMode: true,
  // Wix → new-site 308 redirects (M1 item 3). Single source of truth is
  // redirectRules above.
  async redirects() {
    return [...redirectRules];
  },
};

export default nextConfig;
