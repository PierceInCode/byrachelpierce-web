/**
 * Shared TypeScript types for by Rachel Pierce website.
 * Keep types here so they can be imported from '@/types'.
 */

// ── Navigation ──────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  /** Opens in a new browser tab (external links) */
  external?: boolean;
  /** Sub-navigation items (dropdown) */
  children?: NavItem[];
}

// ── Mural ────────────────────────────────────────────────────────────

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

// ── Collection / Artwork ─────────────────────────────────────────────

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

// ── Sister Business ──────────────────────────────────────────────────

export interface SisterBusiness {
  name: string;
  description: string;
  address: string;
  url: string;
}

// ── Press / Media ────────────────────────────────────────────────────

export interface PressItem {
  id: string;
  publication: string;
  headline: string;
  date: string;
  url?: string;
  excerpt?: string;
}

// ── Mural Selfie Trail ───────────────────────────────────────────────

/**
 * A single check-in event at a mural location.
 * Recorded when a user self-reports visiting a mural.
 * (C# analogy: this is like a simple DTO / record type.)
 */
export interface TrailCheckIn {
  /** References MuralLocation.id (1–14) */
  muralId: number;
  /** ISO 8601 datetime string — when the check-in was recorded */
  timestamp: string;
}

/**
 * Full trail progress for one user, persisted as a JSON file.
 * Each user gets one file: data/trail-progress/{hashed-email}.json
 * (C# analogy: this is the "entity" that gets serialized to storage.)
 */
export interface TrailProgress {
  email: string;
  checkIns: TrailCheckIn[];
  questComplete: boolean;
  /** Null until the quest is complete — then holds the RP-XXXXXX code */
  redemptionCode: string | null;
  /** ISO 8601 datetime, null until quest is complete */
  completedAt: string | null;
}

/**
 * Shape returned by GET /api/trail/status.
 * The client uses this to render the trail progress UI.
 */
export interface TrailStatusResponse {
  authenticated: boolean;
  progress: {
    totalCheckIns: number;
    requiredCheckIns: number;
    checkedInMuralIds: number[];
    questComplete: boolean;
    redemptionCode: string | null;
  } | null; // null when not authenticated
}

/**
 * Shape sent via POST /api/trail/checkin.
 * Just the mural ID — the server identifies the user from the session.
 */
export interface TrailCheckInRequest {
  muralId: number;
}

/**
 * Shape returned by POST /api/trail/checkin.
 * Tells the client whether the quest just completed.
 */
export interface TrailCheckInResponse {
  success: boolean;
  message: string;
  newTotal: number;
  questComplete: boolean;
  /** Populated only if this check-in triggered quest completion */
  redemptionCode: string | null;
}

// ── Meta ─────────────────────────────────────────────────────────────

export interface PageMeta {
  title: string;
  description: string;
  openGraphImage?: string;
}
