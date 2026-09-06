// Simulates a REAL creator's phone: never signed in as admin, so the app
// holds no payment data. Intercepts the JSONP calls with a fake backend so we
// can prove the creator now gets their own figures.
const { chromium } = require('playwright');
const OUT = require('os').tmpdir();
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos', viewport: { width: 430, height: 950 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));

  // Fake the backend: answer every JSONP <script> the page injects.
  await page.route('**://script.google.com/**', async route => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get('action');
    const cb = url.searchParams.get('callback');
    const name = url.searchParams.get('name') || '';
    const adminKey = url.searchParams.get('adminKey') || '';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const ym = today.slice(0, 7);
    let payload;

    if (action === 'get') {
      // rows are arrays: [submitted, name, date, post, tiktok, insta, issues]
      payload = { status:'success', rows:[
        ['2026-09-06T09:00:00Z', 'Tammy', today, '1', 'https://tiktok.com/a', '', '']
      ]};
    } else if (action === 'getCreators') {
      payload = { status:'success', creators:[{ name:'Tammy', status:'Active', rate:300000 }] };
    } else if (action === 'getPayments') {
      // Admin-only. A creator must never get here.
      payload = adminKey ? { status:'success', payments:[] }
                         : { status:'denied', message:'Admin only.' };
    } else if (action === 'getMyPay') {
      globalThis.__myPayCalls = (globalThis.__myPayCalls || 0) + 1;
      payload = { status:'success', payments:[{
        month: ym, name: name,
        bonusViews: '2000000,1000000',           // 500,000 + 250,000
        specialBonus: 'Referral:30000',
        postsCredit: '2'
      }]};
    } else {
      payload = { status:'success' };
    }
    await route.fulfill({ status:200, contentType:'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });

  await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + '');
  await page.waitForTimeout(900);

  ck('creator is NOT admin', await page.evaluate(() => isAdmin), false);
  ck('no payment data held at start', await page.evaluate(() => allPayments.length), 0);

  // Act exactly like the creator: pick the name, tap "View my logs".
  await page.evaluate(() => { showPage('submit'); });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const sel = document.getElementById('f-name');
    sel.innerHTML = '<option value="Tammy">Tammy</option>';
    sel.value = 'Tammy';
    onNameChange();
    openMyLogs();
  });
  await page.waitForTimeout(1200); // let getMyPay come back and re-render

  const tiles = await page.evaluate(() =>
    [...document.querySelectorAll('.mylog-stat')].map(el =>
      el.querySelector('.l').textContent + ' = ' + el.querySelector('.v').textContent));
  console.log('\nWhat the creator now sees on their own phone:');
  tiles.forEach(t => console.log('   ' + t));

  ck('bonus count is real, not zero', tiles.find(t => t.startsWith('Bonuses so far')), 'Bonuses so far = 2');
  ck('bonus amount is real, not zero', tiles.find(t => t.startsWith('Bonus amount')), 'Bonus amount = ₦750,000');
  ck('referral tile shows', tiles.includes('Referral amount = ₦30,000'), true);
  ck('admin-added videos counted', tiles.find(t => t.startsWith('Videos logged')), 'Videos logged = 3');
  ck('+2 chip visible to the creator',
    await page.evaluate(() => (document.querySelector('.admin-chip') || {}).textContent || null), '+2');
  ck('expected amount includes bonuses',
    tiles.find(t => t.startsWith('Amount expected')), 'Amount expected = ₦794,516');
  ck('only THIS creator\'s row was fetched',
    await page.evaluate(() => allPayments.every(p => p.name === 'Tammy')), true);

  await page.locator('#creator-modal').screenshot({ path: OUT + '/creator-sees-pay.png' })
        .catch(() => page.screenshot({ path: OUT + '/creator-sees-pay.png' }));

  ck('no JS errors', errs.length ? errs.join(' | ') : 0, 0);
  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
