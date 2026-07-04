import type { Painting } from '@/types';
import { ArtworkCard } from './ArtworkCard';

export function ArtworkGrid({ paintings }: { paintings: Painting[] }) {
  if (paintings.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--color-slate-light)',
          fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-lg)',
        }}
      >
        No paintings found matching your criteria.
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {paintings.map((painting) => (
        <ArtworkCard key={painting.id} painting={painting} />
      ))}
    </div>
  );
}
