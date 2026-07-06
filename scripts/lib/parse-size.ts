/**
 * parse-size — turn a human-entered `physical_size` string into numeric
 * width/height inches for the R4 ingest (Architecture §7.3, §3.3).
 *
 * The contract that matters (Iron Invariant 3 — honesty): we accept ONLY the
 * documented shapes and NEVER guess. Anything we can't parse confidently is
 * returned as an error so the ingest lists it in the report and leaves the row
 * untouched, rather than inventing a size.
 *
 * Accepted (width first, inches assumed):
 *   24x36            24 x 36           24 X 36
 *   24" x 36"        24in x 36in       24in. x 36 inches
 *   24.5 x 36        (decimals allowed)
 *
 * Rejected (→ error report): a single number, three dimensions (depth is not
 * a paintings.csv field), the unicode × sign, feet/cm, non-positive values,
 * and any free text like "TBD".
 */

export type SizeParseResult =
  { ok: true; widthIn: number; heightIn: number } | { ok: false; reason: string };

// One number, optionally followed by an inch unit ("  |  in | in. | inch | inches).
const NUM = String.raw`\d+(?:\.\d+)?`;
const UNIT = String.raw`(?:"|in\.?|inch(?:es)?)?`;
const SIZE_RE = new RegExp(String.raw`^\s*(${NUM})\s*${UNIT}\s*[xX]\s*(${NUM})\s*${UNIT}\s*$`);

/**
 * Parse a raw size string. Returns `{ ok: true, widthIn, heightIn }` on a
 * confident parse, otherwise `{ ok: false, reason }` with a short, log-safe
 * explanation.
 */
export function parseSize(raw: string): SizeParseResult {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: false, reason: 'empty' };
  }

  const match = SIZE_RE.exec(trimmed);
  if (!match) {
    return { ok: false, reason: `unrecognized format: "${trimmed}"` };
  }

  const widthIn = Number(match[1]);
  const heightIn = Number(match[2]);

  // The regex only matches digits, so these are finite; guard the domain.
  if (widthIn <= 0 || heightIn <= 0) {
    return { ok: false, reason: `non-positive dimension: "${trimmed}"` };
  }

  return { ok: true, widthIn, heightIn };
}
