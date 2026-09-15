// Signing in used to leave the dashboard showing 0 total posts, 0 this month,
// 0 today, and 0 against every one of 61 names — because grantAdmin re-pulled
// creators, payments and tiers but never the posting log itself. Before the
// log became per-creator that was survivable: startup had already fetched it.
// Once startup stopped fetching for nobody in particular, nothing did.
//
// A wall of zeros against 61 names does not read as "still loading". It reads
// as nobody having posted all month.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page = await ctx.newPage();
  const t = today();

  await page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    let payload;
    if (action === 'adminLogin') {
      payload = { status:'success', adminKey:'k' };
    } else if (action === 'get') {
      const only = (u.searchParams.get('name') || '').toLowerCase();
      const all = [
        ['', 'Dora Marycynthia Chukwuneche', t, '1', 'https://tiktok.com/a', '', ''],
        ['', 'Dora Marycynthia Chukwuneche', t, '2', 'https://tiktok.com/b', '', ''],
        ['', 'Anita Ugbaja',                 t, '1', 'https://tiktok.com/c', '', '']
      ];
      payload = { status:'success', earliest:t,
        rows: only ? all.filter(r => r[1].toLowerCase() === only) : all };
    } else if (action === 'getCreators') {
      payload = { status:'success', creators:[
        { name:'Dora Marycynthia Chukwuneche', status:'Active', added:'2026-02-01', rate:200000 },
        { name:'Anita Ugbaja',                 status:'Active', added:'2026-02-01', rate:200000 }] };
    } else { payload = { status:'success', payments:[] }; }
    await route.fulfill({ status:200, contentType:'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });

  // She used this phone as a creator first — the worst case, because a
  // creator-scoped load is in the air at the moment he signs in.
  await page.addInitScript(() => {
    try { localStorage.setItem('nq_me', 'Dora Marycynthia Chukwuneche'); } catch (e) {}
  });
  await page.goto('file://' + INDEX);
  await page.waitForTimeout(400);

  console.log('\n=== He signs in while a creator load is still in the air ===');
  await page.evaluate(() => { document.getElementById('login-pass').value = 'whatever'; checkLogin(); });
  await page.waitForTimeout(2500);

  const d = await page.evaluate(() => ({
    total: document.getElementById('d-total').textContent.trim(),
    month: document.getElementById('d-month').textContent.trim(),
    today: document.getElementById('d-today').textContent.trim(),
    body:  document.getElementById('dash-body').textContent,
    rows:  allRows.length,
    admin: isAdmin
  }));
  console.log('   total:', d.total, '· this month:', d.month, '· today:', d.today, '· allRows:', d.rows);

  ck('he is signed in', d.admin, true);
  ck('the log was fetched for the admin, not left as one creator\'s', d.rows, 3);
  ck('total posts is real, not zero', d.total, '3');
  ck('this month is real, not zero', d.month, '3');
  ck('today is real, not zero', d.today, '3');
  ck('the table is not a wall of zeros', /Dora Marycynthia Chukwuneche/.test(d.body), true);

  console.log('\n=== And before anything lands it says so, rather than printing zeros ===');
  const early = await page.evaluate(() => {
    dataLoaded = false; allRows = []; rowsLoadFailed = false;
    renderDashboard();
    return {
      total: document.getElementById('d-total').textContent.trim(),
      body:  document.getElementById('dash-body').textContent.trim()
    };
  });
  console.log('   shows:', early.total, '·', early.body);
  ck('the headline figure is not a zero it cannot vouch for', early.total, '—');
  ck('and it says what it is doing', /fetching/i.test(early.body), true);

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
