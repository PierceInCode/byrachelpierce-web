/**
 * PostToolUse hook: run Prettier on the file the agent just edited/wrote.
 *
 * Scope: src/**, tests/**, scripts/** with ts/tsx/css/mjs extensions.
 * Everything else (docs, configs, CSVs) is left alone — doc formatting
 * churn would fight the guard hook's intent.
 *
 * Fail-open: if Prettier isn't installed yet (pre-R0) or errors, exit 0.
 * `npx --no-install` never downloads anything mid-session.
 */

import { execFileSync } from 'node:child_process';

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks)));
    process.stdin.on('error', () => resolve(Buffer.concat(chunks)));
  });
}

function decode(buf) {
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le');
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf)
    return buf.subarray(3).toString('utf8');
  return buf.toString('utf8');
}

const buf = await readStdin();
try {
  const payload = JSON.parse(decode(buf).trim());
  const raw = payload?.tool_input?.file_path ?? '';
  if (!raw) process.exit(0);

  const norm = String(raw).replaceAll('\\', '/');
  const inScope = /(^|\/)(src|tests|scripts)\//.test(norm) && /\.(ts|tsx|css|mjs)$/.test(norm);
  if (!inScope) process.exit(0);

  execFileSync('npx', ['--no-install', 'prettier', '--write', raw], {
    stdio: 'ignore',
    timeout: 15000,
    shell: process.platform === 'win32', // npx is npx.cmd on Windows
  });
  process.exit(0);
} catch {
  process.exit(0); // fail open — formatting is a convenience, never a blocker
}
