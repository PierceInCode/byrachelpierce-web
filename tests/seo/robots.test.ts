import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

describe('robots', () => {
  it('disallows the trail status/check-in API routes', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallowed = rules.flatMap((r) => {
      const d = r?.disallow;
      return d == null ? [] : Array.isArray(d) ? d : [d];
    });

    // The murals-trail status/API endpoints must be blocked from crawlers.
    expect(disallowed).toContain('/api/trail/status');
    expect(disallowed).toContain('/api/trail/checkin');
  });

  it('allows public pages', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allowed = rules.flatMap((r) => {
      const a = r?.allow;
      return a == null ? [] : Array.isArray(a) ? a : [a];
    });
    expect(allowed).toContain('/');
  });

  it('publishes the sitemap location', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://byrachelpierce.com/sitemap.xml');
  });
});
