/**
 * Collection Category Page — dynamic route for each artwork category.
 * Handles paths like /collection/beach-coastal, /collection/sea-life, etc.
 *
 * This is a Server Component with generateStaticParams for SSG.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { COLLECTION_CATEGORIES, SHOP_URL } from '@/lib/constants';

// ── Static params for SSG ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return COLLECTION_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

// ── Dynamic metadata ────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = COLLECTION_CATEGORIES.find((c) => c.slug === category);
  if (!cat) return { title: 'Category Not Found' };

  return {
    title: cat.label,
    description: `Browse Rachel Pierce's ${cat.label} artwork — original paintings and prints available from the Sanibel Island gallery.`,
  };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function CollectionCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = COLLECTION_CATEGORIES.find((c) => c.slug === category);

  // Unknown category → 404
  if (!cat) notFound();

  // Placeholder artwork items for the grid
  const placeholderCount = 8;

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
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" style={{ marginBottom: '1rem' }}>
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              <li>
                <Link
                  href="/collection"
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: '0.06em',
                    textDecoration: 'none',
                  }}
                >
                  Collection
                </Link>
              </li>
              <li
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  color: 'rgba(255,255,255,0.4)',
                }}
                aria-hidden="true"
              >
                /
              </li>
              <li>
                <span
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '0.06em',
                  }}
                  aria-current="page"
                >
                  {cat.label}
                </span>
              </li>
            </ol>
          </nav>

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
            {cat.label}
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'rgba(255,255,255,0.82)',
              maxWidth: '52ch',
              lineHeight: 1.65,
            }}
          >
            Original paintings and prints by Rachel Pierce — available through
            our online store or at the gallery on Sanibel Island.
          </p>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <div
        role="status"
        style={{
          backgroundColor: 'var(--color-teal-light)',
          borderBottom: '1px solid rgba(54,181,205,0.25)',
          padding: '0.875rem 0',
        }}
      >
        <div className="container-site">
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-teal-dark)',
              textAlign: 'center',
              margin: 0,
            }}
          >
            Artwork catalog coming soon —{' '}
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-teal-dark)', fontWeight: 600, textDecoration: 'underline' }}
            >
              browse available pieces in our store ↗
            </a>
          </p>
        </div>
      </div>

      {/* Placeholder artwork grid */}
      <section
        aria-labelledby="artworks-heading"
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
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            <h2
              id="artworks-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-slate-dark)',
                margin: 0,
              }}
            >
              {cat.label}
            </h2>
            <Link
              href="/collection"
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-teal)',
                letterSpacing: '0.05em',
                textDecoration: 'none',
              }}
            >
              ← All Categories
            </Link>
          </div>

          {/* Grid of artwork placeholders */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {Array.from({ length: placeholderCount }).map((_, i) => (
              <article
                key={i}
                style={{
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  opacity: 0.55,
                }}
                aria-label={`${cat.label} artwork placeholder ${i + 1}`}
              >
                <div
                  className="img-placeholder"
                  style={{ aspectRatio: '3/4' }}
                  aria-hidden="true"
                >
                  {cat.label}
                </div>
                <div style={{ padding: '1rem 1.25rem' }}>
                  <div
                    style={{
                      height: '0.875rem',
                      backgroundColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      width: '70%',
                      marginBottom: '0.5rem',
                    }}
                    aria-hidden="true"
                  />
                  <div
                    style={{
                      height: '0.75rem',
                      backgroundColor: 'var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      width: '45%',
                    }}
                    aria-hidden="true"
                  />
                </div>
              </article>
            ))}
          </div>

          {/* Shop CTA */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '3rem',
              padding: '2.5rem',
              backgroundColor: 'var(--color-teal-light)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(54,181,205,0.2)',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                fontStyle: 'italic',
                color: 'var(--color-slate-dark)',
                marginBottom: '0.625rem',
              }}
            >
              Looking for a specific {cat.label.toLowerCase()} piece?
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-slate)',
                marginBottom: '1.5rem',
                lineHeight: 1.6,
              }}
            >
              Browse all available works in our online store or visit the gallery
              on Sanibel Island.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.875rem' }}>
              <a
                href={SHOP_URL}
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
                  color: 'var(--color-white)',
                  backgroundColor: 'var(--color-coral)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  minHeight: '44px',
                  transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Shop Online ↗
              </a>
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
                  color: 'var(--color-teal)',
                  backgroundColor: 'transparent',
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: '2px solid var(--color-teal)',
                  textDecoration: 'none',
                  minHeight: '44px',
                }}
              >
                Commission a Custom Piece
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
