import type { Painting } from '@/types';
import { ArtworkCard } from './ArtworkCard';
import { EmptyState } from './EmptyState';

interface ArtworkGridProps {
  paintings: Painting[];
  emptyState?: {
    heading: string;
    body: string;
    actionLabel: string;
    actionHref: string;
  };
}

export function ArtworkGrid({ paintings, emptyState }: ArtworkGridProps) {
  if (paintings.length === 0) {
    return (
      <EmptyState
        heading={emptyState?.heading ?? 'No paintings match those filters — yet.'}
        body={emptyState?.body ?? 'Try clearing a filter or browsing everything instead.'}
        actionLabel={emptyState?.actionLabel ?? 'Browse everything'}
        actionHref={emptyState?.actionHref ?? '/collection?view=all'}
      />
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
