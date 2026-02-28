/**
 * Story Page — Rachel Pierce's biography and artist background.
 *
 * Sections:
 *  1. Hero with page title
 *  2. Biography narrative
 *  3. Gallery Info
 *  4. Murals mention
 *  5. Press / Media teaser
 *
 * This is a Server Component.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { GALLERY_ADDRESS, SHOP_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Story',
  description:
    'Rachel Pierce — from television on-air talent to full-time artist on Sanibel Island. Discover the story behind the vibrant coastal paintings and 14 island murals.',
};

// ── Shared styles ─────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-nav)',
  fontSize: 'var(--text-xs)',
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--color-teal)',
  marginBottom: '0.625rem',
  display: 'block',
};

const bodyParagraph: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  color: 'var(--color-slate)',
  lineHeight: 1.8,
  marginBottom: '1.25rem',
};

// ── Story Page ────────────────────────────────────────────────────────

export default function StoryPage() {
  return (
    <>
      {/* ════════════════════════════════════════════════════════════
          1. HERO
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Page hero"
        style={{
          backgroundColor: 'var(--color-teal)',
          padding: 'clamp(3.5rem, 8vw, 7rem) 0 clamp(2.5rem, 6vw, 5rem)',
        }}
      >
        <div className="container-site">
          <p style={{ ...sectionLabel, color: 'rgba(255,255,255,0.65)' }}>The Artist</p>
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--text-5xl)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: 'var(--color-white)',
              lineHeight: 1.1,
              maxWidth: '16ch',
            }}
          >
            Rachel Pierce
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'rgba(255,255,255,0.82)',
              marginTop: '1rem',
              maxWidth: '52ch',
              lineHeight: 1.6,
            }}
          >
            Artist. Gallery Owner. Sanibel Island&apos;s most colorful storyteller.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          2. BIOGRAPHY
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="bio-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'clamp(2.5rem, 5vw, 6rem)',
              alignItems: 'start',
            }}
          >
            {/* Portrait placeholder */}
            <div style={{ position: 'sticky', top: '88px' }}>
              <div
                className="img-placeholder"
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 'var(--radius-xl)',
                  maxWidth: '440px',
                }}
                aria-hidden="true"
              >
                Rachel Pierce Portrait
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-slate-light)',
                  letterSpacing: '0.06em',
                  marginTop: '0.875rem',
                  textAlign: 'center',
                }}
              >
                Rachel Pierce in her Sanibel Island gallery
              </p>
            </div>

            {/* Biography text */}
            <div>
              <span style={sectionLabel}>Biography</span>
              <h2
                id="bio-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  color: 'var(--color-slate-dark)',
                  lineHeight: 1.2,
                  marginBottom: '1.75rem',
                }}
              >
                From the Camera to the Canvas
              </h2>

              <p style={bodyParagraph}>
                Before she was known across Sanibel for her vivid paintings of sea turtles,
                roseate spoonbills, and tropical florals, Rachel Pierce was a familiar face
                on television. As an on-air talent, she spent years in front of the camera —
                learning how to tell stories, connect with audiences, and convey emotion
                in an instant.
              </p>
              <p style={bodyParagraph}>
                That same instinct for storytelling found a new home when Rachel made
                the leap to full-time artist. She settled on Sanibel Island — a place
                of extraordinary natural beauty, famous for its shelling beaches,
                wildlife refuges, and unhurried pace — and never looked back.
              </p>
              <p style={bodyParagraph}>
                &ldquo;Sanibel gave me permission to slow down and really look,&rdquo; Rachel says.
                &ldquo;Every sea turtle, every heron, every late-afternoon light on the Gulf — 
                it all demands to be painted.&rdquo;
              </p>
              <p style={bodyParagraph}>
                Her work is unmistakably hers: bold color, confident line, and a joyful
                energy that makes even a quiet beach scene feel alive. Rachel paints in
                a range of media — acrylic, watercolor, mixed media — and her subjects
                span the full breadth of island life: sea life, birds, florals,
                mermaids, palm trees, and the abstract play of light on water.
              </p>
              <p style={{ ...bodyParagraph, marginBottom: 0 }}>
                She is also the creative force behind two sister businesses on Periwinkle Way:
                Pierce&apos;s Paw Paradise, a beloved pet boutique, and Home by Rachel Pierce,
                a coastal home goods and décor shop — each reflecting her signature aesthetic
                and love for the Sanibel lifestyle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          3. GALLERY INFO
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="gallery-heading"
        style={{
          backgroundColor: 'var(--color-offwhite)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            {/* Text */}
            <div style={{ maxWidth: '52ch' }}>
              <span style={sectionLabel}>Visit the Gallery</span>
              <h2
                id="gallery-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  color: 'var(--color-slate-dark)',
                  lineHeight: 1.2,
                  marginBottom: '1.25rem',
                }}
              >
                1571 Periwinkle Way
              </h2>
              <p style={bodyParagraph}>
                The by Rachel Pierce gallery sits at the heart of Sanibel&apos;s arts
                corridor on Periwinkle Way. It&apos;s more than a shop — it&apos;s an
                immersive environment where every wall tells a story.
              </p>
              <p style={{ ...bodyParagraph, marginBottom: '2rem' }}>
                Walk in to see original works, browse open-edition prints, find gifts
                that capture the island spirit, and meet the artist herself on many days.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem' }}>
                <Link
                  href="/visit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontFamily: 'var(--font-nav)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: 'var(--color-white)',
                    backgroundColor: 'var(--color-teal)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    textDecoration: 'none',
                    minHeight: '44px',
                    transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  Hours &amp; Events
                </Link>
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
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: 'var(--color-teal)',
                    backgroundColor: 'transparent',
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--radius-full)',
                    border: '2px solid var(--color-teal)',
                    textDecoration: 'none',
                    minHeight: '44px',
                    transition: 'background-color 180ms cubic-bezier(0.16,1,0.3,1), color 180ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  Shop Online ↗
                </a>
              </div>
            </div>

            {/* Details card */}
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-xl)',
                  color: 'var(--color-slate-dark)',
                  marginBottom: '1.25rem',
                }}
              >
                Gallery Details
              </h3>
              <dl style={{ margin: 0 }}>
                {[
                  { label: 'Address', value: GALLERY_ADDRESS },
                  { label: 'Location', value: 'Sanibel Island, FL 33957' },
                  { label: 'Hours', value: 'See our Events & Visit page for current hours' },
                  { label: 'Note', value: 'Walk-ins welcome. Original works, prints, and gifts.' },
                ].map((item) => (
                  <div key={item.label} style={{ marginBottom: '1rem' }}>
                    <dt
                      style={{
                        fontFamily: 'var(--font-nav)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: 'var(--color-teal)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {item.label}
                    </dt>
                    <dd
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--color-slate)',
                        margin: 0,
                        lineHeight: 1.55,
                      }}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          4. MURALS MENTION
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="murals-mention-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
        }}
      >
        <div className="container-site">
          <div style={{ maxWidth: '720px', marginInline: 'auto', textAlign: 'center' }}>
            <span style={{ ...sectionLabel, textAlign: 'center', display: 'block' }}>
              Public Art
            </span>
            <h2
              id="murals-mention-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-slate-dark)',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Painted Into the Island
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--text-base)',
                color: 'var(--color-slate)',
                lineHeight: 1.75,
                marginBottom: '1.25rem',
              }}
            >
              Rachel has left her mark on Sanibel in the most literal way possible —
              with 14 large-scale murals scattered across the island. From the seafront
              at the Lighthouse to the storefronts of Periwinkle Way, her outdoor works
              have become beloved landmarks.
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
              Follow the Sanibel Mural Selfie Trail to visit every location, learn
              the story behind each piece, and collect your mural selfies.
            </p>
            <div
              style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}
            >
              <Link
                href="/murals/trail"
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
                Explore the Mural Trail
              </Link>
              <Link
                href="/murals"
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
                All Murals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          5. PRESS / MEDIA TEASER
      ════════════════════════════════════════════════════════════ */}
      <section
        aria-labelledby="press-teaser-heading"
        style={{
          backgroundColor: 'var(--color-teal-light)',
          padding: 'clamp(3rem, 6vw, 5rem) 0',
          borderTop: '1px solid rgba(54,181,205,0.2)',
        }}
      >
        <div className="container-site">
          <div style={{ textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
            <span style={{ ...sectionLabel, display: 'block', textAlign: 'center' }}>
              Press &amp; Media
            </span>
            <h2
              id="press-teaser-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-3xl)',
                color: 'var(--color-slate-dark)',
                marginBottom: '1rem',
              }}
            >
              Rachel in the News
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
              Rachel&apos;s work and story have been featured in local and regional media
              across Southwest Florida. Visit the Press page for coverage, interviews,
              and media resources.
            </p>
            <Link
              href="/press"
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
              View Press Coverage
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
