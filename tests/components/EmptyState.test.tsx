// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/collection/EmptyState';

describe('EmptyState', () => {
  it('renders the heading, body, and a link to the action href', () => {
    render(
      <EmptyState
        heading="No paintings match those filters — yet."
        body="Try clearing a filter or searching for something else."
        actionLabel="Clear filters"
        actionHref="/collection/sea-life"
      />,
    );

    // getByText/getByRole already throw (failing the test) if no match is
    // found, so no extra jest-dom matcher (not a sanctioned dependency —
    // Spec §5's R0 dev-dependency list) is needed to assert presence.
    expect(screen.getByText('No paintings match those filters — yet.')).toBeDefined();
    expect(
      screen.getByText('Try clearing a filter or searching for something else.'),
    ).toBeDefined();
    const link = screen.getByRole('link', { name: 'Clear filters' });
    expect(link.getAttribute('href')).toBe('/collection/sea-life');
  });
});
