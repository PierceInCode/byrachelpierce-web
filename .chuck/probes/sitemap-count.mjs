// M3 gate: the production sitemap enumerates every published painting (refutation R6).
// Fetches /sitemap.xml from the live domain and asserts the painting-URL count equals
// the expected production count (528 — the same constant prod-verify.mjs asserts).
// Overridable for pre-cutover or fixture runs:
//   node .chuck/probes/sitemap-count.mjs [expected]   (env SITEMAP_BASE_URL)
const BASE = process.env.SITEMAP_BASE_URL || 'https://byrachelpierce.com';
const EXPECTED = Number(process.argv[2] ?? 528);

try {
  const res = await fetch(BASE + '/sitemap.xml', {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  if (res.status !== 200) {
    console.error(`SITEMAP FAIL: HTTP ${res.status} for ${BASE}/sitemap.xml`);
    process.exit(1);
  }
  const xml = await res.text();
  const found = new Set(
    [...xml.matchAll(/<loc>([^<]*\/collection\/painting\/[^<]+)<\/loc>/g)].map((m) => m[1]),
  ).size;
  console.log(`painting URLs in ${BASE}/sitemap.xml: ${found} (expected ${EXPECTED})`);
  if (found !== EXPECTED) {
    console.error('SITEMAP FAIL: painting URL count mismatch');
    process.exit(1);
  }
  console.log(`SITEMAP OK: ${found}/${EXPECTED} painting URLs`);
} catch (e) {
  console.error('SITEMAP FAIL: ' + e.message);
  process.exit(1);
}
