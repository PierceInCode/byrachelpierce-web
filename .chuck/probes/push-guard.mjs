// M0 gate: the db:push disarm is probe-proven (audit F8, DECISIONS D7, refutation R1).
// Asserts:
//   (1) the unguarded `db:push` script is gone from package.json,
//   (2) `db:push:dev` exists,
//   (3) invoking it with a non-file TURSO_DATABASE_URL in process.env refuses:
//       non-zero exit and the literal token "DB PUSH REFUSED" in its output, and
//   (4) F-RG-2: the guard's `.env.local` file-parsing branch (the F-BINK-2 /
//       F-RG-1 code path) genuinely BLOCKS a remote effective URL and ALLOWS a
//       `file:` one — WITHOUT the process.env short-circuit. Prior to this the
//       gate set process.env and returned at db-push-dev.ts's short-circuit
//       BEFORE the `.env.local` branch ran, so it never tested the fixed path.
//
// Check (4) runs the REAL shipped helpers (resolveEffectiveUrl / isLocalFileUrl
// from scripts/db-push-dev.ts) under tsx, with TURSO_DATABASE_URL deleted from
// the child env so resolution falls through to the `.env.local` parse — the
// exact dotenv path drizzle-kit uses. It does NOT mutate the repo's real
// .env.local; it feeds hostile `.env.local`-shaped content directly.
import { readFileSync, writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const fails = [];
const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const scripts = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')).scripts ?? {};
if ('db:push' in scripts) fails.push('unguarded db:push script still present in package.json');
if (!('db:push:dev' in scripts)) fails.push('db:push:dev script missing from package.json');

// (3) End-to-end refusal via the process.env path (unchanged behaviour check).
if (!fails.length) {
  const r = spawnSync('npm', ['run', 'db:push:dev'], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, TURSO_DATABASE_URL: 'libsql://push-guard-probe.invalid' },
    timeout: 60000,
  });
  const out = (r.stdout ?? '') + (r.stderr ?? '');
  console.log(`db:push:dev vs libsql:// URL -> exit ${r.status}`);
  if (r.status === 0) fails.push('db:push:dev exited 0 against a libsql:// URL');
  if (!out.includes('DB PUSH REFUSED'))
    fails.push('refusal token "DB PUSH REFUSED" absent from output');
}

// (4) Exercise the `.env.local` file-parsing branch directly, with NO
// TURSO_DATABASE_URL in process.env so the short-circuit is not taken.
if (!fails.length) {
  const guardModule = pathToFileURL(join(repoRoot, 'scripts', 'db-push-dev.ts')).href;
  // Four hostile `.env.local` shapes that must BLOCK (remote effective URL),
  // plus a `file:` shape that must ALLOW. Each pairs a leading file: line with
  // a remote line that only dotenv (not a naive regex) resolves last-wins:
  //  - export-prefixed remote, inline-comment-after-quoted-remote,
  //  - whitespace-around-`=`+quote+trailing-comment, and a plain duplicate key.
  const cases = [
    {
      label: 'export-prefixed remote',
      content:
        'TURSO_DATABASE_URL=file:./dev.db\nexport TURSO_DATABASE_URL=libsql://push-guard-probe.invalid',
      expectBlock: true,
    },
    {
      label: 'inline-comment after quoted remote',
      content:
        'TURSO_DATABASE_URL=file:./dev.db\nTURSO_DATABASE_URL="libsql://push-guard-probe.invalid" # bad merge',
      expectBlock: true,
    },
    {
      label: 'ws-around-= + quote + trailing comment',
      content:
        'TURSO_DATABASE_URL=file:./dev.db\nTURSO_DATABASE_URL = "libsql://push-guard-probe.invalid"   # oops   ',
      expectBlock: true,
    },
    {
      label: 'plain duplicate key (last is remote)',
      content:
        'TURSO_DATABASE_URL=file:./dev.db\nTURSO_DATABASE_URL=libsql://push-guard-probe.invalid',
      expectBlock: true,
    },
    {
      label: 'file: only',
      content: 'TURSO_DATABASE_URL=file:./dev.db',
      expectBlock: false,
    },
  ];

  const dir = mkdtempSync(join(tmpdir(), 'push-guard-'));
  const entry = join(dir, 'exercise.mts').replace(/\\/g, '/');
  // The entry imports the REAL shipped helpers and prints BLOCK / ALLOW for the
  // content passed on argv, using the exact resolution the guard's main() uses.
  writeFileSync(
    entry,
    [
      `import { resolveEffectiveUrl, isLocalFileUrl } from '${guardModule}';`,
      `const content = Buffer.from(process.argv[2], 'base64').toString('utf8');`,
      `const url = resolveEffectiveUrl(process.env.TURSO_DATABASE_URL, content);`,
      `console.log(isLocalFileUrl(url) ? 'ALLOW' : 'BLOCK');`,
    ].join('\n'),
    'utf8',
  );

  const childEnv = { ...process.env };
  delete childEnv.TURSO_DATABASE_URL; // force the .env.local branch, not the short-circuit

  try {
    for (const c of cases) {
      const r = spawnSync('npx', ['tsx', entry, Buffer.from(c.content).toString('base64')], {
        cwd: repoRoot,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env: childEnv,
        timeout: 60000,
      });
      const verdict = (r.stdout ?? '').trim().split(/\r?\n/).pop();
      const want = c.expectBlock ? 'BLOCK' : 'ALLOW';
      console.log(`.env.local branch [${c.label}] -> ${verdict} (want ${want})`);
      if (r.status !== 0)
        fails.push(`.env.local exercise crashed for "${c.label}": ${(r.stderr ?? '').trim()}`);
      else if (verdict !== want)
        fails.push(`.env.local branch mis-resolved "${c.label}": got ${verdict}, want ${want}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (fails.length) {
  console.error('PUSH-GUARD FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('PUSH-GUARD OK');
