// M0 gate: the db:push disarm is probe-proven (audit F8, DECISIONS D7, refutation R1).
// Asserts (1) the unguarded `db:push` script is gone from package.json, (2) `db:push:dev`
// exists, and (3) invoking it with a non-file TURSO_DATABASE_URL refuses: non-zero exit
// and the literal token "DB PUSH REFUSED" in its output. No schema push happens on the
// success path — the refusal IS the success.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const fails = [];
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};
if ('db:push' in scripts) fails.push('unguarded db:push script still present in package.json');
if (!('db:push:dev' in scripts)) fails.push('db:push:dev script missing from package.json');

if (!fails.length) {
  const r = spawnSync('npm', ['run', 'db:push:dev'], {
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

if (fails.length) {
  console.error('PUSH-GUARD FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('PUSH-GUARD OK');
