const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../prototypes/recruitment.html'),'utf8');
assert.match(html,/data-option-index/,'each answer option has its own field');
assert.match(html,/role="tablist"/,'message types are accessible tabs');
const ctx=vm.createContext({Date,Intl,URL});
vm.runInContext(html.match(/\/\/ RECRUITMENT CORE START([\s\S]*?)\/\/ RECRUITMENT CORE END/)[1]+';this.api={trialDates,invitationUrl,createStore,updateForm};',ctx);
const a=ctx.api;let total=0;function test(name,fn){fn();console.log('PASS '+name);total++;}
test('automatic start uses Lagos date at UTC midnight boundary',()=>{const d=a.trialDates('2026-08-31T23:15:00Z',7);assert.equal(d.start,'2026-09-01');assert.equal(d.due,'2026-09-08');});
test('automatic dates cross year boundary',()=>{assert.equal(a.trialDates('2026-12-29T10:00:00Z',7).due,'2027-01-05');});
test('invalid duration cannot generate dates',()=>{for(const n of [0,-1,1.5,NaN,undefined])assert.equal(a.trialDates('2026-09-01T10:00:00Z',n),null);});
test('invitations are brand-specific and recipient-token bound',()=>{const n={trial:{brand:'NorthQuest'},invitation:{token:'demo-one'}},c={trial:{brand:'CashDrive'},invitation:{token:'demo-two'}};assert.equal(a.invitationUrl(n),'https://preview.example.test/trial/northquest/demo-one');assert.equal(a.invitationUrl(c),'https://preview.example.test/trial/cashdrive/demo-two');assert.equal(a.invitationUrl({}), '');});
test('multiline option stays one answer without altering old config',()=>{const s=a.createStore(),before=s.config.questions,qs=JSON.parse(JSON.stringify(before));qs[0][2]=['One long answer\nwith another line','Another choice'];assert.ok(a.updateForm(s,{role:'admin',agency:'growthcooks',name:'Ella'},qs,'2026-09-01').ok);assert.equal(s.config.questions[0][2].length,2);assert.equal(s.config.questions[0][2][0],qs[0][2][0]);assert.equal(before[0][2][0],'Yes');});
test('UGC branch cannot expose an unhandled third answer',()=>{const s=a.createStore(),q=JSON.parse(JSON.stringify(s.config.questions));q.find(x=>x[0]==='ugcComfort')[2].push('Maybe');assert.equal(a.updateForm(s,{role:'admin',agency:'growthcooks',name:'Ella'},q,'2026-09-01').ok,false);});
console.log(`${total}/${total} settings checks passed`);
