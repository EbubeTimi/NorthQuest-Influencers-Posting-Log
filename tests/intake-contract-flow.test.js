const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const intake = fs.readFileSync(path.join(__dirname, '..', 'intake.html'), 'utf8');
const contract = intake.match(/<section class="step" data-key="contract">([\s\S]*?)<\/section>/)?.[1] || '';

test('contract step puts the current walkthrough before written signing steps and contract', () => {
  const video = contract.indexOf('1Nvzv5bYjjLYt9r_80-9pnIsiMB8tgRBb');
  const instructions = contract.indexOf('Fill &amp; Sign');
  const agreement = contract.indexOf('1Fx0_CJiVWo7PFbMtIRpoMShqA7mhjvrUDFvAor8_ln0');
  const upload = contract.indexOf('id="f-contract"');
  assert.ok(video >= 0 && instructions > video && agreement > instructions && upload > agreement);
  assert.doesNotMatch(contract, /Open Document 1|id="read-doc1"|11K32e1GR8xULU6rnZe12v-mlEGNmtLOV/);
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
