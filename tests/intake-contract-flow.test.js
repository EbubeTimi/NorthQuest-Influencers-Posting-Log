const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const intake = fs.readFileSync(path.join(root, 'intake.html'), 'utf8');
const tracker = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const contract = intake.match(/<section class="step" data-key="contract">([\s\S]*?)<\/section>/)?.[1] || '';

function contractConstant(source) {
  return source.match(/const EMBEDDED_CONTRACT_HTML = (.*?);\r?\n/s)?.[1] || '';
}

test('intake uses the same embedded agreement as the posting tracker', () => {
  assert.ok(contractConstant(intake).length > 10000);
  assert.equal(contractConstant(intake), contractConstant(tracker));
  assert.match(contract, /id="contract-copy"/);
  assert.doesNotMatch(contract, /docs\.google\.com|Open the contract|walkthrough|f-contract|type="file"/i);
});

test('intake collects the contract fields and uses MonteCarlo without bold or italics', () => {
  assert.match(contract, /id="f-address"/);
  assert.match(contract, /id="sign-name"/);
  assert.match(contract, /id="sign-date"[^>]*readonly/);
  assert.match(intake, /family=MonteCarlo/);
  assert.match(intake, /\.signature-input\{[^}]*'MonteCarlo'[^}]*font-weight:400!important[^}]*font-style:normal!important/);
});

test('intake submission sends typed signature and address without uploading a file', () => {
  const finish = intake.match(/function finish\(\)\{([\s\S]*?)\n\}/)?.[1] || '';
  assert.match(finish, /const sign=val\('sign-name'\)/);
  assert.match(finish, /const address=val\('f-address'\)/);
  assert.match(finish, /address:address/);
  assert.match(finish, /signature:sign/);
  assert.doesNotMatch(finish, /f-contract|uploadContract|FileReader/);
  assert.match(finish, /if\(data && data\.status==='success'\)/);
});

test('unfinished intake draft persists but never claims a signed contract', () => {
  assert.match(intake, /const INTAKE_DRAFT_KEY = 'northquest-intake-draft-v1'/);
  assert.match(intake, /sessionStorage\.setItem\(INTAKE_DRAFT_KEY/);
  assert.match(intake, /steps\.findIndex\(s=>s\.dataset\.key===draft\.step\)/);
  assert.match(intake, /sessionStorage\.removeItem\(INTAKE_DRAFT_KEY\)/);
  assert.doesNotMatch(intake, /contractSelected|already signed/i);
});

test('backend shares one contract PDF builder across intake and tracker signing', () => {
  assert.match(backend, /function nqCreateSignedContractPdf_\(/);
  assert.match(backend, /handleSignExistingCreatorContract[\s\S]*nqCreateSignedContractPdf_\(name, enteredSignature, address, email, phone\)/);
  assert.match(backend, /function handleIntake[\s\S]*nqCreateSignedContractPdf_\(name, signature, address, email, phone\)/);
  assert.match(backend, /setFontFamily\(sigStart, sigEnd, 'MonteCarlo'\)/);
  assert.match(backend, /setFontSize\(sigStart, sigEnd, 20\)/);
  assert.match(backend, /setBold\(sigStart, sigEnd, false\)/);
  assert.match(backend, /setItalic\(sigStart, sigEnd, false\)/);
});

test('tracker contract matches onboarding fields and reuses saved contact details', () => {
  const gate = tracker.match(/<section class="existing-contract-gate"[\s\S]*?<\/section>/)?.[0] || '';
  const signer = tracker.match(/function signExistingCreatorContract\(\) \{([\s\S]*?)\n\}/)?.[1] || '';
  const backendSigner = backend.slice(
    backend.indexOf('function handleSignExistingCreatorContract(params)'),
    backend.indexOf('function handleSetCreatorPin', backend.indexOf('function handleSignExistingCreatorContract(params)'))
  );
  assert.match(gate, /id="existing-contract-address"/);
  assert.match(gate, /id="existing-contract-agree"/);
  assert.match(gate, /id="existing-contract-signature"/);
  assert.match(gate, /id="existing-contract-date"[^>]*readonly/);
  assert.doesNotMatch(gate, /existing-contract-email|existing-contract-phone/);
  assert.doesNotMatch(signer, /params[^\n]*(?:email|phone)|existing-contract-email|existing-contract-phone/);
  assert.match(backendSigner, /phone = String\(values\[rowIndex\]\[7\]/);
  assert.match(backendSigner, /email = String\(values\[rowIndex\]\[8\]/);
  assert.match(backendSigner, /nqCreateSignedContractPdf_\(name, enteredSignature, address, email, phone\)/);
});

test('completed intake saves one PDF and enables first-time self PIN setup', () => {
  const start = backend.indexOf('function handleIntake(params)');
  const end = backend.indexOf('function appendToDatabaseDoc', start);
  const handler = backend.slice(start, end);
  assert.match(handler, /existingPdf && intakeEligible/);
  assert.match(handler, /alreadySaved: true/);
  assert.match(handler, /getRange\(savedCreatorRow, 23\)\.setValue\(true\)/);
  assert.match(handler, /getRange\(savedCreatorRow, 24\)\.setValue\(signed\.pdfUrl\)/);
  assert.match(handler, /getRange\(savedCreatorRow, 25\)\.setValue\(true\)/);
  assert.match(handler, /return \{ status: 'success', pdfUrl: signed\.pdfUrl \}/);
});

test('intake still collects only NorthQuest Finance payment details', () => {
  assert.match(intake, /Enter only your NorthQuest Finance account details/);
  assert.match(intake, /id="f-bank"[^>]*value="Paystack-Titan \/ NorthQuest Finance"[^>]*readonly/);
  assert.doesNotMatch(intake, /placeholder="e\.g\. OPay, GTBank"/);
});
