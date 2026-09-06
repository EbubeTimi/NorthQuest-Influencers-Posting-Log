// The two live faults Smith reported, both caused by the creator's browser
// being starved of data the admin's browser receives:
//   1. Ohia is on ₦200,000 but her own card showed ₦2,419 (the ₦150,000
//      default ÷ 62) because the roster withholds rates from non-admins.
//   2. Amaerite could not log yesterday — the whole posting log timed out on
//      her phone, and a failed load locks the grace window.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
const yest  = () => new Date(Date.now() - 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

// Stands in for the deployed Apps Script, including the two fixes: the roster
// still hides rates from non-admins, getMyPay carries the creator's own rate,
// and `get` honours a `since` window.
function backend(page, opts) {
  opts = opts || {};
  const bigLog = [];
  // Two years of everybody — the payload that times out on a phone.
  for (let d = 0; d < 700; d++) {
    const day = new Date(Date.now() - d * 864e5).toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    for (const who of ['Ohia Promise Chiamaka', 'Amaerite H. Biobelemoye', 'Someone Else']) {
      bigLog.push(['', who, day, '1', 'https://tiktok.com/' + who + d, '', '']);
    }
  }
  return page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    const isAdmin = !!u.searchParams.get('adminKey');
    let payload;

    if (action === 'get') {
      const since = u.searchParams.get('since') || '';
      const rows = /^\d{4}-\d{2}-\d{2}$/.test(since)
        ? bigLog.filter(r => r[2] >= since) : bigLog;
      // A phone gives up on an oversized reply. Anything past the cap never
      // arrives, which is precisely what happened to Amaerite.
      if (rows.length > opts.cap) return;          // no answer at all
      payload = { status: 'success', rows };
    } else if (action === 'getCreators') {
      const all = [
        { name:'Ohia Promise Chiamaka', status:'Active', added:'2026-02-01', rate:200000 },
        { name:'Amaerite H. Biobelemoye', status:'Active', added:'2026-02-01', rate:150000 }
      ];
      payload = { status:'success', creators: isAdmin ? all
        : all.map(c => ({ name:c.name, status:c.status, added:c.added })) };  // rate withheld
    } else if (action === 'getMyPay') {
      const nm = (u.searchParams.get('name') || '').toLowerCase();
      const rate = nm.startsWith('ohia') ? 200000 : 150000;
      payload = { status:'success', payments:[{ month: today().slice(0,7), name: u.searchParams.get('name') }],
                  rate: opts.oldBackend ? undefined : rate };
    } else {
      payload = { status:'success' };
    }
    await route.fulfill({ status:200, contentType:'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });
}

async function creatorPage(browser, opts) {
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page = await ctx.newPage();
  await backend(page, opts);
  await page.goto('file://' + INDEX);
  await page.waitForTimeout(600);
  return { ctx, page };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  console.log('\n=== Ohia is on ₦200,000. What does HER phone show? ===');
  {
    const { ctx, page } = await creatorPage(browser, { cap: 5000 });
    const rate = await page.evaluate(async () => {
      const sel = document.getElementById('f-name');
      sel.innerHTML = '<option>Ohia Promise Chiamaka</option>';
      sel.value = 'Ohia Promise Chiamaka';
      showPage('submit'); onNameChange();
      openMyLogs();
      for (let i = 0; i < 40; i++) {
        await new Promise(r => setTimeout(r, 200));
        const t = [...document.querySelectorAll('.mylog-stat')]
          .find(e => e.querySelector('.l').textContent === 'Rate per video');
        if (t && t.querySelector('.v').textContent !== '₦2,419') return t.querySelector('.v').textContent;
      }
      const t = [...document.querySelectorAll('.mylog-stat')]
        .find(e => e.querySelector('.l').textContent === 'Rate per video');
      return t ? t.querySelector('.v').textContent : 'MISSING';
    });
    console.log('   her rate per video:', rate);
    ck('shows ₦3,226, not the ₦2,419 default', rate, '₦3,226');
    await ctx.close();
  }

  console.log('\n=== The same page against the OLD backend (no rate sent) ===');
  {
    const { ctx, page } = await creatorPage(browser, { cap: 5000, oldBackend: true });
    const rate = await page.evaluate(async () => {
      const sel = document.getElementById('f-name');
      sel.innerHTML = '<option>Ohia Promise Chiamaka</option>';
      sel.value = 'Ohia Promise Chiamaka';
      showPage('submit'); onNameChange(); openMyLogs();
      await new Promise(r => setTimeout(r, 1500));
      const t = [...document.querySelectorAll('.mylog-stat')]
        .find(e => e.querySelector('.l').textContent === 'Rate per video');
      return t ? t.querySelector('.v').textContent : 'MISSING';
    });
    console.log('   falls back to:', rate, '(this is why the Apps Script must be deployed)');
    ck('without the deploy it still shows the wrong figure', rate, '₦2,419');
    await ctx.close();
  }

  console.log('\n=== Amaerite: her phone gives up on anything over 400 rows ===');
  {
    const { ctx, page } = await creatorPage(browser, { cap: 400 });
    const r = await page.evaluate(async () => {
      window.graceWindowOpen = () => true;
      const sel = document.getElementById('f-name');
      sel.innerHTML = '<option>Amaerite H. Biobelemoye</option>';
      sel.value = 'Amaerite H. Biobelemoye';
      showPage('submit');
      onNameChange(true);
      await new Promise(r => setTimeout(r, 2500));
      return {
        failed: rowsLoadFailed,
        rows: allRows.length,
        yesterdayLocked: document.getElementById('seg-yesterday').hasAttribute('disabled')
      };
    });
    console.log(`   rows received: ${r.rows} · load failed: ${r.failed} · Yesterday locked: ${r.yesterdayLocked}`);
    ck('the scoped request gets through', r.failed, false);
    ck('Yesterday is offered, not padlocked', r.yesterdayLocked, false);
    await ctx.close();
  }

  console.log('\n=== The admin still receives the whole log ===');
  {
    const { ctx, page } = await creatorPage(browser, { cap: 5000 });
    const n = await page.evaluate(async () => {
      isAdmin = true; adminKey = 'k';
      loadRows();
      await new Promise(r => setTimeout(r, 1800));
      return allRows.length;
    });
    console.log('   admin rows:', n);
    ck('admin sees far more than the creator window', n > 1000, true);
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
