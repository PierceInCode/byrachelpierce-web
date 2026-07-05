import { describe, it, expect } from 'vitest';
import { getAvailabilityDisplay } from '@/lib/availability';

describe('getAvailabilityDisplay', () => {
  it('returns null for null/empty availability', () => {
    expect(getAvailabilityDisplay(null)).toBeNull();
    expect(getAvailabilityDisplay('')).toBeNull();
    expect(getAvailabilityDisplay('   ')).toBeNull();
  });

  it('normalizes "Available" (any casing) to the gallery message + shop CTA', () => {
    for (const raw of ['Available', 'available', 'AVAILABLE']) {
      const result = getAvailabilityDisplay(raw);
      expect(result?.variant).toBe('available');
      expect(result?.label).toBe('Available at the gallery');
      expect(result?.cta?.href).toBe('https://store33134078.company.site/');
    }
  });

  it('normalizes "Sold" to a slate badge + commission cross-sell', () => {
    const result = getAvailabilityDisplay('Sold');
    expect(result?.variant).toBe('sold');
    expect(result?.label).toBe('Sold');
    expect(result?.cta).toEqual({ label: 'Commission a similar piece', href: '/custom' });
  });

  it('passes anything else through verbatim with no cross-sell', () => {
    const result = getAvailabilityDisplay('Sold - prints available');
    expect(result?.variant).toBe('literal');
    expect(result?.label).toBe('Sold - prints available');
    expect(result?.cta).toBeNull();
  });
});
