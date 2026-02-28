/**
 * MuralMap.tsx — The core interactive Leaflet map component.
 *
 * WHY 'use client'?
 * Next.js App Router renders components on the SERVER by default (React Server Components).
 * Leaflet absolutely requires the browser's `window` and `document` objects, which don't
 * exist on the server. The 'use client' directive tells Next.js: "this component and
 * everything it imports runs only in the browser."
 *
 * Think of it like a C# partial class boundary — server-side code can call into it,
 * but it executes in a different environment.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
// Type-only import: this imports ONLY TypeScript type definitions for Leaflet,
// not the actual runtime library. This is safe for SSR because types are erased
// at compile time — they never reach the browser or server as executable code.
// The actual Leaflet library is loaded dynamically inside useEffect (below).
import type L from 'leaflet';

import { MURAL_LOCATIONS } from '@/lib/mural-data';
import type { MuralLocation } from '@/types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MuralMapProps {
  /** Optional: highlight a specific mural by ID (wired up for future use — e.g., clicking
   *  a mural card on the page could cause the corresponding pin to pulse on the map). */
  activeMuralId?: number;
  /** Optional: callback fired when the user clicks a mural marker.
   *  Parent components can use this to sync state (e.g., scroll to the mural's card). */
  onMuralClick?: (muralId: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MuralMap({ activeMuralId, onMuralClick }: MuralMapProps) {
  // useRef holds a reference to a DOM element across renders without triggering re-renders.
  // In C# terms, think of it as storing a pointer to the <div> that Leaflet will take over.
  // The generic type parameter <HTMLDivElement | null> means it starts as null and
  // later gets assigned to the actual div element.
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  // This ref holds the Leaflet map instance itself.
  // We use a ref (not state) because we never want a re-render when the map initializes —
  // we just need to be able to call map.remove() on cleanup.
  // LeafletMap is the Leaflet Map type; null means not yet initialized.
  const mapInstanceRef = useRef<L.Map | null>(null);

  // useState drives the visible loading/error UI. React re-renders the component
  // when these values change (similar to INotifyPropertyChanged in C# MVVM).
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Effect: Initialize the Map ─────────────────────────────────────────────
  //
  // useEffect runs AFTER the component mounts (after the first render paints to screen).
  // This is the correct place to do anything that needs the real DOM — Leaflet absolutely
  // requires a real <div> to attach to, so we can't initialize it during render itself.
  //
  // The empty dependency array [] means "run this effect once, on mount only" —
  // like a constructor in C#. The returned function is the cleanup (like IDisposable.Dispose).
  useEffect(() => {
    // Guard: if the container div doesn't exist yet (shouldn't happen, but defensive coding),
    // bail out early. Also prevent double-initialization in React Strict Mode (which mounts
    // components twice in development to catch side effects).
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // ── Async IIFE (Immediately Invoked Function Expression) ──────────────────
    // useEffect's callback can't be async directly (it would return a Promise, but React
    // expects either nothing or a cleanup function). So we wrap async logic in an IIFE.
    // This is a very common pattern in React — think of it as an async void method in C#.
    (async () => {
      try {
        // ── Dynamic Import: the SSR-safe Leaflet loading pattern ───────────────
        //
        // `import('leaflet')` is a dynamic import — it loads the module at RUNTIME
        // rather than at build time. This means:
        //   1. Leaflet is NOT included in the initial page bundle (better performance)
        //   2. This code only runs in the browser (inside useEffect), so Leaflet never
        //      tries to access `window` on the server
        //
        // Compare to C#: this is like using Assembly.Load() at runtime instead of
        // having a compile-time reference in your .csproj. The module is fetched
        // asynchronously and we await its resolution.
        const L = await import('leaflet');

        // Guard against the component unmounting while we were awaiting the import.
        // React Strict Mode and fast navigation can cause this.
        if (!mapContainerRef.current) return;

        // ── Initialize the Leaflet Map ─────────────────────────────────────────
        //
        // L.map(element, options) creates a new map instance attached to the given DOM element.
        // The options object configures the initial view, zoom limits, and interaction behavior.
        const map = L.map(mapContainerRef.current, {
          // Initial center: approximate geographic center of Sanibel Island
          // Leaflet coordinates are always [latitude, longitude]
          center: [26.449, -82.07],
          zoom: 13,
          // Limit how far the user can zoom out — keeps the map focused on Sanibel
          minZoom: 11,
          maxZoom: 18,
          // zoomControl: we keep this true (default) — shows the +/- zoom buttons
          zoomControl: true,
          // scrollWheelZoom: disable on mobile to prevent the map "trapping" scroll.
          // We could also detect mobile here, but 'center' is a good default:
          // it requires two fingers to zoom on touch, single scroll passes through.
          scrollWheelZoom: 'center',
        });

        // Store the map instance in the ref so the cleanup function can destroy it later
        mapInstanceRef.current = map;

        // ── Tile Layer: the actual map imagery ────────────────────────────────
        //
        // Leaflet maps are composed of "tiles" — small square images fetched from a CDN.
        // CartoDB Voyager is a free, no-API-key-required tile set that looks clean and
        // modern. The URL template uses {s} (subdomain), {z} (zoom), {x}/{y} (tile coords).
        // Leaflet fills these in automatically as the user pans and zooms.
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            // Attribution is legally required by OpenStreetMap's license (ODbL).
            // Leaflet displays this text in the bottom-right corner of the map.
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            // The tile provider supports 4 subdomains (a, b, c, d) for load balancing.
            // Browsers limit concurrent requests per domain, so using multiple subdomains
            // lets the browser fetch tiles in parallel — faster map loading.
            subdomains: 'abcd',
            // Maximum native zoom the tile set supports. Beyond this, Leaflet upscales.
            maxNativeZoom: 19,
            maxZoom: 22,
          }
        ).addTo(map);

        // ── Add Markers for Each Mural ─────────────────────────────────────────
        //
        // We'll collect the lat/lng bounds of all markers to auto-fit the map view.
        // L.latLngBounds() creates a bounding rectangle that we expand as we add markers.
        // Think of it as a Rectangle/BoundingBox in 2D coordinate space.
        const bounds = L.latLngBounds([]);

        // Iterate over all 14 mural locations and create a marker + popup for each.
        // Array.forEach in JS/TS is equivalent to foreach in C#.
        MURAL_LOCATIONS.forEach((mural: MuralLocation) => {
          // ── Custom Marker Icon using L.divIcon ─────────────────────────────
          //
          // By default Leaflet uses a blue image pin. L.divIcon lets us create markers
          // from raw HTML/CSS — perfect for our numbered, brand-colored circles.
          //
          // The 'mural-marker' class is defined in globals.css and handles all the
          // visual styling (teal circle, white border, drop shadow, triangle pointer).
          const icon = L.divIcon({
            // The HTML string that becomes the marker's DOM content.
            // We use a simple div with the mural's ID number inside.
            // Note: this is a template literal (backtick string) — like $"..." in C#.
            html: `<div class="mural-marker">${mural.id}</div>`,
            // className: '' clears Leaflet's default 'leaflet-div-icon' class which
            // adds unwanted white background + border styling. We want full CSS control.
            className: '',
            // iconSize: [width, height] in pixels. Must match the CSS size of .mural-marker.
            iconSize: [32, 32],
            // iconAnchor: the pixel offset from the icon's top-left corner to the
            // geographic point it represents. [16, 38] centers horizontally and
            // places the tip of the triangle pointer at the exact coordinate.
            // Without this, the top-left corner of the div would sit on the coordinate.
            iconAnchor: [16, 38],
            // popupAnchor: offset for the popup relative to the iconAnchor.
            // [0, -40] puts the popup above the marker, not on top of it.
            popupAnchor: [0, -40],
          });

          // ── Build the Popup HTML Content ────────────────────────────────────
          //
          // Leaflet popups accept raw HTML strings. We template in the mural data
          // and use CSS classes from globals.css for brand-consistent styling.
          //
          // Google Maps "Get Directions" URL format:
          //   ?api=1 is required for the public embed API
          //   &destination=lat,lng drops the pin at that coordinate
          const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mural.lat},${mural.lng}`;

          // Build the year badge HTML — only if the mural has a year recorded.
          // The conditional expression (ternary) works just like C#'s ternary operator.
          const yearBadge = mural.year
            ? `<span class="mural-popup-year">${mural.year}</span>`
            : '';

          // Build the description paragraph — only if a description exists.
          const descriptionHtml = mural.description
            ? `<p class="mural-popup-description">${mural.description}</p>`
            : '';

          // Assemble the full popup HTML.
          // Note the map arrow SVG icon next to "Get Directions" — it's an inline SVG
          // for zero-dependency icon rendering (no icon font needed).
          const popupContent = `
            <div class="mural-popup-content">
              <h3 class="mural-popup-name">${mural.name}</h3>
              ${yearBadge}
              ${descriptionHtml}
              <p class="mural-popup-address">📍 ${mural.address}</p>
              <a
                href="${directionsUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="mural-popup-directions"
                aria-label="Get directions to ${mural.name} (opens Google Maps)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                  stroke-linejoin="round" aria-hidden="true">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
                Get Directions
              </a>
            </div>
          `;

          // ── Create and Place the Marker ─────────────────────────────────────
          //
          // L.marker([lat, lng], { icon }) creates a marker at the given coordinates.
          // .bindPopup(html, options) attaches a popup that opens on click.
          // .addTo(map) adds it to the map (like adding a child to a container in WinForms/WPF).
          const marker = L.marker([mural.lat, mural.lng], { icon })
            .bindPopup(popupContent, {
              // className adds our .mural-popup class to the popup container element,
              // which lets us override Leaflet's default popup CSS in globals.css.
              className: 'mural-popup',
              // maxWidth: limits how wide the popup can grow before it scrolls.
              maxWidth: 320,
            })
            .addTo(map);

          // ── Wire up the onMuralClick callback ──────────────────────────────
          //
          // If the parent component passed an onMuralClick prop, attach a click listener.
          // marker.on('click', handler) is Leaflet's event system — similar to C# events.
          // We call the callback with the mural's ID so the parent can react
          // (e.g., highlight a card, scroll to it, etc.)
          if (onMuralClick) {
            marker.on('click', () => {
              onMuralClick(mural.id);
            });
          }

          // ── Expand the bounding box to include this marker ─────────────────
          //
          // L.latLng creates a coordinate object. We extend the bounds rectangle
          // with each marker's position so we can fit all of them in view at the end.
          bounds.extend(L.latLng(mural.lat, mural.lng));
        });

        // ── Fit Map to All Markers ─────────────────────────────────────────────
        //
        // fitBounds adjusts the center and zoom level so that all markers are
        // visible within the map viewport, with some padding so they're not
        // right at the edge. Padding is in pixels.
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [40, 40], // [top/bottom pixels, left/right pixels]
            maxZoom: 14,       // Don't zoom in too close even if there are clustered markers
          });
        }

        // ── Mark loading as complete ───────────────────────────────────────────
        // This triggers a re-render that hides the loading skeleton and reveals the map.
        setIsLoading(false);

      } catch (err) {
        // Something went wrong — log it for debugging and show a user-friendly error.
        // In C#, this is like catching Exception and setting an error property.
        console.error('[MuralMap] Failed to initialize Leaflet map:', err);
        setError('Could not load the map. Please refresh the page to try again.');
        setIsLoading(false);
      }
    })(); // ← the () at the end immediately invokes the async function

    // ── Cleanup Function (the "return" from useEffect) ─────────────────────────
    //
    // React calls this function when the component UNMOUNTS (navigates away, etc.)
    // or before the effect re-runs (if dependencies changed — not the case here since []).
    //
    // This is critical: Leaflet attaches a lot of DOM listeners and creates canvas/WebGL
    // contexts. Calling map.remove() properly tears all of that down.
    // NOT doing this causes memory leaks — the old map instance lingers in memory.
    //
    // In C# terms, this is your IDisposable.Dispose() implementation.
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    // We intentionally omit onMuralClick from the dependency array.
    // It's captured at mount time. Re-initializing the map every time a callback
    // reference changes would cause the map to flash/rebuild unnecessarily.
    // If this were a production app with frequent callback changes, we'd use
    // a ref-wrapped callback instead.
  }, []); // ← empty array = "run once on mount"

  // ── Render ──────────────────────────────────────────────────────────────────
  //
  // JSX is compiled to React.createElement() calls — think of it as a declarative
  // description of DOM structure, like XAML in WPF or Razor in ASP.NET.
  //
  // The rendering logic here follows a simple state machine:
  //   1. error state → show error message
  //   2. loading state → show loading skeleton
  //   3. normal → render the map container div

  if (error) {
    return (
      <div
        role="alert"
        style={{
          width: '100%',
          height: '350px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--color-offwhite)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-nav)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-slate)',
            textAlign: 'center',
            maxWidth: '40ch',
            padding: '0 1.5rem',
            letterSpacing: '0.03em',
          }}
        >
          {error}
        </p>
      </div>
    );
  }

  return (
    // React.Fragment shorthand (<> </>) — renders two sibling elements without
    // a wrapper div, keeping the DOM clean.
    <>
      {/* Loading skeleton — shown while Leaflet is being dynamically imported.
          `display` toggles between 'flex' (visible) and 'none' (hidden).
          We keep the map div in the DOM even while loading (just hidden) so that
          the mapContainerRef is available for Leaflet to attach to as soon as
          the import resolves. If we conditionally rendered it, the ref would be
          null when the async import finished. */}
      {isLoading && (
        <div className="mural-map-loading" aria-busy="true" aria-label="Loading map">
          <div className="mural-map-loading-icon" aria-hidden="true">🗺️</div>
          <p className="mural-map-loading-text">LOADING MAP</p>
        </div>
      )}

      {/* The actual map container div.
          `ref={mapContainerRef}` is how React gives us a direct reference to this DOM node.
          Leaflet's L.map() call needs this real DOM element to attach to.
          The CSS class `mural-map-container` in globals.css handles sizing and border-radius.
          We hide this div (not remove it) while loading via the style below. */}
      <div
        ref={mapContainerRef}
        className="mural-map-container"
        // Hide the map container while loading — keeps it in the DOM for Leaflet to attach,
        // but invisible until the map is ready. This prevents a flash of the empty container.
        style={{ display: isLoading ? 'none' : 'block' }}
        // Accessibility: label the map region for screen readers
        role="region"
        aria-label="Interactive mural map — Sanibel Island, Florida"
      />
    </>
  );
}
