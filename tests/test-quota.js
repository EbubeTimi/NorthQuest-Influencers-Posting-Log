// Simulates handleSubmit's daily-cap counting, OLD vs NEW, against the exact
// situation the creators hit. Rows are [timestamp, name, dateCol, post, tk, ig, issues].

const TODAY = '2026-09-05';
const YESTERDAY = '2026-09-04';
const d = (s, h = 9) => new Date(`${s}T${String(h).padStart(2, '0')}:00:00`);

function countOLD(rows, name, wantsYesterday) {
  const target = wantsYesterday ? YESTERDAY : TODAY;
  let n = 0;
  for (const r of rows) {
    if (r[1].toLowerCase() !== name.toLowerCase()) continue;
    const rowDate = r[2];
    if (wantsYesterday) { if (rowDate === target) n++; }
    else {
      const ts = r[0];
      const tsStr = ts.getFullYear() + '-' + String(ts.getMonth() + 1).padStart(2, '0') + '-' + String(ts.getDate()).padStart(2, '0');
      if (tsStr === TODAY) n++;
    }
  }
  return n;
}

function countNEW(rows, name, wantsYesterday) {
  const target = wantsYesterday ? YESTERDAY : TODAY;
  let n = 0;
  for (const r of rows) {
    if (r[1].toLowerCase() !== name.toLowerCase()) continue;
    if (r[2] === target) n++;
  }
  return n;
}

const verdict = c => (c >= 2 ? 'BLOCKED' : `allowed (${c}/2 used)`);
let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`  ${ok ? '✅' : '❌'} ${label}\n      expected: ${expected}\n      actual:   ${actual}`);
}

console.log('\n=== CASE 1: creator backfilled 2 videos for YESTERDAY this morning,');
console.log('             now tries to log a video for TODAY ===');
let rows = [
  [d(TODAY, 9), 'Tammy', YESTERDAY, '1', 'tk-y1', '', ''],
  [d(TODAY, 9), 'Tammy', YESTERDAY, '2', 'tk-y2', '', ''],
];
console.log(`  OLD logic → ${verdict(countOLD(rows, 'Tammy', false))}`);
console.log(`  NEW logic → ${verdict(countNEW(rows, 'Tammy', false))}`);
check('new logic lets her log today', verdict(countNEW(rows, 'Tammy', false)), 'allowed (0/2 used)');
check('old logic was wrongly blocking her', verdict(countOLD(rows, 'Tammy', false)), 'BLOCKED');

console.log('\n=== CASE 2: the 2-a-day cap for TODAY still holds ===');
rows = [
  [d(TODAY, 20), 'Tammy', TODAY, '1', 'tk-1', '', ''],
  [d(TODAY, 21), 'Tammy', TODAY, '2', 'tk-2', '', ''],
];
check('third video today is refused', verdict(countNEW(rows, 'Tammy', false)), 'BLOCKED');

console.log('\n=== CASE 3: the 2-a-day cap for YESTERDAY still holds in grace window ===');
rows = [
  [d(TODAY, 9), 'Tammy', YESTERDAY, '1', 'tk-y1', '', ''],
  [d(TODAY, 9), 'Tammy', YESTERDAY, '2', 'tk-y2', '', ''],
];
check('third backfill for yesterday is refused', verdict(countNEW(rows, 'Tammy', true)), 'BLOCKED');

console.log('\n=== CASE 4: backfilled 1 for yesterday + logged 1 today ===');
console.log('             she should still have 1 slot left for today');
rows = [
  [d(TODAY, 9), 'Tammy', YESTERDAY, '1', 'tk-y1', '', ''],
  [d(TODAY, 20), 'Tammy', TODAY, '1', 'tk-1', '', ''],
];
console.log(`  OLD logic → ${verdict(countOLD(rows, 'Tammy', false))}`);
console.log(`  NEW logic → ${verdict(countNEW(rows, 'Tammy', false))}`);
check('new logic leaves her 1 slot today', verdict(countNEW(rows, 'Tammy', false)), 'allowed (1/2 used)');
check('old logic wrongly used up both', verdict(countOLD(rows, 'Tammy', false)), 'BLOCKED');

console.log('\n=== CASE 5: one creator never affects another ===');
rows = [
  [d(TODAY, 20), 'Tammy', TODAY, '1', 'tk-1', '', ''],
  [d(TODAY, 20), 'Tammy', TODAY, '2', 'tk-2', '', ''],
];
check('Ada is unaffected by Tammy being full', verdict(countNEW(rows, 'Ada', false)), 'allowed (0/2 used)');

console.log('\n=== CASE 6: matches what handleCheckPost tells the creator ===');
console.log('    (handleCheckPost counts rows whose DATE column is today)');
rows = [
  [d(TODAY, 9), 'Tammy', YESTERDAY, '1', 'tk-y1', '', ''],
  [d(TODAY, 9), 'Tammy', YESTERDAY, '2', 'tk-y2', '', ''],
];
const checkPostSays = rows.filter(r => r[1] === 'Tammy' && r[2] === TODAY).length;
check('submit path now agrees with what the app displays',
  `app says ${checkPostSays}, submit counts ${countNEW(rows, 'Tammy', false)}`,
  'app says 0, submit counts 0');
console.log(`  (before the fix the submit path counted ${countOLD(rows, 'Tammy', false)} — the contradiction)`);

console.log(failures === 0 ? '\n✅ ALL CHECKS PASSED\n' : `\n❌ ${failures} CHECK(S) FAILED\n`);
process.exit(failures === 0 ? 0 : 1);
