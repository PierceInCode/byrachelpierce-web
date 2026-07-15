/**
 * robots.ts — App Router robots convention (emits /robots.txt).
 *
 * Public pages are crawlable. The Mural Selfie Trail's status/check-in API
 * endpoints are disallowed: they are authenticated JSON endpoints, not
 * content, and have no place in a crawler's index. The sitemap is advertised.
 */

import type { MetadataRoute } from 'next';

const BASE = 'https://byrachelpierce.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/trail/status', '/api/trail/checkin'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
