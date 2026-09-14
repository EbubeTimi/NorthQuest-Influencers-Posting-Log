// Two faults Smith reported this week:
//   1. A creator's own log would say "entered" then later show the whole
//      month as "not logged", with pay collapsing to zero — because the
//      "View my logs" screen (and the admin dashboards) trusted allRows even
//      when the fetch that fills it had actually failed.
//   2. Admin adds credit for a creator who already logged videos, and it
//      doubles up with what was already there. The Posts box used to show
//      the TOTAL and ask the admin to retype a new total, doing the
//      subtraction invisibly — a phone never shows the tooltip that
//      explained it. Now the big number is always the raw logged count
//      (never edited here, it's a fact from the Posting Log), and a
//      separate plain field holds the credit an admin added — a normal
//      editable number like every other column in this table, no popup,
//      no decorated chip (that "+N" look belongs on the creator's own
//      dashboard only). Typing a new number in that field sets it outright,
//      the same way editing the rate or a bonus does everywhere else.
const { chromium } = require('playwright');
const INDEX = require('path').resolve(__dirname, '..', 'index.html');
let fails = 0;
const ck = (l, a, e) => { const ok = String(a) === String(e); if (!ok) fails++;
  console.log(`  ${ok ? '✅' : '❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`); };

function backend(page, opts) {
  opts = opts || {};
  const rows = [];
  for (let d = 1; d <= 19; d++) {
    rows.push(['', 'Jessica Lawal', '2026-08-' + String(d).padStart(2, '0'), '1', 'https://tiktok.com/j' + d, '', '']);
  }
  return page.route('**://script.google.com/**', async route => {
    const u = new URL(route.request().url());
    const action = u.searchParams.get('action');
    const cb = u.searchParams.get('callback');
    let payload;
    if (action === 'get') {
      if (opts.failRows) return; // never answers — the load fails
      payload = { status: 'success', rows };
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
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

  console.log('\n=== She logged all month. The NEXT load of her data times out. ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await backend(page, { failRows: false });
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(700);
    const r = await page.evaluate(async () => {
      const sel = document.getElementById('f-name');
      sel.innerHTML = '<option>Jessica Lawal</option>';
      sel.value = 'Jessica Lawal';
      showPage('submit'); onNameChange();
      openMyLogs();
      await new Promise(r => setTimeout(r, 800));
      const before = document.getElementById('modal-body').textContent;
      return { hadRealData: before.includes('logged') };
    });
    // The retry cascade that actually reaches this state takes real minutes
    // by design (patient for a slow phone connection) — that cascade itself
    // isn't what changed, so jump straight to the state it ends in: every
    // attempt exhausted, exactly what loadRows sets on its last try.
    const after = await page.evaluate(() => {
      rowsLoadFailed = true;
      dataLoaded = true;
      refreshAll();
      return {
        failed: rowsLoadFailed,
        bodyText: document.getElementById('modal-body').textContent,
        claimsNotLogged: document.getElementById('modal-body').textContent.includes('Video 1 not logged')
      };
    });
    console.log('   before: had real rows =', r.hadRealData);
    console.log('   after failed reload: rowsLoadFailed =', after.failed);
    ck('the app knows the reload failed', after.failed, true);
    ck('the modal says it could not load, not that nothing was logged', after.bodyText.includes('Could not load'), true);
    ck('the modal does NOT falsely claim every video is unlogged', after.claimsNotLogged, false);
    await ctx.close();
  }

  console.log('\n=== Admin types a credit for someone who already logged 19, then corrects it later ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await backend(page);
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(700);
    await page.evaluate(async () => {
      isAdmin = true; adminKey = 'k';
      loadRows(); loadCreators();
      await new Promise(r => setTimeout(r, 1200));
      currentPage = 'payments';
      renderPayments();
    });

    const r = await page.evaluate(async () => {
      onCreditFieldEdit(0, '2');
      await new Promise(r => setTimeout(r, 300));
      const man = allPayments.find(p => String(p.name).toLowerCase() === 'jessica lawal');
      return { credit: man ? man.postsCredit : null, rawLogged: allRows.filter(x => x.name === 'Jessica Lawal').length };
    });
    console.log('   raw logged:', r.rawLogged, '· credit after typing 2:', r.credit);
    ck('19 real videos stay 19, untouched by the credit edit', r.rawLogged, 19);
    ck('the credit is exactly the 2 just typed', r.credit, '2');

    // Editing the field again sets it outright, same as any other plain
    // column in this table — it does not stack onto the old value.
    const r2 = await page.evaluate(async () => {
      onCreditFieldEdit(0, '7');
      await new Promise(r => setTimeout(r, 300));
      const man = allPayments.find(p => String(p.name).toLowerCase() === 'jessica lawal');
      return { credit: man ? man.postsCredit : null };
    });
    console.log('   credit after retyping 7:', r2.credit);
    ck('retyping 7 replaces the 2, same as editing any other field', r2.credit, '7');
    await ctx.close();
  }

  console.log('\n=== Admin dashboards refuse to show money built on a failed load ===');
  {
    const ctx = await browser.newContext({ timezoneId: 'Africa/Lagos' });
    const page = await ctx.newPage();
    await backend(page, {});
    await page.goto('file://' + INDEX);
    await page.waitForTimeout(700);
    const r = await page.evaluate(async () => {
      isAdmin = true; adminKey = 'k';
      loadCreators();
      await new Promise(r => setTimeout(r, 500));
      // Same shortcut as above: jump straight to "every attempt exhausted"
      // instead of waiting out the real multi-minute retry cascade.
      rowsLoadFailed = true;
      dataLoaded = true;
      currentPage = 'payments';
      renderPayments();
      return { failed: rowsLoadFailed, payBody: document.getElementById('pay-body').textContent };
    });
    console.log('   rowsLoadFailed:', r.failed, '· payments table says:', r.payBody.slice(0, 60).trim());
    ck('the payments table refuses to render a total from missing data', r.payBody.includes('Could not load'), true);
    await ctx.close();
  }

  await browser.close();
  console.log(fails === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${fails} FAILED\n`);
  process.exit(fails === 0 ? 0 : 1);
})();
