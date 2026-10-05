/**
 * Homepage — by Rachel Pierce (Server Component)
 *
 * The home page is the mosaic: every painting in the collection laid out as
 * a tile inside the outline of Sanibel, explorable like a map, with her
 * murals, the causes she works for and the gallery shown as places on the
 * same island. It is full-screen and draws its own chrome, so it sits
 * outside the `(site)` route group and gets no Header or Footer.
 *
 * This page reads no database: the layout is generated ahead of time by
 * `npm run mosaic:build` (src/lib/mosaic/layout.json), and the mural list is
 * the same static data the trail uses.
 */

import type { Metadata, Viewport } from 'next';
import IslandMosaic from '@/components/mosaic/IslandMosaic';
import { artUrl } from '@/lib/art-url';
import { MURAL_LOCATIONS } from '@/lib/mural-data';
import { CAUSES } from '@/lib/mosaic/content';
import { CAPTIVA_PATH, ISLAND_PATH } from '@/lib/mosaic/coast';
import { projectLatLng } from '@/lib/mosaic/geo';
import { MOSAIC_LAYOUT } from '@/lib/mosaic/layout';
import { PLACES } from '@/lib/mosaic/places';
import type { MosaicPin } from '@/lib/mosaic/types';

export const metadata: Metadata = {
  title: 'by Rachel Pierce | Original Art on Sanibel Island',
  description:
    'Hundreds of paintings by Rachel Pierce, assembled into the shape of Sanibel Island. Explore the art, her murals and the gallery on Periwinkle Way.',
};

export const viewport: Viewport = {
  viewportFit: 'cover',
  themeColor: '#0a2b38',
};

/** The mosaic's two typefaces, served by Fontshare (Indian Type Foundry). */
const FONTS_HREF =
  'https://api.fontshare.com/v2/css?f[]=boska@300,400,401&f[]=switzer@400,500,600&display=swap';

export default function HomePage() {
  const murals: MosaicPin[] = MURAL_LOCATIONS.map((mural) => ({
    name: mural.name,
    at: projectLatLng(mural.lat, mural.lng),
  }));
  const causes: MosaicPin[] = CAUSES.map((cause) => ({
    name: cause.name,
    text: cause.text,
    at: cause.place ? projectLatLng(PLACES[cause.place].lat, PLACES[cause.place].lng) : null,
  }));

  return (
    <>
      <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS_HREF} precedence="default" />
      <IslandMosaic
        layout={MOSAIC_LAYOUT}
        islandPath={ISLAND_PATH}
        captivaPath={CAPTIVA_PATH}
        atlasUrl={artUrl('mosaic/atlas.jpg')}
        thumbBase={artUrl('thumbs')}
        webBase={artUrl('web')}
        logoUrl={artUrl('site/brp-logo.png')}
        photoUrl={artUrl('site/rachel-photo.jpg')}
        galleryPhotoUrl={artUrl('site/rachel-gallery.jpg')}
        murals={murals}
        causes={causes}
        gallery={projectLatLng(PLACES.gallery.lat, PLACES.gallery.lng)}
        year={new Date().getFullYear()}
      />
    </>
  );
}
