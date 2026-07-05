// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Pagination } from '@/components/collection/Pagination';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/collection/sea-life',
  useSearchParams: () => new URLSearchParams('tags=3,7'),
}));

describe('Pagination', () => {
  beforeEach(() => {
    push.mockClear();
  });

  // @testing-library/react only auto-registers its afterEach(cleanup) hook
  // when it detects vitest's `globals` mode; this repo's vitest.config.ts
  // doesn't enable globals (tests import from 'vitest' explicitly), so
  // without an explicit cleanup() each render() here leaks into the next
  // test's DOM and queries like getByRole('button', { name: 'Prev' }) fail
  // with "found multiple elements".
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when there is only one page', () => {
    // No @testing-library/jest-dom in this repo (see EmptyState.test.tsx),
    // so assert emptiness on the raw DOM node rather than via
    // `.toBeEmptyDOMElement()`, which isn't a real Chai/vitest matcher here.
    const { container } = render(<Pagination currentPage={1} totalPages={1} />);
    expect(container.innerHTML).toBe('');
  });

  it('navigates to the next page, preserving existing search params', () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    // Verified against real URLSearchParams behavior (node -e):
    // new URLSearchParams('tags=3,7') then .set('page','2') then .toString()
    // percent-encodes the comma as %2C and appends page=2 after tags.
    expect(push).toHaveBeenCalledWith('/collection/sea-life?tags=3%2C7&page=2');
  });

  it('deletes the page param when navigating back to page 1', () => {
    render(<Pagination currentPage={2} totalPages={3} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prev' }));
    expect(push).toHaveBeenCalledWith('/collection/sea-life?tags=3%2C7');
  });

  it('disables Prev on page 1 and Next on the last page', () => {
    render(<Pagination currentPage={1} totalPages={3} />);
    const prev = screen.getByRole('button', { name: 'Prev' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });
});
