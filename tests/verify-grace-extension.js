const { chromium } = require('playwright');
let f=0; const ck=(l,a,e)=>{const ok=String(a)===String(e); if(!ok)f++;
  console.log(`  ${ok?'✅':'❌'} ${l}\n       expected: ${e}\n       actual:   ${a}`);};
async function at(iso, label){
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
  const ctx=await b.newContext({timezoneId:'Africa/Lagos'});
  const p=await ctx.newPage();
  await p.clock.setFixedTime(new Date(iso));
  await p.goto('file://' + require('path').resolve(__dirname,'..','index.html') + '');
  await p.waitForTimeout(500);
  const r=await p.evaluate(()=>({today:todayStr(), hour:lagosParts().hour,
    open:graceWindowOpen(), cutoff:graceCutoffHour(), label:graceCutoffLabel()}));
  console.log(`\n${label}\n   Lagos ${r.today} ${String(r.hour).padStart(2,'0')}:00 · cutoff=${r.cutoff} (${r.label}) · open=${r.open}`);
  await b.close();
  return r;
}
(async()=>{
  // Today, after the old 2 PM cutoff — must now be OPEN.
  let r = await at('2026-09-06T17:38:00+01:00', 'TODAY 5:38 PM (the situation right now)');
  ck('yesterday can still be logged', r.open, true);
  ck('cutoff reads midnight', r.label, 'midnight tonight');

  r = await at('2026-09-06T23:55:00+01:00', 'TODAY 11:55 PM (last few minutes)');
  ck('still open just before midnight', r.open, true);

  // Tomorrow — the extension must lift itself with no action from anyone.
  r = await at('2026-09-07T09:00:00+01:00', 'TOMORROW 9 AM');
  ck('back to the 2 PM rule', r.cutoff, 14);
  ck('open in the morning as normal', r.open, true);
  ck('wording back to 2:00 PM', r.label, '2:00 PM');

  r = await at('2026-09-07T15:00:00+01:00', 'TOMORROW 3 PM');
  ck('closed again after 2 PM', r.open, false);

  console.log(f===0?'\n✅ ALL PASSED\n':`\n❌ ${f} FAILED\n`);
  process.exit(f===0?0:1);
})();
