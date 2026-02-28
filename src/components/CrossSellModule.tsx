'use client';

/**
 * CrossSellModule — "More from Rachel on Sanibel" section.
 * Highlights Rachel's two sister businesses with links.
 * This is a Server Component (no client interactivity needed).
 */

import { SISTER_BUSINESSES } from '@/lib/constants';

// ── External link icon ─────────────────────────────────────────────────────

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
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

interface CrossSellModuleProps {
  /** Override the section background. Defaults to a light teal wash. */
  backgroundColor?: string;
}

export default function CrossSellModule({ backgroundColor }: CrossSellModuleProps) {
  return (
    <section
      aria-label="Sister businesses"
      style={{
        backgroundColor: backgroundColor ?? 'var(--color-teal-light)',
        padding: 'clamp(2.5rem, 6vw, 4.5rem) 0',
      }}
    >
      <div className="container-site">
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-nav)',
              fontSize: 'var(--text-xs)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--color-teal-dark)',
              marginBottom: '0.5rem',
            }}
          >
            The Rachel Pierce Family
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-3xl)',
              color: 'var(--color-slate-dark)',
              margin: 0,
            }}
          >
            More from Rachel on Sanibel
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-base)',
              color: 'var(--color-slate)',
              marginTop: '0.75rem',
              maxWidth: '52ch',
              marginInline: 'auto',
            }}
          >
            Rachel&apos;s creative spirit extends beyond the canvas — discover her
            other beloved Sanibel ventures.
          </p>
        </div>

        {/* Business cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '860px',
            marginInline: 'auto',
          }}
        >
          {SISTER_BUSINESSES.map((business) => (
            <a
              key={business.name}
              href={business.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${business.name} — opens in new tab`}
              style={{
                display: 'block',
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid rgba(54,181,205,0.15)',
                textDecoration: 'none',
                transition: 'box-shadow 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.boxShadow = 'var(--shadow-md)';
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.boxShadow = 'var(--shadow-sm)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Image placeholder */}
              <div
                className="img-placeholder"
                style={{
                  height: '120px',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.25rem',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: '0.1em',
                }}
                aria-hidden="true"
              >
                {business.name.split(' ').slice(0, 2).join(' ')}
              </div>

              {/* Business name */}
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '0.5rem',
                  lineHeight: 1.25,
                }}
              >
                {business.name}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-slate)',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                }}
              >
                {business.description}
              </p>

              {/* Address */}
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-slate-light)',
                  letterSpacing: '0.05em',
                  marginBottom: '1.25rem',
                }}
              >
                📍 {business.address}
              </p>

              {/* CTA */}
              <span
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--color-teal)',
                  letterSpacing: '0.05em',
                }}
              >
                Visit Website <ExternalLinkIcon />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
