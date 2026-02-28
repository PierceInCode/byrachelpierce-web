/**
 * Custom Orders Page — commission a custom painting from Rachel Pierce.
 * Placeholder — will include a commission inquiry form.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Custom Orders',
  description:
    'Commission a custom original painting by Rachel Pierce. Original coastal art made to your specifications — perfect for gifts, home décor, and special occasions.',
};

export default function CustomPage() {
  // Custom order process steps
  const steps = [
    {
      number: '01',
      title: 'Reach Out',
      description:
        'Tell Rachel about your vision — subject, size, color palette, and any special details. The more you share, the better.',
    },
    {
      number: '02',
      title: 'Consultation',
      description:
        'Rachel will discuss the commission, confirm the scope, and provide a quote based on size and complexity.',
    },
    {
      number: '03',
      title: 'Creation',
      description:
        'Rachel brings your vision to life in her signature vibrant style. You may receive progress updates along the way.',
    },
    {
      number: '04',
      title: 'Delivery',
      description:
        'Your original painting is carefully packaged and shipped — or available for pickup at the Sanibel gallery.',
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
            Commission an Original
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
            Custom Orders
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
            Have a specific subject, size, or occasion in mind? Rachel accepts
            commissions for custom original paintings — a meaningful, lasting
            piece created just for you.
          </p>
        </div>
      </section>

      {/* Process */}
      <section
        aria-labelledby="process-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          <div style={{ maxWidth: '860px', marginInline: 'auto' }}>
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
              How It Works
            </p>
            <h2
              id="process-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-slate-dark)',
                marginBottom: 'clamp(2rem, 4vw, 3.5rem)',
              }}
            >
              The Commission Process
            </h2>

            {/* Steps */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: 'clamp(2.5rem, 5vw, 4rem)',
              }}
            >
              {steps.map((step) => (
                <div
                  key={step.number}
                  style={{
                    backgroundColor: 'var(--color-offwhite)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.5rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-3xl)',
                      fontWeight: 700,
                      color: 'var(--color-teal)',
                      lineHeight: 1,
                      marginBottom: '0.75rem',
                      opacity: 0.35,
                    }}
                  >
                    {step.number}
                  </p>
                  <h3
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 'var(--text-lg)',
                      color: 'var(--color-slate-dark)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-slate)',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Under Construction + CTA */}
            <div
              style={{
                textAlign: 'center',
                backgroundColor: 'var(--color-teal-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '2.5rem',
                border: '1px solid rgba(54,181,205,0.25)',
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: 'rgba(54,181,205,0.2)',
                  color: 'var(--color-teal-dark)',
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '0.375rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  marginBottom: '1rem',
                }}
              >
                Commission Form Coming Soon
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '0.875rem',
                }}
              >
                Ready to Commission a Piece?
              </h3>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-slate)',
                  lineHeight: 1.7,
                  marginBottom: '1.75rem',
                  maxWidth: '48ch',
                  marginInline: 'auto',
                }}
              >
                An online commission form is on the way. For now, get in touch
                directly through the Contact page — Rachel will be happy to discuss
                your ideas.
              </p>
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
                  backgroundColor: 'var(--color-coral)',
                  padding: '0.875rem 2rem',
                  borderRadius: 'var(--radius-full)',
                  textDecoration: 'none',
                  minHeight: '48px',
                  transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                Get in Touch →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
