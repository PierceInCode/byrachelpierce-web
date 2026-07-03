/**
 * PreToolUse hook: block agent edits to specification documents.
 *
 * CLAUDE.md iron rule 8: nothing under docs/ may be edited by the agent,
 * except docs/intake/ (the operator's content drop zone, where the agent
 * writes ingest reports). Exit code 2 blocks the tool call and surfaces
 * the stderr message to the agent; anything else allows the call.
 *
 * Fail-open by design: a hook crash must never break unrelated edits.
 */

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks)));
    process.stdin.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

/** Decode defensively: the host sends UTF-8, but manual testing through
 *  PowerShell 5.1 pipes can produce BOMs or UTF-16 (FogBank precedent). */
function decode(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  // strip UTF-8 BOM if present
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.subarray(3).toString('utf8');
  }
  return buf.toString('utf8');
}

const buf = await readStdin();
try {
  const payload = JSON.parse(decode(buf).trim());
  const raw = payload?.tool_input?.file_path ?? '';
  if (!raw) process.exit(0);

  const parts = String(raw).replaceAll('\\', '/').split('/').filter(Boolean);
  const idx = parts.indexOf('docs');
  if (idx === -1) process.exit(0);

  const underDocs = parts.slice(idx + 1);
  if (underDocs[0] === 'intake') process.exit(0); // operator drop zone + ingest reports are writable

  console.error(
    'BLOCKED by guard-docs hook: files under docs/ are specification documents ' +
      '(CLAUDE.md iron rule 8). Record the problem in DECISIONS.md for the operator ' +
      'instead. Only docs/intake/ is writable.',
  );
  process.exit(2);
} catch {
  process.exit(0); // fail open
}
