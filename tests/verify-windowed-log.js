// The admin console used to ask for the entire posting log in one request.
// Measured against the real backend on 15 Sept 2026: reading the sheet costs
// ~5s however much is in it, but shipping the reply fell off a cliff — 0.5MB
// came back in 6s, the full 1.1MB log took 32s on one call and 95s on the
// very next. No client timeout rides that out, so the admin's load failed,
// and every retry made the server redo the whole 95-second job.
//
// The log is now fetched one month at a time, all windows at once. These
// checks prove the three things that matter:
//   1. no single request asks for the whole log any more;
//   2. what lands in allRows is still the COMPLETE log, not a recent slice;
//   3. if any one window fails, the load reports failure rather than quietly
//      handing the payment register a short log and underpaying somebody.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

const lagosToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });

// Six months of log, ending today: the shape that broke in production.
function buildLog() {
  const rows = [];
  const end = new Date(lagosToday() + 'T00:00:00Z');
  const start = new Date(end); start.setMonth(start.getMonth() - 5); start.setDate(1);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const ds = d.toISOString().slice(0, 10);
    for (const who of ['Jessica Lawal', 'Ohia Promise']) {
      rows.push(['2026-01-01T00:00:00Z', who, ds, '1', 'https://tiktok.com/' + who + ds, '', '']);
    }
  }
  return rows;
}

// A backend that understands since/until and reports `earliest`, i.e. the
// deployed Code.gs. `breakMonth` makes one window answer with a server error.
function backend(page, log, seen, breakMonth) {
  const earliest = log.map(r => r[2]).sort()[0];
  let inFlight = 0;
  seen.maxInFlight = 0;
  return page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    let payload;
    if (action === 'get') {
      const since = u.searchParams.get('since') || '';
      const until = u.searchParams.get('until') || '';
      seen.push({ since, until });
      // Hold the reply briefly so overlapping requests are observable —
      // Google serves only about two at a time, so anything the app fires
      // beyond that is just queued ahead of whatever the person does next.
      inFlight++;
      seen.maxInFlight = Math.max(seen.maxInFlight, inFlight);
      await new Promise(r => setTimeout(r, 120));
      inFlight--;
      if (breakMonth && since.slice(0, 7) === breakMonth) {
        payload = { status: 'error', message: 'Service invoked too many times for one day' };
      } else {
        const rows = log.filter(r => (!since || r[2] >= since) && (!until || r[2] <= until));
        payload = { status: 'success', rows, earliest };
      }
    } else if (action === 'getCreators') {
      payload = { status: 'success', creators: [
        { name: 'Jessica Lawal', status: 'Active', added: '2026-02-01', rate: 200000 },
        { name: 'Ohia Promise', status: 'Active', added: '2026-02-01', rate: 200000 }] };
    } else {
      payload = { status: 'success' };
    }
    await route.fulfill({ status: 200, contentType: 'application/javascript',
      body: `${cb}(${JSON.stringify(payload)});` });
  });
}

async function adminLoad(browser, log, seen, breakMonth) {
  const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
  const page = await ctx.newPage();
  await backend(page, log, seen, breakMonth);
  await page.goto('file://' + INDEX);
  await page.waitForTimeout(900);
  seen.length = 0;   // ignore the page's own boot load; measure the admin's
  const out = await page.evaluate(async () => {
    isAdmin = true; adminKey = 'k';
    loadRows();
    await new Promise(r => setTimeout(r, 2500));
    // What the register actually paints is the thing that matters: it must
    // never put a number against somebody's name built on a short log.
    currentPage = 'payments';
    selectedPayMonth = (getMonths() || [])[0] || '';
    renderPayments();
    return {
      rows: allRows.length, failed: rowsLoadFailed, reason: rowsLoadFailedReason,
      payBody: document.getElementById('pay-body').textContent
    };
  });
  return { ctx, out };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const log = buildLog();

  console.log('\n=== The admin loads ' + log.length + ' rows spanning 6 months ===');
  {
    const seen = [];
    const { ctx, out } = await adminLoad(browser, log, seen);
    const askedForEverything = seen.filter(s => !s.since && !s.until).length;
    const widest = Math.max(...seen.map(s => log.filter(r =>
      (!s.since || r[2] >= s.since) && (!s.until || r[2] <= s.until)).length));
    console.log('   requests made:', seen.length, '· rows in the biggest single reply:', widest);
    seen.forEach(s => console.log('     window: since=' + (s.since || '—') + ' until=' + (s.until || '—')));
    ck('every row arrives — the admin still holds the complete log', out.rows, log.length);
    ck('the load is not marked failed', out.failed, false);
    ck('nothing asks for the entire log in one request', askedForEverything, 0);
    ck('6 months are covered in fewer than 6 requests', seen.length < 6, true);
    ck('no single reply carries the whole log', widest < log.length, true);
    // Google serves ~2 at a time; anything more just queues, and everything
    // else the person does queues behind it. Signing in timed out that way.
    ck('never more than 2 requests in flight at once', seen.maxInFlight <= 2, true);
    await ctx.close();
  }

  console.log('\n=== One month fails. A short log must never reach the pay figures ===');
  {
    const broken = lagosToday().slice(0, 7);
    const d = new Date(broken + '-01T00:00:00Z'); d.setMonth(d.getMonth() - 3);
    const breakMonth = d.toISOString().slice(0, 7);
    const seen = [];
    const { ctx, out } = await adminLoad(browser, log, seen, breakMonth);
    console.log('   broke the ' + breakMonth + ' window · failed =', out.failed);
    ck('the load reports failure', out.failed, true);
    ck('the payment register refuses to show figures built on a short log',
      out.payBody.includes('Could not load'), true);
    ck('the real server reason is surfaced, not buried as a dropped connection',
      out.reason, 'Service invoked too many times for one day');
    await ctx.close();
  }

  console.log('\n=== Opening Payments while the page is still loading must not run two loads ===');
  {
    const seen = [];
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await backend(page, log, seen);
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(900);
    seen.length = 0;
    const out = await page.evaluate(async () => {
      isAdmin = true; adminKey = 'k';
      loadRows();                     // page boot
      refreshPaymentsData();          // and the admin lands on Payments
      await new Promise(r => setTimeout(r, 3000));
      return { rows: allRows.length, failed: rowsLoadFailed };
    });
    const single = Math.ceil(6 / 2) + 1;   // 3 spans of two months, plus the probe
    console.log('   requests for two overlapping loads:', seen.length, '(one load alone =', single + ')');
    ck('the second load joins the first instead of doubling the queue', seen.length, single);
    ck('still never more than 2 in flight', seen.maxInFlight <= 2, true);
    ck('and the log still arrives complete', out.rows, log.length);
    ck('not marked failed', out.failed, false);
    await ctx.close();
  }

  console.log('\n=== A creator still gets one small scoped request, never the whole log ===');
  {
    const seen = [];
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await backend(page, log, seen);
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(900);
    seen.length = 0;   // ignore the page's own boot load
    const out = await page.evaluate(async () => {
      loadRows();
      await new Promise(r => setTimeout(r, 1500));
      return { rows: allRows.length, failed: rowsLoadFailed };
    });
    console.log('   requests:', seen.length, '· rows held:', out.rows, 'of', log.length);
    ck('one request only', seen.length, 1);
    ck('scoped to recent months, not the whole log', out.rows < log.length, true);
    ck('and it succeeded', out.failed, false);
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
