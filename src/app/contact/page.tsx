/**
 * Contact Page — placeholder for contact form and gallery information.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { GALLERY_ADDRESS, SOCIAL, SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with Rachel Pierce — commission a custom painting, ask about gallery hours, or send a message to the studio on Sanibel Island, Florida.',
};

export default function ContactPage() {
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
            Get in Touch
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
            Contact
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
            Questions about a piece, custom commission inquiries, press requests, or
            just want to say hello — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact content */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'clamp(2.5rem, 5vw, 5rem)',
              alignItems: 'start',
            }}
          >
            {/* Contact form placeholder */}
            <div>
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
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(54,181,205,0.3)',
                }}
              >
                Form Coming Soon
              </div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '1rem',
                }}
              >
                Send a Message
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-base)',
                  color: 'var(--color-slate)',
                  lineHeight: 1.7,
                  marginBottom: '2rem',
                }}
              >
                A contact form with email integration is under construction. In the
                meantime, reach Rachel directly through social media or visit the
                gallery on Periwinkle Way.
              </p>

              {/* Form mockup (visual placeholder) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  opacity: 0.4,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
                aria-hidden="true"
              >
                {['Your Name', 'Email Address', 'Subject'].map((placeholder) => (
                  <div key={placeholder}>
                    <div
                      style={{
                        height: '48px',
                        backgroundColor: 'var(--color-offwhite)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        paddingInline: '1rem',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-slate-light)',
                        }}
                      >
                        {placeholder}
                      </span>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    height: '120px',
                    backgroundColor: 'var(--color-offwhite)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    padding: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-slate-light)',
                    }}
                  >
                    Your message...
                  </span>
                </div>
                <div
                  style={{
                    height: '48px',
                    backgroundColor: 'var(--color-coral)',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: 'var(--color-white)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Send Message
                  </span>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-2xl)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '1.5rem',
                }}
              >
                Find Us
              </h2>

              {/* Address card */}
              <div
                style={{
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.5rem',
                  border: '1px solid var(--color-border)',
                  marginBottom: '1.5rem',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-teal)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Gallery Location
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-slate-dark)',
                    fontWeight: 600,
                    marginBottom: '0.25rem',
                    lineHeight: 1.5,
                  }}
                >
                  {SITE_NAME}
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-slate)',
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {GALLERY_ADDRESS}
                </p>
              </div>

              {/* Social links */}
              <div
                style={{
                  backgroundColor: 'var(--color-offwhite)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.5rem',
                  border: '1px solid var(--color-border)',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--color-teal)',
                    marginBottom: '1rem',
                  }}
                >
                  Follow Rachel
                </h3>
                {[
                  { label: 'Instagram', url: SOCIAL.instagram, handle: '@by_rachelpierce' },
                  { label: 'Facebook', url: SOCIAL.facebook, handle: 'byrachelpierce' },
                  { label: 'YouTube', url: SOCIAL.youtube, handle: '@byrachelpierce' },
                ].map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.625rem 0',
                      borderBottom: '1px solid var(--color-border)',
                      textDecoration: 'none',
                      transition: 'color 180ms cubic-bezier(0.16,1,0.3,1)',
                      minHeight: '44px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-nav)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 500,
                        color: 'var(--color-slate)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {social.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-nav)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-teal)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {social.handle} ↗
                    </span>
                  </a>
                ))}
              </div>

              {/* Custom orders CTA */}
              <div style={{ marginTop: '1.5rem' }}>
                <Link
                  href="/custom"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'var(--color-coral)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '1.25rem 1.5rem',
                    textDecoration: 'none',
                    transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                    minHeight: '64px',
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-nav)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.75)',
                        margin: '0 0 0.25rem',
                      }}
                    >
                      Want a custom piece?
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 'var(--text-lg)',
                        color: 'var(--color-white)',
                        margin: 0,
                      }}
                    >
                      Commission an Original
                    </p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.25rem' }}>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
