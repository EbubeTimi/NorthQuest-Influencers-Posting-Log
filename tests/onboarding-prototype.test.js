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
  for (const state of ["ready", "details", "profiles", "payment", "contract", "review", "error", "awaiting", "manager", "correction", "complete", "paused"]) {
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
  assert.match(html, /TikTok profile link/);
  assert.match(html, /Instagram profile link/);
  assert.match(html, /never ask for your passwords/i);
  assert.doesNotMatch(html, /type="password"/);
  assert.doesNotMatch(html, /email password|instagram password|tiktok password/i);
});

test("complete signed PDF is required in the flow", () => {
  assert.match(html, /complete signed contract \(PDF\)/i);
  assert.match(html, /accept="application\/pdf,.pdf"/);
  assert.match(html, /if\(!contractSelected\)/);
  assert.match(html, /Use example signed PDF/);
  assert.match(html, /fixed NorthQuest agreement/);
  assert.doesNotMatch(html, /SignaturePad|signature\.png/);
});

test("creator submission does not self-activate", () => {
  assert.match(html, /It does not activate the account until management checks it/);
  assert.match(html, /check all four items before completing onboarding/i);
  assert.match(html, /Complete onboarding/);
});

test("failure and correction preserve work", () => {
  assert.match(html, /Nothing was lost/);
  assert.match(html, /Everything else remains saved/);
  assert.match(html, /Original onboarding retained/);
});

test("private data is masked in review", () => {
  assert.match(html, /GTBank ···· 6789/);
  assert.doesNotMatch(html, />0123456789</);
});

test("prototype performs no external write or persistence", () => {
  assert.doesNotMatch(html, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|supabase\.co/);
});

test("phone and accessibility fundamentals are present", () => {
  assert.match(html, /width=device-width/);
  assert.match(html, /min-height:50px/);
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /focus-visible/);
  assert.match(html, /prototypeMenu\.open=false/);
});

console.log(`${total}/${total} onboarding prototype checks passed`);
