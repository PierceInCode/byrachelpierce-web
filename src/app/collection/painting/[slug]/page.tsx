import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/db';
import { paintings } from '@/db/schema';
import { getPaintingBySlug, getRelatedPaintings } from '@/lib/art-service';
import { artUrl } from '@/lib/art-url';
import { ArtworkGrid } from '@/components/collection/ArtworkGrid';

// ── Static params for SSG ─────────────────────────────────────────

export async function generateStaticParams() {
  const rows = await db.select({ slug: paintings.slug }).from(paintings);
  return rows.map((r) => ({ slug: r.slug }));
}

// ── Dynamic metadata ──────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const painting = await getPaintingBySlug(slug);
  if (!painting) return { title: 'Painting Not Found' };

  return {
    title: painting.title,
    description: `"${painting.title}" — ${painting.medium ?? 'original artwork'} by Rachel Pierce. ${painting.availability ?? 'Available at the Sanibel Island gallery.'}`,
    openGraph: painting.webImagePath ? { images: [artUrl(painting.webImagePath)] } : undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────

export default async function PaintingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const painting = await getPaintingBySlug(slug);

  if (!painting) notFound();

  const related = await getRelatedPaintings(painting.id, 6);

  // Group tags by category for display
  const tagsByCategory: Record<string, string[]> = {};
  for (const t of painting.tags) {
    if (!tagsByCategory[t.categoryName]) {
      tagsByCategory[t.categoryName] = [];
    }
    tagsByCategory[t.categoryName].push(t.tagName);
  }

  return (
    <>
      {/* Hero / breadcrumb strip */}
      <section
        style={{
          backgroundColor: 'var(--color-teal)',
          padding: 'clamp(2rem, 4vw, 3rem) 0',
        }}
      >
        <div className="container-site">
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                listStyle: 'none',
                padding: 0,
                margin: 0,
                flexWrap: 'wrap',
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
                  {painting.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Main content */}
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(2rem, 5vw, 4rem) 0',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '2.5rem',
            }}
            className="painting-detail-grid"
          >
            {/* Image */}
            <div
              style={{
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                backgroundColor: 'var(--color-offwhite)',
                maxWidth: '800px',
                margin: '0 auto',
                width: '100%',
              }}
            >
              {painting.webImagePath && painting.widthPx && painting.heightPx ? (
                <Image
                  src={artUrl(painting.webImagePath)}
                  alt={painting.title}
                  width={painting.widthPx}
                  height={painting.heightPx}
                  sizes="(max-width: 800px) 100vw, 800px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  priority
                />
              ) : painting.webImagePath ? (
                // Dimensions missing for this row — crop into a fixed-aspect
                // box rather than pass a guessed width/height to next/image.
                <div style={{ position: 'relative', aspectRatio: '4/3', width: '100%' }}>
                  <Image
                    src={artUrl(painting.webImagePath)}
                    alt={painting.title}
                    fill
                    sizes="(max-width: 800px) 100vw, 800px"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              ) : (
                <div className="img-placeholder" style={{ aspectRatio: '4/3', width: '100%' }}>
                  {painting.title}
                </div>
              )}
            </div>

            {/* Details */}
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-3xl)',
                  fontWeight: 700,
                  color: 'var(--color-slate-dark)',
                  lineHeight: 1.2,
                  marginBottom: '1rem',
                }}
              >
                {painting.title}
              </h1>

              {/* Meta info */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.625rem',
                  marginBottom: '1.5rem',
                }}
              >
                {painting.medium && (
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: '12px',
                      color: 'var(--color-teal-dark)',
                      backgroundColor: 'var(--color-teal-light)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {painting.medium}
                  </span>
                )}
                {painting.formatType && (
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: '12px',
                      color: 'var(--color-slate)',
                      backgroundColor: 'var(--color-offwhite)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {painting.formatType}
                  </span>
                )}
                {painting.orientation && (
                  <span
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: '12px',
                      color: 'var(--color-slate)',
                      backgroundColor: 'var(--color-offwhite)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--color-border)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {painting.orientation}
                  </span>
                )}
              </div>

              {/* Additional details */}
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: '0.5rem 1.5rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: 'var(--text-sm)',
                  marginBottom: '1.5rem',
                }}
              >
                {painting.physicalSize && (
                  <>
                    <dt style={{ color: 'var(--color-slate-light)', fontWeight: 600 }}>Size</dt>
                    <dd style={{ color: 'var(--color-slate-dark)', margin: 0 }}>
                      {painting.physicalSize}
                    </dd>
                  </>
                )}
                {painting.availability && (
                  <>
                    <dt style={{ color: 'var(--color-slate-light)', fontWeight: 600 }}>
                      Availability
                    </dt>
                    <dd style={{ color: 'var(--color-slate-dark)', margin: 0 }}>
                      {painting.availability}
                    </dd>
                  </>
                )}
                {painting.series && (
                  <>
                    <dt style={{ color: 'var(--color-slate-light)', fontWeight: 600 }}>Series</dt>
                    <dd style={{ color: 'var(--color-slate-dark)', margin: 0 }}>
                      {painting.series}
                    </dd>
                  </>
                )}
                {painting.widthPx && painting.heightPx && (
                  <>
                    <dt style={{ color: 'var(--color-slate-light)', fontWeight: 600 }}>Image</dt>
                    <dd style={{ color: 'var(--color-slate-dark)', margin: 0 }}>
                      {painting.widthPx} &times; {painting.heightPx} px
                    </dd>
                  </>
                )}
              </dl>

              {/* Notes */}
              {painting.notes && (
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-slate)',
                    lineHeight: 1.65,
                    marginBottom: '1.5rem',
                  }}
                >
                  {painting.notes}
                </p>
              )}

              {/* Tags */}
              {painting.tags.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--font-nav)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-slate-dark)',
                      marginBottom: '0.625rem',
                    }}
                  >
                    Tags
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.375rem',
                    }}
                  >
                    {painting.tags.map((t) => (
                      <span
                        key={`${t.categoryName}-${t.tagName}`}
                        style={{
                          fontFamily: 'var(--font-nav)',
                          fontSize: '11px',
                          color: 'var(--color-teal-dark)',
                          backgroundColor: 'var(--color-teal-light)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          letterSpacing: '0.03em',
                        }}
                      >
                        {t.tagName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Back link */}
              <Link
                href="/collection"
                style={{
                  fontFamily: 'var(--font-nav)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-teal)',
                  letterSpacing: '0.05em',
                }}
              >
                &larr; Back to Collection
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related paintings */}
      {related.length > 0 && (
        <section
          style={{
            backgroundColor: 'var(--color-offwhite)',
            padding: 'clamp(2.5rem, 5vw, 4rem) 0',
          }}
        >
          <div className="container-site">
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-slate-dark)',
                marginBottom: 'clamp(1.25rem, 2.5vw, 2rem)',
              }}
            >
              You May Also Like
            </h2>
            <ArtworkGrid paintings={related} />
          </div>
        </section>
      )}
    </>
  );
}
