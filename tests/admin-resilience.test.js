const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const gs = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');

test('current-month response carries every available month and the admin summary', () => {
  assert.match(gs, /function handleGetAdminMonth[\s\S]*months:/);
  assert.match(gs, /function handleGetAdminMonth[\s\S]*summary:/);
  assert.match(html, /requestCurrentMonth[\s\S]*data\.months[\s\S]*adminAvailableMonths/);
});

test('admin shell no longer scans the Posting Log a second time', () => {
  const shell = /function handleGetAdminShell\(params\) \{([\s\S]*?)\n\}/.exec(gs);
  assert.ok(shell, 'getAdminShell handler exists');
  assert.doesNotMatch(shell[1], /buildAdminBootstrapPayload_|getSheet\(\)/);
});

test('a failed shell is not converted into fake loaded empty payments', () => {
  assert.doesNotMatch(html, /if \(!shellSucceeded && !hadCreators\) creatorsLoaded = true/);
  assert.doesNotMatch(html, /if \(!shellSucceeded && !hadPayments\) paysLoaded = true/);
  assert.match(html, /adminBootstrapFailed[\s\S]*retryLoadRows/);
  assert.match(html, /function renderDashboard[\s\S]*adminReferenceFailedRowHtml/);
  assert.match(html, /function renderWeekly[\s\S]*adminReferenceFailedRowHtml/);
});

test('late shell replies cannot overwrite newly saved columns or payment edits', () => {
  assert.match(html, /lastBonusCatEditTime/);
  assert.match(html, /shellRequestStarted\s*>=\s*lastBonusCatEditTime/);
  assert.match(html, /shellRequestStarted\s*>=\s*lastPayEditTime/);
  assert.match(html, /shellRequestStarted\s*>=\s*lastCreatorEditTime/);
  assert.match(html, /shellRequestStarted\s*>=\s*lastBonusTierEditTime/);
  assert.match(html, /pendingPayEdits\s*===\s*0\s*&&\s*shellRequestStarted\s*>=\s*lastPayEditTime/);
  assert.match(html, /pendingBonusCatEdits\s*===\s*0\s*&&\s*shellRequestStarted\s*>=\s*lastBonusCatEditTime/);
  assert.match(html, /pendingCreatorEdits\s*===\s*0\s*&&\s*shellRequestStarted\s*>=\s*lastCreatorEditTime/);
  assert.match(html, /pendingBonusTierEdits\s*===\s*0\s*&&\s*shellRequestStarted\s*>=\s*lastBonusTierEditTime/);
  assert.match(html, /function savePaymentField[\s\S]*?pendingPayEdits\+\+[\s\S]*?pendingPayEdits\s*=\s*Math\.max\(0,\s*pendingPayEdits\s*-\s*1\)/);
  assert.match(html, /function addCreator[\s\S]*?pendingCreatorEdits\+\+[\s\S]*?pendingCreatorEdits\s*=\s*Math\.max\(0,\s*pendingCreatorEdits\s*-\s*1\)/);
  assert.match(html, /function jsonp\(params, cb, timeoutMs, acceptLate\)/);
  assert.match(html, /if \(acceptLate\) cb\(data, 'late'\)/);
  assert.match(html, /function savePaymentField[\s\S]*?err === 'timeout'[\s\S]*?return;[\s\S]*?pendingPayEdits\s*=\s*Math\.max/);
  assert.match(html, /action:'savePayment'[\s\S]*?\}, 15000, true\)/);
  assert.match(html, /action:'savePayment'[\s\S]*?\(d, err\)\s*=>\s*\{[\s\S]*?lastPayEditTime\s*=\s*Date\.now\(\)/);
  assert.match(html, /action:'setBonusCategories'[\s\S]*?\(d, err\)\s*=>\s*\{[\s\S]*?lastBonusCatEditTime\s*=\s*Date\.now\(\)/);
  assert.match(html, /action:'setBonusTiers'[\s\S]*?\(d, err\)\s*=>\s*\{[\s\S]*?lastBonusTierEditTime\s*=\s*Date\.now\(\)/);
  assert.match(html, /action:'addCreator'[\s\S]*?\(data, err\)\s*=>\s*\{[\s\S]*?lastCreatorEditTime\s*=\s*Date\.now\(\)/);
  assert.match(html, /action:'setCreatorBank'[\s\S]*?\(d, err\)\s*=>\s*\{[\s\S]*?lastCreatorEditTime\s*=\s*Date\.now\(\)/);
  assert.match(html, /function deletePaymentRow[\s\S]*?const deleteMonth = selectedPayMonth[\s\S]*?pendingPayEdits\+\+[\s\S]*?pendingRowsEdits\[deleteMonth\][\s\S]*?err === 'timeout'[\s\S]*?pendingPayEdits\s*=\s*Math\.max[\s\S]*?pendingRowsEdits\[deleteMonth\][\s\S]*?\}, 15000, true\)/);
  assert.match(html, /pendingRowsEdits\[requestedMonth\][\s\S]*?monthRequestStarted\s*>=\s*\(lastRowsEditTime\[requestedMonth\]/);
  assert.match(html, /pendingRowsEdits\[ym\][\s\S]*?monthRequestStarted\s*>=\s*\(lastRowsEditTime\[ym\]/);
});

test('creator join dates keep their Lagos calendar day', () => {
  assert.match(gs, /added:\s*publicData\[i\]\[2\] instanceof Date\s*\?\s*Utilities\.formatDate\(publicData\[i\]\[2\], 'Africa\/Lagos', 'yyyy-MM-dd'\)/);
  assert.match(gs, /const added = data\[i\]\[2\] instanceof Date\s*\?\s*Utilities\.formatDate\(data\[i\]\[2\], 'Africa\/Lagos', 'yyyy-MM-dd'\)/);
});

test('admin login does not compete with the public bootstrap or require a manual retry', () => {
  assert.match(html, /creatorBootstrapTimer\s*=\s*setTimeout/);
  assert.match(html, /name === 'login' && creatorBootstrapTimer[\s\S]*clearTimeout\(creatorBootstrapTimer\)/);
  assert.match(html, /name === 'submit'[\s\S]*loadCreatorBootstrap\(\)/);
  assert.match(html, /function checkLogin\(\)[\s\S]*err\.classList\.remove\('show'\)/);
  assert.match(html, /function requestLogin\(attempt\)[\s\S]*attempt < 1[\s\S]*requestLogin\(attempt \+ 1\)/);
  assert.match(html, /action: 'adminLogin'[\s\S]*25000, true\)/);
  assert.match(html, /function finishLogin\(d\)[\s\S]*d\.status === 'success'[\s\S]*grantAdmin\(d\.adminKey\)/);
});


