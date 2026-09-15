const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');

function loadBackend() {
  const cacheValues = new Map();
  const propertyValues = new Map();
  const cache = {
    get(key) { return cacheValues.has(key) ? cacheValues.get(key) : null; },
    put(key, value) { cacheValues.set(key, value); },
    remove(key) { cacheValues.delete(key); },
  };
  const properties = {
    getProperty(key) { return propertyValues.has(key) ? propertyValues.get(key) : null; },
    setProperty(key, value) { propertyValues.set(key, value); },
  };
  const sandbox = {
    CacheService: { getScriptCache: () => cache },
    PropertiesService: { getScriptProperties: () => properties },
    console,
    Date,
    JSON,
    Math,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return { sandbox, cacheValues, propertyValues };
}

test('creator log reads are cached and invalidated after a write', () => {
  const { sandbox } = loadBackend();
  let reads = 0;
  const values = [
    ['Timestamp', 'Name', 'Date', 'Post', 'TikTok', 'Instagram', 'Issues'],
    ['2026-09-14T09:00:00Z', 'Ada', '2026-09-14', '1', 'tt-a', 'ig-a', ''],
    ['2026-09-14T10:00:00Z', 'Ben', '2026-09-14', '1', 'tt-b', 'ig-b', ''],
  ];
  sandbox.getSheet = () => ({
    getDataRange: () => ({
      getValues: () => { reads += 1; return values; },
    }),
  });

  const first = sandbox.handleGet({ name: 'Ada', since: '2026-08-01' });
  const second = sandbox.handleGet({ name: 'Ada', since: '2026-08-01' });
  assert.equal(reads, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(first)));
  assert.equal(first.rows.length, 1);

  sandbox.nqBumpLogVersion_('Ada');
  sandbox.handleGet({ name: 'Ada', since: '2026-08-01' });
  assert.equal(reads, 2);
});

test('public creator roster is cached without exposing admin fields', () => {
  const { sandbox } = loadBackend();
  let reads = 0;
  sandbox.getCreatorsSheet = () => ({
    getLastRow: () => 3,
    getRange: () => ({
      getValues: () => {
        reads += 1;
        return [
          ['Ada', 'Active', '2026-01-01'],
          ['Ben', 'Inactive', '2026-02-01'],
        ];
      },
    }),
  });

  const first = sandbox.handleGetCreators(false);
  const second = sandbox.handleGetCreators(false);
  assert.equal(reads, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(first)));
  assert.deepEqual(Object.keys(first.creators[0]).sort(), ['added', 'name', 'status']);
});

test('creator bootstrap returns roster and only the requested creator rows', () => {
  const { sandbox } = loadBackend();
  const postingValues = [
    ['Timestamp', 'Name', 'Date', 'Post', 'TikTok', 'Instagram', 'Issues'],
    ['2026-09-14T09:00:00Z', 'Ada', '2026-09-14', '1', 'tt-a', 'ig-a', ''],
    ['2026-09-14T10:00:00Z', 'Ben', '2026-09-14', '1', 'tt-b', 'ig-b', ''],
  ];
  sandbox.getSheet = () => ({ getDataRange: () => ({ getValues: () => postingValues }) });
  sandbox.getCreatorsSheet = () => ({
    getLastRow: () => 3,
    getRange: () => ({ getValues: () => [
      ['Ada', 'Active', '2026-01-01'],
      ['Ben', 'Active', '2026-02-01'],
    ] }),
  });

  const result = sandbox.handleGetCreatorBootstrap({ name: 'Ada', since: '2026-08-01' });
  assert.equal(result.status, 'success');
  assert.equal(result.creators.length, 2);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0][1], 'Ada');
});

test('creator pay reads are cached and explicit invalidation refreshes them', () => {
  const { sandbox } = loadBackend();
  let manualReads = 0;
  let creatorReads = 0;
  sandbox.getManualSheet = () => ({
    getDataRange: () => ({
      getValues: () => {
        manualReads += 1;
        return [
          ['Month', 'Name', 'Bonus Views', 'Special Bonus'],
          ["'2026-09", 'Ada', "'100000", '5000', '', '', '', '', '', '', ''],
        ];
      },
    }),
  });
  sandbox.getCreatorsSheet = () => ({
    getDataRange: () => ({
      getValues: () => {
        creatorReads += 1;
        return [['Name', 'Status', 'Added', 'Rate'], ['Ada', 'Active', '', 150000]];
      },
    }),
  });

  sandbox.handleGetMyPay({ name: 'Ada' });
  sandbox.handleGetMyPay({ name: 'Ada' });
  assert.equal(manualReads, 1);
  assert.equal(creatorReads, 1);

  sandbox.nqInvalidateCreatorPay_('Ada');
  sandbox.handleGetMyPay({ name: 'Ada' });
  assert.equal(manualReads, 2);
  assert.equal(creatorReads, 2);
});
