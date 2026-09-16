const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const intake = fs.readFileSync(path.join(__dirname, '..', 'intake.html'), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, 'missing start marker: ' + start);
  const to = source.indexOf(end, from);
  assert.notEqual(to, -1, 'missing end marker: ' + end);
  return source.slice(from, to);
}

test('creator startup requests roster and recent rows in one bootstrap call', () => {
  const startup = between(
    index,
    "document.addEventListener('DOMContentLoaded'",
    "window.addEventListener('online', flushQueue)"
  );
  const creatorBranch = between(startup, 'if (!isAdmin) {', '} else {');
  assert.match(creatorBranch, /loadCreatorBootstrap\(\)/);
  assert.doesNotMatch(creatorBranch, /loadCreators\(\)/);
  assert.doesNotMatch(creatorBranch, /loadRows\(/);
  assert.doesNotMatch(creatorBranch, /loadBonusTiers\(/);
  assert.doesNotMatch(creatorBranch, /loadBonusCategories\(/);
  assert.doesNotMatch(creatorBranch, /loadPayments\(/);
});

test('admin startup and login use one bootstrap request instead of a request fan-out', () => {
  const startup = between(
    index,
    "document.addEventListener('DOMContentLoaded'",
    "window.addEventListener('online', flushQueue)"
  );
  const adminBranch = startup.slice(startup.indexOf('} else {'));
  assert.match(adminBranch, /loadAdminBootstrap\(\)/);
  assert.doesNotMatch(adminBranch, /loadRows\(\)/);
  assert.doesNotMatch(adminBranch, /loadCreators\(\)/);
  assert.doesNotMatch(adminBranch, /loadBonusTiers\(\)/);
  assert.doesNotMatch(adminBranch, /loadBonusCategories\(\)/);
  assert.doesNotMatch(adminBranch, /loadPayments\(\)/);

  const login = between(index, 'function grantAdmin(', '// Server-first login');
  assert.match(login, /loadAdminBootstrap\(\)/);
  assert.doesNotMatch(login, /loadCreators\(\)/);
  assert.doesNotMatch(login, /loadPayments\(\)/);
});

test('admin history is loaded one selected month at a time', () => {
  const monthLoader = between(index, 'function loadAdminMonth(', 'function loadCreatorBootstrap(');
  assert.match(monthLoader, /action:'getAdminMonth'/);
  assert.match(monthLoader, /adminLoadedMonths/);

  const paymentNav = between(index, 'function selectPayMonth(', '// Add a creator to the current register month');
  assert.match(paymentNav, /loadAdminMonth\(ym/);

  const pageNav = between(index, 'function showPage(', '// ── PAGE-NATIVE SEARCH');
  const paymentsPage = pageNav.match(/if \(name==='payments'\)[^\n]*/);
  assert.ok(paymentsPage, 'missing payments page navigation');
  assert.doesNotMatch(paymentsPage[0], /refreshPaymentsData/);
});

test('name selection stays quiet while logs load, but the logs modal shows progress', () => {
  const nameChange = between(index, 'function onNameChange(', 'function retryLoadRows(');
  const pendingState = between(
    nameChange,
    'if ((!dataLoaded || rowsAreForSomeoneElse(name)) && !rowsLoadFailed) {',
    '// We could not reach the server'
  );
  assert.match(pendingState, /statusEl\.style\.display = 'none'/);
  assert.doesNotMatch(pendingState, /waitingMessage\(\)/);

  const myLogs = between(index, 'function renderMyLogs(', 'const today = todayStr();');
  assert.match(myLogs, /class="spinner"/);
  assert.match(myLogs, /id="mylog-waiting"/);
  assert.match(myLogs, /waitingMessage\(\)/);
});

test('slow JSONP replies retain a cleanup callback', () => {
  const jsonp = between(index, 'function jsonp(', 'function saveQueue(');
  assert.match(jsonp, /window\[name\] = function\(\) \{ cleanup\(\); \}/);
  assert.match(jsonp, /setTimeout\(cleanup, 120000\)/);
});

test('log and creator loaders retry at most once', () => {
  const logLoader = between(index, 'function fetchLogWindow(', 'function currentCreatorName(');
  const creatorLoader = between(index, 'function loadCreators(', 'function getActiveCreators(');
  assert.match(logLoader, /attempt < 1/);
  assert.doesNotMatch(logLoader, /attempt < 4/);
  assert.match(creatorLoader, /attempt < 1/);
  assert.doesNotMatch(creatorLoader, /attempt < 4/);
});

test('confirmed submit success does not call checkPost again', () => {
  const submit = between(index, 'function doSubmitLog(', '// ── CONFIRM DIALOG');
  assert.match(submit, /finalizeSuccess\(/);
  assert.doesNotMatch(submit, /confirmSaved\(/);
  const uncertainty = between(index, 'function verifySubmission(', 'function refreshAll(');
  assert.match(uncertainty, /action:'checkPost'/);
});

test('intake backend contracts remain present', () => {
  assert.match(intake, /action:'intake'/);
  assert.match(intake, /action:'uploadContract'/);
  assert.match(intake, /nqEmailPass:/);
  assert.match(intake, /signature:/);
});
