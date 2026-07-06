/**
 * Minimal, dependency-free CSV reader/writer for the R4 content-intake
 * scripts (Spec §9: "no csv lib — hand-rolled for the fixed schemas").
 *
 * Follows the RFC 4180 rules that matter for hand-edited spreadsheets:
 *   - fields are comma-separated;
 *   - a field is wrapped in double-quotes if it contains a comma, a
 *     double-quote, or a line break;
 *   - a literal double-quote inside a quoted field is written doubled ("").
 * That is exactly what Excel / Google Sheets emit, so a round-trip through
 * either tool is lossless.
 *
 * For C# developers: this is the same job as CsvHelper, just small enough
 * to read in one sitting — no external package (Spec §3 rule 6).
 */

/** True when a raw value must be quoted to survive a CSV round-trip. */
function needsQuoting(value: string): boolean {
  return /[",\r\n]/.test(value);
}

/** Escape a single field for output: quote-and-double only when required. */
export function escapeCsvField(value: string): string {
  if (needsQuoting(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Join one record's fields into a CSV line (no trailing newline). */
export function formatCsvRow(fields: readonly string[]): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Render a full table (header row + data rows) to CSV text, LF-terminated
 * including a trailing newline so the file ends cleanly.
 */
export function formatCsv(rows: readonly (readonly string[])[]): string {
  return rows.map(formatCsvRow).join('\n') + '\n';
}

/**
 * Parse CSV text into rows of string fields. A single-pass state machine so
 * that quoted fields containing commas, embedded double-quotes, and line
 * breaks all parse correctly. Accepts both LF and CRLF line endings.
 *
 * Empty input yields an empty array. A trailing newline does NOT produce a
 * spurious empty final row. Callers are responsible for treating the first
 * row as a header and for skipping all-empty rows (see `isBlankRow`).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let sawAnyChar = false; // did the current record contain any content at all?

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // consume the escaped quote's partner
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    switch (ch) {
      case '"':
        inQuotes = true;
        sawAnyChar = true;
        break;
      case ',':
        row.push(field);
        field = '';
        sawAnyChar = true;
        break;
      case '\r':
        break; // ignore; the paired \n (or lone \r handled below) ends the row
      case '\n':
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        sawAnyChar = false;
        break;
      default:
        field += ch;
        sawAnyChar = true;
        break;
    }
  }

  // Flush a final unterminated record (file not ending in a newline).
  if (sawAnyChar || field !== '') {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/** True when every field in the row is empty — a blank spreadsheet line. */
export function isBlankRow(row: readonly string[]): boolean {
  return row.every((field) => field.trim() === '');
}
