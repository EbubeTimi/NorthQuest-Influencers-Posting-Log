const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const appsScript = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('creator posting fields stay behind the six-digit PIN gate', () => {
  assert.match(html, /id="creator-pin"[^>]*maxlength="6"/);
  assert.match(html, /id="creator-secure-content" style="display:none"/);
  assert.match(html, /action:'verifyCreatorPin'/);
  assert.match(appsScript, /function handleVerifyCreatorPin\(/);
  assert.match(appsScript, /Utilities\.DigestAlgorithm\.SHA_256/);
  assert.doesNotMatch(appsScript, /appendRow\(\[name,\s*pin/i);
});

test('creator dashboard supports one, two, or three editable profile links', () => {
  assert.match(html, /id="profile-instagram"/);
  assert.match(html, /id="profile-tiktok"/);
  assert.match(html, /id="profile-facebook"/);
  assert.match(appsScript, /\['Name', 'Instagram', 'TikTok', 'Facebook', 'Updated At'\]/);
  assert.match(appsScript, /if \(!value\) return true/);
  assert.match(appsScript, /Use a complete profile URL for every link you add/);
});

test('admin keeps Creator Profiles and Analytics on separate pages', () => {
  assert.match(html, /id="page-profiles"/);
  assert.match(html, /id="page-analytics"/);
  assert.match(html, /onclick="setCreatorPinByIndex\(/);
  assert.match(html, /Instagram Videos/);
  assert.match(html, /TikTok Videos/);
  assert.match(html, /Facebook Videos/);
  assert.match(html, /Bank Name/);
  assert.match(appsScript, /function handleRunCreatorAnalytics\(/);
  assert.match(appsScript, /payableVideos/);
});

test('Manage Creators payment changes create Lagos-dated bonus audit deltas', () => {
  assert.match(appsScript, /NQ_BONUS_LEDGER_SHEET/);
  assert.match(appsScript, /Utilities\.formatDate\(new Date\(\), 'Africa\/Lagos', 'yyyy-MM-dd'\)/);
  assert.match(appsScript, /function nqAuditPaymentBonusChange_\(/);
  assert.match(appsScript, /nqAuditPaymentBonusChange_\(month, name, before, f\)/);
  assert.doesNotMatch(html, /id="bonus-entry-creator"/);
  assert.doesNotMatch(html, /id="bonus-entry-date"/);
});
