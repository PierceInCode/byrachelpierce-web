import { describe, expect, it } from 'vitest';
import { parseSize } from '../../scripts/lib/parse-size';

describe('parseSize — accepted formats (Architecture §7.3)', () => {
  const accepted: [string, number, number][] = [
    ['24x36', 24, 36],
    ['24 x 36', 24, 36],
    ['24 X 36', 24, 36],
    ['24" x 36"', 24, 36],
    ['24in x 36in', 24, 36],
    ['24in. x 36 inches', 24, 36],
    ['24inch x 36inch', 24, 36],
    ['24.5 x 36', 24.5, 36],
    ['24.5 x 36.25', 24.5, 36.25],
    ['  24  x  36  ', 24, 36],
    ['8x10', 8, 10],
  ];

  it.each(accepted)('parses %s → %i x %i', (raw, w, h) => {
    const result = parseSize(raw);
    expect(result).toEqual({ ok: true, widthIn: w, heightIn: h });
  });
});

describe('parseSize — rejected inputs go to the error report, never guessed', () => {
  const rejected: string[] = [
    '',
    '   ',
    '36', // single number, no separator
    '24 36', // missing separator
    '24×36', // unicode multiplication sign, not ASCII x
    '24 x 36 x 2', // three dimensions — depth is not a paintings.csv field
    'TBD',
    'unknown',
    'two feet',
    '24cm x 36cm', // wrong unit
    "2' x 3'", // feet
    '-24 x 36', // negative
    '0 x 36', // non-positive
    '24 x 0', // non-positive
    '24 x', // missing second dimension
    'x 36', // missing first dimension
    '24 by 36', // "by" not supported
  ];

  it.each(rejected)('rejects %j', (raw) => {
    const result = parseSize(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});
