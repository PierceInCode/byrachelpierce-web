import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { artUrl } from '@/lib/art-url';

const ORIGINAL_BASE = process.env.NEXT_PUBLIC_ART_BASE_URL;

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_ART_BASE_URL;
});

afterEach(() => {
  if (ORIGINAL_BASE === undefined) {
    delete process.env.NEXT_PUBLIC_ART_BASE_URL;
  } else {
    process.env.NEXT_PUBLIC_ART_BASE_URL = ORIGINAL_BASE;
  }
});

describe('artUrl', () => {
  it('defaults to the local /art base when NEXT_PUBLIC_ART_BASE_URL is unset', () => {
    expect(artUrl('web/matthews-turtle-7bb2b9a6.jpg')).toBe(
      '/art/web/matthews-turtle-7bb2b9a6.jpg',
    );
  });

  it('uses the Blob base URL when set', () => {
    process.env.NEXT_PUBLIC_ART_BASE_URL = 'https://abc123.public.blob.vercel-storage.com';
    expect(artUrl('thumbs/matthews-turtle-7bb2b9a6.jpg')).toBe(
      'https://abc123.public.blob.vercel-storage.com/thumbs/matthews-turtle-7bb2b9a6.jpg',
    );
  });

  it('normalizes a trailing slash on the base', () => {
    process.env.NEXT_PUBLIC_ART_BASE_URL = 'https://abc123.public.blob.vercel-storage.com/';
    expect(artUrl('web/a.jpg')).toBe('https://abc123.public.blob.vercel-storage.com/web/a.jpg');
  });

  it('normalizes a leading slash on the path', () => {
    expect(artUrl('/web/a.jpg')).toBe('/art/web/a.jpg');
  });

  it('treats an empty base override as unset (falls back to /art)', () => {
    process.env.NEXT_PUBLIC_ART_BASE_URL = '';
    expect(artUrl('web/a.jpg')).toBe('/art/web/a.jpg');
  });
});
