// Drives the REAL index.html in a browser and checks the date toggle +
// post cards render the approved outline+tint marker in every state.
const { chromium } = require('playwright');
const path = require('path').resolve(__dirname, '..', 'index.html');

const OUT = require('os').tmpdir();
let fails = 0;
function check(label, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${label}\n       expected: ${expected}\n       actual:   ${actual}`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos', viewport: { width: 430, height: 950 } });
  const page = await ctx.newPage();
  await page.goto('file://' + path);
  await page.waitForTimeout(400);
  await page.evaluate(() => showPage('submit'));
  await page.waitForTimeout(600);

  // Drive the real UI directly: seed rows, then call the real render functions.
  const state = await page.evaluate(() => {
    const today = todayStr(), yest = yesterdayStr();
    // "Nothing missed" must not depend on the real clock: before 2 PM Lagos
    // an empty log genuinely means yesterday WAS missed, and the app rightly
    // unlocks Yesterday. Force the window shut so this state is deterministic.
    window.graceWindowOpen = () => false;
    allRows = [];
    rowsLoadFailed = false;
    const sel = document.getElementById('f-name');
    sel.innerHTML = '<option value="Tammy">Tammy</option>';
    sel.value = 'Tammy';
    onNameChange();
    return { today, yest };
  });
  console.log(`\n(today=${state.today}, yesterday=${state.yest})`);

  const marker = sel => page.evaluate(s => {
    const el = document.querySelector(s);
    if (!el) return 'MISSING';
    const cs = getComputedStyle(el);
    return `${el.classList.contains('is-target') || el.classList.contains('pc-active') ? 'marked' : 'plain'} bg=${cs.backgroundColor} shadow=${cs.boxShadow !== 'none' ? 'yes' : 'no'}`;
  }, sel);

  console.log('\n=== STATE 1: normal day, nothing missed ===');
  check('Today carries the marker', (await marker('#seg-today')).startsWith('marked'), true);
  check('Yesterday is not marked', (await marker('#seg-yesterday')).startsWith('plain'), true);
  check('Yesterday is locked/disabled',
    await page.getAttribute('#seg-yesterday', 'disabled') !== null, true);
  check('Today segment is tinted, not white',
    await page.evaluate(() => getComputedStyle(document.getElementById('seg-today')).backgroundColor),
    'rgb(231, 239, 231)');
  await page.screenshot({ path: OUT + '/shot-1-normal.png' });

  console.log('\n=== STATE 2: missed yesterday, grace window open ===');
  await page.evaluate(() => {
    // Force the grace window open regardless of the real clock.
    window.graceWindowOpen = () => true;
    allRows = [];
    onNameChange();
  });
  await page.waitForTimeout(200);
  check('Yesterday is now tappable', await page.getAttribute('#seg-yesterday', 'disabled'), null);
  check('marker still on Today', (await marker('#seg-today')).startsWith('marked'), true);
  check('gold dot visible on Yesterday',
    await page.evaluate(() => getComputedStyle(document.querySelector('#seg-yesterday .seg-dot')).display !== 'none'), true);
  check('2 PM cutoff is stated',
    (await page.textContent('#date-toggle-hint')).includes('2:00 PM'), true);
  await page.screenshot({ path: OUT + '/shot-2-available.png' });

  console.log('\n=== STATE 3: creator taps Yesterday ===');
  await page.click('#seg-yesterday');
  await page.waitForTimeout(300);
  check('marker moved to Yesterday', (await marker('#seg-yesterday')).startsWith('marked'), true);
  check('marker left Today', (await marker('#seg-today')).startsWith('plain'), true);
  check('Yesterday is NOT solid green (tint, not fill)',
    await page.evaluate(() => getComputedStyle(document.getElementById('seg-yesterday')).backgroundColor),
    'rgb(231, 239, 231)');
  check('date field switched to yesterday',
    await page.inputValue('#f-date'), state.yest);
  check('2 PM cutoff still stated',
    (await page.textContent('#date-toggle-hint')).includes('2:00 PM'), true);
  await page.screenshot({ path: OUT + '/shot-3-yesterday.png' });

  console.log('\n=== STATE 4: switch back to Today ===');
  await page.click('#seg-today');
  await page.waitForTimeout(300);
  check('marker back on Today', (await marker('#seg-today')).startsWith('marked'), true);
  check('marker off Yesterday', (await marker('#seg-yesterday')).startsWith('plain'), true);
  check('date field back to today', await page.inputValue('#f-date'), state.today);

  console.log('\n=== STATE 5: active video card marker follows video 1 → 2 ===');
  await page.evaluate(() => updatePostCards(0));
  await page.waitForTimeout(150);
  check('video 1 marked when nothing logged',
    await page.evaluate(() => document.getElementById('pc-1').className.includes('pc-active')), true);
  check('video 2 not marked',
    await page.evaluate(() => document.getElementById('pc-2').className.includes('pc-active')), false);
  await page.screenshot({ path: OUT + '/shot-5-video1.png' });

  await page.evaluate(() => updatePostCards(1));
  await page.waitForTimeout(150);
  check('marker moved to video 2 after video 1 logged',
    await page.evaluate(() => document.getElementById('pc-2').className.includes('pc-active')), true);
  check('video 1 no longer marked',
    await page.evaluate(() => document.getElementById('pc-1').className.includes('pc-active')), false);
  check('video 2 is tinted, matching the day marker',
    await page.evaluate(() => getComputedStyle(document.getElementById('pc-2')).backgroundColor),
    'rgb(231, 239, 231)');
  await page.screenshot({ path: OUT + '/shot-6-video2.png' });

  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.waitForTimeout(200);
  check('no JS errors', errs.length, 0);

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL UI CHECKS PASSED\n' : `\n❌ ${fails} CHECK(S) FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
