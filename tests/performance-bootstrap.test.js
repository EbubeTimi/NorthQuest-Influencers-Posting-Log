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

test('creator startup serializes roster before creator rows', () => {
  const startup = between(
    index,
    "document.addEventListener('DOMContentLoaded'",
    "window.addEventListener('online', flushQueue)"
  );
  const creatorBranch = between(startup, 'if (!isAdmin) {', '} else {');
  assert.match(creatorBranch, /loadCreators\(\)/);
  assert.doesNotMatch(creatorBranch, /loadRows\(/);
  assert.doesNotMatch(creatorBranch, /loadBonusTiers\(/);
  assert.doesNotMatch(creatorBranch, /loadBonusCategories\(/);
  assert.doesNotMatch(creatorBranch, /loadPayments\(/);
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
