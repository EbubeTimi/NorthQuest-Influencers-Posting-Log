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

test('PIN retry preserves the submitted credentials when background refresh clears the field', () => {
  assert.match(html, /function verifyCreatorPin\(attempt, preservedName, preservedPin\)/);
  assert.match(html, /verifyCreatorPin\(attempt \+ 1, name, pin\)/);
});

test('contract and PIN loading copy stay creator-facing and current', () => {
  assert.match(html, />Open the contract in a new tab</);
  assert.doesNotMatch(html, />Open the read-only contract/);
  assert.match(html, /btn\.textContent = messages\[messageIndex\]/);
  assert.match(appsScript, /Utilities\.formatDate\(new Date\(\), 'Africa\/Lagos', 'd MMMM yyyy'\)/);
});

test('creator dashboard supports one, two, or three editable profile links', () => {
  assert.match(html, /id="profile-instagram"/);
  assert.match(html, /id="profile-tiktok"/);
  assert.match(html, /id="profile-facebook"/);
  assert.match(appsScript, /\['Name', 'Instagram', 'TikTok', 'Facebook', 'Updated At'\]/);
  assert.match(appsScript, /if \(!value\) return true/);
  assert.match(appsScript, /Use a complete profile URL for every link you add/);
});

test('approved Growth Cooks creator design is the real signed-in flow', () => {
  assert.match(html, /class="creator-brand-mark"/);
  assert.match(html, /id="brand-wordmark">growthcooks<em>\.<\/em>/);
  assert.match(html, /Welcome, Creator\./);
  assert.match(html, /id="page-submit" class="page active main"/);
  assert.match(html, /id="creator-tabs"/);
  assert.match(html, />Log a post<\/button>/);
  assert.match(html, />My dashboard<\/button>/);
  assert.match(html, />Account profile<\/button>/);
  assert.match(html, /function openMyProfile\(/);
  assert.match(html, /let currentPage = 'submit'/);
  assert.match(html, /body:not\(\.is-admin-page\) \.header \{[\s\S]*?border:0; border-radius:0/);
  assert.match(html, /body:not\(\.is-admin-page\) \.login-card \{[\s\S]*?border:2px solid #11110f/);
  assert.match(html, /body:not\(\.is-admin-page\) \.login-brand,[\s\S]*?display:none/);
});

test('admin keeps Creator Profiles and Analytics on separate pages', () => {
  assert.match(html, /id="page-profiles"/);
  assert.match(html, /id="page-analytics"/);
  assert.match(html, /onclick="setCreatorPinByIndex\(/);
  assert.match(html, /Instagram Videos/);
  assert.match(html, /TikTok Videos/);
  assert.match(html, /Facebook Videos/);
  assert.match(html, /Bank Name/);
  assert.match(html, /id="analytics-roster-body"/);
  assert.match(html, /function renderAnalyticsRoster\(/);
  assert.match(appsScript, /function handleRunCreatorAnalytics\(/);
  assert.match(appsScript, /payableVideos/);
});

test('creator profile administration bulk-loads only unique active creators', () => {
  const handler = appsScript.match(/function handleGetCreatorProfiles\(\) \{[\s\S]*?\n\}/)[0];
  assert.match(handler, /String\(c\.status \|\| ''\)\.toLowerCase\(\) !== 'active'/);
  assert.match(handler, /if \(!key \|\| seen\[key\]/);
  assert.match(handler, /nqProfileRecordsMap_\(\)/);
  assert.match(handler, /nqCreatorAccessRecordsMap_\(\)/);
  assert.doesNotMatch(handler, /nqProfileRecord_\(c\.name\)/);
  assert.doesNotMatch(handler, /nqCreatorAccessRecord_\(c\.name\)/);
  assert.match(appsScript, /summary: \{ active: out\.length/);
});

test('creator profile loading retries once and also renders analytics readiness', () => {
  assert.match(html, /creatorProfilesLoadInFlight/);
  assert.match(html, /if \(attempt < 1\)/);
  assert.match(html, /renderAnalyticsRoster\(\)/);
  assert.match(html, /Active creators/);
  assert.match(html, /With profile links/);
});

test('admin can generate missing PINs once without replacing active PINs', () => {
  assert.match(html, /Generate missing PINs/);
  assert.match(html, /action:'generateMissingCreatorPins'/);
  assert.match(appsScript, /function handleGenerateMissingCreatorPins\(/);
  assert.match(appsScript, /existing && existing\.status\.toLowerCase\(\) === 'active'/);
  assert.match(appsScript, /generateMissingCreatorPins', 'getAnalyticsSetup', 'runCreatorAnalytics'/);
  assert.match(appsScript, /CacheService\.getScriptCache\(\)/);
  assert.match(appsScript, /function nqSheetWithHeaders_\([\s\S]*?var ss = getSpreadsheet_\(\)/);
});

test('generated PIN opens the existing creator WhatsApp contact with a prefilled message', () => {
  assert.match(html, /if \(rosterCreator && rosterCreator\.phone\) profile\.phone = rosterCreator\.phone/);
  assert.match(html, /generatedCreatorPins/);
  assert.match(html, /Send PIN via WhatsApp/);
  assert.match(html, /function sendCreatorPinViaWhatsApp\(/);
  assert.match(html, /https:\/\/api\.whatsapp\.com\/send\/\?phone=/);
  assert.match(html, /Your North Quest creator dashboard PIN is/);
  assert.doesNotMatch(html, /WhatsApp message prepared/);
});
test('Manage Creators payment changes create Lagos-dated bonus audit deltas', () => {
  assert.match(appsScript, /NQ_BONUS_LEDGER_SHEET/);
  assert.match(appsScript, /Utilities\.formatDate\(new Date\(\), 'Africa\/Lagos', 'yyyy-MM-dd'\)/);
  assert.match(appsScript, /function nqAuditPaymentBonusChange_\(/);
  assert.match(appsScript, /nqAuditPaymentBonusChange_\(month, name, before, f\)/);
  assert.doesNotMatch(html, /id="bonus-entry-creator"/);
  assert.doesNotMatch(html, /id="bonus-entry-date"/);
});

test('deactivated creators retain read-only access through the tenth of the next month', () => {
  assert.match(appsScript, /function nqCreatorRosterAccess_\(/);
  assert.match(appsScript, /function nqCreatorVisibleUntil_\(/);
  assert.match(appsScript, /function nqCreatorAccessMode_\(/);
  assert.match(appsScript, /action === 'submit'[\s\S]*?!nqCreatorCanWrite_/);
  assert.match(appsScript, /This dashboard is read-only/);
  assert.match(html, /id="creator-readonly-notice"/);
  assert.match(html, /creatorAccessMode === 'readOnly'/);
  assert.match(html, /You can view your dashboard, but you cannot log new videos/);
});

test('deactivation cutoff includes the tenth and hides the creator on the eleventh', () => {
  const visibleUntil = appsScript.match(/function nqCreatorVisibleUntil_\(left\) \{[\s\S]*?\n\}/)[0];
  const accessMode = appsScript.match(/function nqCreatorAccessMode_\(status, left, today\) \{[\s\S]*?\n\}/)[0];
  const factory = new Function(visibleUntil + '\n' + accessMode + '\nreturn { visibleUntil: nqCreatorVisibleUntil_, accessMode: nqCreatorAccessMode_ };');
  const rule = factory();
  assert.equal(rule.visibleUntil('2026-10-19'), '2026-11-10');
  assert.equal(rule.visibleUntil('2026-12-31'), '2027-01-10');
  assert.equal(rule.accessMode('Inactive', '2026-10-19', '2026-11-10'), 'readOnly');
  assert.equal(rule.accessMode('Inactive', '2026-10-19', '2026-11-11'), 'hidden');
  assert.equal(rule.accessMode('Active', '', '2026-11-11'), 'active');
});

test('creator dashboard and account profile switch below persistent tabs', () => {
  assert.match(html, /id="creator-tabs"[\s\S]*Log a post[\s\S]*My dashboard[\s\S]*Account profile/);
  assert.match(html, /id="creator-post-panel"/);
  assert.match(html, /id="creator-dashboard-panel"/);
  assert.match(html, /id="creator-profile-panel"/);
  assert.match(html, /showCreatorSection\('dashboard'/);
  assert.match(html, /showCreatorSection\('profile'/);
  assert.doesNotMatch(html, /id="page-creator-dashboard"/);
  assert.doesNotMatch(html, /id="page-creator-profile"/);
  assert.match(html, /function goToCreatorPost\(/);
});

test('creator PIN has visibility control, staged progress, and one automatic retry', () => {
  assert.match(html, /id="creator-pin-toggle"/);
  assert.match(html, /function toggleCreatorPinVisibility\(/);
  assert.match(html, /id="creator-pin-progress"/);
  assert.match(html, /Fetching your details/);
  assert.match(html, /Fetching your posting log/);
  assert.match(html, /Fetching your rates/);
  assert.match(html, /networkError && attempt < 1/);
});

test('creator roster is shown from cache while the live roster refreshes', () => {
  assert.match(html, /CREATOR_ROSTER_CACHE_KEY/);
  assert.match(html, /function hydrateCachedCreatorRoster\(/);
  assert.match(html, /hydrateCachedCreatorRoster\(\)/);
  assert.match(html, /cacheCreatorRoster\(allCreators\)/);
});

test('admin can generate one random PIN and control the posting cutoff', () => {
  assert.match(appsScript, /function handleGenerateCreatorPin/);
  assert.match(appsScript, /POSTING_CUTOFF_HOUR/);
  assert.match(appsScript, /function handleSetPostingCutoff/);
  assert.match(html, /Generate new PIN/);
  assert.match(html, /id="posting-cutoff-hour"/);
  assert.match(html, /action:'setPostingCutoff'/);
  assert.match(html, /id="generated-pin-result"/);
  assert.match(html, /function copyGeneratedPin\(/);
  assert.doesNotMatch(html, /prompt\('New PIN for/);
});

test('analytics exposes setup readiness and uses secure Apify authentication', () => {
  assert.match(appsScript, /'getAnalyticsSetup'/);
  assert.match(appsScript, /function handleGetAnalyticsSetup\(/);
  assert.match(appsScript, /Authorization:\s*'Bearer '\s*\+\s*token/);
  assert.doesNotMatch(appsScript, /run-sync-get-dataset-items\?token=/);
  assert.match(html, /function loadAnalyticsSetup\(/);
  assert.match(html, /Apify is not connected/);
});

test('creator profiles include only exactly active roster rows', () => {
  assert.match(appsScript, /function handleGetCreatorProfiles\(\)[\s\S]*status[^\n]*toLowerCase\(\) !== 'active'/);
});

test('admin and creator branding use Growthcooks', () => {
  assert.match(html, /login-brand-name">growthcooks/);
  assert.match(html, /wordmark\.textContent = 'Growthcooks'/);
  assert.doesNotMatch(html, /Northquest Finance/);
});

