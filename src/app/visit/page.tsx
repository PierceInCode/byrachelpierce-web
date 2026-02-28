/**
 * Events & Visit Page — gallery hours, events, and visitor information.
 * Placeholder — full content to be added with events data.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { GALLERY_ADDRESS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Events & Visit',
  description:
    'Visit the by Rachel Pierce gallery on Sanibel Island. Find hours, upcoming events, exhibitions, and everything you need to plan your visit to 1571 Periwinkle Way.',
};

export default function VisitPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          backgroundColor: 'var(--color-teal)',
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
            Plan Your Visit
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
            Events &amp; Visit
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '52ch',
              lineHeight: 1.65,
            }}
          >
            Gallery hours, upcoming events, artist meet-and-greets, and everything
            you need to plan a visit to the gallery on Periwinkle Way.
          </p>
        </div>
      </section>

      {/* Under Construction */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          <div
            style={{
              maxWidth: '640px',
              marginInline: 'auto',
              textAlign: 'center',
            }}
          >
            {/* Coming Soon badge */}
            <div
              style={{
                display: 'inline-block',
                backgroundColor: 'var(--color-teal-light)',
                color: 'var(--color-teal-dark)',
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '0.375rem 1rem',
                borderRadius: 'var(--radius-full)',
                marginBottom: '1.5rem',
                border: '1px solid rgba(54,181,205,0.3)',
              }}
            >
              Under Construction
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-slate-dark)',
                marginBottom: '1rem',
              }}
            >
              Coming Soon
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate)',
                lineHeight: 1.7,
                marginBottom: '1rem',
              }}
            >
              This page will include gallery hours, upcoming exhibitions, artist
              meet-and-greet events, and local tourism information for visitors
              to Sanibel Island.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate)',
                lineHeight: 1.7,
                marginBottom: '2.5rem',
              }}
            >
              In the meantime, find us at{' '}
              <strong style={{ color: 'var(--color-slate-dark)' }}>{GALLERY_ADDRESS}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-teal)',
                  padding: '0.875rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  minHeight: '48px',
                  transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Contact Us
              </Link>
              <Link
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--color-teal)',
                  backgroundColor: 'transparent',
                  padding: '0.875rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--color-teal)',
                  textDecoration: 'none',
                  minHeight: '48px',
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
