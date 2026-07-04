/**
 * Homepage — by Rachel Pierce (Server Component)
 *
 * Sections:
 *  1. Hero
 *  2. Featured Collection (category grid)
 *  3. About Teaser ("From Television to Canvas")
 *  4. Mural Trail CTA
 *  5. Shop CTA
 *
 * The CrossSellModule is rendered inside Footer, so it naturally
 * appears on every page between content and the teal footer bar.
 *
 * All hover effects use CSS classes defined in globals.css.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { SHOP_URL, GALLERY_ADDRESS } from '@/lib/constants';
import { getCategoryCards } from '@/lib/art-service';

export const metadata: Metadata = {
  title: 'by Rachel Pierce | Original Art on Sanibel Island',
  description:
    'Original paintings, prints, and murals by Rachel Pierce. Vibrant coastal art — sea turtles, birds, florals, and island life. Visit our gallery on Sanibel Island, Florida.',
};

// ── Shared button styles ──────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
  border: 'none',
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'var(--font-nav)',
  fontSize: 'var(--text-sm)',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-white)',
  backgroundColor: 'transparent',
  padding: '0.875rem 2rem',
  borderRadius: 'var(--radius-full)',
  textDecoration: 'none',
  minHeight: '48px',
  border: '2px solid rgba(255,255,255,0.6)',
  transition: 'border-color 180ms cubic-bezier(0.16,1,0.3,1), background-color 180ms cubic-bezier(0.16,1,0.3,1)',
};

// ── External link icon ────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'middle' }}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

// Featured categories shown on homepage — first 8 to form two rows of 4
const FEATURED_SLUGS = [
  'beach-coastal', 'sea-life', 'birds-wildlife', 'florals',
  'abstracts', 'palm-trees', 'mermaids-whimsy', 'watercolors',
];

// ── Homepage ──────────────────────────────────────────────────────────

export default async function HomePage() {
  const allCategories = await getCategoryCards();
  const featuredCategories = allCategories.filter((c) => FEATURED_SLUGS.includes(c.slug));

  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Hero"
        style={{
          background: 'linear-gradient(160deg, var(--color-teal) 0%, var(--color-teal-dark) 100%)',
          padding: 'clamp(4rem, 10vw, 9rem) 0 clamp(3rem, 8vw, 7rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle decorative circle */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-12%',
            right: '-8%',
            width: 'clamp(300px, 50vw, 600px)',
            height: 'clamp(300px, 50vw, 600px)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-18%',
            left: '-6%',
            width: 'clamp(200px, 35vw, 420px)',
            height: 'clamp(200px, 35vw, 420px)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.08)',
            pointerEvents: 'none',
          }}
        />

        <div className="container-site" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px' }}>
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.7)',
                marginBottom: '1.25rem',
              }}
            >
              Gallery on Sanibel Island, Florida
            </p>

            {/* Main heading */}
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-5xl)',
                fontWeight: 700,
                color: 'var(--color-white)',
                lineHeight: 1.1,
                marginBottom: '1.5rem',
              }}
            >
              Original Art Inspired by Island Life
            </h1>

            {/* Sub-text */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-lg)',
                color: 'rgba(255,255,255,0.88)',
                lineHeight: 1.65,
                marginBottom: '2.5rem',
                maxWidth: '54ch',
              }}
            >
              Rachel Pierce paints the soul of Sanibel — sea turtles, herons, florals,
              and the light that makes this island unforgettable. Original works,
              open-edition prints, and hand-painted murals.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <Link
                href="/collection"
                className="btn-primary"
                style={btnPrimary}
              >
                Explore the Collection
              </Link>
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={btnSecondary}
              >
                Visit Our Store <ExternalLinkIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. FEATURED COLLECTION
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="collection-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          {/* Section header */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '1rem',
              marginBottom: 'clamp(2rem, 4vw, 3rem)',
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-teal)',
                  marginBottom: '0.5rem',
                }}
              >
                Browse by Subject
              </p>
              <h2
                id="collection-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  color: 'var(--color-slate-dark)',
                  margin: 0,
                }}
              >
                The Collection
              </h2>
            </div>
            <Link
              href="/collection"
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
              View All →
            </Link>
          </div>

          {/* Category grid — 4 columns on desktop, 2 on tablet, 1 on mobile */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
            }}
            className="home-category-grid"
          >
            {featuredCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collection/${cat.slug}`}
                aria-label={`Browse ${cat.label} artwork`}
                className="card-hover"
                style={{
                  display: 'block',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)',
                  transition: 'box-shadow 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                {/* Thumbnail image */}
                <div
                  style={{
                    height: '200px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-teal-light)',
                  }}
                >
                  {cat.thumbPath ? (
                    <img
                      src={`/art/${cat.thumbPath}`}
                      alt=""
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div
                      className="img-placeholder"
                      style={{ width: '100%', height: '100%' }}
                      aria-hidden="true"
                    >
                      {cat.label}
                    </div>
                  )}
                </div>

                {/* Card label + count */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--color-slate-dark)',
                      margin: 0,
                    }}
                  >
                    {cat.label}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: '11px',
                      color: 'var(--color-teal)',
                      backgroundColor: 'var(--color-teal-light)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {cat.count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. ABOUT TEASER
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="about-heading"
        style={{
          backgroundColor: 'var(--color-offwhite)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'clamp(2.5rem, 5vw, 5rem)',
              alignItems: 'center',
            }}
          >
            {/* Image placeholder */}
            <div
              className="img-placeholder"
              style={{
                aspectRatio: '4/5',
                borderRadius: 'var(--radius-xl)',
                maxWidth: '420px',
                width: '100%',
              }}
              aria-hidden="true"
            >
              Rachel Pierce
            </div>

            {/* Text */}
            <div style={{ maxWidth: '52ch' }}>
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-teal)',
                  marginBottom: '0.75rem',
                }}
              >
                The Artist
              </p>
              <h2
                id="about-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-4xl)',
                  fontStyle: 'italic',
                  color: 'var(--color-slate-dark)',
                  lineHeight: 1.15,
                  marginBottom: '1.25rem',
                }}
              >
                From Television to Canvas
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-slate)',
                  lineHeight: 1.75,
                  marginBottom: '1rem',
                }}
              >
                Rachel Pierce traded the camera for a paintbrush — and Sanibel Island
                became her muse. A former television on-air personality, Rachel now
                channels her expressive energy into vivid, joyful paintings that
                capture the light, color, and life of Southwest Florida.
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-slate)',
                  lineHeight: 1.75,
                  marginBottom: '2rem',
                }}
              >
                Her gallery at 1571 Periwinkle Way is a destination — filled with
                original works, prints, and the stories behind every piece.
              </p>
              <Link
                href="/story"
                className="btn-teal"
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
                Read Rachel&apos;s Story →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. MURAL TRAIL CTA
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="mural-trail-heading"
        style={{
          background: 'linear-gradient(135deg, #1a7a8f 0%, var(--color-teal) 60%, #4ec9dc 100%)',
          padding: 'clamp(3.5rem, 8vw, 7rem) 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative elements */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '10%',
            right: '-5%',
            width: 'min(45vw, 400px)',
            height: 'min(45vw, 400px)',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.12)',
            pointerEvents: 'none',
          }}
        />

        <div className="container-site" style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            {/* Text content */}
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.65)',
                  marginBottom: '0.75rem',
                }}
              >
                14 Locations Across Sanibel
              </p>
              <h2
                id="mural-trail-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-4xl)',
                  color: 'var(--color-white)',
                  lineHeight: 1.15,
                  marginBottom: '1.25rem',
                }}
              >
                The Sanibel Mural Selfie Trail
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'rgba(255,255,255,0.88)',
                  lineHeight: 1.7,
                  marginBottom: '2rem',
                  maxWidth: '52ch',
                }}
              >
                Rachel has painted 14 large-scale murals across Sanibel Island.
                Follow the trail, snap your selfie, and discover each piece of
                outdoor art that has become part of the island&apos;s identity.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <Link
                  href="/murals/trail"
                  className="btn-primary"
                  style={btnPrimary}
                >
                  Explore the Trail
                </Link>
                <Link href="/murals" style={btnSecondary}>
                  All Murals
                </Link>
              </div>
            </div>

            {/* Mural count display */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              {[
                { number: '14', label: 'Murals' },
                { number: '6+', label: 'Years Painting Sanibel' },
                { number: '100s', label: 'Original Works' },
                { number: '1', label: 'Island. Infinite Inspiration.' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 700,
                      color: 'var(--color-white)',
                      lineHeight: 1,
                      margin: '0 0 0.375rem',
                    }}
                  >
                    {stat.number}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-xs)',
                      color: 'rgba(255,255,255,0.72)',
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. SHOP CTA
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="shop-cta-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
          textAlign: 'center',
        }}
      >
        <div className="container-site">
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-teal)',
              marginBottom: '0.75rem',
            }}
          >
            Shop Original Art &amp; Prints
          </p>
          <h2
            id="shop-cta-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-4xl)',
              color: 'var(--color-slate-dark)',
              lineHeight: 1.2,
              marginBottom: '1rem',
              maxWidth: '18ch',
              marginInline: 'auto',
            }}
          >
            Take a Piece of the Island Home
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-slate)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: '52ch',
              marginInline: 'auto',
            }}
          >
            Original paintings, open-edition prints, and gift-ready works —
            available through our Lightspeed store with secure checkout and
            shipping to your door.
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '1rem',
            }}
          >
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...btnPrimary,
                backgroundColor: 'var(--color-coral)',
              }}
            >
              Browse the Store <ExternalLinkIcon />
            </a>
            <Link
              href="/custom"
              style={{
                ...btnSecondary,
                color: 'var(--color-teal)',
                borderColor: 'var(--color-teal)',
              }}
            >
              Commission a Custom Piece
            </Link>
          </div>

          {/* Gallery address note */}
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-slate-light)',
              letterSpacing: '0.06em',
              marginTop: '2rem',
            }}
          >
            Or visit us in person — {GALLERY_ADDRESS}
          </p>
        </div>
      </section>
    </>
  );
}
