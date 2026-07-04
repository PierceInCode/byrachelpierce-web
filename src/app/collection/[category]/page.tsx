import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { COLLECTION_CATEGORIES, SHOP_URL, PAGE_SIZE } from '@/lib/constants';
import { getPaintingsByCategory, searchPaintings, getFilterOptions } from '@/lib/art-service';
import { ArtworkGrid } from '@/components/collection/ArtworkGrid';
import { SearchBar } from '@/components/collection/SearchBar';
import { FilterPanel } from '@/components/collection/FilterPanel';
import { Pagination } from '@/components/collection/Pagination';
import { ActiveFilters } from '@/components/collection/ActiveFilters';

// ── Static params for SSG ─────────────────────────────────────────

export async function generateStaticParams() {
  return COLLECTION_CATEGORIES.map((cat) => ({ category: cat.slug }));
}

// ── Dynamic metadata ──────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────

export default async function CollectionCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; medium?: string; tags?: string; page?: string }>;
}) {
  const { category } = await params;
  const sp = await searchParams;
  const cat = COLLECTION_CATEGORIES.find((c) => c.slug === category);

  if (!cat) notFound();

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const query = sp.q ?? '';
  const medium = sp.medium ?? '';
  const tagIds = sp.tags?.split(',').filter(Boolean).map(Number) ?? [];

  const hasSearchFilters = query || medium || tagIds.length > 0;

  // Fetch data
  let paintings;
  let total;

  if (hasSearchFilters) {
    const result = await searchPaintings(
      query,
      { medium: medium || undefined, tagIds: tagIds.length > 0 ? tagIds : undefined },
      { page, limit: PAGE_SIZE },
    );
    paintings = result.paintings;
    total = result.total;
  } else {
    const result = await getPaintingsByCategory(cat.slug, {
      page,
      limit: PAGE_SIZE,
    });
    paintings = result.paintings;
    total = result.total;
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const filterOptions = await getFilterOptions();

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
            {total} original painting{total !== 1 ? 's' : ''} and prints by Rachel Pierce —
            available through our online store or at the gallery on Sanibel Island.
          </p>
        </div>
      </section>

      {/* Artwork Section */}
      <section
        aria-labelledby="artworks-heading"
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(2rem, 4vw, 3rem) 0 clamp(3rem, 6vw, 5rem)',
        }}
      >
        <div className="container-site">
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <Suspense>
              <SearchBar />
            </Suspense>
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
              &larr; All Categories
            </Link>
          </div>

          <Suspense>
            <ActiveFilters
              mediums={filterOptions.mediums}
              tagsByCategory={filterOptions.tagsByCategory}
            />
          </Suspense>

          {/* Main content with filter sidebar */}
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              alignItems: 'flex-start',
            }}
          >
            <Suspense>
              <FilterPanel
                mediums={filterOptions.mediums}
                tagsByCategory={filterOptions.tagsByCategory}
              />
            </Suspense>

            <div style={{ flex: 1, minWidth: 0 }}>
              <ArtworkGrid paintings={paintings} />
              <Suspense>
                <Pagination currentPage={page} totalPages={totalPages} />
              </Suspense>
            </div>
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
              Browse all available works in our online store or visit the gallery on Sanibel Island.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '0.875rem',
              }}
            >
              <a
                href={SHOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-coral"
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
                }}
              >
                Shop Online
              </a>
              <Link
                href="/contact"
                className="btn-ghost-teal"
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
