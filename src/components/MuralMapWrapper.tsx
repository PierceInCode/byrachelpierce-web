/**
 * MuralMapWrapper.tsx — Dynamic import wrapper for the Leaflet map.
 *
 * WHY does this file exist when MuralMap.tsx already uses dynamic imports internally?
 *
 * Defense in depth. There are two layers of SSR protection here:
 *
 *   Layer 1 — MuralMap.tsx: Uses dynamic `import('leaflet')` inside useEffect,
 *             so Leaflet itself is never evaluated on the server.
 *
 *   Layer 2 — THIS FILE: Uses Next.js `dynamic()` with `{ ssr: false }` to prevent
 *             MuralMap.tsx from even being IMPORTED on the server. Without this,
 *             Next.js would still parse and evaluate MuralMap.tsx on the server,
 *             which would fail if any top-level code referenced browser APIs.
 *
 * In C# terms: Layer 1 is like lazy-loading an assembly. Layer 2 is like
 * compiler directives (#if !SERVER) that exclude the file entirely from the
 * server build. Together they make the component bullet-proof for SSR.
 *
 * ADDITIONAL BENEFIT: Code splitting.
 * Next.js will bundle MuralMap.tsx and Leaflet into a separate JavaScript chunk
 * that is only downloaded when this wrapper component mounts. Users who never
 * visit a page with the map never download the Leaflet library.
 * This is free performance — Leaflet + its dependencies is ~150KB gzipped.
 */
'use client';

import dynamic from 'next/dynamic';

// ── Dynamic import with SSR disabled ──────────────────────────────────────────
//
// `dynamic()` is Next.js's enhanced version of React.lazy().
// The `ssr: false` option tells Next.js: "never render this component on the server,
// not even a static HTML shell." The first render will always be the `loading` fallback.
//
// The `loading` function returns a React element to show while the dynamic chunk
// is being downloaded. This appears:
//   - On the server (where the real component can't render)
//   - In the browser before the chunk has finished downloading
// We show the same branded loading skeleton defined in globals.css.
const MuralMapDynamic = dynamic(
  // This arrow function returns a Promise<Module> — Next.js calls it when the
  // component needs to render for the first time in the browser.
  () => import('@/components/MuralMap'),
  {
    // Disable server-side rendering for this component entirely.
    // This is the key option — without it, Next.js would try to render MuralMap
    // on the server and hit errors because Leaflet needs window/document.
    ssr: false,

    // Loading UI: shown while the chunk downloads.
    // This is a function (not a component) that returns JSX.
    // Note: we can't use the CSS class animations here easily, so we use a simple
    // styled div that matches the .mural-map-loading appearance.
    loading: () => (
      <div
        className="mural-map-loading"
        aria-busy="true"
        aria-label="Map loading"
      >
        {/* The pulsing map emoji gives a visual cue that something is loading. */}
        <div className="mural-map-loading-icon" aria-hidden="true">
          🗺️
        </div>
        <p className="mural-map-loading-text">LOADING MAP</p>
      </div>
    ),
  }
);

// ── Props re-export ────────────────────────────────────────────────────────────
//
// We pass all props straight through to the underlying MuralMap component.
// TypeScript's ComponentPropsWithoutRef utility type would be cleaner here,
// but since MuralMap's props are simple, we just inline them.
// (This is like a passthrough constructor in C# decorator pattern.)
interface MuralMapWrapperProps {
  /** Optional: highlight a specific mural by ID */
  activeMuralId?: number;
  /** Optional: callback when a mural marker is clicked */
  onMuralClick?: (muralId: number) => void;
}

// ── The wrapper component ──────────────────────────────────────────────────────
//
// This is a thin pass-through: it just renders MuralMapDynamic with whatever
// props were passed in. All the real work happens in MuralMap.tsx.
//
// We export this as the default export so pages can import it with:
//   import MuralMapWrapper from '@/components/MuralMapWrapper';
export default function MuralMapWrapper(props: MuralMapWrapperProps) {
  return <MuralMapDynamic {...props} />;
}
