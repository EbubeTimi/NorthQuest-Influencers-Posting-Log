// Explicit read-only probe: public auth settings and destination metadata only.
// Never calls sync functions, secrets, uploads, cron, or writes.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const client=fs.readFileSync(path.join(__dirname,'../smithstem/lib/supabaseClient.js'),'utf8');
const base=client.match(/NEXT_PUBLIC_SUPABASE_URL\s*\|\|\s*"([^"]+)"/)[1];
const anon=client.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*\|\|\s*"([^"]+)"/)[1];
const claims=JSON.parse(Buffer.from(anon.split('.')[1],'base64url'));
assert.equal(base,'https://zuuhlowjqniadtcpdypv.supabase.co');
assert.equal(claims.role,'anon');
assert.equal(claims.ref,'zuuhlowjqniadtcpdypv');
const requests=[
 {name:'google-sign-in-public-settings',route:'/auth/v1/settings',summarize:d=>({googleSettingPresent:typeof d.external?.google==='boolean',googleEnabled:typeof d.external?.google==='boolean'?d.external.google:null,signupDisabled:d.disable_signup??null})},
 {name:'application-destination-metadata',route:'/rest/v1/app_settings?select=key,value&key=in.(tdt_root_folder_id,applicants_sheet_id)',summarize:d=>({rows:Array.isArray(d)?d.length:null,settings:Array.isArray(d)?d.map(x=>({key:x.key,value:x.value})):undefined})},
 {name:'business-destination-metadata',route:'/rest/v1/businesses?select=slug,drive_signed_contracts_folder_id,drive_database_doc_id,drive_database_folder_id,drive_analytics_folder_id&slug=in.(northquest,cashdrive,aura)',summarize:d=>({rows:Array.isArray(d)?d.length:null,businesses:Array.isArray(d)?d:undefined})},
];
async function run(){
 const results=[];
 for(const q of requests){
  const started=Date.now();
  try{
   const r=await fetch(base+q.route,{method:'GET',headers:{apikey:anon,Authorization:'Bearer '+anon},signal:AbortSignal.timeout(12000),redirect:'error'});
   const raw=await r.text();let body;try{body=JSON.parse(raw);}catch{body={};}
   results.push({check:q.name,httpStatus:r.status,elapsedMs:Date.now()-started,...(r.ok?q.summarize(body):{errorCode:body.code??body.error_code??null}),interpretation:r.ok?'Read completed; an empty result does not prove configuration is absent.':'Read not successful; no write attempted.'});
  }catch(e){results.push({check:q.name,error:e.name,causeCode:e.cause?.code??null,elapsedMs:Date.now()-started,interpretation:'Network/timeout failure; configuration remains unverified.'});}
 }
 console.log(JSON.stringify({verifiedAt:new Date().toISOString(),identity:'public anon (not manager/service role)',method:'GET only',results},null,2));
 if(results.some(r=>r.error))process.exitCode=1;
}
if(process.argv.includes('--live-read-only'))run().catch(()=>{console.error('Probe failed; no credentials printed.');process.exitCode=1;});
else console.log('PASS static safety checks. Pass --live-read-only to run the three fixed metadata GETs.');
