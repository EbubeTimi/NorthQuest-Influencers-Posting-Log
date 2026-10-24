const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('completed intake marks only that creator as eligible for first-time PIN creation', () => {
  const intake = code.match(/function handleIntake\(params\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(intake, /getRange\(savedCreatorRow, 25\)\.setValue\(true\)/);
});

test('public status reveals only whether the selected creator should create or enter a PIN', () => {
  assert.match(code, /function handleGetCreatorPinStatus\(params\)/);
  assert.match(code, /mode: hasActivePin \? 'login' : \(selfPinEligible \? 'create' : 'login'\)/);
  assert.match(code, /else if \(action === 'getCreatorPinStatus'\)/);
});

test('first-time PIN creation is intake-only, atomic, and never overwrites an active PIN', () => {
  const handler = code.match(/function handleCreateCreatorPin\(params\) \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(handler, /LockService\.getScriptLock\(\)/);
  assert.match(handler, /tryLock\(/);
  assert.match(handler, /selfPinEligible/);
  assert.match(handler, /already has a PIN/);
  assert.match(handler, /nqPinHash_\(salt, pin\)/);
  assert.match(code, /else if \(action === 'createCreatorPin'\)/);
});

test('new creator creates and confirms a PIN, can copy it, then lands on Account profile once', () => {
  assert.match(html, /id="creator-pin-setup"/);
  assert.match(html, /id="creator-pin-create"[^>]*maxlength="6"/);
  assert.match(html, /id="creator-pin-confirm"[^>]*maxlength="6"/);
  assert.match(html, /function createCreatorPin\(/);
  assert.match(html, /action:'createCreatorPin'/);
  assert.match(html, /function copyNewCreatorPin\(/);
  assert.match(html, /showCreatorSection\('profile', document\.getElementById\('creator-profile-tab'\)\)/);
});

test('returning creator still lands on Log a post and intake creators skip recontract', () => {
  assert.match(html, /else showCreatorSection\('post', document\.getElementById\('creator-post-tab'\)\)/);
  assert.match(code, /contractRequired: false/);
});
