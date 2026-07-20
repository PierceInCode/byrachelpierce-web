// Gate helper for human-hands result forms: usage
//   node .chuck/probes/ht-result-check.mjs <result-file> <expected-row-count>
// Passes only when the form has exactly the expected number of filled "| Pass |"
// cells and zero "| Fail |" cells — an unfilled form (header-only "Pass/Fail")
// or any failed step does not pass. Cell matching is case-insensitive.
import { readFileSync } from 'node:fs';

const [file, expected] = process.argv.slice(2);
if (!file || !expected) {
  console.error('HT FAIL: usage: ht-result-check.mjs <result-file> <expected-row-count>');
  process.exit(1);
}
let text;
try {
  text = readFileSync(file, 'utf8');
} catch {
  console.error(`HT FAIL: result form not found: ${file} (protocol not yet returned)`);
  process.exit(1);
}
const cells = (re) => (text.match(re) || []).length;
const passes = cells(/\|\s*pass\s*\|/gi);
const fails = cells(/\|\s*fail\s*\|/gi);
console.log(`filled Pass cells: ${passes}/${expected}; Fail cells: ${fails}`);
if (passes === Number(expected) && fails === 0) {
  console.log('HT OK');
} else {
  console.error('HT FAIL');
  process.exit(1);
}
