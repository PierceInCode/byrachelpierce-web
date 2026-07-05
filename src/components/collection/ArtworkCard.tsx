import Image from 'next/image';
import Link from 'next/link';
import type { Painting } from '@/types';
import { artUrl } from '@/lib/art-url';

export function ArtworkCard({ painting }: { painting: Painting }) {
  const thumbSrc = painting.thumbPath ? artUrl(painting.thumbPath) : null;

  return (
    <Link
      href={`/collection/painting/${painting.slug}`}
      className="card-hover"
      data-testid="artwork-card"
      style={{
        display: 'block',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        textDecoration: 'none',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-white)',
        transition:
          'box-shadow 180ms cubic-bezier(0.16,1,0.3,1), transform 180ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          position: 'relative',
          aspectRatio: '3/4',
          overflow: 'hidden',
          backgroundColor: 'var(--color-teal-light)',
        }}
      >
        {thumbSrc ? (
          <Image
            src={thumbSrc}
            alt={painting.title}
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
            {painting.title}
          </div>
        )}
      </div>
      <div style={{ padding: '0.875rem 1rem' }}>
        <h3
          data-testid="artwork-title"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--color-slate-dark)',
            margin: 0,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {painting.title}
        </h3>
        {painting.medium && (
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.375rem',
              fontFamily: 'var(--font-nav)',
              fontSize: '11px',
              color: 'var(--color-teal)',
              backgroundColor: 'var(--color-teal-light)',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.04em',
            }}
          >
            {painting.medium}
          </span>
        )}
      </div>
    </Link>
  );
}
