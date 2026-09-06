// The full extra-bonus loop: admin names a bonus and sets what one is worth,
// types a count against a creator, and the creator sees the pair on their own
// card. Also proves changing the amount re-prices, and that months are apart.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + INDEX);
  await page.waitForTimeout(700);

  const ym = await page.evaluate(() => todayStr().slice(0, 7));
  const prev = await page.evaluate(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  });

  // Admin defines: Referral ₦30,000 this month, ₦10,000 last month.
  await page.evaluate(([ym, prev]) => {
    bonusCats = [
      { month: ym,   name: 'Referral',     amount: 30000 },
      { month: ym,   name: 'Budget video', amount: 10000 },
      { month: prev, name: 'Referral',     amount: 10000 }
    ];
    bonusCatsLoaded = true;
  }, [ym, prev]);

  console.log('\n=== Typing a count turns into money ===');
  let r = await page.evaluate(([ym]) => {
    // 2 referrals, 3 budget videos, plus a flat one-off with no category.
    const cell = setBonusCount(setBonusCount('Ice cream:20000', 'Referral', '2'), 'Budget video', '3');
    return { cell: cell, parsed: parseExtraBonuses(cell, ym) };
  }, [ym]);
  console.log('   cell text:', r.cell);
  r.parsed.forEach(p => console.log(`   ${p.name}: count=${p.count} each=${p.each} → ₦${p.amount.toLocaleString()}`));
  ck('2 referrals at ₦30,000 = ₦60,000', r.parsed.find(p => p.name === 'Referral').amount, 60000);
  ck('3 budget videos at ₦10,000 = ₦30,000', r.parsed.find(p => p.name === 'Budget video').amount, 30000);
  ck('undefined name stays a flat amount', r.parsed.find(p => p.name === 'Ice cream').amount, 20000);
  ck('flat one-off has no count', r.parsed.find(p => p.name === 'Ice cream').count, null);

  console.log('\n=== Change the amount, the same count re-prices ===');
  r = await page.evaluate(([ym]) => {
    bonusCats = bonusCats.map(c => (c.month === ym && c.name === 'Referral') ? { ...c, amount: 50000 } : c);
    return parseExtraBonuses('Referral:2', ym);
  }, [ym]);
  ck('2 referrals at ₦50,000 = ₦100,000', r[0].amount, 100000);

  console.log('\n=== Last month keeps its own amount ===');
  r = await page.evaluate(([prev]) => parseExtraBonuses('Referral:2', prev), [prev]);
  ck('same 2 referrals last month = ₦20,000', r[0].amount, 20000);

  console.log('\n=== The creator sees the pair on their own card ===');
  const tiles = await page.evaluate(([ym]) => {
    const t = todayStr();
    allCreators = [{ name: 'Tammy', rate: 300000, status: 'Active' }];
    allPayments = [{ month: ym, name: 'Tammy', specialBonus: 'Referral:2, Ice cream:20000', postsCredit: '1' }];
    allRows = [{ name: 'Tammy', date: t, post: '1', tiktok: 'x', insta: '', issues: '' }];
    rowsLoadFailed = false;
    renderMyLogs('Tammy');
    return [...document.querySelectorAll('.mylog-stat')].map(el =>
      el.querySelector('.l').textContent + ' = ' + el.querySelector('.v').textContent);
  }, [ym]);
  tiles.forEach(t => console.log('   ' + t));
  ck('referral count tile', tiles.includes('Referral = 2'), true);
  ck('referral money tile', tiles.includes('Referral amount = ₦100,000'), true);
  ck('flat one-off shows amount only', tiles.includes('Ice cream amount = ₦20,000'), true);
  ck('no count tile for the flat one', tiles.includes('Ice cream = 20000'), false);

  console.log('\n=== A month with no extra bonuses shows none ===');
  const bare = await page.evaluate(([ym]) => {
    bonusCats = [];
    allPayments = [{ month: ym, name: 'Tammy' }];
    renderMyLogs('Tammy');
    return [...document.querySelectorAll('.mylog-stat')].map(el => el.querySelector('.l').textContent);
  }, [ym]);
  ck('back to the six standing tiles', bare.length, 6);
  ck('the six are the permanent ones',
    bare.join(' | '),
    'Videos logged | Monthly target | Rate per video | Amount expected | Bonuses so far | Bonus amount');

  ck('no JS errors', errs.length ? errs.join(' | ') : 0, 0);
  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
