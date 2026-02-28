/**
 * Murals Hub Page — overview of Rachel Pierce's mural work on Sanibel Island.
 * Links to the Mural Selfie Trail. Now includes an interactive Leaflet map.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { MURAL_LOCATIONS } from '@/lib/mural-data';
// MuralMapWrapper handles the client/server boundary for us.
// This page remains a Server Component — no 'use client' needed here.
import MuralMapWrapper from '@/components/MuralMapWrapper';

export const metadata: Metadata = {
  title: 'Murals',
  description:
    'Rachel Pierce has painted 14 large-scale murals across Sanibel Island, Florida. Explore her public art and follow the Sanibel Mural Selfie Trail.',
};

export default function MuralsPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(150deg, #1a7a8f 0%, var(--color-teal) 100%)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0 clamp(2.5rem, 5vw, 4.5rem)',
        }}
      >
        <div className="container-site">
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
              marginBottom: '0.625rem',
            }}
          >
            Public Art on Sanibel Island
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-5xl)',
              fontWeight: 700,
              color: 'var(--color-white)',
              lineHeight: 1.1,
              marginBottom: '1rem',
            }}
          >
            Murals
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '52ch',
              lineHeight: 1.65,
              marginBottom: '2rem',
            }}
          >
            Rachel Pierce has painted {MURAL_LOCATIONS.length} large-scale murals across Sanibel Island —
            transforming storefronts, walls, and public spaces into vibrant works of art.
          </p>
          <Link
            href="/murals/trail"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-white)',
              backgroundColor: 'var(--color-coral)',
              padding: '0.875rem 2rem',
              borderRadius: 'var(--radius-full)',
              textDecoration: 'none',
              minHeight: '48px',
              transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            Follow the Mural Trail →
          </Link>
        </div>
      </section>

      {/* Mural list */}
      <section
        aria-labelledby="murals-list-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            <h2
              id="murals-list-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-slate-dark)',
                margin: 0,
              }}
            >
              All {MURAL_LOCATIONS.length} Murals
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-slate-light)',
                letterSpacing: '0.06em',
                margin: 0,
              }}
            >
              Explore the map to find each mural location
            </p>
          </div>

          {/* Interactive map */}
          <div style={{ marginBottom: '2rem' }}>
            <MuralMapWrapper />
          </div>

          {/* Mural cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {MURAL_LOCATIONS.map((mural) => (
              <article
                key={mural.id}
                style={{
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Placeholder image */}
                <div
                  className="img-placeholder"
                  style={{ height: '180px' }}
                  aria-hidden="true"
                >
                  Mural #{mural.id}
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 700,
                        color: 'var(--color-slate-dark)',
                        margin: 0,
                        flex: 1,
                      }}
                    >
                      {mural.name}
                    </h3>
                    {mural.year && (
                      <span
                        style={{
                          fontFamily: 'var(--font-nav)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-teal)',
                          letterSpacing: '0.06em',
                          flexShrink: 0,
                          marginLeft: '0.5rem',
                        }}
                      >
                        {mural.year}
                      </span>
                    )}
                  </div>
                  {mural.description && (
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-slate)',
                        lineHeight: 1.6,
                        marginBottom: '0.75rem',
                      }}
                    >
                      {mural.description}
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-slate-light)',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}
                  >
                    📍 {mural.address}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
