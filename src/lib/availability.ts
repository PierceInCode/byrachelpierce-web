/**
 * Availability display rule — Architecture §5.3. `paintings.availability`
 * is authoritative free text; this is the ONE place that decides what a
 * visitor sees, so the honesty rule (no availability claim when unknown)
 * lives here rather than being re-implemented per render site.
 */

import { SHOP_URL } from './constants';

export interface AvailabilityDisplay {
  variant: 'available' | 'sold' | 'literal';
  label: string;
  cta: { label: string; href: string } | null;
}

export function getAvailabilityDisplay(availability: string | null): AvailabilityDisplay | null {
  const raw = availability?.trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();

  if (normalized === 'available') {
    return {
      variant: 'available',
      label: 'Available at the gallery',
      cta: { label: 'Shop Online', href: SHOP_URL },
    };
  }

  if (normalized === 'sold') {
    return {
      variant: 'sold',
      label: 'Sold',
      cta: { label: 'Commission a similar piece', href: '/custom' },
    };
  }

  return { variant: 'literal', label: raw, cta: null };
}
