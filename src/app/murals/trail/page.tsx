/**
 * Mural Trail Page — the Sanibel Mural Selfie Trail.
 *
 * This page combines:
 *   1. A hero section introducing the trail
 *   2. The TRAIL GAMIFICATION section (sign-in, progress, check-ins)
 *   3. An interactive Leaflet map of all 14 locations
 *   4. A full list of all trail stops with addresses and descriptions
 *
 * The TrailClient component is a 'use client' component that manages
 * the interactive trail experience (auth, check-ins, progress tracking).
 * Everything else on this page is a Server Component (renders on the server).
 *
 * C# ANALOGY:
 *   This is like a Razor Page where most of the HTML is server-rendered,
 *   but one section contains a Blazor WebAssembly component for interactivity.
 *   The Server Component parts are like @Html.Partial() — rendered once on the server.
 *   The TrailClient is like a <component type="typeof(TrailApp)" render-mode="WebAssembly" />.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { MURAL_LOCATIONS } from '@/lib/mural-data';
import MuralMapWrapper from '@/components/MuralMapWrapper';
import TrailClient from '@/components/trail/TrailClient';

export const metadata: Metadata = {
  title: 'Mural Selfie Trail',
  description:
    'Follow the Sanibel Mural Selfie Trail — 14 large-scale murals by Rachel Pierce scattered across Sanibel Island, Florida. Visit any 3 to earn a reward at the gallery.',
};

export default function MuralTrailPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(145deg, #145f70 0%, var(--color-teal) 100%)',
          padding: 'clamp(3.5rem, 8vw, 7rem) 0 clamp(2.5rem, 5vw, 4.5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circle */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: 'min(50vw, 480px)',
            height: 'min(50vw, 480px)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'none',
          }}
        />
        <div className="container-site" style={{ position: 'relative', zIndex: 1 }}>
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
            {MURAL_LOCATIONS.length} Stops · Sanibel Island, Florida
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-5xl)',
              fontWeight: 700,
              color: 'var(--color-white)',
              lineHeight: 1.1,
              marginBottom: '1rem',
              maxWidth: '14ch',
            }}
          >
            The Mural Selfie Trail
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
            Rachel Pierce has painted {MURAL_LOCATIONS.length} large-scale murals
            across Sanibel Island. Visit any 3, check in below, and earn a special
            reward at the gallery.
          </p>

          {/* Trail stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
            {[
              { number: String(MURAL_LOCATIONS.length), label: 'Mural Locations' },
              { number: '3', label: 'Visits to Complete' },
              { number: '🎁', label: 'Gallery Reward' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '0.875rem 1.25rem',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-xl)',
                    fontWeight: 700,
                    color: 'var(--color-white)',
                    margin: '0 0 0.2rem',
                    lineHeight: 1,
                  }}
                >
                  {stat.number}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.7)',
                    margin: 0,
                    letterSpacing: '0.05em',
                  }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trail Gamification (Sign-in + Progress + Check-ins) ────────── */}
      {/* This section is the core interactive experience. TrailClient is a
          client component that manages authentication state, check-ins, and
          progress display. It renders different UI based on the user's state. */}
      <section
        aria-label="Mural trail check-in"
        style={{
          backgroundColor: 'var(--color-offwhite)',
          padding: 'clamp(2rem, 4vw, 3rem) 0',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container-site" style={{ maxWidth: '640px' }}>
          <TrailClient />
        </div>
      </section>

      {/* ── Interactive Mural Map ─────────────────────────────────────── */}
      <section
        aria-label="Interactive mural map"
        style={{
          backgroundColor: 'var(--color-offwhite)',
          borderBottom: '1px solid var(--color-border)',
          padding: 'clamp(1.5rem, 3vw, 2.5rem) 0',
        }}
      >
        <div className="container-site">
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-slate-dark)',
              marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
            }}
          >
            Find the Murals
          </h2>
          <MuralMapWrapper />
        </div>
      </section>

      {/* ── Trail stops list ──────────────────────────────────────────── */}
      <section
        aria-labelledby="trail-stops-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
        }}
      >
        <div className="container-site">
          <h2
            id="trail-stops-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-slate-dark)',
              marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            All {MURAL_LOCATIONS.length} Trail Stops
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
            }}
          >
            {MURAL_LOCATIONS.map((mural) => (
              <article
                key={mural.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '1.5rem',
                  alignItems: 'start',
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-xl)',
                  padding: 'clamp(1rem, 2vw, 1.5rem)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {/* Stop number */}
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-teal)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 700,
                      color: 'var(--color-white)',
                    }}
                  >
                    {mural.id}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'var(--text-lg)',
                        fontWeight: 700,
                        color: 'var(--color-slate-dark)',
                        margin: 0,
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
                          letterSpacing: '0.08em',
                          backgroundColor: 'var(--color-teal-light)',
                          padding: '0.2rem 0.6rem',
                          borderRadius: 'var(--radius-full)',
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
                        lineHeight: 1.65,
                        marginBottom: '0.5rem',
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

          {/* Back to murals */}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link
              href="/murals"
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--color-teal)',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              ← Back to All Murals
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
