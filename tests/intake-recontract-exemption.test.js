const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const intakeHandler = code.match(/function handleIntake\(params\) \{([\s\S]*?)\n\}/)?.[1] || '';
const loginHandler = code.match(/function handleVerifyCreatorPin\(params\) \{([\s\S]*?)\n\}/)?.[1] || '';

test('completed intake exempts that creator from the existing-roster recontract gate', () => {
  assert.match(intakeHandler, /const savedCreatorRow = rowIdx > -1 \? rowIdx : sheet\.getLastRow\(\)/);
  assert.match(intakeHandler, /sheet\.getRange\(savedCreatorRow, 23\)\.setValue\(true\)/);
});

test('creator login still requires the renewed contract unless the exemption is true', () => {
  assert.match(loginHandler, /contractRequired = !\(creatorRow && String\(creatorRow\.recontractSigned \|\| ''\)\.toLowerCase\(\) === 'true'\)/);
});
