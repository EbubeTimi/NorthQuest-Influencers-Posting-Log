const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.join(__dirname,'../prototypes/contract-management.html');
if(!fs.existsSync(file)){console.error('FAIL contract management prototype does not exist');process.exit(1);}
const html=fs.readFileSync(file,'utf8');let total=0;
function test(name,fn){fn();total++;console.log('PASS '+name);}
test('covers the simplified contract lifecycle',()=>{for(const state of ['brands','business','document','upload','confirm','live','resign','resign-sent','notice','history','error','denied'])assert.match(html,new RegExp(`data-screen="${state}"`));});
test('uses the requested management title and compact business rows',()=>{assert.match(html,/Management Business Contracts/);assert.match(html,/NorthQuest[\s\S]*68 signed[\s\S]*>Manage</);assert.match(html,/CashDrive[\s\S]*12 signed/);assert.doesNotMatch(html,/Choose the agreement you want to manage/);});
test('keeps separate business boundaries and an Aura empty state',()=>{for(const business of ['NorthQuest','CashDrive','Aura'])assert.match(html,new RegExp(`data-business="${business}"`));assert.match(html,/No contract added/);});
test('uses a door and arrow exit control',()=>{assert.match(html,/class="exit"/);assert.match(html,/aria-label="Back to business contracts"/);assert.match(html,/M14 4h5v16h-5/);});
test('accepts complete Word or PDF uploads instead of clause editing',()=>{assert.match(html,/Choose Word or PDF/);assert.match(html,/accept="\.docx,\.pdf/);assert.match(html,/Microsoft Word/);assert.doesNotMatch(html,/data-clause=|Edit agreement|Draft editor/);});
test('makes Smith-confirmed contract live without a publisher queue',()=>{assert.match(html,/Make live/);assert.match(html,/New onboarding now uses this contract/);assert.doesNotMatch(html,/Waiting for approval|Publisher review|Submit for approval|Authorized publisher/);});
test('preserves signed legal evidence without noisy version labels',()=>{assert.match(html,/Existing signed contracts remain unchanged/);assert.match(html,/signed PDF remains connected|signed contracts preserved/);assert.doesNotMatch(html,/Published version|Current version|Version 3|Version 4|Archived/);});
test('supports selective and all-creator re-signing',()=>{assert.match(html,/Select all \$\{info\.signed\} active creators/);assert.match(html,/creator-check/);assert.match(html,/creator.*selected/);});
test('shows the creator dashboard request',()=>{assert.match(html,/Your contract needs your signature/);assert.match(html,/Review and sign/);});
test('shows exact contract and signature destination',()=>{assert.match(html,/Current contract/);assert.match(html,/Creator signature area/);assert.match(html,/drawn signature appear on the final signed PDF/);});
test('upload failure keeps the selected file and offers recovery',()=>{assert.match(html,/The contract did not upload/);assert.match(html,/selected file is still here/);assert.match(html,/Try again/);});
test('restricts contract management to Smith for now',()=>{assert.match(html,/Only Smith currently has contract-management access/);});
test('is phone-first with accessible focus, touch and reduced motion',()=>{assert.match(html,/grid-template-columns:430px 320px/);assert.match(html,/min-height:44px/);assert.match(html,/:focus-visible/);assert.match(html,/prefers-reduced-motion/);});
test('prototype performs no persistence or external writes',()=>{assert.doesNotMatch(html,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase\.co|drive\.google/);assert.match(html,/No contract, signature, Drive file, database row or notification is created/);});
console.log(`${total}/${total} contract management prototype checks passed`);
