/**
 * Real places on Sanibel that the home-page mosaic refers to, by latitude
 * and longitude. The gallery's coordinates are the same ones the mural list
 * uses; the others were geocoded from their street addresses (October 2026).
 */

export interface Place {
  lat: number;
  lng: number;
}

export const PLACES = {
  /** Rachel Pierce Art Gallery, 1571 Periwinkle Way. */
  gallery: { lat: 26.4418806, lng: -82.0557876 },
  /** Sanibel Lighthouse, Point Ybel. */
  lighthouse: { lat: 26.4529516, lng: -82.0142316 },
  /** Sanibel-Captiva Conservation Foundation, 3333 Sanibel-Captiva Road. */
  sccf: { lat: 26.439403, lng: -82.0971702 },
  /** J.N. "Ding" Darling National Wildlife Refuge visitor center, 1 Wildlife Drive. */
  dingDarling: { lat: 26.4454735, lng: -82.1123757 },
  /** Inside the refuge itself, north of the visitor center; used only to place bird paintings. */
  refuge: { lat: 26.4525, lng: -82.108 },
  /** Sanibel Recreation Center, 3880 Sanibel-Captiva Road. */
  recCenter: { lat: 26.4470238, lng: -82.1177371 },
} as const satisfies Record<string, Place>;
