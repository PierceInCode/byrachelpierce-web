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

export interface Painting {
  id: number;
  title: string;
  slug: string;
  medium: string | null;
  formatType: string | null;
  location: string | null;
  physicalSize: string | null;
  availability: string | null;
  series: string | null;
  notes: string | null;
  widthPx: number | null;
  heightPx: number | null;
  orientation: string | null;
  webImagePath: string | null;
  thumbPath: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PaintingWithTags extends Painting {
  tags: { categoryName: string; tagName: string }[];
}

export interface CategoryCardData {
  label: string;
  slug: string;
  count: number;
  thumbPath: string | null;
}

export interface PaintingSearchParams {
  q?: string;
  medium?: string;
  tags?: string;
  page?: string;
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
 * Payload for the trail-completion emails (redemption code to the user,
 * notification to the gallery). Built by the check-in route from the
 * user's real, stored data — every timestamp is the mural's actual
 * `checked_in_at`, not "now" (Architecture §4.2 hole 4).
 *
 * Replaces the legacy `TrailProgress` JSON-file shape, which no longer
 * exists — trail state lives in the database (Architecture §4.2).
 */
export interface TrailCompletionEmail {
  /** The completing user's email address */
  email: string;
  /** Their redemption code (BRP-XXXXXX) */
  code: string;
  /** ISO-8601 datetime the quest was completed */
  completedAt: string;
  /** Each visited mural with its stored check-in time (ISO-8601) */
  checkIns: { muralId: number; checkedInAt: string }[];
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
