// Drives the REAL index.html modal with seeded data and checks the tiles.
const { chromium } = require('playwright');
const OUT = require('os').tmpdir();
let fails = 0;
const check = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos', viewport: { width: 620, height: 1100 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + '');
  await page.waitForTimeout(700);

  const tiles = await page.evaluate(() => {
    const t = todayStr(), ym = t.slice(0, 7);
    // 4 bonuses totalling 1,300,000 + 2 videos credited by admin.
    allCreators = [{ name: 'Lawrence Emmanuella Inikio', rate: 300000, active: 'yes' }];
    allPayments = [{ month: ym, name: 'Lawrence Emmanuella Inikio',
                     bonusViews: '2000000,2000000,1000000,100000', postsCredit: '2' }];
    allRows = [{ name: 'Lawrence Emmanuella Inikio', date: t, post: '1',
                 tiktok: 'https://tiktok.com/x', insta: '', issues: '' }];
    rowsLoadFailed = false;
    renderMyLogs('Lawrence Emmanuella Inikio');
    return [...document.querySelectorAll('.mylog-stat')].map(el =>
      el.querySelector('.l').textContent + ' = ' + el.querySelector('.v').textContent);
  });
  console.log('\nTiles rendered:');
  tiles.forEach(t => console.log('  ' + t));

  check('exactly 6 tiles', tiles.length, 6);
  check('"Days fully done" is gone', tiles.some(t => t.includes('Days fully done')), false);
  check('Bonuses so far is a count', tiles.find(t => t.startsWith('Bonuses so far')), 'Bonuses so far = 4');
  check('Bonus amount is naira', tiles.find(t => t.startsWith('Bonus amount')), 'Bonus amount = ₦1,300,000');
  check('admin credit counted in Videos logged', tiles.find(t => t.startsWith('Videos logged')), 'Videos logged = 3');
  // The "2 logged by admin." text was replaced by a "+2" corner chip.
  check('admin credit shown as a +2 chip',
    await page.evaluate(() => (document.querySelector('.admin-chip') || {}).textContent || null), '+2');

  await page.locator('.modal-card, #creator-modal .modal-card, #creator-modal > *').first()
            .screenshot({ path: OUT + '/real-bonus-tiles.png' }).catch(async () =>
              await page.screenshot({ path: OUT + '/real-bonus-tiles.png' }));

  // Creator with no bonuses at all — must read 0 and ₦0, not blank or NaN.
  const none = await page.evaluate(() => {
    const t = todayStr(), ym = t.slice(0, 7);
    allPayments = [{ month: ym, name: 'Lawrence Emmanuella Inikio' }];
    renderMyLogs('Lawrence Emmanuella Inikio');
    return [...document.querySelectorAll('.mylog-stat')].map(el =>
      el.querySelector('.l').textContent + ' = ' + el.querySelector('.v').textContent);
  });
  console.log('\nNo bonuses yet:');
  none.forEach(t => console.log('  ' + t));
  check('count reads 0', none.find(t => t.startsWith('Bonuses so far')), 'Bonuses so far = 0');
  check('amount reads ₦0', none.find(t => t.startsWith('Bonus amount')), 'Bonus amount = ₦0');

  check('no JS errors', errs.length ? errs.join(' | ') : 0, 0);
  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
