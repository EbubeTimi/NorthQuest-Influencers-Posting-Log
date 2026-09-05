const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.join(__dirname,'../prototypes/management-dashboard.html');
if(!fs.existsSync(file)){console.error('FAIL management dashboard prototype does not exist');process.exit(1);}
const html=fs.readFileSync(file,'utf8');let total=0;
function test(name,fn){fn();total++;console.log('PASS '+name);}
test('covers management entry, work, people and recovery states',()=>{for(const state of ['home','work','business','creators','creator','evidence','onboarding','bonus','payments','access','pause-confirm','paused','audit','loading','empty','error','denied'])assert.match(html,new RegExp(`data-screen="${state}"`));});
test('connects all three businesses without mixing scope',()=>{for(const business of ['NorthQuest','CashDrive','Aura'])assert.match(html,new RegExp(`data-business="${business}"`));assert.match(html,/Business scope/);});
test('home gives one compact needs-attention queue',()=>{assert.match(html,/Needs attention/);for(const item of ['Trial videos','Onboarding','Bonus claims','Payments'])assert.match(html,new RegExp(item));});
test('creator record includes identity lifecycle and linked records',()=>{for(const item of ['Joined 12 August 2026','Videos','View reports','Bonuses','Payments','Manage access','History'])assert.match(html,new RegExp(item));});
test('trial evidence requires exact video count and screenshot',()=>{assert.match(html,/10,240 views/);assert.match(html,/Screenshot submitted/);assert.match(html,/Open TikTok video/);assert.match(html,/Approve onboarding/);assert.match(html,/Keep in trial/);});
test('onboarding supports completion and exact correction',()=>{assert.match(html,/Review signed contract/);assert.match(html,/Complete onboarding/);assert.match(html,/Request correction/);});
test('approved bonuses feed the payment ledger',()=>{assert.match(html,/Approved bonus creates one payment item/);assert.match(html,/Approve bonus/);assert.match(html,/Reject claim/);});
test('payment preparation separates expected owed and paid',()=>{assert.match(html,/Expected video pay/);assert.match(html,/Approved bonuses/);assert.match(html,/Already paid/);assert.match(html,/Prepare statements/);});
test('one-business pause is separate from whole-person suspension',()=>{assert.match(html,/Pause NorthQuest only/);assert.match(html,/Suspend this person/);assert.match(html,/Other business access is unchanged/);});
test('audit history names actor action and time',()=>{assert.match(html,/Smith · 4 September 2026/);assert.match(html,/Ella · 3 September 2026/);});
test('wrong roles receive no management records',()=>{assert.match(html,/You cannot open management/);assert.match(html,/No creator names, counts or records are shown/);});
test('uses a PC-first TypeUI workspace that still reflows for phones',()=>{assert.match(html,/TypeUI responsive admin polish/);assert.match(html,/PC-first management workspace/);assert.match(html,/@media\(min-width:800px\)/);assert.match(html,/grid-template-columns:220px minmax\(0,1fr\)/);assert.match(html,/@media\(max-width:799px\)/);assert.match(html,/--ui-canvas:#f3f5f2/);assert.match(html,/min-height:44px/);assert.match(html,/:focus-visible/);assert.match(html,/prefers-reduced-motion/);});
test('keeps prototype local and read only',()=>{assert.doesNotMatch(html,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase\.co|drive\.google/);assert.match(html,/No approval, payment, message, export, access change or database write occurs/);});
console.log(`${total}/${total} management dashboard prototype checks passed`);
