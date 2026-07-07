// M2 gate: mural content un-suppression (Architecture §4.4 / Invariant 4).
// Three assertions: (1) all 14 entries in src/lib/mural-data.ts carry a non-empty
// description — the data-presence signal that real content replaced suppression
// (0/14 before the content loop); (2) every mural name appears in the deployed
// trail page HTML; (3) every mural description appears in the deployed HTML
// (normalized to survive HTML entity escaping — refutation R7, supersedes D14(b)'s
// names-only deployed check). "Real" (vs plausible fiction) is attested by the
// operator in HT2; this probe proves presence and deployment, which a machine can.
// Run with: npx tsx .chuck/probes/mural-content.ts
import { MURAL_LOCATIONS } from '../../src/lib/mural-data';

const BASE = process.env.SMOKE_BASE_URL || 'https://byrachelpierce-web.vercel.app';

const descOf = (m: unknown): string =>
  typeof (m as { description?: string }).description === 'string'
    ? ((m as { description?: string }).description as string)
    : '';

// Collapse HTML entities and punctuation so React's text escaping (' -> &#x27; etc.)
// cannot false-fail a straight substring check.
const norm = (s: string): string =>
  s
    .replace(/&[#a-zA-Z0-9]+;/g, ' ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .trim();

async function main(): Promise<void> {
  const withContent = MURAL_LOCATIONS.filter(
    (m) => descOf(m).trim().length > 0 && m.name.trim().length > 0,
  );
  console.log(`MURAL CONTENT: ${withContent.length}/14`);

  const res = await fetch(BASE + '/murals/trail', {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  const html = await res.text();
  const normHtml = norm(html);
  const deployedNames = MURAL_LOCATIONS.filter((m) => html.includes(m.name));
  const deployedDescriptions = MURAL_LOCATIONS.filter(
    (m) => descOf(m).trim().length > 0 && normHtml.includes(norm(descOf(m))),
  );
  console.log(
    `DEPLOYED (${BASE}/murals/trail, HTTP ${res.status}): ${deployedNames.length}/14 names, ${deployedDescriptions.length}/14 descriptions found`,
  );

  if (
    MURAL_LOCATIONS.length === 14 &&
    withContent.length === 14 &&
    res.status === 200 &&
    deployedNames.length === 14 &&
    deployedDescriptions.length === 14
  ) {
    console.log('MURAL GATE OK');
  } else {
    const missingNames = MURAL_LOCATIONS.filter((m) => !html.includes(m.name)).map((m) => m.id);
    if (missingNames.length)
      console.log(`names missing from deployed HTML for ids: ${missingNames.join(', ')}`);
    const missingDescs = MURAL_LOCATIONS.filter(
      (m) => !(descOf(m).trim().length > 0 && normHtml.includes(norm(descOf(m)))),
    ).map((m) => m.id);
    if (missingDescs.length)
      console.log(`descriptions missing from deployed HTML for ids: ${missingDescs.join(', ')}`);
    console.error('MURAL GATE FAIL');
    // process.exitCode (not process.exit): a hard exit mid-teardown of undici's
    // keep-alive sockets crashes libuv on Windows (observed on Node 24).
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('MURAL GATE FAIL: ' + (e as Error).message);
  process.exitCode = 1;
});
