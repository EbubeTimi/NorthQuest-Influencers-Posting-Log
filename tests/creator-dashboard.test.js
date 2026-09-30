const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const appsScript = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function functionSource(source, name) {
  const start = source.indexOf('function ' + name + '(');
  assert.notEqual(start, -1, name + ' should exist');
  let depth = 0;
  let opened = false;
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') { depth++; opened = true; }
    if (source[i] === '}') {
      depth--;
      if (opened && depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('Could not extract ' + name);
}

test('one creator log response carries pay and both bonus references', () => {
  const getSource = functionSource(appsScript, 'handleGet');
  assert.match(getSource, /if \(only && useSince\)/);
  assert.match(getSource, /handleGetMyPay\(\{ name: only \}\)/);
  assert.match(getSource, /handleGetBonusTiers\(\{ month: month \}\)/);
  assert.match(getSource, /handleGetBonusCategories\(\)/);
  assert.match(getSource, /payments: pay\.payments \|\| \[\]/);
  assert.match(getSource, /categories: categories\.categories \|\| \[\]/);

  const bootstrapSource = functionSource(appsScript, 'handleGetCreatorBootstrap');
  assert.match(bootstrapSource, /payments: logs\.payments \|\| \[\]/);
  assert.match(bootstrapSource, /monthlyTiers: logs\.monthlyTiers \|\| \{\}/);
  assert.match(bootstrapSource, /categories: logs\.categories \|\| \[\]/);
});

test('combined creator payload replaces only that creator and becomes render-ready', () => {
  const sandbox = {
    allPayments: [
      { name: 'Ada', month: '2026-09', specialBonus: '' },
      { name: 'Ohia Promise Chiamaka', month: '2026-08', specialBonus: '' }
    ],
    myOwnRate: { name: '', rate: 0 },
    bonusTiersLoaded: false,
    bonusCatsLoaded: false,
    bonusCats: [],
    creatorDashboardLoadedFor: null,
    acceptBonusTierPayload(data) { sandbox.acceptedTiers = data.tiers; }
  };
  vm.createContext(sandbox);
  vm.runInContext(functionSource(html, 'acceptCreatorDashboardPayload'), sandbox);
  vm.runInContext(functionSource(html, 'creatorDashboardIsLoaded'), sandbox);

  const accepted = sandbox.acceptCreatorDashboardPayload('Ohia Promise Chiamaka', {
    payments: [{ name: 'Ohia Promise Chiamaka', month: '2026-09', specialBonus: 'Referral=30000' }],
    rate: 150000,
    tiers: [[100000, 50000]],
    categories: [{ month: '2026-09', name: 'Referral', amount: 0 }]
  });

  assert.equal(accepted, true);
  assert.deepEqual(JSON.parse(JSON.stringify(sandbox.allPayments)), [
    { name: 'Ada', month: '2026-09', specialBonus: '' },
    { name: 'Ohia Promise Chiamaka', month: '2026-09', specialBonus: 'Referral=30000' }
  ]);
  assert.equal(sandbox.myOwnRate.rate, 150000);
  assert.equal(sandbox.bonusTiersLoaded, true);
  assert.equal(sandbox.bonusCatsLoaded, true);
  assert.equal(sandbox.creatorDashboardIsLoaded('OHIA PROMISE CHIAMAKA'), true);
});

test('opening logs does not fan out legacy pay requests while dashboard load is running', () => {
  const calls = [];
  const sandbox = {
    document: { getElementById(id) { return id === 'f-name' ? { value: 'Ohia Promise Chiamaka' } : {}; } },
    logLoadInFlight: true,
    loadRowsIfStale() { calls.push('rows'); },
    renderMyLogs() { calls.push('render'); },
    creatorDashboardIsLoaded() { return false; },
    loadMyPay() { calls.push('pay'); },
    loadBonusTiers() { calls.push('tiers'); },
    loadBonusCategories() { calls.push('categories'); }
  };
  vm.createContext(sandbox);
  vm.runInContext(functionSource(html, 'openMyLogs'), sandbox);
  sandbox.openMyLogs();
  assert.deepEqual(calls, ['rows', 'render']);
});

test('payment edits send only the changed field and preserve edit order', () => {
  const requests = [];
  const sandbox = {
    paymentSaveQueues: {},
    allPayments: [{ month: '2026-09', name: 'Ohia Promise Chiamaka', specialBonus: '' }],
    lastPayEditTime: 0,
    pendingPayEdits: 0,
    Date,
    jsonp(payload, cb) { requests.push({ payload, cb }); },
    showToast() {},
    renderPayments() {}
  };
  vm.createContext(sandbox);
  vm.runInContext(functionSource(html, 'runNextPaymentSave'), sandbox);
  vm.runInContext(functionSource(html, 'savePaymentField'), sandbox);

  sandbox.savePaymentField('2026-09', 'Ohia Promise Chiamaka', 'specialBonus', 'Referral=30000', false);
  sandbox.savePaymentField('2026-09', 'Ohia Promise Chiamaka', 'specialBonus', 'Referral=30000, Budget Videos=10000', false);

  assert.equal(requests.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(requests[0].payload)), {
    action: 'savePayment', month: '2026-09', name: 'Ohia Promise Chiamaka', specialBonus: 'Referral=30000'
  });
  assert.equal('paymentStatus' in requests[0].payload, false);

  requests[0].cb({ status: 'success' }, null);
  assert.equal(requests.length, 2);
  assert.equal(requests[1].payload.specialBonus, 'Referral=30000, Budget Videos=10000');
  requests[1].cb({ status: 'success' }, null);
  assert.equal(sandbox.pendingPayEdits, 0);
});

test('payment row merge is protected by a script lock', () => {
  const saveSource = functionSource(appsScript, 'handleSavePayment');
  assert.match(saveSource, /LockService\.getScriptLock\(\)/);
  assert.match(saveSource, /lock\.waitLock\(20000\)/);
  assert.match(saveSource, /upsertManual\(month, name, f\)/);
  assert.match(saveSource, /finally\s*\{\s*lock\.releaseLock\(\)/);
});
