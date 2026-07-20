// M0 gate: anonymous smoke over the public production alias (audit L8). The alias is the
// only anonymously reachable deployment URL (deployment-specific URLs sit behind SSO).
const BASE = process.env.SMOKE_BASE_URL || 'https://byrachelpierce-web.vercel.app';
const ROUTES = ['/', '/collection', '/murals', '/murals/trail'];

let ok = true;
for (const r of ROUTES) {
  try {
    const res = await fetch(BASE + r, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
    console.log(`${r}: ${res.status}`);
    if (res.status !== 200) ok = false;
  } catch (e) {
    console.log(`${r}: FETCH FAILED (${e.message})`);
    ok = false;
  }
}
if (!ok) {
  console.error('SMOKE FAIL');
  process.exit(1);
}
console.log('SMOKE OK');
