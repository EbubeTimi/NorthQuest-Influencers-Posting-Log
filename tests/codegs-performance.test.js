const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, 'missing start marker: ' + start);
  const to = source.indexOf(end, from);
  assert.notEqual(to, -1, 'missing end marker: ' + end);
  return source.slice(from, to);
}

test('creator startup uses one bootstrap API request', () => {
  const startup = between(
    index,
    "document.addEventListener('DOMContentLoaded'",
    "window.addEventListener('online', flushQueue)"
  );
  const creatorBranch = between(startup, 'if (!isAdmin) {', '} else {');
  assert.match(creatorBranch, /loadCreatorBootstrap\(\)/);
  assert.doesNotMatch(creatorBranch, /loadCreators\(\)/);
  assert.doesNotMatch(creatorBranch, /loadRows\(/);
});

test('Apps Script dispatch exposes creator bootstrap without changing intake', () => {
  const dispatch = between(code, 'function doGet(e)', 'function doPost(e)');
  assert.match(dispatch, /action === 'getCreatorBootstrap'/);
  assert.match(dispatch, /handleGetCreatorBootstrap\(e\.parameter\)/);
  assert.match(dispatch, /action === 'intake'/);
  const post = between(code, 'function doPost(e)', 'function handleUploadContract(');
  assert.match(post, /body\.action === 'uploadContract'/);
});

test('Apps Script exposes protected admin bootstrap and month endpoints', () => {
  const adminActions = between(code, 'var NQ_ADMIN_ACTIONS = [', '];');
  assert.match(adminActions, /'getAdminBootstrap'/);
  assert.match(adminActions, /'getAdminMonth'/);

  const dispatch = between(code, 'function doGet(e)', 'function doPost(e)');
  assert.match(dispatch, /action === 'getAdminBootstrap'/);
  assert.match(dispatch, /handleGetAdminBootstrap\(e\.parameter\)/);
  assert.match(dispatch, /action === 'getAdminMonth'/);
  assert.match(dispatch, /handleGetAdminMonth\(e\.parameter\)/);

  const bootstrap = between(code, 'function handleGetAdminBootstrap(', 'function handleGetAdminMonth(');
  assert.match(bootstrap, /handleGetCreators\(true\)/);
  assert.match(bootstrap, /handleGetPayments\(\)/);
  assert.match(bootstrap, /handleGetBonusTiers\(\)/);
  assert.match(bootstrap, /handleGetBonusCategories\(\)/);
  assert.match(bootstrap, /summary/);
  assert.match(bootstrap, /months/);
});

test('high-frequency creator reads use Apps Script cache', () => {
  assert.match(code, /CacheService\.getScriptCache\(\)/);
  const creators = between(code, 'function handleGetCreators(', 'function handleAddCreator(');
  const logs = between(code, 'function handleGet(params)', 'function handleGetCreatorBootstrap(');
  const pay = between(code, 'function handleGetMyPay(', 'function handleGetPayments(');
  assert.match(creators, /nqCacheGetJson_/);
  assert.match(creators, /nqCachePutJson_/);
  assert.match(logs, /nqCacheGetJson_/);
  assert.match(logs, /nqCachePutJson_/);
  assert.match(pay, /nqCacheGetJson_/);
  assert.match(pay, /nqCachePutJson_/);
});

test('creator and log mutations invalidate their caches', () => {
  const submit = between(code, 'function handleSubmit(', 'function handleCheckPost(');
  const add = between(code, 'function handleAddCreator(', 'function handleToggleCreator(');
  const toggle = between(code, 'function handleToggleCreator(', 'function handleDeleteCreator(');
  const remove = between(code, 'function handleDeleteCreator(', 'function handleSetRate(');
  const intake = between(code, 'function handleIntake(', 'function appendToDatabaseDoc(');
  assert.match(submit, /nqBumpLogVersion_\(name\)/);
  assert.match(add, /nqInvalidateCreatorRoster_\(\)/);
  assert.match(toggle, /nqInvalidateCreatorRoster_\(\)/);
  assert.match(remove, /nqInvalidateCreatorRoster_\(\)/);
  assert.match(intake, /nqInvalidateCreatorRoster_\(\)/);
});

test('successful submit returns the saved post and date', () => {
  const submit = between(code, 'function handleSubmit(', 'function handleCheckPost(');
  assert.match(submit, /status: 'success', post: post, date: targetDateStr/);
});
