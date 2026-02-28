/**
 * AR Sizing Tool — Coming Soon Page.
 * "See how art looks on your wall before you buy."
 *
 * Includes: styled badge, heading, description, and email signup UI (no backend).
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'AR Sizing Tool — Coming Soon',
  description:
    'See how Rachel Pierce\'s artwork looks on your wall before you buy — our AR Sizing Tool is coming soon to byrachelpierce.com.',
};

export default function ARPage() {
  return (
    <>
      {/* Full-page centered layout */}
      <section
        aria-labelledby="ar-heading"
        style={{
          minHeight: 'calc(100dvh - 68px)',
          backgroundColor: 'var(--color-white)',
          display: 'flex',
          alignItems: 'center',
          padding: 'clamp(3rem, 8vw, 6rem) 0',
        }}
      >
        <div className="container-site" style={{ width: '100%' }}>
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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'var(--color-teal-light)',
                color: 'var(--color-teal-dark)',
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                marginBottom: '2rem',
                border: '1px solid rgba(54,181,205,0.35)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-teal)',
                  display: 'inline-block',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
                aria-hidden="true"
              />
              Coming Soon
            </div>

            {/* AR icon placeholder */}
            <div
              className="img-placeholder"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: 'var(--radius-xl)',
                marginInline: 'auto',
                marginBottom: '2rem',
                fontSize: 'var(--text-xs)',
              }}
              aria-hidden="true"
            >
              AR
            </div>

            {/* Heading */}
            <h1
              id="ar-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-4xl)',
                fontWeight: 700,
                color: 'var(--color-slate-dark)',
                lineHeight: 1.15,
                marginBottom: '0.75rem',
              }}
            >
              AR Sizing Tool
            </h1>

            {/* Subheading */}
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-xl)',
                fontStyle: 'italic',
                color: 'var(--color-teal)',
                marginBottom: '1.5rem',
              }}
            >
              See how art looks on your wall before you buy.
            </p>

            {/* Description */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate)',
                lineHeight: 1.75,
                marginBottom: '1rem',
              }}
            >
              We&apos;re building an augmented reality tool that lets you preview
              Rachel Pierce&apos;s artwork at true scale in your own space —
              before you commit to a purchase.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate)',
                lineHeight: 1.75,
                marginBottom: '2.5rem',
              }}
            >
              Point your phone at a wall, choose a painting, and see exactly how
              it will look — complete with true-to-life sizing. Perfect for
              finding the right piece for your home.
            </p>

            {/* Feature highlights */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem',
                textAlign: 'left',
              }}
            >
              {[
                { icon: '📐', label: 'True-to-scale sizing' },
                { icon: '📱', label: 'Works in your browser' },
                { icon: '🎨', label: 'Full collection support' },
              ].map((feature) => (
                <div
                  key={feature.label}
                  style={{
                    backgroundColor: 'var(--color-offwhite)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }} aria-hidden="true">
                    {feature.icon}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-slate)',
                      letterSpacing: '0.04em',
                      lineHeight: 1.4,
                    }}
                  >
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Email signup placeholder (UI only — no backend) */}
            <div
              style={{
                backgroundColor: 'var(--color-teal-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                border: '1px solid rgba(54,181,205,0.25)',
                marginBottom: '2rem',
              }}
            >
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '0.5rem',
                }}
              >
                Be the First to Know
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-slate)',
                  marginBottom: '1.25rem',
                  lineHeight: 1.55,
                }}
              >
                Sign up for early access when the AR tool launches.
              </p>

              {/* Email input + button (UI placeholder — backend TBD) */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.625rem',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="email"
                  placeholder="Your email address"
                  aria-label="Email address for AR tool early access"
                  disabled
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    height: '48px',
                    padding: '0 1rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(54,181,205,0.4)',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-slate)',
                    outline: 'none',
                    cursor: 'not-allowed',
                    opacity: 0.65,
                  }}
                />
                <button
                  type="button"
                  disabled
                  aria-label="Notify me — coming soon"
                  title="Email signup coming soon"
                  style={{
                    height: '48px',
                    padding: '0 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-coral)',
                    color: 'var(--color-white)',
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    border: 'none',
                    cursor: 'not-allowed',
                    opacity: 0.65,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Notify Me
                </button>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-slate-light)',
                  marginTop: '0.625rem',
                  letterSpacing: '0.04em',
                }}
              >
                Email signup integration coming soon.
              </p>
            </div>

            {/* Back to collection */}
            <Link
              href="/collection"
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--color-teal)',
                letterSpacing: '0.06em',
                textDecoration: 'none',
              }}
            >
              ← Browse the Collection Now
            </Link>
          </div>
        </div>
      </section>

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
