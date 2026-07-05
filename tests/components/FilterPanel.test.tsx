// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { FilterPanel } from '@/components/collection/FilterPanel';

const push = vi.fn();
let searchParamsString = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/collection/sea-life',
  useSearchParams: () => new URLSearchParams(searchParamsString),
}));

const mediums = ['Watercolor', 'Acrylic on canvas'];
const tagsByCategory = {
  'Sea Life - Animals': [
    { id: 21, name: 'Sea turtles' },
    { id: 24, name: 'Octopus' },
  ],
};

describe('FilterPanel', () => {
  beforeEach(() => {
    push.mockClear();
    searchParamsString = '';
  });

  // @testing-library/react's afterEach(cleanup) only auto-registers under
  // vitest's `globals` mode, which this repo doesn't enable (tests import
  // from 'vitest' explicitly, per vitest.config.ts). Without an explicit
  // cleanup(), FilterPanel's two "Watercolor" labels (desktop sidebar +
  // whatever renders from a prior test) leak across tests and
  // getAllByLabelText indexing gets unreliable.
  afterEach(() => {
    cleanup();
  });

  it('sets the medium param and clears page when a medium checkbox is toggled on (activate direction)', () => {
    searchParamsString = '';
    render(<FilterPanel mediums={mediums} tagsByCategory={tagsByCategory} />);
    const checkbox = screen.getAllByLabelText('Watercolor')[0] as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(push).toHaveBeenCalledWith('/collection/sea-life?medium=Watercolor');
  });

  it('adds a tag id to the tags param when a tag checkbox is toggled on', () => {
    render(<FilterPanel mediums={mediums} tagsByCategory={tagsByCategory} />);
    fireEvent.click(screen.getAllByLabelText('Sea turtles')[0]);
    expect(push).toHaveBeenCalledWith('/collection/sea-life?tags=21');
  });

  // The brief's original draft toggled the same checkbox on then off within
  // a single render() call, expecting the second click's `push` argument to
  // reflect the "off" state. That can't work here: useSearchParams is
  // mocked to a fixed return value for the whole render, so FilterPanel's
  // `currentMedium` (derived once from searchParams.get('medium')) never
  // flips between the two clicks — both clicks would fire the exact same
  // "activate" branch of toggleMedium's ternary, and the assertion would
  // pass for the wrong reason (or not exercise the deactivate path at all).
  //
  // Fixed by using two separate renders, each seeding `searchParamsString`
  // to the state that should exist *before* the click under test: the test
  // above already covers the activate direction (no filter -> medium set),
  // and this test covers the deactivate direction (medium already active ->
  // cleared), verifying toggleMedium's other ternary branch independently.
  it('clears the medium param entirely when the active medium is toggled off (deactivate direction)', () => {
    searchParamsString = 'medium=Watercolor';
    render(<FilterPanel mediums={mediums} tagsByCategory={tagsByCategory} />);
    const checkbox = screen.getAllByLabelText('Watercolor')[0] as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    fireEvent.click(checkbox);
    // FilterPanel's updateParams always builds `${pathname}?${params.toString()}`
    // unconditionally (unlike Pagination, which has no such guard either, but
    // here the params end up fully empty), so clearing the only param leaves
    // a trailing `?` rather than a bare pathname. Verified by running this
    // test and observing the actual push argument.
    expect(push).toHaveBeenCalledWith('/collection/sea-life?');
  });
});
