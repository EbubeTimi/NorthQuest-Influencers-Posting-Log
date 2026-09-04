const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const file=path.join(__dirname,'../prototypes/contract-management.html');
if(!fs.existsSync(file)){console.error('FAIL contract management prototype does not exist');process.exit(1);}
const html=fs.readFileSync(file,'utf8');let total=0;
function test(name,fn){fn();total++;console.log('PASS '+name);}
test('covers the complete management contract lifecycle',()=>{for(const state of ['brands','history','editor','preview','awaiting','publisher','published','amend','resign-sent','source','audit','error','denied'])assert.match(html,new RegExp(`data-screen="${state}"`));});
test('keeps a separate business agreement boundary',()=>{assert.match(html,/NorthQuest/);assert.match(html,/CashDrive/);assert.match(html,/Aura/);assert.match(html,/data-business="NorthQuest"/);assert.match(html,/data-business="CashDrive"/);});
test('does not mislabel a NorthQuest source as Aura',()=>{assert.match(html,/supplied files contain NorthQuest terms/);assert.match(html,/Agreement source needed/);});
test('published and signed versions are immutable',()=>{assert.match(html,/published agreement remains unchanged/);assert.match(html,/Existing signed copies stay connected to their original versions/);assert.match(html,/previous signed PDFs remain available/);});
test('draft editor is segmented and records a change summary',()=>{for(const clause of ['parties','accounts','payment','ending'])assert.match(html,new RegExp(`data-clause="${clause}"`));assert.match(html,/What changed\?/);});
test('preview shows exact creator-facing agreement and signature destination',()=>{assert.match(html,/Exact creator view/);assert.match(html,/Signature will appear here on the final signed PDF/);assert.match(html,/bound to this exact version/);});
test('publishing requires both review and authority checks',()=>{assert.match(html,/id="exactCheck"/);assert.match(html,/id="authorityCheck"/);assert.match(html,/id="publishButton" disabled/);assert.match(html,/publishChecks\.every/);});
test('supports selective and all-creator re-signing',()=>{assert.match(html,/Select all 68 active creators/);assert.match(html,/creator-check/);assert.match(html,/creator.*selected/);});
test('failure retains draft and offers recovery',()=>{assert.match(html,/Your draft did not save/);assert.match(html,/Your edits are still here/);assert.match(html,/Review retained draft/);});
test('non-publisher cannot publish',()=>{assert.match(html,/You cannot publish this version/);assert.match(html,/Only an authorized publisher/);});
test('audit history records actor and version events',()=>{assert.match(html,/Version history/);assert.match(html,/Version 3 published/);assert.match(html,/Draft created from version 2/);});
test('prototype uses phone-first review shell and accessible controls',()=>{assert.match(html,/grid-template-columns:430px 330px/);assert.match(html,/aria-label="Back to business agreements"/);assert.match(html,/:focus-visible/);assert.match(html,/prefers-reduced-motion/);});
test('prototype does not persist or perform external writes',()=>assert.doesNotMatch(html,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase\.co|drive\.google/));
test('prototype clearly states it creates no records or files',()=>assert.match(html,/No contract, signature, Drive file, database row or notification is created/));
console.log(`${total}/${total} contract management prototype checks passed`);
