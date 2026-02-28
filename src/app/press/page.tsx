/**
 * Press Page — media coverage, press mentions, and media resources.
 * Placeholder — full content to be populated with actual press items.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SOCIAL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Press',
  description:
    'Press coverage, media features, and artist resources for Rachel Pierce — artist and gallery owner on Sanibel Island, Florida.',
};

export default function PressPage() {
  // Sample press placeholder items — replace with real data
  const pressPlaceholders = [
    {
      publication: 'Sanibel-Captiva Islander',
      headline: 'Rachel Pierce Brings Sanibel to Life on Canvas',
      date: 'Coming Soon',
    },
    {
      publication: 'Fort Myers Magazine',
      headline: 'The Artist Who Painted an Island',
      date: 'Coming Soon',
    },
    {
      publication: 'SWFL Living',
      headline: 'Murals, Mermaids & More: Inside Rachel Pierce\'s World',
      date: 'Coming Soon',
    },
  ];

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
            Media &amp; Coverage
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
            Press
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
            Coverage, features, and interviews about Rachel Pierce and her work
            on Sanibel Island.
          </p>
        </div>
      </section>

      {/* Press content */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          {/* Under Construction note */}
          <div
            role="status"
            style={{
              backgroundColor: 'var(--color-teal-light)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem 1.5rem',
              marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
              border: '1px solid rgba(54,181,205,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.875rem',
            }}
          >
            <span style={{ fontSize: '1.25rem' }} aria-hidden="true">📰</span>
            <p
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-teal-dark)',
                margin: 0,
              }}
            >
              Press page under construction — full coverage archive coming soon. For media
              inquiries, please use the{' '}
              <Link
                href="/contact"
                style={{ color: 'var(--color-teal-dark)', fontWeight: 600, textDecoration: 'underline' }}
              >
                Contact page
              </Link>
              .
            </p>
          </div>

          {/* Coming Soon badge */}
          <div style={{ marginBottom: '2rem' }}>
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
                border: '1px solid rgba(54,181,205,0.3)',
              }}
            >
              Coverage Archive Coming Soon
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-slate-dark)',
              marginBottom: '1.5rem',
            }}
          >
            Recent Coverage
          </h2>

          {/* Placeholder press items */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '3.5rem',
            }}
          >
            {pressPlaceholders.map((item) => (
              <article
                key={item.headline}
                style={{
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  border: '1px solid var(--color-border)',
                  opacity: 0.6,
                }}
                aria-label={`Press placeholder: ${item.headline}`}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-teal)',
                    marginBottom: '0.375rem',
                  }}
                >
                  {item.publication}
                </p>
                <h3
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--color-slate-dark)',
                    marginBottom: '0.375rem',
                    lineHeight: 1.3,
                  }}
                >
                  {item.headline}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-slate-light)',
                    margin: 0,
                  }}
                >
                  {item.date}
                </p>
              </article>
            ))}
          </div>

          {/* Media contact / resources */}
          <div
            style={{
              backgroundColor: 'var(--color-offwhite)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem',
              border: '1px solid var(--color-border)',
              maxWidth: '600px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                color: 'var(--color-slate-dark)',
                marginBottom: '0.875rem',
              }}
            >
              Media Resources
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate)',
                lineHeight: 1.65,
                marginBottom: '1.25rem',
              }}
            >
              For press inquiries, interview requests, high-resolution images, or
              artist bios, please reach out via the Contact page or connect on
              social media.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
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
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                Media Inquiry
              </Link>
              <a
                href={SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
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
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--color-teal)',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                Instagram ↗
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
