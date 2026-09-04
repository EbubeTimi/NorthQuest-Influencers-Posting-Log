const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "..", "prototypes", "onboarding.html");
const html = fs.readFileSync(file, "utf8");

let total = 0;
function test(name, fn) {
  fn();
  total += 1;
  console.log(`PASS ${name}`);
}

test("complete creator and manager state set exists", () => {
  for (const state of ["ready", "details", "profiles", "payment", "contract", "review", "signed", "error", "awaiting", "manager", "correction", "complete", "paused"]) {
    assert.match(html, new RegExp(`data-screen="${state}"`));
  }
});

test("onboarding is bound to the approved brand", () => {
  assert.match(html, /<div class="brand">TDT<\/div>/);
  assert.doesNotMatch(html, /<div class="brand">Smithstem<\/div>/);
  assert.match(html, /NorthQuest/);
  assert.doesNotMatch(html, /Choose (a |your )?business/i);
  assert.doesNotMatch(html, /repeat trial/i);
});

test("public profiles are collected without credentials", () => {
  assert.match(html, /TikTok username/);
  assert.match(html, /TikTok profile link/);
  assert.match(html, /Instagram username/);
  assert.match(html, /Instagram profile link/);
  assert.doesNotMatch(html, /type="password"/);
  assert.doesNotMatch(html, /email password|instagram password|tiktok password/i);
});

test("contract is read, completed and signed inside the flow", () => {
  assert.match(html, /contractName/);
  assert.match(html, /contractDate/);
  assert.match(html, /signatureCanvas/);
  assert.match(html, /Clear signature/);
  assert.match(html, /signatureProvided/);
  assert.match(html, /signedSignaturePreview/);
  assert.match(html, /Signed agreement/);
  assert.match(html, /renderSignedAgreement/);
  assert.match(html, /complete approved legal document/);
  assert.doesNotMatch(html, /Upload your complete signed contract/i);
  assert.doesNotMatch(html, /type="file"[^>]*signedContract/);
});

test("creator submission does not self-activate", () => {
  assert.match(html, /Management will review your details/);
  assert.match(html, /check all four items before completing onboarding/i);
  assert.match(html, /Complete onboarding/);
});

test("manager can select or clear all four review checks at once", () => {
  assert.match(html, /id="selectAllChecks"/);
  assert.match(html, /aria-controls="checkIdentity checkProfile checkPayment checkContract"/);
  assert.match(html, /const managerCheckIds=\["checkIdentity","checkProfile","checkPayment","checkContract"\]/);
  assert.match(html, /selectAllChecks\.addEventListener\("click"/);
  assert.match(html, /button\.textContent=allSelected\?"Clear all":"Select all"/);
});

test("failure and correction preserve work", () => {
  assert.match(html, /Your onboarding did not save/);
  assert.doesNotMatch(html, /Nothing was lost/);
  assert.match(html, /Correction needed/);
  assert.match(html, /correctionAccountName/);
  assert.match(html, /correctionInstagramLink/);
  assert.match(html, /correctionSignature/);
  assert.match(html, /correctionSignatureCanvas/);
  assert.match(html, /correctionNote/);
  assert.match(html, /correctionFields/);
  assert.match(html, /Original onboarding retained/);
});

test("bank entry is searchable or free text and account number is exactly ten digits", () => {
  assert.match(html, /list="nigerianBanks"/);
  assert.match(html, /id="nigerianBanks"/);
  assert.match(html, /maxlength="10"/);
  assert.match(html, /\^\\d\{10\}\$/);
});

test("ready, complete and paused states use concise left-aligned treatment", () => {
  assert.match(html, /data-screen="ready" class="screen simple-state"/);
  assert.match(html, /Your onboarding is ready/);
  assert.match(html, /Use the same Google account you used during your trial/);
  assert.doesNotMatch(html, /Click below to start/);
  assert.match(html, />Begin</);
  assert.match(html, /data-screen="complete" class="screen simple-state"/);
  assert.match(html, /Welcome to your creator dashboard/);
  assert.doesNotMatch(html, /One login, one record/);
  assert.match(html, /data-screen="paused" class="screen simple-state paused-state"/);
  assert.match(html, /View payments and records/);
});

test("creator and authorised management can verify the full account number", () => {
  assert.match(html, /id="reviewAccountNumber">0123456789</);
  assert.match(html, /<span>Account number<\/span><strong id="managerAccountNumber">0123456789</);
});

test("prototype autosaves locally without an external write", () => {
  assert.match(html, /localStorage/);
  assert.match(html, /saveDraft/);
  assert.match(html, /restoreDraft/);
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|supabase\.co/);
});

test("examples are placeholders and review spells out every field", () => {
  assert.match(html, /id="instagramUsername" placeholder="@yourname"/);
  assert.match(html, /id="instagram" placeholder="https:\/\/www\.instagram\.com\/yourname"/);
  assert.doesNotMatch(html, /id="instagramUsername" value=/);
  for (const label of ["Full name", "WhatsApp number", "Address", "TikTok username", "TikTok profile link", "Instagram username", "Instagram profile link", "Bank", "Account number", "Account name", "Agreement date", "Signature"]) {
    assert.match(html, new RegExp(`<span>${label}<\\/span>`));
  }
  assert.doesNotMatch(html, /Check before submitting/);
});

test("phone and accessibility fundamentals are present", () => {
  assert.match(html, /width=device-width/);
  assert.match(html, /min-height:50px/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /focus-visible/);
  assert.match(html, /prototypeMenu\.open=false/);
});

test("desktop review keeps the phone preview left and prototype states right", () => {
  assert.match(html, /class="review-workspace"/);
  assert.match(html, /grid-template-columns:430px 320px/);
  assert.match(html, /\.prototype\{position:sticky/);
  assert.match(html, /sideReview\.matches/);
  assert.match(html, /prototypeMenu\.open=sideReview\.matches/);
});

console.log(`${total}/${total} onboarding prototype checks passed`);
