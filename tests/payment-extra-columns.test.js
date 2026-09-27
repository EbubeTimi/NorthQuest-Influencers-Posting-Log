const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appsScript = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const code = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];

function buildSandbox() {
  const els = {};
  const el = id => els[id] || (els[id] = {
    id, innerHTML: '', textContent: '', style: {}, contains: () => false,
    parentNode: { querySelectorAll: () => [], insertBefore() {} }
  });
  const sandbox = {
    console,
    document: {
      getElementById: el, querySelectorAll: () => [], querySelector: () => null,
      addEventListener() {}, body: { classList: { add() {}, remove() {} } },
      activeElement: null, documentElement: { style: { setProperty() {} } },
      createElement: () => ({ className: '', innerHTML: '', parentNode: null })
    },
    window: {}, navigator: { userAgent: 'node' },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    setTimeout, clearTimeout, setInterval, clearInterval,
    location: { href: '', search: '', hash: '' }
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const bridge = "\n;globalThis.__set = function (k, v) { eval(k + ' = v'); };";
  try { vm.runInContext(code + bridge, sandbox); } catch (_) {}
  return sandbox;
}

test('payment register hides raw bonus storage and keeps custom columns before total', () => {
  const header = html.match(/<table class="pay-table">[\s\S]*?<\/thead>/)?.[0] || '';
  assert.doesNotMatch(header, /id="ph-bv"|id="ph-special"/);
  assert.match(header, /id="ph-perf"[\s\S]*id="ph-total"/);
  assert.match(code, /document\.getElementById\('ph-perf'\)/);
  assert.equal((code.match(/function payExtraBonusCells/g) || []).length, 1);
});

test('custom payment columns accept direct naira amounts without a duplicate amount below', () => {
  const sandbox = buildSandbox();
  sandbox.__set('bonusCats', [
    { month: '2026-09', name: 'Budget Videos', amount: 10000 },
    { month: '2026-09', name: 'Referral', amount: 30000 }
  ]);
  sandbox.__set('selectedPayMonth', '2026-09');
  sandbox.__set('allPayments', []);

  assert.equal(sandbox.getPaymentExtraAmount('Referral:2', '2026-09', 'Referral'), 60000);
  assert.equal(sandbox.getPaymentExtraAmount('Referral=45000', '2026-09', 'Referral'), 45000);
  assert.equal(
    sandbox.setPaymentExtraAmount('Budget Videos=10000, Referral:2', 'Referral', '30000'),
    'Budget Videos=10000, Referral=30000'
  );
  assert.equal(sandbox.paymentExtraTotal('Budget Videos=10000, Referral=30000', '2026-09'), 40000);

  const cells = sandbox.payExtraBonusCells('Ada');
  assert.doesNotMatch(cells, /eb-paid|Referral:|Budget Videos:/);
  assert.match(cells, /inputmode="decimal"/);
});

test('export follows the visible payment order and omits Bonus Views and Special Bonus', () => {
  const start = html.indexOf('function exportPaymentsCSV()');
  const end = html.indexOf('// ══════════════════════════════════════════════════════════', start);
  const exportFn = start > -1 && end > start ? html.slice(start, end) : '';
  assert.doesNotMatch(exportFn, /'Bonus Views'|'Special Bonus \(₦\)'/);
  assert.match(exportFn, /extraCats\.map\(c => c\.name\)/);
  assert.match(exportFn, /'Performance Bonus \(₦\)'[\s\S]*extraCats[\s\S]*'Total Payable \(₦\)'/);
});

test('Apps Script accepts zero as the legacy rate for a name-only payment column', () => {
  assert.match(appsScript, /const rawAmount = list\[i\] && list\[i\]\.amount;/);
  assert.match(appsScript, /rawAmount == null \? '' : rawAmount/);
  assert.doesNotMatch(appsScript, /String\(\(list\[i\] && list\[i\]\.amount\) \|\| ''\)/);
});

test('payment column reorder controls stay compact and wording says column', () => {
  assert.match(html, /\.bt-row\.payment-column-row \{ grid-template-columns: minmax\(0,1fr\) auto auto auto; \}/);
  assert.match(html, /Remove a column to stop it applying\./);
});
