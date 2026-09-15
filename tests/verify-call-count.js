// Every call to the Apps Script backend costs about 2.5 seconds before it has
// sent a single byte. Measured against the live backend, 15 Sept 2026:
//
//   get (creator window, 522KB) ... 4.3s      getBonusTiers (136 bytes) . 2.7s
//   getCreators (7.5KB) .......... 2.6s       getBonusCategories (132 b) 1.9s
//   getMyPay (710 bytes) ......... 2.9s       checkPost (63 bytes) ...... 3.4s
//
// A 136-byte reply taking 2.7 seconds is the whole story: what makes this app
// feel slow is the NUMBER of calls, not their size. The creator journey used
// to re-pull the entire log three times in the few seconds between opening the
// page and picking a name — once at startup, again on selecting the name, and
// again on opening "View my logs" — roughly 1.5MB to learn nothing new.
//
// This pins the call count for a normal creator session so it cannot quietly
// creep back up.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page = await ctx.newPage();
  const calls = [];

  const today = lagosToday();
  await page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    calls.push(action);
    let payload;
    if (action === 'get') {
      payload = { status: 'success', earliest: today,
        rows: [['', 'Jessica Lawal', today, '1', 'https://tiktok.com/a', '', '']] };
    } else if (action === 'getCreators') {
      payload = { status: 'success', creators: [{ name: 'Jessica Lawal', status: 'Active', added: '2026-02-01' }] };
    } else if (action === 'getMyPay') {
      payload = { status: 'success', payments: [], rate: 150000 };
    } else {
      payload = { status: 'success' };
    }
    await route.fulfill({ status: 200, contentType: 'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });

  await page.goto('file://' + INDEX);
  await page.waitForTimeout(1200);

  const onOpen = calls.slice();
  console.log('\n=== Creator opens the page ===');
  onOpen.forEach(c => console.log('   → ' + c));
  ck('the log is fetched once at startup', onOpen.filter(c => c === 'get').length, 1);
  ck('the roster is fetched once', onOpen.filter(c => c === 'getCreators').length, 1);

  console.log('\n=== Creator picks their name from the dropdown ===');
  calls.length = 0;
  await page.evaluate(async () => {
    const sel = document.getElementById('f-name');
    sel.innerHTML = '<option value="Jessica Lawal">Jessica Lawal</option>';
    sel.value = 'Jessica Lawal';
    showPage('submit');
    onNameChange(true);          // true = a real user change of the dropdown
    await new Promise(r => setTimeout(r, 900));
  });
  calls.forEach(c => console.log('   → ' + c));
  ck('picking a name does NOT re-download the whole log', calls.filter(c => c === 'get').length, 0);

  console.log('\n=== Creator taps "View my logs" ===');
  calls.length = 0;
  await page.evaluate(async () => { openMyLogs(); await new Promise(r => setTimeout(r, 900)); });
  calls.forEach(c => console.log('   → ' + c));
  ck('it does not re-download the log either', calls.filter(c => c === 'get').length, 0);
  ck('it fetches only this creator\'s own pay row', calls.filter(c => c === 'getMyPay').length, 1);

  console.log('\n=== Creator switches app and comes back (twice) ===');
  calls.length = 0;
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForTimeout(400);
  }
  calls.forEach(c => console.log('   → ' + c));
  ck('coming back does not re-download the log every time', calls.filter(c => c === 'get').length, 0);

  console.log('\n=== But stale data IS still refreshed ===');
  calls.length = 0;
  const refetched = await page.evaluate(async () => {
    lastRowsFetch = Date.now() - 120000;    // pretend the page has sat open 2 minutes
    loadRowsIfStale();
    await new Promise(r => setTimeout(r, 900));
    return allRows.length;
  });
  calls.forEach(c => console.log('   → ' + c));
  ck('a log older than a minute is re-fetched', calls.filter(c => c === 'get').length, 1);
  ck('and the rows survive the refresh', refetched, 1);

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
