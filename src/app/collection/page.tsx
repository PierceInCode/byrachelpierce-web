'use client';

/**
 * Collection Page — placeholder for the full art gallery.
 *
 * Will eventually display filterable artwork with Lightspeed integration.
 * For now, shows category grid and “coming soon” note.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { COLLECTION_CATEGORIES } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Collection',
  description:
    'Browse original paintings and prints by Rachel Pierce — Beach & Coastal, Sea Life, Birds & Wildlife, Florals, and more. Gallery on Sanibel Island, Florida.',
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  'beach-coastal':    'linear-gradient(135deg, #e0f5fb 0%, #b3e6f2 100%)',
  'sea-life':         'linear-gradient(135deg, #cce9f5 0%, #7ecde8 100%)',
  'birds-wildlife':   'linear-gradient(135deg, #d4f0e8 0%, #88d5c2 100%)',
  'florals':          'linear-gradient(135deg, #fde8e4 0%, #f7b8b0 100%)',
  'abstracts':        'linear-gradient(135deg, #e8e4fd 0%, #c4b0f7 100%)',
  'palm-trees':       'linear-gradient(135deg, #e4f8e0 0%, #a6dfa0 100%)',
  'mermaids-whimsy':  'linear-gradient(135deg, #fde4f5 0%, #f0a8da 100%)',
  'watercolors':      'linear-gradient(135deg, #e4f0fd 0%, #a8c8f0 100%)',
  'line-art':         'linear-gradient(135deg, #f5f0e4 0%, #ddd0a8 100%)',
};

export default function CollectionPage() {
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
            Original Art &amp; Prints
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
            The Collection
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
            Browse Rachel&apos;s full body of work — original paintings, prints, and studies
            organized by subject.
          </p>
        </div>
      </section>

      {/* Coming Soon Banner */}
      <div
        role="status"
        style={{
          backgroundColor: 'var(--color-teal-light)',
          borderBottom: '1px solid rgba(54,181,205,0.25)',
          padding: '1rem 0',
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
            🎨 Full artwork catalog coming soon — browse individual categories below or{' '}
            <a
              href="https://store33134078.company.site/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-teal-dark)', fontWeight: 600, textDecoration: 'underline' }}
            >
              shop our online store
            </a>{' '}
            now.
          </p>
        </div>
      </div>

      {/* Category Grid */}
      <section
        aria-labelledby="categories-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
        }}
      >
        <div className="container-site">
          <h2
            id="categories-heading"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-2xl)',
              color: 'var(--color-slate-dark)',
              marginBottom: 'clamp(1.5rem, 3vw, 2.5rem)',
            }}
          >
            Browse by Category
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {COLLECTION_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collection/${cat.slug}`}
                style={{
                  display: 'block',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)',
                  transition: 'box-shadow 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = 'var(--shadow-md)';
                  el.style.transform = 'translateY(-3px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.boxShadow = 'var(--shadow-sm)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <div
                  style={{
                    height: '160px',
                    background: CATEGORY_GRADIENTS[cat.slug] ?? 'var(--color-teal-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-sm)',
                      color: 'rgba(80,110,130,0.45)',
                      fontStyle: 'italic',
                    }}
                  >
                    {cat.label}
                  </span>
                </div>
                <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--color-white)' }}>
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
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
