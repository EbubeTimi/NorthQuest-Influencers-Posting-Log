const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const intake = fs.readFileSync(path.join(__dirname, '..', 'intake.html'), 'utf8');
const contract = intake.match(/<section class="step" data-key="contract">([\s\S]*?)<\/section>/)?.[1] || '';

test('contract step puts the current walkthrough before written signing steps and contract', () => {
  const video = contract.indexOf('assets/contract-signing-walkthrough.mp4');
  const instructions = contract.indexOf('Fill &amp; Sign');
  const agreement = contract.indexOf('1Fx0_CJiVWo7PFbMtIRpoMShqA7mhjvrUDFvAor8_ln0');
  const upload = contract.indexOf('id="f-contract"');
  assert.ok(video >= 0 && instructions > video && agreement > instructions && upload > agreement);
  assert.doesNotMatch(contract, /Open Document 1|id="read-doc1"|11K32e1GR8xULU6rnZe12v-mlEGNmtLOV/);
  assert.match(contract, /<video[^>]*controls[^>]*playsinline[^>]*preload="metadata"/);
  assert.doesNotMatch(contract, /drive\/folders\/1Vi8khniSRXO0Ocg672jqKzAhzjSawFw3/);
});

test('intake submission no longer requires Document 1 but still records agreement and signed copy', () => {
  const finish = intake.match(/function finish\(\)\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.doesNotMatch(finish, /read-doc1|readDoc1|Document 1/);
  assert.match(finish, /const agree=document\.getElementById\('agree'\)\.checked/);
  assert.match(finish, /if\(!file\)\{ fail\('Please upload your signed contract before finishing\.'\); return; \}/);
  assert.match(finish, /uploadContract\(fullname, file\)/);
});

test('submit without a signed file stops before any intake request', () => {
  const finish = intake.match(/function finish\(\)\{([\s\S]*?)\n\}/)?.[1] || '';
  const error = {
    textContent: '',
    classList: { add() {}, remove() {} },
    scrollIntoView() {}
  };
  let requests = 0;
  const fields = { err: error, agree: { checked: true }, 'f-contract': { files: [] } };
  vm.runInNewContext(`function finish(){${finish}\n} finish();`, {
    PREVIEW: false,
    document: { getElementById: id => fields[id] },
    val: () => 'Ada Okeke',
    jsonp: () => { requests++; }
  });
  assert.equal(error.textContent, 'Please upload your signed contract before finishing.');
  assert.equal(requests, 0);
});

test('intake progress survives a reload in the same tab and clears after completion', () => {
  assert.match(intake, /const INTAKE_DRAFT_KEY = 'northquest-intake-draft-v1'/);
  assert.match(intake, /sessionStorage\.setItem\(INTAKE_DRAFT_KEY/);
  assert.match(intake, /function restoreDraft\(\)/);
  assert.match(intake, /steps\.findIndex\(s=>s\.dataset\.key===draft\.step\)/);
  assert.match(intake, /document\.addEventListener\('input', saveDraft\)/);
  assert.match(intake, /document\.addEventListener\('change', saveDraft\)/);
  assert.match(intake, /sessionStorage\.removeItem\(INTAKE_DRAFT_KEY\)/);
});

test('reload recovery does not claim that a browser file input was restored', () => {
  assert.match(intake, /contractSelected: !!document\.getElementById\('f-contract'\)\.files\[0\]/);
  assert.match(intake, /Please select your signed contract again after the reload\./);
  assert.doesNotMatch(intake, /fileData|readAsDataURL\(.*saveDraft/);
});

test('intake collects only NorthQuest Finance payment details', () => {
  assert.match(intake, /Enter only your NorthQuest Finance account details/);
  assert.match(intake, /id="f-bank"[^>]*value="Paystack-Titan \/ NorthQuest Finance"[^>]*readonly/);
  assert.match(intake, /<label>Your NorthQuest Finance account number<\/label>/);
  assert.match(intake, /<label>Name on your NorthQuest Finance account<\/label>/);
  assert.doesNotMatch(intake, /placeholder="e\.g\. OPay, GTBank"/);
});


