import { describe, expect, it } from 'vitest';
import {
  escapeCsvField,
  formatCsvRow,
  formatCsv,
  parseCsv,
  isBlankRow,
} from '../../scripts/lib/csv';

describe('escapeCsvField', () => {
  it('leaves plain values untouched', () => {
    expect(escapeCsvField('Available')).toBe('Available');
    expect(escapeCsvField('24 x 36')).toBe('24 x 36');
    expect(escapeCsvField('')).toBe('');
  });

  it('quotes values containing a comma', () => {
    expect(escapeCsvField('a, b')).toBe('"a, b"');
  });

  it('quotes and doubles embedded double-quotes', () => {
    expect(escapeCsvField('she said "hi"')).toBe('"she said ""hi"""');
  });

  it('quotes values containing newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCsvField('line1\r\nline2')).toBe('"line1\r\nline2"');
  });
});

describe('formatCsvRow / formatCsv', () => {
  it('joins fields with commas', () => {
    expect(formatCsvRow(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('emits a header + rows with a trailing newline', () => {
    const csv = formatCsv([
      ['slug', 'availability'],
      ['sunset-01', 'Sold'],
    ]);
    expect(csv).toBe('slug,availability\nsunset-01,Sold\n');
  });
});

describe('parseCsv', () => {
  it('returns an empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('parses a simple table', () => {
    expect(parseCsv('slug,availability\nsunset-01,Sold\n')).toEqual([
      ['slug', 'availability'],
      ['sunset-01', 'Sold'],
    ]);
  });

  it('does not emit a spurious empty row for a trailing newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']]);
  });

  it('parses a final row with no trailing newline', () => {
    expect(parseCsv('a,b\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('accepts CRLF line endings', () => {
    expect(parseCsv('a,b\r\nc,d\r\n')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('parses quoted fields containing commas', () => {
    expect(parseCsv('id,note\n1,"Periwinkle Way, Sanibel"\n')).toEqual([
      ['id', 'note'],
      ['1', 'Periwinkle Way, Sanibel'],
    ]);
  });

  it('parses embedded doubled quotes', () => {
    expect(parseCsv('id,note\n1,"she said ""hi"""\n')).toEqual([
      ['id', 'note'],
      ['1', 'she said "hi"'],
    ]);
  });

  it('parses newlines inside quoted fields', () => {
    expect(parseCsv('id,desc\n1,"line1\nline2"\n')).toEqual([
      ['id', 'desc'],
      ['1', 'line1\nline2'],
    ]);
  });

  it('preserves empty trailing fields', () => {
    expect(parseCsv('1,,,\n')).toEqual([['1', '', '', '']]);
  });

  it('round-trips through formatCsv', () => {
    const table = [
      ['slug', 'notes'],
      ['a-1', 'plain'],
      ['b-2', 'has, comma'],
      ['c-3', 'has "quotes"'],
      ['d-4', ''],
    ];
    expect(parseCsv(formatCsv(table))).toEqual(table);
  });
});

describe('isBlankRow', () => {
  it('is true for all-empty and whitespace-only rows', () => {
    expect(isBlankRow(['', '', ''])).toBe(true);
    expect(isBlankRow([' ', '\t'])).toBe(true);
  });

  it('is false when any field has content', () => {
    expect(isBlankRow(['', 'x', ''])).toBe(false);
  });
});
