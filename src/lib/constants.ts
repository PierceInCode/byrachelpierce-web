/**
 * Site-wide constants for by Rachel Pierce.
 * Import from '@/lib/constants' throughout the project.
 */

import type { SisterBusiness } from '@/types';

// ── Site Identity ─────────────────────────────────────────────────────

export const SITE_NAME = 'by Rachel Pierce';
export const SITE_TAGLINE = 'Original Art Inspired by Island Life';
export const SITE_DESCRIPTION =
  'Original paintings, prints, and murals by Rachel Pierce. Visit our gallery on Sanibel Island, Florida.';

// ── External Shop (Lightspeed) ──────────────────────────────────────────

export const SHOP_URL = 'https://store33134078.company.site/';

// ── Gallery Location ─────────────────────────────────────────────────────

export const GALLERY_ADDRESS = '1571 Periwinkle Way, Sanibel Island, FL 33957';
export const GALLERY_PHONE = '';
export const GALLERY_EMAIL = '';

// ── Social Links ─────────────────────────────────────────────────────

export const SOCIAL = {
  instagram: 'https://www.instagram.com/by_rachelpierce/',
  facebook: 'https://www.facebook.com/byrachelpierce',
  youtube: 'https://www.youtube.com/@byrachelpierce',
} as const;

// ── Sister Businesses ─────────────────────────────────────────────────────

export const SISTER_BUSINESSES: SisterBusiness[] = [
  {
    name: "Pierce's Paw Paradise",
    description:
      'A beloved pet boutique on Sanibel featuring curated toys, treats, accessories, and Rachel\'s pet-inspired artwork.',
    address: "Jerry's Plaza, Sanibel Island",
    url: 'https://www.piercespawparadise.com',
  },
  {
    name: 'Home by Rachel Pierce',
    description:
      'Coastal home goods and island-inspired décor — bringing the beauty of Sanibel into every room.',
    address: '1626 Periwinkle Way, Sanibel Island',
    url: 'https://www.homebyrachelpierce.com',
  },
];

// ── Collection Categories ───────────────────────────────────────────────────

export const COLLECTION_CATEGORIES = [
  { label: 'Beach & Coastal', slug: 'beach-coastal' },
  { label: 'Sea Life', slug: 'sea-life' },
  { label: 'Birds & Wildlife', slug: 'birds-wildlife' },
  { label: 'Florals', slug: 'florals' },
  { label: 'Abstracts', slug: 'abstracts' },
  { label: 'Palm Trees', slug: 'palm-trees' },
  { label: 'Mermaids & Whimsy', slug: 'mermaids-whimsy' },
  { label: 'Watercolors', slug: 'watercolors' },
  { label: 'Line Art', slug: 'line-art' },
] as const;

// ── Navigation ────────────────────────────────────────────────────────────

export const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: SHOP_URL,
    external: true,
  },
  {
    label: 'Collection',
    href: '/collection',
    children: [
      ...COLLECTION_CATEGORIES.map((c) => ({
        label: c.label,
        href: `/collection/${c.slug}`,
      })),
      { label: 'View All', href: '/collection' },
    ],
  },
  { label: 'Story', href: '/story' },
  { label: 'Murals', href: '/murals' },
  { label: 'Events & Visit', href: '/visit' },
  { label: 'Contact', href: '/contact' },
] as const;
