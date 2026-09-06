// The two false alarms Smith hit:
//   1. Backfilling yesterday saved fine, then announced "Video was NOT logged"
//      because the confirmation only ever looked at TODAY's rows.
//   2. A slow/timed-out login was reported as "Incorrect password", when the
//      password had never been checked at all.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

// Stands in for the real backend. Rows live in `sheet`; checkPost honours the
// date it is asked about, exactly as the fixed Apps Script now does.
function makeBackend(page, sheet, opts) {
  opts = opts || {};
  return page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const yest = new Date(Date.now() - 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    let payload;

    if (action === 'adminLogin') {
      if (opts.loginSilent) return; // never answer — reproduces a timeout
      payload = u.searchParams.get('pass') === 'correct-horse'
        ? { status: 'success', adminKey: 'k' } : { status: 'denied' };
    } else if (action === 'submit') {
      const wantsY = u.searchParams.get('logYesterday') === '1';
      sheet.push({ name: u.searchParams.get('name'), date: wantsY ? yest : today,
                   post: u.searchParams.get('post'), tiktok: u.searchParams.get('tiktok') || '',
                   insta: u.searchParams.get('insta') || '' });
      payload = { status: 'success' };
    } else if (action === 'checkPost') {
      const asked = (u.searchParams.get('date') || '').trim();
      const checkDate = (asked === yest) ? yest : today;
      const nm = (u.searchParams.get('name') || '').toLowerCase();
      const tk = u.searchParams.get('tiktok') || '', ig = u.searchParams.get('insta') || '';
      const mine = sheet.filter(r => r.name.toLowerCase() === nm && r.date === checkDate);
      const hit = mine.find(r => (tk && r.tiktok === tk) || (ig && r.insta === ig));
      payload = { status:'success', found: !!hit, post: hit ? hit.post : '', todayCount: mine.length };
    } else if (action === 'get') {
      payload = { status:'success', rows: sheet.map(r => ['', r.name, r.date, r.post, r.tiktok, r.insta, '']) };
    } else if (action === 'getCreators') {
      payload = { status:'success', creators:[{ name:'Lawrence', status:'Active', rate:300000 }] };
    } else {
      payload = { status:'success' };
    }
    await route.fulfill({ status:200, contentType:'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  // ── 1. Backfilling yesterday must not be called a failure ──
  console.log('\n=== Logging a video for YESTERDAY ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    const sheet = [];
    await makeBackend(page, sheet);
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(700);

    const toast = await page.evaluate(async () => {
      const yest = yesterdayStr();
      window.graceWindowOpen = () => true;
      const sel = document.getElementById('f-name');
      sel.innerHTML = '<option value="Lawrence">Lawrence</option>';
      sel.value = 'Lawrence';
      allRows = []; rowsLoadFailed = false;
      showPage('submit');
      onNameChange();
      startLogYesterday();
      document.getElementById('f-tiktok').value = 'https://tiktok.com/backfilled';
      doSubmitLog('Lawrence', yest, '1', 'https://tiktok.com/backfilled', '', '', 'Lawrence', false);
      // Wait for the confirm round-trip to settle.
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 250));
        const t = document.querySelector('.toast');
        if (t && t.classList.contains('show')) {
          return { kind: t.className, title: (t.querySelector('.toast-title')||{}).textContent || '' };
        }
      }
      return { kind:'none', title:'(no toast appeared)' };
    });
    console.log('   toast:', toast.title);
    ck('the video is reported as saved, not failed', /NOT logged/i.test(toast.title), false);
    // A success toast has no 'error' class on it.
    ck('it is a success toast, not an error one', /\berror\b/.test(toast.kind), false);
    ck('the row really is in the sheet, dated yesterday',
       sheet.length === 1 && sheet[0].date === new Date(Date.now()-864e5).toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'}),
       true);
    await ctx.close();
  }

  // ── 2. A login that never gets an answer is not a wrong password ──
  console.log('\n=== Signing in when the server does not answer ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await makeBackend(page, [], { loginSilent: true });
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(600);
    const msg = await page.evaluate(async () => {
      showPage('login');
      document.getElementById('login-pass').value = 'correct-horse';
      jsonp = (p, cb) => cb(null, 'timeout');   // exactly what a timeout delivers
      checkLogin();
      await new Promise(r => setTimeout(r, 300));
      return document.getElementById('login-err').textContent;
    });
    console.log('   message:', msg);
    ck('does not claim the password is wrong', /incorrect password/i.test(msg), false);
    ck('says the server could not be reached', /could not reach the server/i.test(msg), true);
    await ctx.close();
  }

  // ── 3. A genuinely wrong password must still say so ──
  console.log('\n=== Signing in with a genuinely wrong password ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await makeBackend(page, []);
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(600);
    const msg = await page.evaluate(async () => {
      showPage('login');
      document.getElementById('login-pass').value = 'wrong';
      checkLogin();
      await new Promise(r => setTimeout(r, 900));
      return document.getElementById('login-err').textContent;
    });
    console.log('   message:', msg);
    ck('still says incorrect password', /incorrect password/i.test(msg), true);
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
