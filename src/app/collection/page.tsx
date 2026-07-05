import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { getCategoryCards, getAllPaintings, searchPaintings } from '@/lib/art-service';
import { artUrl } from '@/lib/art-url';
import { PAGE_SIZE } from '@/lib/constants';
import { ArtworkGrid } from '@/components/collection/ArtworkGrid';
import { SearchBar } from '@/components/collection/SearchBar';
import { Pagination } from '@/components/collection/Pagination';
import type { CategoryCardData } from '@/types';

// ── Rendering mode ──────────────────────────────────────────────────
// This page reads searchParams (view/q/page) to switch between the
// category grid and the all-paintings browse view — force-dynamic
// makes every request re-run the query rather than serving a static
// snapshot from build time.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Collection',
  description:
    'Browse original paintings and prints by Rachel Pierce — Beach & Coastal, Sea Life, Birds & Wildlife, Florals, and more. Gallery on Sanibel Island, Florida.',
};

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const query = sp.q ?? '';
  const isAllView = sp.view === 'all' || !!query || !!sp.page;

  if (isAllView) {
    const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
    const { paintings, total } = query
      ? await searchPaintings(query, {}, { page, limit: PAGE_SIZE })
      : await getAllPaintings({ page, limit: PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    return (
      <AllPaintingsView paintings={paintings} total={total} page={page} totalPages={totalPages} />
    );
  }

  const categories = await getCategoryCards();
  return <CategoryGridView categories={categories} />;
}

// ── Category grid (default) view ────────────────────────────────────

function CategoryGridView({ categories }: { categories: CategoryCardData[] }) {
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

      {/* Category Grid */}
      <section
        aria-labelledby="categories-heading"
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
              id="categories-heading"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--text-2xl)',
                color: 'var(--color-slate-dark)',
                margin: 0,
              }}
            >
              Browse by Category
            </h2>
            <Link
              href="/collection?view=all"
              className="btn-teal"
              style={{
                fontFamily: 'var(--font-nav)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                letterSpacing: '0.06em',
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-teal)',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                textDecoration: 'none',
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Browse All
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collection/${cat.slug}`}
                className="card-hover"
                style={{
                  display: 'block',
                  borderRadius: 'var(--radius-xl)',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--color-border)',
                  transition:
                    'box-shadow 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    height: '160px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--color-teal-light)',
                  }}
                >
                  {cat.thumbPath ? (
                    <Image
                      src={artUrl(cat.thumbPath)}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
                      style={{ objectFit: 'cover' }}
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
    </>
  );
}

// ── All-paintings (browse all) view ─────────────────────────────────
// Note: ArtworkGrid does not yet accept an `emptyState` prop — that's
// added in a later task. Until then it falls back to its own generic
// built-in empty message when `paintings` is empty.

function AllPaintingsView({
  paintings,
  total,
  page,
  totalPages,
}: {
  paintings: Awaited<ReturnType<typeof getAllPaintings>>['paintings'];
  total: number;
  page: number;
  totalPages: number;
}) {
  return (
    <>
      <section
        style={{
          backgroundColor: 'var(--color-teal)',
          padding: 'clamp(3.5rem, 7vw, 6rem) 0 clamp(2.5rem, 5vw, 4.5rem)',
        }}
      >
        <div className="container-site">
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
            All Paintings
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
            {total} original painting{total !== 1 ? 's' : ''} and prints by Rachel Pierce.
          </p>
        </div>
      </section>
      <section
        style={{
          backgroundColor: 'var(--color-white)',
          padding: 'clamp(2rem, 4vw, 3rem) 0 clamp(3rem, 6vw, 5rem)',
        }}
      >
        <div className="container-site">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
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
                textDecoration: 'none',
              }}
            >
              &larr; Browse by Category
            </Link>
          </div>
          <ArtworkGrid paintings={paintings} />
          <Suspense>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
