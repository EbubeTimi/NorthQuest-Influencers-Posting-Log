const { chromium } = require('playwright');
const OUT=require('os').tmpdir();
let f=0; const ck=(l,a,e)=>{const ok=String(a)===String(e); if(!ok)f++;
  console.log(`  ${ok?'✅':'❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`);};
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const ctx=await b.newContext({timezoneId:'Africa/Lagos',viewport:{width:620,height:1150}});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + ''); await p.waitForTimeout(700);

  const run = (pay) => p.evaluate(pm => {
    const t=todayStr(), ym=t.slice(0,7);
    allCreators=[{name:'Tammy',rate:300000,active:'yes'}];
    allPayments=[Object.assign({month:ym,name:'Tammy'},pm)];
    allRows=[{name:'Tammy',date:t,post:'1',tiktok:'x',insta:'',issues:''}];
    rowsLoadFailed=false; renderMyLogs('Tammy');
    return {
      tiles:[...document.querySelectorAll('.mylog-stat')].map(el=>
        el.querySelector('.l').textContent+' = '+el.querySelector('.v').textContent),
      chip:(document.querySelector('.admin-chip')||{}).textContent||null,
      note:(document.querySelector('.mylog-pay-note')||{}).textContent||null,
      expected:[...document.querySelectorAll('.mylog-stat')].find(e=>e.querySelector('.l').textContent==='Amount expected').querySelector('.v').textContent
    };
  }, pay);

  console.log('=== A: +2 admin credit, TWO ad-hoc bonuses ===');
  let r = await run({postsCredit:'2', specialBonus:'Budget video:50000, Talking head video:20000'});
  r.tiles.forEach(t=>console.log('  '+t));
  ck('admin chip reads +2', r.chip, '+2');
  ck('old "logged by admin" text gone', r.note, null);
  ck('budget tile labelled with "amount"', r.tiles.includes('Budget video amount = ₦50,000'), true);
  ck('second ad-hoc tile present', r.tiles.includes('Talking head video amount = ₦20,000'), true);
  // 3 videos * (300000/62=4838.7 -> baseAmount rounds) + 0 perf + 70000 extra
  ck('extras summed correctly, NOT concatenated', r.expected, '₦84,516');
  await p.locator('#creator-modal .modal-card, #creator-modal').first().screenshot({path:OUT+'/real-extras.png'}).catch(()=>p.screenshot({path:OUT+'/real-extras.png'}));

  console.log('\n=== B: no admin credit, no ad-hoc bonus (the normal case) ===');
  r = await run({});
  r.tiles.forEach(t=>console.log('  '+t));
  ck('exactly 6 tiles', r.tiles.length, 6);
  ck('no chip', r.chip, null);
  ck('no ad-hoc tiles', r.tiles.some(t=>t.includes('amount = ')&&t.includes('Budget')), false);

  console.log('\n=== C: legacy bare number in Special Bonus still works ===');
  r = await run({specialBonus:'50000'});
  ck('shows as Extra bonus amount', r.tiles.includes('Extra bonus amount = ₦50,000'), true);

  console.log('\n=== D: legacy "set by admin" override keeps its wording ===');
  r = await run({postsOverride:'20'});
  ck('no misleading chip', r.chip, null);
  ck('keeps Set by admin text', (r.note||'').trim(), 'Set by admin.');

  ck('no JS errors', errs.length?errs.join(' | '):0, 0);
  await b.close();
  console.log(f===0?'\n✅ ALL CHECKS PASSED\n':`\n❌ ${f} FAILED\n`);
  process.exit(f===0?0:1);
})();
