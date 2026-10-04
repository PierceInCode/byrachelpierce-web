// M3 gate: the real domain serves the site from Vercel (Spec §10.2's curl check,
// made a probe): apex returns 200 with a Vercel signature header, www redirects to apex.
const APEX = 'https://byrachelpierce.com';
const WWW = 'https://www.byrachelpierce.com';
const fails = [];

try {
  const r = await fetch(APEX, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
  const vercel =
    r.headers.get('server')?.toLowerCase().includes('vercel') || r.headers.has('x-vercel-id');
  console.log(`${APEX}: ${r.status}, vercel-served: ${vercel}`);
  if (r.status !== 200) fails.push(`apex status ${r.status}`);
  if (!vercel) fails.push('no Vercel signature header on apex response');
} catch (e) {
  fails.push(`apex fetch failed: ${e.message}`);
}

try {
  const w = await fetch(WWW, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const loc = w.headers.get('location') || '';
  console.log(`${WWW}: ${w.status} -> ${loc || '(no location)'}`);
  if (![301, 302, 307, 308].includes(w.status) || !loc.startsWith(APEX))
    fails.push(`www does not redirect to apex (status ${w.status}, location ${loc})`);
} catch (e) {
  fails.push(`www fetch failed: ${e.message}`);
}

if (fails.length) {
  console.error('DOMAIN FAIL:\n- ' + fails.join('\n- '));
  process.exit(1);
}
console.log('DOMAIN OK');
