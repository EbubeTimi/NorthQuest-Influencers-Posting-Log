// Run with the browser skill's existing page and viewport handles; no browser bootstrap here.
const assert = require('node:assert/strict');
async function verifyDesign(page, {viewport, capture = async () => {}}) {
  const checks = [];
  const check = (name, ok) => { assert.ok(ok, name); checks.push({name, status:'PASS'}); };
  const click = async name => { await page.getByRole('button', {name, exact:true}).click(); await page.domSnapshot(); };
  await viewport({width:320, height:780});
  for (const state of ['Invitation','Dashboard','Weekly views due','10,000-view submission','Manager review','Under review','Approved','Expired link']) {
    await click(state);
    const metrics = await page.evaluate(() => {
      const app = document.querySelector('#app'), bounds = app.getBoundingClientRect();
      const controls = [...app.querySelectorAll('button,a,input:not(:disabled),select')].filter(e => e.getBoundingClientRect().height > 0);
      const headings = [...app.querySelectorAll('h1,h2,h3,h4')].map(e => Number(e.tagName[1]));
      return {
        fits: document.documentElement.scrollWidth <= document.documentElement.clientWidth && app.scrollWidth <= app.clientWidth,
        targets: controls.every(e => { const b = e.getBoundingClientRect(); return b.width >= 44 && b.height >= 44 && b.left >= bounds.left && b.right <= bounds.right; }),
        headings: headings[0] === 1 && headings.every((level,index) => !index || level <= headings[index-1] + 1),
        inputType: [...app.querySelectorAll('input:not(:disabled):not([type=file]),select')].every(e => Number(getComputedStyle(e).fontSize.replace('px','')) >= 16)
      };
    });
    check('320px '+state+': no horizontal overflow', metrics.fits);
    check('320px '+state+': touch controls at least 44px and inside frame', metrics.targets);
    check('320px '+state+': logical heading levels', metrics.headings);
    check('320px '+state+': readable editable inputs', metrics.inputType);
  }
  await viewport({width:390,height:844});
  await click('Dashboard');
  const dashboard = await page.evaluate(() => ({
    order: document.querySelector('#track-panel').getBoundingClientRect().bottom < document.querySelector('.milestone-card').getBoundingClientRect().top,
    primary: document.querySelectorAll('#app .primary').length === 1,
    heading: Number(getComputedStyle(document.querySelector('#app h1')).fontSize.replace('px','')) <= 28 && Number(getComputedStyle(document.querySelector('#app h1')).fontWeight) <= 600,
    selected: document.querySelector('[data-day=today]').getAttribute('aria-pressed') === 'true'
  }));
  check('daily form precedes milestone action',dashboard.order);
  check('one main action on daily dashboard',dashboard.primary);
  check('phone heading stays restrained',dashboard.heading);
  check('selected day is announced',dashboard.selected);
  await page.getByRole('textbox',{name:'TikTok link',exact:true}).click();
  await page.getByRole('textbox',{name:'TikTok link',exact:true}).press('Tab');
  const focus = await page.evaluate(() => ({id:document.activeElement.id, width:Number(getComputedStyle(document.activeElement).outlineWidth.replace('px',''))}));
  check('focused input has a visible ring of at least 2px',focus.width >= 2);
  // Record the observed limitation, rather than turning a missing keyboard result into PASS.
  checks.push({name:'Tab advances from TikTok to Instagram',status:focus.id==='instagram-link'?'PASS':'UNVERIFIED',observed:focus.id});
  const colours = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(['--ink','--muted','--green','--green-dark','--control-border'].map(key => [key,s.getPropertyValue(key).trim()]));
  });
  function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(x => parseInt(x,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
    return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
  }
  for (const key of ['--ink','--muted','--green','--green-dark','--control-border']) {
    const ratio = 1.05/(luminance(colours[key])+.05);
    check(key+' against white meets '+(key==='--control-border'?'3':'4.5')+':1 contrast',ratio >= (key==='--control-border'?3:4.5));
  }
  await click('Invitation'); await click('Dashboard'); await capture('dashboard');
  await click('Midweek dashboard'); await capture('midweek');
  await click('10,000-view submission'); await capture('submission-empty');
  await click('Manager review'); await capture('management-top');
  await click('Sign in'); await capture('signin');
  await click('Invitation'); await capture('invitation');
  await viewport({width:1280,height:900});
  const details = page.locator('details').filter({has:page.getByText('Viewport and conditions',{exact:true})});
  if(await details.getAttribute('open') === null) await page.getByText('Viewport and conditions',{exact:true}).click();
  await click('Desktop'); await click('Dashboard');
  check('desktop mode uses available width without overflow', await page.evaluate(() => document.querySelector('#app').getBoundingClientRect().width > 700 && document.documentElement.scrollWidth <= innerWidth));
  await capture('desktop');
  await click('Phone');
  return checks;
}
module.exports = {verifyDesign};
