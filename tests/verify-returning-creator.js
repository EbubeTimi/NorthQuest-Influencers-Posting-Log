// A creator opens this on the same phone as the same person every day. The
// fetch used to wait for the roster to arrive, the dropdown to render, and
// the creator to find their own name in 88 rows — several seconds of dead
// time before the request had even started, on top of the request itself.
// Their name is remembered now, so their rows are on their way at startup,
// in parallel with the roster.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

function backend(page, seen) {
  return page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    if (action === 'get') seen.push({ at: Date.now(), name: u.searchParams.get('name') });
    let payload;
    if (action === 'get') {
      payload = { status:'success', earliest: today(),
        rows: [['', 'Dora Marycynthia Chukwuneche', today(), '1', 'https://tiktok.com/a', '', '']] };
    } else if (action === 'getCreators') {
      await new Promise(r => setTimeout(r, 600));   // the roster is never instant
      payload = { status:'success', creators: [
        { name:'Dora Marycynthia Chukwuneche', status:'Active', added:'2026-02-01' },
        { name:'Someone Else', status:'Active', added:'2026-02-01' }] };
    } else { payload = { status:'success' }; }
    await route.fulfill({ status:200, contentType:'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  console.log('\n=== First ever visit: nobody is remembered yet ===');
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page = await ctx.newPage();
  const seen1 = [];
  await backend(page, seen1);
  await page.goto('file://' + INDEX);
  await page.waitForTimeout(1400);
  ck('nothing is fetched before a name is known', seen1.length, 0);

  await page.evaluate(async () => {
    const sel = document.getElementById('f-name');
    sel.value = 'Dora Marycynthia Chukwuneche';
    onNameChange(true);
    await new Promise(r => setTimeout(r, 700));
  });
  ck('picking a name fetches her rows', seen1.length, 1);
  ck('remembered for next time',
    await page.evaluate(() => safeStorage.getItem('nq_me')), 'Dora Marycynthia Chukwuneche');
  await ctx.close();

  console.log('\n=== She comes back tomorrow, same phone ===');
  const ctx2 = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page2 = await ctx2.newPage();
  const seen2 = [];
  await backend(page2, seen2);
  await page2.addInitScript(() => {
    try { localStorage.setItem('nq_me', 'Dora Marycynthia Chukwuneche'); } catch (e) {}
  });
  const opened = Date.now();
  await page2.goto('file://' + INDEX);
  await page2.waitForTimeout(1600);
  const startedAfter = seen2.length ? seen2[0].at - opened : -1;
  console.log('   her rows were requested ' + startedAfter + 'ms after the page opened');
  ck('her rows start loading at startup, without her touching anything', seen2.length >= 1, true);
  ck('and they are asked for by her name', seen2[0] && seen2[0].name, 'Dora Marycynthia Chukwuneche');
  ck('the request does not wait for the roster (600ms) first', startedAfter < 600, true);

  const state = await page2.evaluate(() => ({
    picked: document.getElementById('f-name').value,
    loadedFor: loadedForName,
    ready: dataLoaded && !rowsLoadFailed
  }));
  console.log('   dropdown shows:', state.picked || '(empty)');
  ck('her name is already selected for her', state.picked, 'Dora Marycynthia Chukwuneche');
  ck('and her rows are the ones held', state.loadedFor, 'Dora Marycynthia Chukwuneche');
  ck('so the page is ready the moment she looks at it', state.ready, true);
  await ctx2.close();

  console.log('\n=== The waiting wording moves while she waits ===');
  const ctx3 = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page3 = await ctx3.newPage();
  const words = await page3.goto('file://' + INDEX).then(async () => {
    await page3.waitForTimeout(500);
    return page3.evaluate(() => {
      logWaitStartedAt = Date.now();
      const a = waitingMessage();
      logWaitStartedAt = Date.now() - 12000;   // twelve seconds in
      const b = waitingMessage();
      logWaitStartedAt = Date.now() - 25000;   // half a minute in
      const c = waitingMessage();
      return [a, b, c];
    });
  });
  words.forEach(w => console.log('   → ' + w));
  ck('it does not say the same thing for thirty seconds', new Set(words).size, 3);
  await ctx3.close();

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
