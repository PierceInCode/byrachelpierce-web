/**
 * Shared TypeScript types for by Rachel Pierce website.
 * Keep types here so they can be imported from '@/types'.
 */

// ── Navigation ────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  /** Opens in a new browser tab (external links) */
  external?: boolean;
  /** Sub-navigation items (dropdown) */
  children?: NavItem[];
}

// ── Mural ─────────────────────────────────────────────────────────────

export interface MuralLocation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** Geofence radius in meters */
  radius: number;
  /** Short description of the artwork */
  description?: string;
  /** Year the mural was painted */
  year?: number;
}

// ── Collection / Artwork ───────────────────────────────────────────────────

export type ArtworkCategory =
  | 'beach-coastal'
  | 'sea-life'
  | 'birds-wildlife'
  | 'florals'
  | 'abstracts'
  | 'palm-trees'
  | 'mermaids-whimsy'
  | 'watercolors'
  | 'line-art';

export interface Artwork {
  id: string;
  title: string;
  category: ArtworkCategory;
  medium: string;
  dimensions?: string;
  /** Path relative to /public/images */
  imagePath?: string;
  available: boolean;
  /** Link to Lightspeed product page */
  shopUrl?: string;
}

// ── Sister Business ────────────────────────────────────────────────────────

export interface SisterBusiness {
  name: string;
  description: string;
  address: string;
  url: string;
}

// ── Press / Media ────────────────────────────────────────────────────────

export interface PressItem {
  id: string;
  publication: string;
  headline: string;
  date: string;
  url?: string;
  excerpt?: string;
}

// ── Meta ──────────────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
  openGraphImage?: string;
}
