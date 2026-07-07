// M0 gate: line-ending renormalization proof (audit F13 / legacy DECISIONS 033).
// Passes only when zero tracked files materialize CRLF in the working tree.
import { execSync } from 'node:child_process';

const out = execSync('git ls-files --eol', { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const crlf = out.split('\n').filter((l) => l.includes('w/crlf'));
console.log(`files with CRLF working-tree endings: ${crlf.length}`);
if (crlf.length) {
  console.log(crlf.slice(0, 20).join('\n'));
  console.error('EOL FAIL');
  process.exit(1);
}
console.log('EOL OK');
