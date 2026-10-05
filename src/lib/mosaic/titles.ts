/**
 * Painting titles as the mosaic shows them.
 *
 * The catalogue stores some titles run together ("ABirder'sDream") and some
 * that are really camera or file names ("IMG 6044 color Corrected"). The
 * mosaic spaces the first kind out and shows the second kind as "Untitled"
 * rather than present a file name as if it were the painting's title.
 */

/** Space out a run-together catalogue title. */
export function spaceTitle(title: string): string {
  return title
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}

/** The title to show for a painting, or "Untitled" when the stored title is a file name. */
export function displayTitle(title: string): string {
  return /^(img|dsc|\d{3,})/i.test(title.trim()) ? 'Untitled' : title;
}
