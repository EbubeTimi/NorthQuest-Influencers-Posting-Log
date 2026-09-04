const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const file=path.join(__dirname,'../prototypes/active-creator-dashboard.html');
if(!fs.existsSync(file)){console.error('FAIL active prototype does not exist yet');process.exit(1);}
const html=fs.readFileSync(file,'utf8');
const core=html.match(/\/\/ CORE START([\s\S]*?)\/\/ CORE END/);
assert.ok(core,'testable core');
const ctx=vm.createContext({Intl,Date,URL});
vm.runInContext(core[1]+';this.api={dateAt,periodFor,previousDay,canYesterday,scopeVideos,entries,reportDays,duePeriod,nextSlot,validCount,validLink,canSubmit,commitVideo,commitReports,paidRows,daysInMonth,monthlySummary,allTimeSummary};',ctx);
const a=ctx.api,now='2026-09-08T10:00:00+01:00';
let total=0;
function test(name,fn){fn();total++;console.log('PASS '+name);}
const nq={id:'nq',enabled:true,joined:'2026-09-04',calendar:'month-blocks'},au={id:'aura',enabled:true,joined:'2026-09-01',calendar:'monday'};
const records=[{id:'n1',business:'nq',date:'2026-09-04',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/1'}},{id:'n2',business:'nq',date:'2026-09-06',number:2,links:{instagram:'https://www.instagram.com/reel/demo/'}},{id:'a1',business:'aura',date:'2026-09-06',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/2'}}];
test('Lagos date, not host timezone',()=>assert.equal(a.dateAt('2026-09-07T23:30:00Z'),'2026-09-08'));
test('NorthQuest shared calendar blocks',()=>assert.equal(a.periodFor('2026-09-08',nq).start,'2026-09-08'));
test('Aura Monday–Sunday',()=>assert.equal(JSON.stringify(a.periodFor('2026-09-08',au)),JSON.stringify({start:'2026-09-07',end:'2026-09-13'})));
test('February closes at month end',()=>assert.equal(a.periodFor('2028-02-28',nq).end,'2028-02-29'));
test('weekly obligation only from join date and own business',()=>assert.equal(a.entries(records,nq,{start:'2026-09-01',end:'2026-09-07'}).length,2));
test('four reporting dates since joining',()=>assert.equal(a.reportDays(nq,{start:'2026-09-01',end:'2026-09-07'}).length,4));
test('due period is exact closed shared week',()=>assert.equal(a.duePeriod(now,nq,records,{}).end,'2026-09-07'));
test('no gate before midnight',()=>assert.equal(a.duePeriod('2026-09-07T23:59:59+01:00',nq,records,{}),null));
test('gate begins at midnight',()=>assert.ok(a.duePeriod('2026-09-08T00:00:00+01:00',nq,records,{})));
test('unposted days do not require fake reports',()=>assert.equal(a.duePeriod(now,nq,[],{}),null));
test('missed yesterday is allowed before noon',()=>assert.equal(a.canYesterday(now,nq,records),true));
test('no yesterday at noon',()=>assert.equal(a.canYesterday('2026-09-08T12:00:00+01:00',nq,records),false));
test('another business log does not consume Yesterday',()=>assert.equal(a.canYesterday(now,nq,[...records,{business:'aura',date:'2026-09-07',number:1}]),true));
test('a previous-day log hides Yesterday',()=>assert.equal(a.canYesterday(now,nq,[...records,{business:'nq',date:'2026-09-07',number:1}]),false));
test('no yesterday before membership',()=>assert.equal(a.canYesterday(now,{...nq,joined:'2026-09-08'},[]),false));
test('two slots maximum',()=>assert.equal(a.nextSlot([{number:1},{number:2}]),null));
test('zero is a valid count, blanks and exponent are not',()=>{assert.ok(a.validCount('0'));for(const x of ['', '-1','1.5','1e4'])assert.equal(a.validCount(x),false);});
test('reject platform profiles, scripts and wrong hosts',()=>{for(const link of ['javascript:alert(1)','https://tiktok.com.evil.test/@x/video/1','https://www.tiktok.com/@demo'])assert.equal(a.validLink(link,'tiktok'),false);assert.ok(a.validLink('https://www.instagram.com/reel/demo/','instagram'));});
test('gated today rejected but eligible yesterday allowed',()=>{assert.equal(a.canSubmit(now,nq,records,{},'2026-09-08'),false);assert.equal(a.canSubmit(now,nq,records,{},'2026-09-07'),true);});
test('paused membership cannot submit',()=>assert.equal(a.canSubmit(now,{...nq,enabled:false},records,{},'2026-09-07'),false));
test('commit validates date and refuses repeat slot',()=>{const data={videos:records.slice(),reports:{}};const draft={business:'nq',date:'2026-09-07',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/3'}};assert.equal(a.commitVideo(data,now,nq,draft).ok,true);assert.equal(a.commitVideo(data,now,nq,draft).ok,false);assert.equal(data.videos.length,4);});
test('cross-business forged commit refused',()=>{const data={videos:[],reports:{}};assert.equal(a.commitVideo(data,now,nq,{business:'aura',date:'2026-09-07',number:1,links:{tiktok:'x'}}).ok,false);});
test('reports save atomically and never clear another business',()=>{const data={videos:records.slice(),reports:{}};const period=a.duePeriod(now,nq,records,{});assert.equal(a.commitReports(data,nq,period,{'n1:tiktok':'0'}).ok,false);assert.equal(Object.keys(data.reports).length,0);assert.equal(a.commitReports(data,nq,period,{'n1:tiktok':'0','n2:instagram':'200'}).ok,true);assert.equal(a.duePeriod(now,nq,records,data.reports),null);assert.ok(a.duePeriod(now,au,records,data.reports));});
test('payments are paid-only and business scoped',()=>assert.equal(a.paidRows([{business:'nq',status:'paid'},{business:'aura',status:'paid'},{business:'nq',status:'pending'}],nq).length,1));
test('monthly summary is scoped to the selected business and current month',()=>{
  const business={...nq,dailyVideoTarget:2,ratePerVideo:5000};
  const data={videos:[...records,{id:'old',business:'nq',date:'2026-08-31',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/4'}}],claims:[{business:'nq',date:'2026-09-05',status:'approved',amount:6000},{business:'nq',date:'2026-09-06',status:'approved',amount:4000},{business:'nq',date:'2026-09-07',status:'pending',amount:9000},{business:'aura',date:'2026-09-05',status:'approved',amount:8000}]};
  assert.equal(JSON.stringify(a.monthlySummary(data,business,now)),JSON.stringify({videosLogged:2,monthlyTarget:60,ratePerVideo:5000,videoPay:10000,bonusCount:2,bonusAmount:10000,totalDue:20000}));
});
test('monthly target follows the number of days in the month',()=>{
  const business={...nq,dailyVideoTarget:2,ratePerVideo:5000};
  assert.equal(a.daysInMonth('2026-09-08T10:00:00+01:00'),30);
  assert.equal(a.monthlySummary({videos:[],claims:[]},business,'2026-10-08T10:00:00+01:00').monthlyTarget,62);
  assert.equal(a.monthlySummary({videos:[],claims:[]},business,'2028-02-08T10:00:00+01:00').monthlyTarget,58);
});
test('all-time summary is cumulative, business-scoped and has no invented target',()=>{
  const business={...nq,joined:'2026-08-01',dailyVideoTarget:2,ratePerVideo:5000};
  const data={videos:[...records,{id:'old',business:'nq',date:'2026-08-31',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/4'}}],claims:[{business:'nq',date:'2026-08-20',status:'approved',amount:6000},{business:'nq',date:'2026-09-06',status:'pending',amount:9000},{business:'aura',date:'2026-08-20',status:'approved',amount:8000}],payments:[{business:'nq',status:'paid',amount:20000},{business:'nq',status:'pending',amount:10000},{business:'aura',status:'paid',amount:50000}]};
  assert.equal(JSON.stringify(a.allTimeSummary(data,business)),JSON.stringify({videosLogged:3,ratePerVideo:5000,videoPay:15000,bonusCount:1,bonusAmount:6000,paymentsReceived:20000}));
});
test('video pay increases after a successful video save',()=>{
  const business={...nq,dailyVideoTarget:2,ratePerVideo:5000};
  const data={videos:records.slice(),reports:{},claims:[]};
  const before=a.monthlySummary(data,business,now).videoPay;
  assert.equal(a.commitVideo(data,now,business,{business:'nq',date:'2026-09-07',number:1,links:{tiktok:'https://www.tiktok.com/@demo/video/3'}}).ok,true);
  assert.equal(a.monthlySummary(data,business,now).videoPay,before+5000);
});
test('active UI separates Home from Track and uses five labelled navigation buttons',()=>{
  assert.doesNotMatch(html,/Add Instagram, TikTok, or both\./);
  assert.match(html,/function navIcon/);
  assert.match(html,/aria-label="\$\{name\}"/);
  assert.match(html,/\['home','Home'\],\['track','Track videos'\],\['videos','Videos'\],\['bonuses','Bonuses'\],\['payments','Payments'\]/);
  assert.match(html,/else content=\(\{home,track,videos,weekly,bonuses,claim,payments,chooser\}/);
  assert.match(html,/data-icon="\$\{name==='bonuses'\?'money-bag':name\}"/);
});
test('Home is summary-only and each record screen includes creator context',()=>{
  assert.match(html,/function home\(\)\{const period=due\(\);if\(period\)return gatedHome\(period\);const missed=.*return `<div class="stack"><div><p class="screen-context small muted">\$\{dayLabel\(dateAt\(model\.now\)\)\}<\/p><h1 tabindex="-1">Good morning, Amara\.<\/h1><\/div>\$\{summary\(\)\}/);
  assert.match(html,/function track\(\)/);
  assert.match(html,/function creatorContext\(\)/);
  assert.match(html,/Amara ·/);
});
test('dashboard period switch is accessible and removes redundant active and total labels',()=>{
  assert.match(html,/This month/);
  assert.match(html,/All time/);
  assert.match(html,/aria-pressed="\$\{model\.summaryRange==='month'\}"/);
  assert.match(html,/Bonuses so far/);
  assert.doesNotMatch(html,/>Active</);
  assert.doesNotMatch(html,/Total so far/);
  assert.match(html,/s\.bonusAmount\?`<small>\$\{money\(s\.bonusAmount\)\}<\/small>`:''/);
});
test('payment empty state uses only the hopeful sentence',()=>{
  assert.doesNotMatch(html,/No payments yet\./);
  assert.match(html,/Your payments appear here after they’re paid\./);
});
test('weekly gate replaces daily controls and missed yesterday has a notice',()=>{
  assert.match(html,/if\(period\)return gatedHome\(period\)/);
  assert.match(html,/You did not log your videos yesterday/);
  assert.match(html,/day-switch \$\{showYesterday\?'':'one'\}/);
});
test('no production requests or browser persistence',()=>assert.doesNotMatch(html,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase\.co/));
test('prototype has no trial qualification or Facebook inputs',()=>assert.doesNotMatch(html,/Reached 10,000|Start onboarding|Facebook|Video 3/));
console.log(`${total}/${total} active prototype checks passed`);
