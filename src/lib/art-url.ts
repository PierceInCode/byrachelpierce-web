/**
 * Art URL — the only place artwork image URLs are assembled (Architecture §6).
 *
 * `web_image_path`/`thumb_path` in the DB stay relative forever (e.g.
 * `web/matthews-turtle-7bb2b9a6.jpg`). `NEXT_PUBLIC_ART_BASE_URL` supplies the
 * base — the Vercel Blob public URL in deployed environments, unset locally
 * so `/art` (served straight from the gitignored `public/art/` folder) is
 * the default dev base with zero setup.
 */

const DEFAULT_LOCAL_BASE = '/art';

export function artUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_ART_BASE_URL || DEFAULT_LOCAL_BASE;
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
