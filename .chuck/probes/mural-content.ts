// M2 gate: mural content un-suppression (Architecture §4.4 / Invariant 4).
// Two assertions: (1) all 14 entries in src/lib/mural-data.ts carry a non-empty
// description — the data-presence signal that real content replaced suppression
// (0/14 before the content loop); (2) every mural name appears in the deployed
// trail page HTML. "Real" (vs plausible fiction) is attested by the operator in
// HT2; this probe proves presence and deployment, which a machine can.
// Run with: npx tsx .chuck/probes/mural-content.ts
import { MURAL_LOCATIONS } from '../../src/lib/mural-data';

const BASE = process.env.SMOKE_BASE_URL || 'https://byrachelpierce-web.vercel.app';

async function main(): Promise<void> {
  const withContent = MURAL_LOCATIONS.filter(
    (m) =>
      typeof (m as { description?: string }).description === 'string' &&
      ((m as { description?: string }).description as string).trim().length > 0 &&
      m.name.trim().length > 0,
  );
  console.log(`MURAL CONTENT: ${withContent.length}/14`);

  const res = await fetch(BASE + '/murals/trail', {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  const html = await res.text();
  const deployed = MURAL_LOCATIONS.filter((m) => html.includes(m.name));
  console.log(
    `DEPLOYED (${BASE}/murals/trail, HTTP ${res.status}): ${deployed.length}/14 names found`,
  );

  if (
    MURAL_LOCATIONS.length === 14 &&
    withContent.length === 14 &&
    res.status === 200 &&
    deployed.length === 14
  ) {
    console.log('MURAL GATE OK');
  } else {
    const missing = MURAL_LOCATIONS.filter((m) => !html.includes(m.name)).map((m) => m.id);
    if (missing.length)
      console.log(`names missing from deployed HTML for ids: ${missing.join(', ')}`);
    console.error('MURAL GATE FAIL');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('MURAL GATE FAIL: ' + (e as Error).message);
  process.exit(1);
});
