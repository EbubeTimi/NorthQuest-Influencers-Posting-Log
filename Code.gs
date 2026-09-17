// ==========================================================
// NORTHQUEST — HARMONIZED Code.gs
// Combines the live data/cleanup backend with the onboarding
// and in-app payments backend. Deploy as a NEW version.
// Data-cleanup tools (mergeBatch2, forensicCheck, the monthly
// register builder) are kept untouched. seedFromRegisters is
// intentionally NOT included (it held old, pre-cleanup names).
// ==========================================================








const SHEET_NAME = 'Posting Log';
const CREATORS_SHEET = 'Creators';
const MANUAL_SHEET = 'Payment Manual';
const SHEET_ID = '18y6PCB4Dl8fAr8SIQY52fBCReAn8B8Mzqwu9qyj_S0g';
// Monthly salary stored per creator. The per-video rate is never stored directly —
// it is calculated at display time as: salary ÷ 60 (flat divisor, regardless of month length).
// Pay = (videos actually posted that month) × per-video rate.
const DEFAULT_MONTHLY_SALARY = 150000;  // ₦150,000/month — current default for any new creator
const NEW_CREATOR_MONTHLY_SALARY = 150000;  // kept for backward compatibility; same as default
const LEGACY_MONTHLY_SALARY = 100000;     // ₦100,000/month — older creators only; never auto-assigned








// Onboarding destinations
const SIGNED_FOLDER_ID = '1rt1u3zsLXMcBr3jKwKMOAnpY4kUvy-Ww';   // signed contracts land here
const DB_DOC_ID = '1HYDnzyZUuyZjNOobvzItIJou39nzhVWEUQlAnQn_dNo'; // master creator database doc








// Set to false to launch onboarding WITHOUT storing account passwords
// (they will be left blank in the sheet and the database doc).
const STORE_PASSWORDS = true;


// ==========================================================
// HOT-PATH CACHE + PER-EXECUTION SHEET HANDLE
// ==========================================================
// Creator phones ask for the same small roster and recent-row slices all day.
// Cache those read-only replies so creator growth does not turn every page
// open into another full-sheet scan. All cache helpers fail open: a cache
// outage can make a request slower, but can never block a submission.
const NQ_PUBLIC_CREATORS_CACHE_KEY = 'nq:creators:public:v2';
const NQ_BONUS_TIERS_CACHE_KEY = 'nq:bonus-tiers:v2';
const NQ_BONUS_CATS_CACHE_KEY = 'nq:bonus-cats:v2';
const NQ_ROSTER_CACHE_SECONDS = 300;
const NQ_CREATOR_LOG_CACHE_SECONDS = 120;
const NQ_CREATOR_PAY_CACHE_SECONDS = 120;
const NQ_REFERENCE_CACHE_SECONDS = 600;

let nqSpreadsheet_ = null;

function getSpreadsheet_() {
  if (!nqSpreadsheet_) nqSpreadsheet_ = SpreadsheetApp.openById(SHEET_ID);
  return nqSpreadsheet_;
}

function nqCache_() {
  try { return CacheService.getScriptCache(); }
  catch (err) { return null; }
}

function nqCacheGetJson_(key) {
  try {
    const cache = nqCache_();
    const raw = cache && cache.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

function nqCachePutJson_(key, value, seconds) {
  try {
    const cache = nqCache_();
    if (!cache) return;
    const raw = JSON.stringify(value);
    // Apps Script limits each cache entry to 100 KB. Stay comfortably below
    // that ceiling; oversized creator histories still work uncached.
    if (raw.length <= 90000) cache.put(key, raw, seconds);
  } catch (err) {
    // Cache is an optimization only.
  }
}

function nqCacheRemove_(key) {
  try {
    const cache = nqCache_();
    if (cache) cache.remove(key);
  } catch (err) {
    // Cache is an optimization only.
  }
}

function nqShortHash_(value) {
  const text = String(value || '').toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return text.length.toString(36) + '-' + hash.toString(36);
}

function nqLogVersionKey_(name) {
  return 'NQ_LOG_VERSION_' + nqShortHash_(name);
}

function nqLogVersion_(name) {
  try { return PropertiesService.getScriptProperties().getProperty(nqLogVersionKey_(name)) || '0'; }
  catch (err) { return '0'; }
}

function nqBumpLogVersion_(name) {
  try { PropertiesService.getScriptProperties().setProperty(nqLogVersionKey_(name), String(Date.now())); }
  catch (err) { /* cache invalidation must never block a saved post */ }
}

function nqCreatorLogCacheKey_(name, since, until) {
  return 'nq:log:' + nqShortHash_(name) + ':' + nqLogVersion_(name) + ':' + (since || '-') + ':' + (until || '-');
}

function nqCreatorPayCacheKey_(name) {
  return 'nq:pay:' + nqShortHash_(name);
}

function nqInvalidateCreatorPay_(name) {
  nqCacheRemove_(nqCreatorPayCacheKey_(name));
}

function nqInvalidateCreatorRoster_() {
  nqCacheRemove_(NQ_PUBLIC_CREATORS_CACHE_KEY);
}

function nqInvalidateBonusTiers_() {
  nqCacheRemove_(NQ_BONUS_TIERS_CACHE_KEY);
}

function nqInvalidateBonusCategories_() {
  nqCacheRemove_(NQ_BONUS_CATS_CACHE_KEY);
}








function getSheet() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp','Name','Date','Post Number','TikTok Link','Instagram Link','Issues']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}








function getCreatorsSheet() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(CREATORS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(CREATORS_SHEET);
    sheet.appendRow(['Name','Status','Added','Monthly Salary','Bank Name','Account Number','Account Name']);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else {
    const headers = sheet.getRange(1, 1, 1, Math.max(7, sheet.getLastColumn())).getValues()[0];
    if (!headers[3] || headers[3] !== 'Monthly Salary') {
      sheet.getRange(1, 4).setValue('Monthly Salary').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.getRange(1, 5).setValue('Bank Name').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.getRange(1, 6).setValue('Account Number').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.getRange(1, 7).setValue('Account Name').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        for (let i = 2; i <= lastRow; i++) {
          const cell = sheet.getRange(i, 4);
          if (!cell.getValue()) cell.setValue(DEFAULT_MONTHLY_SALARY);
        }
      }
    }
  }
  // One-time column-8-20 setup + number formatting, gated behind a Script
  // Property so this never re-runs (and re-costs several Sheets API
  // round-trips) on every single getCreators call once it's done. Before
  // this gate, getCreatorsSheet() did 3 getLastColumn() reads plus an
  // unconditional setNumberFormat() write EVERY call, forever — real,
  // compounding latency on the one function that fires every time the
  // name dropdown loads. Diagnosed 18 July 2026 after reports of names
  // taking minutes to load.
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('CREATORS_SCHEMA_READY') !== '1') {
    // Ensure the onboarding / credential columns (8-17) exist. Never touches columns 1-7.
    const CRED = ['Phone','Email','NQ Email','NQ Email Password','Instagram Username','Instagram Password','TikTok Username','TikTok Password','Contract Signed','Intake Date'];
    let lastCol = sheet.getLastColumn();
    if (lastCol < 17) {
      for (let k = 0; k < CRED.length; k++) {
        sheet.getRange(1, 8 + k).setValue(CRED[k]).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      }
      sheet.setFrozenRows(1);
      lastCol = 17;
    }
    // Columns 18-19: filled automatically the moment the signed contract PDF
    // actually lands in the Drive folder (handleUploadContract) — separate
    // from "Contract Signed" (col 16), which only records the typed signature
    // at intake time. Having both lets the admin see the difference between
    // "signed the form" and "the file is actually filed".
    if (lastCol < 19) {
      sheet.getRange(1, 18).setValue('Contract File Link').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.getRange(1, 19).setValue('Contract Filed At').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      lastCol = 19;
    }
    // Column 20: admin has manually marked an outstanding contract issue as
    // handled (e.g. confirmed by phone) even though no PDF has landed yet —
    // lets Manage Creators stop flagging something that's already been dealt with.
    if (lastCol < 20) {
      sheet.getRange(1, 20).setValue('Contract Resolved').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
    // Keep account numbers as text so leading zeros survive
    sheet.getRange(2, 6, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');
    props.setProperty('CREATORS_SCHEMA_READY', '1');
  }
  // Column 21: what the creator said they make at onboarding (see nqTierRate_).
  // Its own gate, because CREATORS_SCHEMA_READY is already '1' on the live
  // sheet and that block will never run again.
  if (props.getProperty('CREATORS_TYPE_COL_READY') !== '1') {
    // A sheet trimmed to exactly 20 columns would make getRange(1, 21) throw,
    // and this function is called by nearly everything else — the creators
    // dropdown, intake, rate edits, bank edits. Widen first, and never let a
    // failure here take the whole app down with it.
    try {
      var maxCols = sheet.getMaxColumns();
      if (maxCols < 21) sheet.insertColumnsAfter(maxCols, 21 - maxCols);
      sheet.getRange(1, 21).setValue('Creator Type').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      props.setProperty('CREATORS_TYPE_COL_READY', '1');
    } catch (err) {
      Logger.log('Creator Type column setup skipped: ' + err);
    }
  }
  // Column 22: stamped automatically the moment a creator is deactivated,
  // cleared automatically the moment they are reactivated (handleToggleCreator).
  // Before this column existed, "when did they leave" was never actually
  // saved anywhere — the app only kept a guess in the browser's own local
  // storage on whichever device clicked Deactivate, invisible to any other
  // device and lost if that browser's data was ever cleared. CashDrive's
  // Creators sheet already has this real column; NorthQuest's never did.
  if (props.getProperty('CREATORS_LEFT_COL_READY') !== '1') {
    try {
      var maxCols2 = sheet.getMaxColumns();
      if (maxCols2 < 22) sheet.insertColumnsAfter(maxCols2, 22 - maxCols2);
      sheet.getRange(1, 22).setValue('Left Date').setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      props.setProperty('CREATORS_LEFT_COL_READY', '1');
    } catch (err) {
      Logger.log('Left Date column setup skipped: ' + err);
    }
  }
  return sheet;
}








const BONUS_TIERS_SHEET = 'Bonus Tiers';
const DEFAULT_BONUS_TIERS = [
  [100000, 50000], [500000, 100000], [1000000, 250000], [2000000, 500000], [5000000, 1000000]
];








// Editable from Manage Creators / Payments in the app — no code changes needed
// when the bonus structure changes. Seeds the current defaults the first time.
// ══════════════════════════════════════════════════════════
// EXTRA BONUSES — admin-defined, month by month.
//
// A referral, a budget-video run, anything that comes and goes. The admin
// names it and sets what ONE of them is worth for that month; against each
// creator they type only how many. Two referrals at ₦30,000 is ₦60,000;
// change the amount to ₦50,000 and the same 2 becomes ₦100,000.
//
// Stored per month so correcting September never rewrites August, which is
// the same rule base pay already follows.
// ══════════════════════════════════════════════════════════
const BONUS_CATS_SHEET = 'Extra Bonuses';


function getBonusCatsSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(BONUS_CATS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(BONUS_CATS_SHEET);
    sheet.appendRow(['Month', 'Bonus Name', 'Amount Each (₦)']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}


// Readable by creators too: it is only names and amounts, nothing personal,
// and their own card needs it to turn "2 referrals" into a naira figure.
function handleGetBonusCategories() {
  const cached = nqCacheGetJson_(NQ_BONUS_CATS_CACHE_KEY);
  if (cached) return cached;
  const data = getBonusCatsSheet_().getDataRange().getValues();
  const categories = [];
  for (let i = 1; i < data.length; i++) {
    const month = String(data[i][0] || '').replace(/^'/, '').trim();
    const name = String(data[i][1] || '').trim();
    const amount = parseFloat(String(data[i][2] || '').replace(/[^\d.]/g, '')) || 0;
    if (!month || !name) continue;
    categories.push({ month: month, name: name, amount: amount });
  }
  const result = { status: 'success', categories: categories };
  nqCachePutJson_(NQ_BONUS_CATS_CACHE_KEY, result, NQ_REFERENCE_CACHE_SECONDS);
  return result;
}


// Replaces the whole list for ONE month. Other months are untouched.
function handleSetBonusCategories(params) {
  const month = (params.month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return { status: 'error', message: 'Month required (YYYY-MM)' };
  let list;
  try { list = JSON.parse(params.categories || '[]'); }
  catch (e) { return { status: 'error', message: 'Bad category data' }; }
  if (!Array.isArray(list)) return { status: 'error', message: 'Bad category data' };


  const clean = [];
  const seen = {};
  for (let i = 0; i < list.length; i++) {
    const name = String((list[i] && list[i].name) || '').trim();
    const amount = parseFloat(String((list[i] && list[i].amount) || '').replace(/[^\d.]/g, ''));
    if (!name) continue;
    if (seen[name.toLowerCase()]) return { status: 'error', message: 'Two bonuses share the name "' + name + '"' };
    if (isNaN(amount) || amount < 0) return { status: 'error', message: '"' + name + '" needs an amount' };
    seen[name.toLowerCase()] = true;
    clean.push([month, name, amount]);
  }


  const lock = LockService.getScriptLock();
  try { lock.waitLock(20000); } catch (e) {
    return { status: 'error', message: 'The system is busy. Please try again in a few seconds.' };
  }
  try {
    const sheet = getBonusCatsSheet_();
    const data = sheet.getDataRange().getValues();
    // Drop this month's existing rows bottom-up so earlier row numbers hold.
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0] || '').replace(/^'/, '').trim() === month) sheet.deleteRow(i + 1);
    }
    if (clean.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, clean.length, 3).setValues(clean);
    }
    SpreadsheetApp.flush();
    nqInvalidateBonusCategories_();
    return { status: 'success' };
  } finally {
    lock.releaseLock();
  }
}




function getBonusTiersSheet_() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(BONUS_TIERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(BONUS_TIERS_SHEET);
    sheet.appendRow(['Views Threshold', 'Bonus Amount (₦)']);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4a2eab').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
    DEFAULT_BONUS_TIERS.forEach(t => sheet.appendRow(t));
  }
  return sheet;
}








function readBonusTiers_() {
  const cached = nqCacheGetJson_(NQ_BONUS_TIERS_CACHE_KEY);
  if (cached && Array.isArray(cached.tiers) && cached.tiers.length) return cached.tiers;
  const data = getBonusTiersSheet_().getDataRange().getValues();
  const tiers = [];
  for (let i = 1; i < data.length; i++) {
    const min = parseFloat(data[i][0]);
    const bonus = parseFloat(data[i][1]);
    if (!isNaN(min) && !isNaN(bonus) && min > 0) tiers.push([min, bonus]);
  }
  tiers.sort((a, b) => b[0] - a[0]);
  const result = tiers.length ? tiers : DEFAULT_BONUS_TIERS;
  nqCachePutJson_(NQ_BONUS_TIERS_CACHE_KEY, { tiers: result }, NQ_REFERENCE_CACHE_SECONDS);
  return result;
}








function handleGetBonusTiers() {
  return { status: 'success', tiers: readBonusTiers_() };
}








// params.tiers is a JSON string: [[views, amount], ...]. Full replace —
// simplest to keep the sheet as the single source of truth, no partial edits.
function handleSetBonusTiers(params) {
  let tiers;
  try { tiers = JSON.parse(params.tiers || '[]'); } catch (e) { return { status: 'error', message: 'Bad tier data' }; }
  if (!Array.isArray(tiers) || !tiers.length) return { status: 'error', message: 'At least one tier is required' };
  const clean = [];
  for (let i = 0; i < tiers.length; i++) {
    const min = parseFloat(tiers[i][0]), bonus = parseFloat(tiers[i][1]);
    if (isNaN(min) || isNaN(bonus) || min <= 0 || bonus < 0) return { status: 'error', message: 'Every tier needs a positive view count and a bonus amount' };
    clean.push([min, bonus]);
  }
  clean.sort((a, b) => b[0] - a[0]);
  const sheet = getBonusTiersSheet_();
  const existingRows = sheet.getLastRow() - 1;
  if (existingRows > 0) sheet.getRange(2, 1, existingRows, 2).clearContent();
  if (clean.length) sheet.getRange(2, 1, clean.length, 2).setValues(clean);
  nqInvalidateBonusTiers_();
  return { status: 'success', tiers: clean };
}








function getManualSheet() {
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(MANUAL_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(MANUAL_SHEET);
    sheet.appendRow(['Month','Name','Bonus Views','Special Bonus','Payment Status','Payment Date','Remarks','Posts Override','Total Override','Posts Added (Admin)','Rate Override']);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else {
    if (sheet.getLastColumn() < 9) {
      sheet.getRange(1, 8).setValue('Posts Override').setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
      sheet.getRange(1, 9).setValue('Total Override').setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    }
    if (sheet.getLastColumn() < 10) {
      sheet.getRange(1, 10).setValue('Posts Added (Admin)').setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    }
    // Rate Override (col 11): monthly base pay for this creator in this month.
    // Empty = use the creator's default base pay. Lets a past month keep its
    // own base pay when the creator's pay later changes. Added Aug 2026.
    if (sheet.getLastColumn() < 11) {
      sheet.getRange(1, 11).setValue('Rate Override').setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    }
  }








  // One-time: force the Bonus Views column to plain text so Sheets can never
  // auto-reinterpret a comma-separated list like "50000,50000" as a single
  // number (which is exactly what was inflating bonuses — e.g. two 50,000
  // entries silently merging into one huge number that then qualified for
  // the top tier). Month/Date already had this same protection (apostrophe
  // prefix); Bonus Views was missed. Gated behind a flag, same pattern as
  // the Creators-sheet fix, so this never re-costs a Sheets API call once done.
  // Diagnosed 21 July 2026.
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('MANUAL_SCHEMA_READY') !== '1') {
    sheet.getRange(2, 3, Math.max(1, sheet.getMaxRows() - 1), 1).setNumberFormat('@');
    props.setProperty('MANUAL_SCHEMA_READY', '1');
  }
  // One-time: the old column-10 header ("Posts Credit") already existed on
  // this sheet before "Posts Added (Admin)" was introduced, so the
  // lastColumn-gated block above never touches it. Relabel it once so the
  // sheet actually shows the clearer name instead of only new sheets getting it.
  if (props.getProperty('MANUAL_POSTS_HEADERS_RENAMED') !== '1') {
    sheet.getRange(1, 10).setValue('Posts Added (Admin)').setFontWeight('bold').setBackground('#1a6b4a').setFontColor('#FFFFFF');
    props.setProperty('MANUAL_POSTS_HEADERS_RENAMED', '1');
  }
  return sheet;
}








// ==========================================================
// SECURITY — server-side admin lock
// The admin password lives ONLY in Script Properties (Project Settings →
// Script Properties → ADMIN_PASS). It never appears in the website code.
// The website exchanges it once for a derived admin key, and that key must
// accompany every admin action listed below — anyone calling the API
// without it gets "denied" and cannot read or change anything sensitive.
// ==========================================================
var NQ_ADMIN_ACTIONS = [
  'addCreator', 'toggleCreator', 'deleteCreator', 'setRate',
  'setCreatorBank', 'savePayment', 'deletePaymentRow', 'getPayments', 'setBonusTiers',
  'setContractResolved', 'getViewLog', 'getIgStatus', 'getIgInsights',
  'setBonusCategories', 'getAdminBootstrap', 'getAdminShell', 'getAdminMonth'
];








function nqAdminPass_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASS') || '';
}








// A key derived from the password — the browser session holds this key
// instead of the password itself.
function nqAdminKey_() {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'nq-key-' + nqAdminPass_());
  return Utilities.base64EncodeWebSafe(digest);
}








function nqIsAdmin_(e) {
  var k = e && e.parameter && e.parameter.adminKey;
  return !!k && nqAdminPass_() !== '' && k === nqAdminKey_();
}








function handleAdminLogin(params) {
  if (!nqAdminPass_()) return { status: 'error', message: 'ADMIN_PASS Script Property is not set. Add it under Project Settings (gear icon) → Script Properties.' };
  if ((params.pass || '') === nqAdminPass_()) return { status: 'success', adminKey: nqAdminKey_() };
  return { status: 'denied' };
}








// ==========================================================
// API — called by the website
// ==========================================================
function doGet(e) {
  const action = e.parameter.action;
  const callback = e.parameter.callback;








  // Instagram OAuth needs the creator's actual browser to navigate to Meta
  // and back — it cannot go through the JSONP script-tag pattern everything
  // else uses. These two return real HTML redirects, not JSON, so they're
  // handled before anything else touches the response format.
  if (action === 'igConnectStart') return handleIgConnectStart_(e);
  if (action === 'igCallback') return handleIgCallback_(e);








  let result;
  try {
    if (action === 'adminLogin') result = handleAdminLogin(e.parameter);
    else if (NQ_ADMIN_ACTIONS.indexOf(action) >= 0 && !nqIsAdmin_(e)) result = { status: 'denied', message: 'Admin only. Please sign in from the Admin login page.' };
    else if (action === 'submit') result = handleSubmit(e.parameter);
    else if (action === 'checkPost') result = handleCheckPost(e.parameter);
    else if (action === 'get') result = handleGet(e.parameter);
    else if (action === 'getCreatorBootstrap') result = handleGetCreatorBootstrap(e.parameter);
    else if (action === 'getAdminBootstrap') result = handleGetAdminBootstrap(e.parameter);
    else if (action === 'getAdminShell') result = handleGetAdminShell(e.parameter);
    else if (action === 'getAdminMonth') result = handleGetAdminMonth(e.parameter);
    else if (action === 'getCreators') result = handleGetCreators(nqIsAdmin_(e));
    else if (action === 'addCreator') result = handleAddCreator(e.parameter);
    else if (action === 'toggleCreator') result = handleToggleCreator(e.parameter);
    else if (action === 'deleteCreator') result = handleDeleteCreator(e.parameter);
    else if (action === 'getPayments') result = handleGetPayments();
    else if (action === 'getMyPay') result = handleGetMyPay(e.parameter);
    else if (action === 'getBonusCategories') result = handleGetBonusCategories();
    else if (action === 'setBonusCategories') result = handleSetBonusCategories(e.parameter);
    else if (action === 'savePayment') result = handleSavePayment(e.parameter);
    else if (action === 'deletePaymentRow') result = handleDeletePaymentRow(e.parameter);
    else if (action === 'setRate') result = handleSetRate(e.parameter);
    else if (action === 'setCreatorBank') result = handleSetCreatorBank(e.parameter);
    else if (action === 'intake') result = handleIntake(e.parameter);
    else if (action === 'getBonusTiers') result = handleGetBonusTiers();
    else if (action === 'setBonusTiers') result = handleSetBonusTiers(e.parameter);
    else if (action === 'setContractResolved') result = handleSetContractResolved(e.parameter);
    else if (action === 'submitViews') result = handleSubmitViews(e.parameter);
    else if (action === 'getMyViews') result = handleGetMyViews(e.parameter);
    else if (action === 'getViewLog') result = handleGetViewLogAdmin();
    else if (action === 'getIgStatus') result = handleGetIgStatus_();
    else if (action === 'getIgInsights') result = handleGetIgInsights_();
    else result = { status: 'error', message: 'Unknown action' };
  } catch (err) { result = { status: 'error', message: err.toString() }; }
  const json = JSON.stringify(result);
  if (callback) return ContentService.createTextOutput(callback + '(' + json + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}








// Signed-contract file upload from the onboarding page
function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === 'uploadContract') result = handleUploadContract(body);
    else result = { status: 'error', message: 'Unknown action' };
  } catch (err) { result = { status: 'error', message: err.toString() }; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}








function handleUploadContract(body) {
  const name = (body.name || 'Unknown').trim();
  if (!body.data) return { status: 'error', message: 'No file data' };
  const bytes = Utilities.base64Decode(body.data);
  let ext = '';
  const fn = body.fileName || '';
  if (fn.indexOf('.') > -1) ext = fn.substring(fn.lastIndexOf('.'));
  else if ((body.mimeType || '').indexOf('pdf') > -1) ext = '.pdf';
  const file = DriveApp.getFolderById(SIGNED_FOLDER_ID).createFile(
    Utilities.newBlob(bytes, body.mimeType || 'application/pdf', name + ' - Signed Contract' + ext)
  );
  // Stamp the Creators row so Manage Creators can show "filed" without
  // anyone having to open Drive — this is what actually confirms the file
  // landed, as opposed to just the signature being typed at intake.
  try { linkContractFileToCreator_(name, file.getUrl()); } catch (err) { Logger.log('Contract link failed: ' + err); }
  return { status: 'success', fileUrl: file.getUrl() };
}








function linkContractFileToCreator_(name, fileUrl) {
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  const nameLower = name.toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === nameLower) {
      sheet.getRange(i + 1, 18).setValue(fileUrl);
      sheet.getRange(i + 1, 19).setValue(new Date());
      // The file actually landing is the real resolution — clear any manual
      // "resolved" override so it doesn't linger on a now-stale record.
      sheet.getRange(i + 1, 20).setValue('');
      return true;
    }
  }
  return false;
}








// Admin has manually confirmed an outstanding contract item is handled
// (e.g. verified by phone) even though no PDF has landed in Drive yet.
// Purely a display override — does not touch contractSigned/contractFileLink.
function handleSetContractResolved(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const resolved = params.resolved === '1' || params.resolved === true || params.resolved === 'true';
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  const nameLower = name.toLowerCase();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === nameLower) {
      sheet.getRange(i + 1, 20).setValue(resolved ? 'true' : '');
      return { status: 'success' };
    }
  }
  return { status: 'error', message: 'Creator not found' };
}








// ══════════════════════════════════════════════════════════
// GRACE WINDOW CUTOFF
//
// Yesterday's videos can normally be backfilled until 2 PM Lagos. A one-off
// extension can be granted for a SINGLE date — set the date and the hour
// below, and it lifts itself the moment that date passes. Nobody has to
// remember to undo it.
//
// Hour is 0–24 in Lagos time, where 24 means "all the way to midnight".
// Set GRACE_EXTENSION_DATE to '' to have no extension at all.
// ══════════════════════════════════════════════════════════
const GRACE_CUTOFF_HOUR = 14;          // the standing rule: 2 PM
const GRACE_EXTENSION_DATE = '2026-09-06';
const GRACE_EXTENSION_HOUR = 24;       // midnight, i.e. the whole of that day


function graceCutoffHour_(todayLagos) {
  return (GRACE_EXTENSION_DATE && GRACE_EXTENSION_DATE === todayLagos)
    ? GRACE_EXTENSION_HOUR
    : GRACE_CUTOFF_HOUR;
}
function graceCutoffLabel_(hour) {
  if (hour >= 24) return 'midnight tonight';
  if (hour === 12) return 'noon';
  return (hour > 12 ? (hour - 12) + ' PM' : hour + ' AM');
}




function handleSubmit(params) {
  const name   = (params.name   || '').trim();
  const post   = (params.post   || '');
  const tiktok = (params.tiktok || '').trim();
  const insta  = (params.insta  || '').trim();
  const issues = (params.issues || '');








  if (!name) return { status: 'error', message: 'Name required' };








  // One submission at a time. Prevents two requests arriving in the same
  // instant from double-writing or slipping past the 2-per-day limit.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
  } catch (e) {
    return { status: 'error', message: 'The system is busy right now. Please wait a few seconds and try again.' };
  }








  try {
    const sheet = getSheet();
    const nameLower = name.toLowerCase();








    // Server date is the only date that counts for a NORMAL submission (no
    // backdating possible). The ONE exception is the explicit "log
    // yesterday" grace window below: a creator who missed a video can
    // submit for exactly yesterday, only until 2 PM Africa/Lagos the next
    // day. That target date is computed here on the server — never trusted
    // from the client — so it can only ever be exactly "yesterday", never
    // an arbitrary date.
    const now = new Date();
    // Africa/Lagos, always and explicitly. Reading the day off the raw Date
    // object instead uses the Apps Script PROJECT's timezone, which silently
    // files videos under the wrong calendar date whenever that timezone is
    // not Lagos — and it disagreed with yesterdayStr/hourLagos just below,
    // which were already Lagos-anchored.
    const todayStr = Utilities.formatDate(now, 'Africa/Lagos', 'yyyy-MM-dd');
    const wantsYesterday = params.logYesterday === '1';
    const hourLagos = parseInt(Utilities.formatDate(now, 'Africa/Lagos', 'H'), 10);
    const yesterdayStr = Utilities.formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'Africa/Lagos', 'yyyy-MM-dd');
    const graceCutoff = graceCutoffHour_(todayStr);
    if (wantsYesterday && hourLagos >= graceCutoff) {
      return {
        status: 'blocked',
        message: 'The grace window to log yesterday\'s videos has closed (cutoff was ' +
                 graceCutoffLabel_(graceCutoff) + '). See you today!'
      };
    }
    // Every check and the final write below use this, not todayStr directly —
    // that is what makes the grace window a single, narrow exception rather
    // than a second code path to keep in sync.
    const targetDateStr = wantsYesterday ? yesterdayStr : todayStr;








    // Only scan the most recent rows. New rows are always appended at the
    // bottom, so today's submissions live there. This keeps every submission
    // fast no matter how large the log grows — same speed with 10 creators
    // or 1,000 (5,000 rows covers over 2 full days even at 1,000 creators).
    const lastRow = sheet.getLastRow();
    const SCAN_ROWS = 5000;
    const startRow = Math.max(2, lastRow - SCAN_ROWS + 1);
    const numRows = lastRow - startRow + 1;
    const data = numRows > 0 ? sheet.getRange(startRow, 1, numRows, 7).getValues() : [];








    let todayCount = 0;
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][1] || '').trim().toLowerCase() !== nameLower) continue;








      let rowDate = data[i][2];
      if (rowDate instanceof Date) {
        rowDate = rowDate.getFullYear() + '-' +
                  String(rowDate.getMonth() + 1).padStart(2, '0') + '-' +
                  String(rowDate.getDate()).padStart(2, '0');
      } else {
        rowDate = String(rowDate || '');
      }








      const rowPost   = String(data[i][3] || '');
      const rowTiktok = String(data[i][4] || '').trim();
      const rowInsta  = String(data[i][5] || '').trim();








      if (rowDate === targetDateStr) {
        // 1. Exact repeat of the identical request (network retry) — say
        //    "success" without writing a second row.
        if (rowPost === post && rowTiktok === tiktok && rowInsta === insta) {
          return { status: 'success', post: post, date: targetDateStr };
        }
        // 2. SAME VIDEO LINK already logged for this date under ANY post
        //    number. This is the fix for the double-log problem: if Video 1
        //    secretly saved and the creator re-submits the same link as
        //    "Video 2", the server recognises the link and refuses to write
        //    it twice.
        if ((tiktok && rowTiktok && rowTiktok === tiktok) ||
            (insta  && rowInsta  && rowInsta  === insta)) {
          return { status: 'duplicate', post: rowPost,
                   message: 'This video is already logged for ' + (wantsYesterday ? 'yesterday' : 'today') + '.' };
        }
      }








      // 3. Daily rate limit — count what is already filed FOR the target
      //    date, using the DATE column, on both paths.
      //
      //    This deliberately does not count by submission timestamp. A
      //    creator can never choose the date: the server writes either today
      //    or, inside the grace window, exactly yesterday. So the date column
      //    cannot be forged, and it is the honest answer to "how many videos
      //    does this creator already have for this day."
      //
      //    Counting the normal path by timestamp is what broke the grace
      //    window: videos backfilled for yesterday carry TODAY's timestamp,
      //    so they ate today's quota. A creator who backfilled 2 videos in
      //    the morning was refused all day with "You have already submitted
      //    2 posts today" — while handleCheckPost, which has always counted
      //    by the date column, kept telling them they had slots free. That
      //    contradiction is the "I can't log my videos" report.
      if (rowDate === targetDateStr) todayCount++;
    }








    if (todayCount >= 2) {
      return {
        status:  'blocked',
        message: wantsYesterday
          ? 'Both of yesterday\'s posts are already logged. The maximum is 2 posts per day.'
          : 'You have already submitted 2 posts today. The maximum is 2 posts per day.'
      };
    }








    // All clear — record it. The date column is targetDateStr (today's
    // server date, or exactly yesterday inside the grace window — never an
    // arbitrary client-supplied date). The timestamp column is always the
    // real moment of submission, so admin can always see which entries were
    // logged late by comparing the two columns.
    sheet.appendRow([new Date(), name, targetDateStr, post, tiktok, insta, issues]);
    SpreadsheetApp.flush();
    nqBumpLogVersion_(name);
    return { status: 'success', post: post, date: targetDateStr };
  } finally {
    lock.releaseLock();
  }
}








// Lightweight, read-only "did my video land?" check. The website calls this
// after a slow or dropped connection, BEFORE showing any failure message —
// so creators never again see "NOT saved" for a video that actually saved.
function handleCheckPost(params) {
  const name   = (params.name   || '').trim();
  const tiktok = (params.tiktok || '').trim();
  const insta  = (params.insta  || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };








  const sheet = getSheet();
  const nameLower = name.toLowerCase();
  const now = new Date();
  // Lagos, explicitly — must match handleSubmit exactly, or this tells the
  // creator one thing about today and the submit path enforces another.
  const todayStr = Utilities.formatDate(now, 'Africa/Lagos', 'yyyy-MM-dd');
  const yesterdayStr = Utilities.formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000), 'Africa/Lagos', 'yyyy-MM-dd');


  // WHICH DAY to look in. This used to be today, always — so a video
  // backfilled into the grace window saved correctly and then failed its own
  // confirmation, because the row carries yesterday's date and this refused
  // to look there. The creator was told "Video was NOT logged" about a video
  // that was sitting in the sheet.
  //
  // Only today or yesterday are accepted: those are the only dates handleSubmit
  // can ever write, so nothing else is a legitimate question.
  const asked = String(params.date || '').trim();
  const checkDate = (asked === yesterdayStr) ? yesterdayStr : todayStr;








  const lastRow = sheet.getLastRow();
  const SCAN_ROWS = 5000;
  const startRow = Math.max(2, lastRow - SCAN_ROWS + 1);
  const numRows = lastRow - startRow + 1;
  const data = numRows > 0 ? sheet.getRange(startRow, 1, numRows, 7).getValues() : [];








  let found = false, foundPost = '', todayCount = 0;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][1] || '').trim().toLowerCase() !== nameLower) continue;








    let rowDate = data[i][2];
    if (rowDate instanceof Date) {
      rowDate = rowDate.getFullYear() + '-' +
                String(rowDate.getMonth() + 1).padStart(2, '0') + '-' +
                String(rowDate.getDate()).padStart(2, '0');
    } else {
      rowDate = String(rowDate || '');
    }
    if (rowDate !== checkDate) continue;








    todayCount++;
    const rowTiktok = String(data[i][4] || '').trim();
    const rowInsta  = String(data[i][5] || '').trim();
    if ((tiktok && rowTiktok && rowTiktok === tiktok) ||
        (insta  && rowInsta  && rowInsta  === insta)) {
      found = true;
      foundPost = String(data[i][3] || '');
    }
  }








  return { status: 'success', found: found, post: foundPost, todayCount: todayCount };
}








// Optional `since` (yyyy-MM-dd) trims the reply to recent rows. Without it
// this returns the entire log — every creator, every day, since the
// beginning. The optimized admin console no longer does that at startup; it
// asks for one month at a time. A creator only ever looks at the last couple
// of months, and when this reply times out the app cannot tell whether they
// logged yesterday, so it locks the grace window and blames the connection.
// `until` (inclusive, same yyyy-mm-dd shape as `since`) lets the caller ask
// for ONE window of the log instead of everything from `since` onwards.
// Reading the sheet costs about 5 seconds no matter what; it is shipping the
// reply that falls off a cliff — ~0.5MB comes back in 6 seconds, but the
// full ~1.1MB log took 32s on one call and 95s on the next, which no client
// timeout can ride out. Windowing keeps every single reply inside the fast
// band, so a load completes in several quick, reliable pieces instead of one
// request that cannot finish. Measured 15 Sept 2026.
function handleGet(params) {
  const since = String((params && params.since) || '').trim();
  const until = String((params && params.until) || '').trim();
  const useSince = /^\d{4}-\d{2}-\d{2}$/.test(since);
  const useUntil = /^\d{4}-\d{2}-\d{2}$/.test(until);
  // A creator's screens only ever show that creator's own rows, but they were
  // being sent the whole roster's log to find them: 2,813 rows and 521KB to
  // read their own 89. Asking by name cuts that to about 16KB.
  const only = String((params && params.name) || '').trim().toLowerCase();
  const cacheKey = only && useSince ? nqCreatorLogCacheKey_(only, since, useUntil ? until : '') : '';
  const cached = cacheKey ? nqCacheGetJson_(cacheKey) : null;
  if (cached) return cached;
  const data = getSheet().getDataRange().getValues();
  const rows = [];
  // The oldest date anywhere in the log, regardless of the window asked for.
  // Costs nothing (every row is being walked anyway) and it is what tells the
  // caller how many windows it needs to ask for to hold the whole log.
  let earliest = '';
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[1]) continue;
    const ts = r[0] instanceof Date ? r[0].toISOString() : String(r[0] || '');
    let dateStr = r[2];
    if (dateStr instanceof Date) {
      dateStr = dateStr.getFullYear() + '-' + String(dateStr.getMonth()+1).padStart(2,'0') + '-' + String(dateStr.getDate()).padStart(2,'0');
    } else { dateStr = String(dateStr || ''); }
    if (dateStr && (!earliest || dateStr < earliest)) earliest = dateStr;
    if (only && String(r[1]).trim().toLowerCase() !== only) continue;
    if (useSince && dateStr < since) continue;
    if (useUntil && dateStr > until) continue;
    rows.push([ts, String(r[1]).trim(), dateStr, String(r[3]||''), String(r[4]||''), String(r[5]||''), String(r[6]||'')]);
  }
  const result = { status: 'success', rows: rows, earliest: earliest };
  if (cacheKey) nqCachePutJson_(cacheKey, result, NQ_CREATOR_LOG_CACHE_SECONDS);
  return result;
}


// One creator-facing startup request replaces the old roster request followed
// by a second recent-log request. It deliberately returns only the public
// roster fields and, when a remembered name is supplied, only that creator's
// requested date window. Admin startup remains on its established endpoints.
function handleGetCreatorBootstrap(params) {
  const roster = handleGetCreators(false);
  const name = String((params && params.name) || '').trim();
  if (!name) {
    return { status: 'success', creators: roster.creators, rows: [] };
  }
  const logs = handleGet({
    name: name,
    since: String((params && params.since) || '').trim(),
    until: String((params && params.until) || '').trim()
  });
  return {
    status: 'success',
    creators: roster.creators,
    rows: logs.rows || [],
    earliest: logs.earliest || ''
  };
}


// Build the compact admin summary separately from the detailed month rows.
// A previous combined response included 1,000+ link-heavy posting rows plus
// the roster and payment register. Apps Script completed that work quickly,
// but browsers intermittently failed to receive the oversized JSONP payload
// and waited for the full client timeout before retrying.
function buildAdminBootstrapPayload_(includeCurrentRows) {
  const currentMonth = Utilities.formatDate(new Date(), 'Africa/Lagos', 'yyyy-MM');
  const postingData = getSheet().getDataRange().getValues();
  const rows = [];
  const months = {};
  const byCreator = {};
  let total = 0;

  for (let i = 1; i < postingData.length; i++) {
    const r = postingData[i];
    const name = String(r[1] || '').trim();
    if (!name) continue;
    const ts = r[0] instanceof Date ? r[0].toISOString() : String(r[0] || '');
    let dateStr = r[2];
    if (dateStr instanceof Date) {
      dateStr = dateStr.getFullYear() + '-' + String(dateStr.getMonth() + 1).padStart(2, '0') + '-' + String(dateStr.getDate()).padStart(2, '0');
    } else {
      dateStr = String(dateStr || '').slice(0, 10);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;

    const ym = dateStr.slice(0, 7);
    months[ym] = true;
    total++;
    if (!byCreator[name]) byCreator[name] = { total: 0, last: '' };
    byCreator[name].total++;
    if (!byCreator[name].last || dateStr > byCreator[name].last) byCreator[name].last = dateStr;

    if (includeCurrentRows && ym === currentMonth) {
      rows.push([ts, name, dateStr, String(r[3] || ''), String(r[4] || ''), String(r[5] || ''), String(r[6] || '')]);
    }
  }

  const creators = handleGetCreators(true);
  const payments = handleGetPayments();
  const tiers = handleGetBonusTiers();
  const categories = handleGetBonusCategories();
  const result = {
    status: 'success',
    currentMonth: currentMonth,
    months: Object.keys(months).sort().reverse(),
    summary: { total: total, creators: byCreator },
    creators: creators.creators || [],
    payments: payments.payments || [],
    tiers: tiers.tiers || [],
    categories: categories.categories || []
  };
  if (includeCurrentRows) result.rows = rows;
  return result;
}


// Small first response used by the admin console. Detailed current-month rows
// travel through handleGetAdminMonth in a separate request, so one dropped
// large script response can no longer hold every admin page for a minute.
function handleGetAdminShell(params) {
  return buildAdminBootstrapPayload_(false);
}


// Kept for rollback compatibility with older frontends. New frontends use
// handleGetAdminShell plus handleGetAdminMonth instead.
function handleGetAdminBootstrap(params) {
  return buildAdminBootstrapPayload_(true);
}


// Admin history is loaded one selected month at a time. Each request still
// reads the source sheet once, but it sends only the rows the current screen
// needs and does not block the rest of the admin console behind old history.
function handleGetAdminMonth(params) {
  const month = String((params && params.month) || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return { status: 'error', message: 'Month required (YYYY-MM)' };
  const result = handleGet({ since: month + '-01', until: month + '-31' });
  if (result.status === 'error') return result;
  return { status: 'success', month: month, rows: result.rows || [] };
}








// ==========================================================
// INSTAGRAM AUTO-INSIGHTS — real view/like/comment counts pulled directly
// from Meta's Instagram API, per creator, once each creator has connected
// their own Instagram Business/Creator account.
//
// SETUP REQUIRED BEFORE ANY OF THIS WORKS (see NORTHQUEST_HANDOFF.md):
// 1. Create a Business app at developers.facebook.com, add the Instagram
//    product, get an App ID and App Secret.
// 2. In Project Settings (gear icon) → Script Properties, add:
//      IG_APP_ID     = <your App ID>
//      IG_APP_SECRET = <your App Secret>
// 3. In the Meta App dashboard, add this exact URL as a valid OAuth
//    redirect: <your deployment exec URL>?action=igCallback
// 4. Each creator's Instagram must be a Business or Creator account.
//    During Meta's "Development Mode," only accounts added as Testers in
//    the Meta dashboard can actually connect — this is a Meta limitation,
//    not something this code controls.
// 5. Run setupInstagramTriggers() ONCE manually from the Apps Script editor
//    (select it in the function dropdown, click Run) to install the daily
//    insights-fetch and the ~45-day token-refresh schedule.
//
// The exact endpoint URLs and scope names below match Meta's "Instagram
// API with Instagram Login" flow as documented at the time this was
// written — Meta does change these periodically, so if a call starts
// failing, check developers.facebook.com/docs/instagram-platform first.
// ==========================================================
const IG_TOKENS_SHEET = 'IG Tokens';
const IG_INSIGHTS_SHEET = 'IG Insights';
const IG_AUTH_URL = 'https://api.instagram.com/oauth/authorize';
const IG_TOKEN_URL = 'https://api.instagram.com/oauth/access_token';
const IG_GRAPH_URL = 'https://graph.instagram.com';
const IG_SCOPES = 'instagram_business_basic,instagram_business_manage_insights';








function igAppId_() { return PropertiesService.getScriptProperties().getProperty('IG_APP_ID') || ''; }
function igAppSecret_() { return PropertiesService.getScriptProperties().getProperty('IG_APP_SECRET') || ''; }








function getIgTokensSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(IG_TOKENS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(IG_TOKENS_SHEET);
    sheet.appendRow(['Name', 'IG User ID', 'IG Username', 'Access Token', 'Token Expires At', 'Connected At']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}








function getIgInsightsSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(IG_INSIGHTS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(IG_INSIGHTS_SHEET);
    sheet.appendRow(['Timestamp', 'Name', 'Media ID', 'Permalink', 'Posted At', 'Plays', 'Likes', 'Comments', 'Fetched At']);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}








// ── Step 1: creator clicks "Connect Instagram" — this sends their browser
// to Meta's real login screen. Cannot be a JSONP call; must be a real page
// navigation, which is why the frontend opens this URL directly rather
// than going through jsonp().
function handleIgConnectStart_(e) {
  const name = (e.parameter.name || '').trim();
  if (!name) return HtmlService.createHtmlOutput('Missing your name — go back and select your name first, then try again.');
  if (!igAppId_()) return HtmlService.createHtmlOutput('Instagram connection is not set up yet (missing IG_APP_ID). Ask an admin to finish the Meta setup.');








  const redirectUri = ScriptApp.getService().getUrl() + '?action=igCallback';
  const authUrl = IG_AUTH_URL +
    '?client_id=' + encodeURIComponent(igAppId_()) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent(IG_SCOPES) +
    '&response_type=code' +
    '&state=' + encodeURIComponent(name);








  return HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
    'Taking you to Instagram…<script>location.href=' + JSON.stringify(authUrl) + ';</script>' +
    '</body></html>'
  );
}








// ── Step 2: Meta redirects back here with a one-time code. Exchange it for
// a short-lived token, immediately exchange THAT for a long-lived (60-day)
// token, look up the connected account's own ID/username, and save it all.
function handleIgCallback_(e) {
  const code = e.parameter.code;
  const name = (e.parameter.state || '').trim();
  const errorPage = (msg) => HtmlService.createHtmlOutput(
    '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
    '<h3>Could not connect Instagram</h3><p>' + msg + '</p><p>Close this tab and try again from the app.</p></body></html>'
  );








  if (!code || !name) return errorPage('Missing authorization code or name.');
  if (!igAppId_() || !igAppSecret_()) return errorPage('Instagram connection is not fully set up yet.');








  try {
    const redirectUri = ScriptApp.getService().getUrl() + '?action=igCallback';








    // Short-lived token
    const tokenResp = UrlFetchApp.fetch(IG_TOKEN_URL, {
      method: 'post',
      payload: {
        client_id: igAppId_(),
        client_secret: igAppSecret_(),
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code
      },
      muteHttpExceptions: true
    });
    const tokenData = JSON.parse(tokenResp.getContentText());
    if (!tokenData.access_token) return errorPage('Meta did not return a token: ' + tokenResp.getContentText());








    // Exchange for long-lived (60-day) token
    const longResp = UrlFetchApp.fetch(
      IG_GRAPH_URL + '/access_token?grant_type=ig_exchange_token&client_secret=' + encodeURIComponent(igAppSecret_()) + '&access_token=' + encodeURIComponent(tokenData.access_token),
      { muteHttpExceptions: true }
    );
    const longData = JSON.parse(longResp.getContentText());
    if (!longData.access_token) return errorPage('Could not get a long-lived token: ' + longResp.getContentText());








    // Who did we just connect?
    const meResp = UrlFetchApp.fetch(IG_GRAPH_URL + '/me?fields=id,username&access_token=' + encodeURIComponent(longData.access_token), { muteHttpExceptions: true });
    const me = JSON.parse(meResp.getContentText());








    const expiresAt = new Date(Date.now() + (longData.expires_in || 5184000) * 1000); // default ~60 days








    const sheet = getIgTokensSheet_();
    const data = sheet.getDataRange().getValues();
    const nameLower = name.toLowerCase();
    let row = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0] || '').trim().toLowerCase() === nameLower) { row = i + 1; break; }
    }
    const rowData = [name, me.id || '', me.username || '', longData.access_token, expiresAt, new Date()];
    if (row > 0) sheet.getRange(row, 1, 1, 6).setValues([rowData]);
    else sheet.appendRow(rowData);








    return HtmlService.createHtmlOutput(
      '<html><body style="font-family:sans-serif;text-align:center;padding:40px">' +
      '<h3>Instagram connected!</h3><p>' + (me.username ? '@' + me.username + ' is now linked.' : '') + '</p><p>You can close this tab and go back to the app.</p></body></html>'
    );
  } catch (err) {
    return errorPage(err.toString());
  }
}








// ── Data fetching engine. Not a doGet action — meant to run on a daily
// time-driven trigger (see setupInstagramTriggers). Pulls each connected
// creator's recent media, then the view/like/comment counts for each.
function fetchAllInstagramInsights() {
  const tokensSheet = getIgTokensSheet_();
  const tokens = tokensSheet.getDataRange().getValues();
  const insightsSheet = getIgInsightsSheet_();
  const now = new Date();








  for (let i = 1; i < tokens.length; i++) {
    const name = String(tokens[i][0] || '').trim();
    const token = String(tokens[i][3] || '').trim();
    if (!name || !token) continue;








    try {
      const mediaResp = UrlFetchApp.fetch(
        IG_GRAPH_URL + '/me/media?fields=id,permalink,timestamp,media_type&access_token=' + encodeURIComponent(token),
        { muteHttpExceptions: true }
      );
      if (igShouldBackOff_(mediaResp)) { Utilities.sleep(2000); continue; }
      const mediaData = JSON.parse(mediaResp.getContentText());
      if (!mediaData.data) continue;








      mediaData.data.forEach(function (media) {
        if (media.media_type !== 'VIDEO' && media.media_type !== 'REELS') return;
        const insResp = UrlFetchApp.fetch(
          IG_GRAPH_URL + '/' + media.id + '/insights?metric=plays,likes,comments&access_token=' + encodeURIComponent(token),
          { muteHttpExceptions: true }
        );
        if (igShouldBackOff_(insResp)) return;
        const insData = JSON.parse(insResp.getContentText());
        const metrics = {};
        (insData.data || []).forEach(function (m) { metrics[m.name] = (m.values && m.values[0] && m.values[0].value) || 0; });
        insightsSheet.appendRow([
          now, name, media.id, media.permalink || '', media.timestamp || '',
          metrics.plays || 0, metrics.likes || 0, metrics.comments || 0, now
        ]);
      });
    } catch (err) {
      Logger.log('Instagram fetch failed for ' + name + ': ' + err);
    }
  }
}








// Meta returns an X-Business-Use-Case-Usage header with current rate-limit
// usage as a percentage. Back off once any account is at/above 80% so we
// don't get the whole app rate-limited.
function igShouldBackOff_(response) {
  try {
    const header = response.getAllHeaders()['x-business-use-case-usage'] || response.getAllHeaders()['X-Business-Use-Case-Usage'];
    if (!header) return false;
    const parsed = JSON.parse(header);
    const firstKey = Object.keys(parsed)[0];
    const usage = firstKey && parsed[firstKey][0] && parsed[firstKey][0].call_count;
    return typeof usage === 'number' && usage >= 80;
  } catch (e) {
    return false;
  }
}








// ── Token refresh job. Long-lived tokens last ~60 days; run this well
// before that (every ~45 days) so a connection never silently dies.
function refreshAllInstagramTokens() {
  const sheet = getIgTokensSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const token = String(data[i][3] || '').trim();
    if (!token) continue;
    try {
      const resp = UrlFetchApp.fetch(
        IG_GRAPH_URL + '/refresh_access_token?grant_type=ig_refresh_token&access_token=' + encodeURIComponent(token),
        { muteHttpExceptions: true }
      );
      const refreshed = JSON.parse(resp.getContentText());
      if (refreshed.access_token) {
        const expiresAt = new Date(Date.now() + (refreshed.expires_in || 5184000) * 1000);
        sheet.getRange(i + 1, 4).setValue(refreshed.access_token);
        sheet.getRange(i + 1, 5).setValue(expiresAt);
      } else {
        Logger.log('Token refresh failed for ' + data[i][0] + ': ' + resp.getContentText());
      }
    } catch (err) {
      Logger.log('Token refresh error for ' + data[i][0] + ': ' + err);
    }
  }
}








// ── Run this ONCE manually from the Apps Script editor after IG_APP_ID /
// IG_APP_SECRET are set. Installs the two schedules; safe to run again
// later (it clears old Instagram triggers first so they never double up).
function setupInstagramTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'fetchAllInstagramInsights' || t.getHandlerFunction() === 'refreshAllInstagramTokens') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('fetchAllInstagramInsights').timeBased().everyDays(1).atHour(23).create();
  ScriptApp.newTrigger('refreshAllInstagramTokens').timeBased().everyDays(45).create();
  Logger.log('Instagram triggers installed: daily insights fetch, 45-day token refresh.');
}








// ── Admin-facing: which creators are connected, and are any tokens close
// to expiring (worth knowing about before the automatic refresh runs).
function handleGetIgStatus_() {
  const data = getIgTokensSheet_().getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    rows.push({
      name: String(data[i][0] || ''),
      igUsername: String(data[i][2] || ''),
      expiresAt: data[i][4] instanceof Date ? data[i][4].toISOString() : String(data[i][4] || ''),
      connectedAt: data[i][5] instanceof Date ? data[i][5].toISOString() : String(data[i][5] || '')
    });
  }
  return { status: 'success', accounts: rows };
}








function handleGetIgInsights_() {
  const data = getIgInsightsSheet_().getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    rows.push({
      name: String(data[i][1] || ''),
      mediaId: String(data[i][2] || ''),
      permalink: String(data[i][3] || ''),
      postedAt: data[i][4] instanceof Date ? data[i][4].toISOString() : String(data[i][4] || ''),
      plays: data[i][5], likes: data[i][6], comments: data[i][7],
      fetchedAt: data[i][8] instanceof Date ? data[i][8].toISOString() : String(data[i][8] || '')
    });
  }
  return { status: 'success', rows: rows };
}








// ==========================================================
// VIEW LOG — creator self-reported daily views, per video per platform.
// Purely a reference log for admins to eyeball when deciding bonuses by
// hand. Does NOT feed CALC_BONUS or any payment calculation — intentional,
// per the June 2026 decision to keep self-reported numbers out of pay math.
// ==========================================================
const VIEWLOG_SHEET = 'View Log';








function getViewLogSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(VIEWLOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(VIEWLOG_SHEET);
    sheet.appendRow(['Timestamp', 'Name', 'Video Date', 'Post Number', 'Platform', 'Link', 'Views', 'Log Date']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#2E4057').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}








function todayStr_() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}








// One reading per creator+video+platform+day. Re-submitting the same
// video+platform on the same day overwrites that day's number instead of
// appending a duplicate row, so the sheet never fills up with repeats.
function handleSubmitViews(params) {
  const name = (params.name || '').trim();
  const videoDate = (params.videoDate || '').trim();
  const post = (params.post || '').trim();
  const platform = (params.platform || '').trim().toLowerCase();
  const views = parseInt(params.views, 10);








  if (!name || !videoDate || !post) return { status: 'error', message: 'Missing name, video date, or post number' };
  if (platform !== 'tiktok' && platform !== 'insta') return { status: 'error', message: 'Platform must be tiktok or insta' };
  if (isNaN(views) || views < 0) return { status: 'error', message: 'Views must be a non-negative number' };








  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (e) {
    return { status: 'error', message: 'The system is busy right now. Please try again in a few seconds.' };
  }
  try {
    const sheet = getViewLogSheet();
    const data = sheet.getDataRange().getValues();
    const today = todayStr_();
    const nameLower = name.toLowerCase();








    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1] || '').trim().toLowerCase() === nameLower &&
          String(data[i][2] || '') === videoDate &&
          String(data[i][3] || '') === post &&
          String(data[i][4] || '').toLowerCase() === platform &&
          String(data[i][7] || '') === today) {
        sheet.getRange(i + 1, 1).setValue(new Date());
        sheet.getRange(i + 1, 6).setValue(params.link || data[i][5] || '');
        sheet.getRange(i + 1, 7).setValue(views);
        return { status: 'success' };
      }
    }








    sheet.appendRow([new Date(), name, videoDate, post, platform, params.link || '', views, today]);
    return { status: 'success' };
  } finally {
    lock.releaseLock();
  }
}








// Creator-facing: their own videos from today + yesterday only (a one-day
// grace window so someone who forgot last night can still catch up this
// morning), joined with
// whatever views they've already logged TODAY for each one (so the form
// pre-fills instead of showing blank boxes for something they already did).
function handleGetMyViews(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const nameLower = name.toLowerCase();








  const postingData = getSheet().getDataRange().getValues();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 1); // today + 1 day back = 2-day grace window
  const cutoffStr = cutoff.getFullYear() + '-' + String(cutoff.getMonth() + 1).padStart(2, '0') + '-' + String(cutoff.getDate()).padStart(2, '0');








  const videos = [];
  for (let i = 1; i < postingData.length; i++) {
    if (String(postingData[i][1] || '').trim().toLowerCase() !== nameLower) continue;
    let d = postingData[i][2];
    if (d instanceof Date) d = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    else d = String(d || '');
    if (d < cutoffStr) continue;
    videos.push({
      date: d,
      post: String(postingData[i][3] || ''),
      tiktok: String(postingData[i][4] || '').trim(),
      insta: String(postingData[i][5] || '').trim()
    });
  }








  const today = todayStr_();
  const viewData = getViewLogSheet().getDataRange().getValues();
  const todayViews = {};
  for (let i = 1; i < viewData.length; i++) {
    if (String(viewData[i][1] || '').trim().toLowerCase() !== nameLower) continue;
    if (String(viewData[i][7] || '') !== today) continue;
    const key = String(viewData[i][2] || '') + '|' + String(viewData[i][3] || '') + '|' + String(viewData[i][4] || '').toLowerCase();
    todayViews[key] = viewData[i][6];
  }








  videos.forEach(v => {
    const tkKey = v.date + '|' + v.post + '|tiktok';
    const igKey = v.date + '|' + v.post + '|insta';
    v.tiktokViews = todayViews.hasOwnProperty(tkKey) ? todayViews[tkKey] : '';
    v.instaViews = todayViews.hasOwnProperty(igKey) ? todayViews[igKey] : '';
  });








  videos.sort((a, b) => b.date.localeCompare(a.date) || a.post.localeCompare(b.post));
  return { status: 'success', videos: videos };
}








// Admin-facing: full history, every row, no date cap — the frontend groups
// this by month and builds the daily/weekly/monthly CSV exports client-side
// from whatever slice of this the admin has selected.
function handleGetViewLogAdmin() {
  const data = getViewLogSheet().getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    rows.push({
      name: String(data[i][1] || ''),
      videoDate: String(data[i][2] || ''),
      post: String(data[i][3] || ''),
      platform: String(data[i][4] || ''),
      link: String(data[i][5] || ''),
      views: data[i][6],
      logDate: String(data[i][7] || '')
    });
  }
  return { status: 'success', rows: rows };
}








// Returns columns 1-7 only (name, status, added, rate, bank, acct number, acct name).
// Passwords (cols 8-17) are NEVER returned here. Without the admin key,
// even pay and bank details are stripped — visitors get names/status only.
function handleGetCreators(isAdmin) {
  // The creator dropdown needs only name, status and added date. Serve its
  // cached public shape before opening the spreadsheet at all.
  if (!isAdmin) {
    const cached = nqCacheGetJson_(NQ_PUBLIC_CREATORS_CACHE_KEY);
    if (cached) return cached;
    const sheet = getCreatorsSheet();
    const lastRow = sheet.getLastRow();
    const publicData = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, 3).getValues() : [];
    const publicCreators = [];
    for (let i = 0; i < publicData.length; i++) {
      if (!publicData[i][0]) continue;
      publicCreators.push({
        name: String(publicData[i][0]).trim(),
        status: String(publicData[i][1] || 'Active'),
        added: publicData[i][2] instanceof Date ? publicData[i][2].toISOString() : String(publicData[i][2] || '')
      });
    }
    const publicResult = { status: 'success', creators: publicCreators };
    nqCachePutJson_(NQ_PUBLIC_CREATORS_CACHE_KEY, publicResult, NQ_ROSTER_CACHE_SECONDS);
    return publicResult;
  }

  const data = getCreatorsSheet().getDataRange().getValues();
  const creators = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const added = data[i][2] instanceof Date ? data[i][2].toISOString() : String(data[i][2] || '');
    const leftRaw = data[i][21];
    creators.push({
      name: String(data[i][0]).trim(),
      status: String(data[i][1] || 'Active'),
      added: added,
      rate: parseFloat(data[i][3]) || DEFAULT_MONTHLY_SALARY,
      bankName: String(data[i][4] || ''),
      acctNum: String(data[i][5] || ''),
      acctName: String(data[i][6] || ''),
      phone: String(data[i][7] || ''),
      contractSigned: String(data[i][15] || ''),
      intakeDate: data[i][16] instanceof Date ? data[i][16].toISOString() : String(data[i][16] || ''),
      contractFileLink: String(data[i][17] || ''),
      contractFiledAt: data[i][18] instanceof Date ? data[i][18].toISOString() : String(data[i][18] || ''),
      contractResolved: String(data[i][19] || ''),
      creatorType: String(data[i][20] || ''),
      left: leftRaw instanceof Date ? leftRaw.toISOString() : String(leftRaw || '')
    });
  }
  return { status: 'success', creators };
}








function handleAddCreator(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase())
      return { status: 'error', message: 'Creator already exists' };
  }
  sheet.appendRow([name, 'Active', new Date(), DEFAULT_MONTHLY_SALARY, '', '', '']);
  nqInvalidateCreatorRoster_();
  nqInvalidateCreatorPay_(name);
  return { status: 'success' };
}








// Flips active/inactive AND stamps/clears the "Left Date" column automatically.
function handleToggleCreator(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
      const newStatus = String(data[i][1]||'').toLowerCase() === 'active' ? 'Inactive' : 'Active';
      sheet.getRange(i + 1, 2).setValue(newStatus);
      sheet.getRange(i + 1, 22).setValue(newStatus === 'Inactive' ? new Date() : '');
      nqInvalidateCreatorRoster_();
      return { status: 'success', newStatus };
    }
  }
  return { status: 'error', message: 'Creator not found' };
}








// Deletes a creator from the roster. Does NOT touch their posting history.
function handleDeleteCreator(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const ss = getSpreadsheet_();
  const posting = ss.getSheetByName(SHEET_NAME);
  const pdata = posting.getDataRange().getValues();
  let postCount = 0;
  for (let i = 1; i < pdata.length; i++) {
    if (String(pdata[i][1] || '').trim().toLowerCase() === name.toLowerCase()) postCount++;
  }
  const creators = getCreatorsSheet();
  const cdata = creators.getDataRange().getValues();
  for (let i = 1; i < cdata.length; i++) {
    if (String(cdata[i][0] || '').trim().toLowerCase() === name.toLowerCase()) {
      creators.deleteRow(i + 1);
      nqInvalidateCreatorRoster_();
      nqInvalidateCreatorPay_(name);
      return { status: 'success', postCount: postCount };
    }
  }
  return { status: 'error', message: 'Creator not found' };
}








function handleSetRate(params) {
  const name = (params.name || '').trim();
  const rate = parseFloat(params.rate);
  if (!name || isNaN(rate)) return { status: 'error', message: 'Name and rate required' };
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
      sheet.getRange(i + 1, 4).setValue(rate);
      nqInvalidateCreatorPay_(name);
      return { status: 'success' };
    }
  }
  // Creator not in Creators sheet yet — auto-add them so the edit goes through
  sheet.appendRow([name, 'Active', new Date(), rate, '', '', '']);
  nqInvalidateCreatorRoster_();
  nqInvalidateCreatorPay_(name);
  return { status: 'success', message: 'Auto-added to Creators sheet' };
}








// New creator onboarding: writes to Creators (activates them) + appends to the Google Doc database.
function handleIntake(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  let rowIdx = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) { rowIdx = i + 1; break; }
  }
  const now = new Date();
  const added = (rowIdx > -1 && data[rowIdx - 1][2]) ? data[rowIdx - 1][2] : now;
  // The content type they picked at onboarding decides the monthly salary.
  // See nqTierRate_ at the bottom of this file for the exact rules.
  const rate = nqTierRate_(params, rowIdx > -1 ? data[rowIdx - 1][3] : null);
  const contractSigned = (params.signature || '') + (params.signDate ? (' | ' + params.signDate) : '');
  const pw = STORE_PASSWORDS;
  const vals = [
    name, 'Active', added, rate,
    params.bankName || '', params.acctNum || '', params.acctName || '',
    params.phone || '', params.email || '', params.nqEmail || '', (pw ? (params.nqEmailPass || '') : ''),
    params.igUser || '', (pw ? (params.igPass || '') : ''), params.ttUser || '', (pw ? (params.ttPass || '') : ''),
    contractSigned, now
  ];
  if (rowIdx > -1) {
    sheet.getRange(rowIdx, 1, 1, vals.length).setValues([vals]);
  } else {
    sheet.appendRow(vals);
  }
  // Column 21 — what they said they create. For reading only; nothing
  // calculates from it. Written separately because vals only covers 1-17.
  // The creator's real record is already saved by this point, so a failure
  // here must never turn a successful onboarding into an error the creator
  // would retry — log it and move on.
  const nqType = String(params.creatorType || '').slice(0, 60);
  if (nqType) {
    try {
      sheet.getRange(rowIdx > -1 ? rowIdx : sheet.getLastRow(), 21).setValue(nqType);
    } catch (err) {
      Logger.log('Creator Type not recorded for ' + name + ': ' + err);
    }
  }
  try { appendToDatabaseDoc(params); } catch (err) { Logger.log('Doc append failed: ' + err); }
  nqInvalidateCreatorRoster_();
  nqInvalidateCreatorPay_(name);
  return { status: 'success' };
}








function appendToDatabaseDoc(p) {
  const body = DocumentApp.openById(DB_DOC_ID).getBody();
  let dividers = 0;
  const n = body.getNumChildren();
  for (let i = 0; i < n; i++) {
    const el = body.getChild(i);
    if (el.getType() === DocumentApp.ElementType.PARAGRAPH && el.asParagraph().getText().indexOf('━') > -1) dividers++;
  }
  const num = dividers + 1;
  const pw = STORE_PASSWORDS;
  const heading = body.appendParagraph(num + '. ' + (p.name || ''));
  heading.setBold(true);
  const lines = [
    'Full name: ' + (p.name || ''),
    'Personal Email: ' + (p.email || ''),
    'Phone number: ' + (p.phone || ''),
    'NQ Gmail: ' + (p.nqEmail || ''),
    'NQ Gmail password: ' + (pw ? (p.nqEmailPass || '') : ''),
    'NQ Instagram handle: ' + (p.igUser || ''),
    'NQ Instagram password: ' + (pw ? (p.igPass || '') : ''),
    'NQ TikTok Handle: ' + (p.ttUser || ''),
    'NQ TikTok password: ' + (pw ? (p.ttPass || '') : ''),
    'Creator type: ' + (p.creatorType || ''),
    'Bank account name: ' + (p.acctName || ''),
    'Account number: ' + (p.acctNum || ''),
    'Bank name: ' + (p.bankName || '')
  ];
  lines.forEach(function(t){ body.appendParagraph(t).setBold(false); });
  body.appendParagraph('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}








// ==========================================================
// PAYMENTS — manual fields for the in-app register
// (Bonus Views, Special Bonus, Status, Date, Remarks, Posts Override, Total Override, Posts Credit)
// ==========================================================
// A creator asking for their OWN pay figures. handleGetPayments returns
// everybody and is admin-only, which is correct — but it left creators with
// no way to see their own bonuses, admin-added videos, or real expected
// amount, so those all showed as zero on their own dashboard.
//
// This returns one creator's rows and nothing else, and only the fields that
// actually affect what they are owed. Payment status, payment date and the
// admin's private remarks are deliberately left out.
function handleGetMyPay(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const nameLower = name.toLowerCase();
  const cacheKey = nqCreatorPayCacheKey_(nameLower);
  const cached = nqCacheGetJson_(cacheKey);
  if (cached) return cached;
  const data = getManualSheet().getDataRange().getValues();
  const payments = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0] || !data[i][1]) continue;
    if (String(data[i][1]).trim().toLowerCase() !== nameLower) continue;
    payments.push({
      month: String(data[i][0]).replace(/^'/, '').trim(),
      name: String(data[i][1]).trim(),
      bonusViews: String(data[i][2] || '').replace(/^'/, ''),
      specialBonus: String(data[i][3] || ''),
      postsOverride: String(data[i][7] || ''),
      totalOverride: String(data[i][8] || ''),
      postsCredit: String(data[i][9] || ''),
      rateOverride: String(data[i][10] || '')
    });
  }
  // Their own base pay travels with it. The roster deliberately withholds
  // every creator's rate from non-admins, which is right — but it left a
  // creator unable to work out their OWN rate per video, so their card fell
  // back to the default and showed the wrong figure to the person it belongs
  // to. This is one creator's own number, not the roster.
  let rate = 0;
  const cdata = getCreatorsSheet().getDataRange().getValues();
  for (let i = 1; i < cdata.length; i++) {
    if (String(cdata[i][0] || '').trim().toLowerCase() === nameLower) {
      rate = parseFloat(cdata[i][3]) || 0;
      break;
    }
  }
  const result = { status: 'success', payments: payments, rate: rate };
  nqCachePutJson_(cacheKey, result, NQ_CREATOR_PAY_CACHE_SECONDS);
  return result;
}




function handleGetPayments() {
  const data = getManualSheet().getDataRange().getValues();
  const payments = [];
  for (let i = 1; i < data.length; i++) {
    if (!data[i][0] || !data[i][1]) continue;
    let pd = data[i][5];
    if (pd instanceof Date) {
      pd = pd.getFullYear() + '-' + String(pd.getMonth()+1).padStart(2,'0') + '-' + String(pd.getDate()).padStart(2,'0');
    } else { pd = String(pd || '').replace(/^'/, ''); }
    payments.push({
      month: String(data[i][0]).replace(/^'/, '').trim(),
      name: String(data[i][1]).trim(),
      bonusViews: String(data[i][2] || '').replace(/^'/, ''),
      specialBonus: String(data[i][3] || ''),
      paymentStatus: String(data[i][4] || 'Pending'),
      paymentDate: pd,
      remarks: String(data[i][6] || ''),
      postsOverride: String(data[i][7] || ''),
      totalOverride: String(data[i][8] || ''),
      postsCredit: String(data[i][9] || ''),
      rateOverride: String(data[i][10] || '')
    });
  }
  return { status: 'success', payments };
}








function handleSavePayment(params) {
  const month = (params.month || '').trim();
  const name = (params.name || '').trim();
  if (!month || !name) return { status: 'error', message: 'Month and name required' };
  // Only fields actually sent are updated; anything not sent is preserved.
  const f = {};
  if (params.bonusViews !== undefined) f.bonusViews = params.bonusViews;
  if (params.specialBonus !== undefined) f.specialBonus = params.specialBonus;
  if (params.paymentStatus !== undefined) f.paymentStatus = params.paymentStatus;
  if (params.paymentDate !== undefined) f.paymentDate = params.paymentDate;
  if (params.remarks !== undefined) f.remarks = params.remarks;
  if (params.postsOverride !== undefined) f.postsOverride = params.postsOverride;
  if (params.totalOverride !== undefined) f.totalOverride = params.totalOverride;
  if (params.postsCredit !== undefined) f.postsCredit = params.postsCredit;
  if (params.rateOverride !== undefined) f.rateOverride = params.rateOverride;
  // When postsCredit is being set, also clear any legacy postsOverride
  // (the new credit-based system replaces the old fixed-replacement override).
  if (params.postsCredit !== undefined && String(params.postsCredit) !== '') {
    f.postsOverride = '';
  }
  upsertManual(month, name, f);
  nqInvalidateCreatorPay_(name);
  return { status: 'success' };
}








// f may contain any of: bonusViews, specialBonus, paymentStatus, paymentDate,
// remarks, postsOverride, totalOverride, postsCredit. Missing keys keep their
// existing value (so a partial save never wipes other fields).
function upsertManual(month, name, f) {
  const sheet = getManualSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).replace(/^'/, '').trim() === month && String(data[i][1]).trim().toLowerCase() === name.toLowerCase()) {
      let pd = data[i][5];
      if (pd instanceof Date) pd = pd.getFullYear() + '-' + String(pd.getMonth()+1).padStart(2,'0') + '-' + String(pd.getDate()).padStart(2,'0');
      else pd = String(pd || '').replace(/^'/, '');
      const cur = {
        bonusViews: String(data[i][2] || '').replace(/^'/, ''),
        specialBonus: String(data[i][3] || ''),
        paymentStatus: String(data[i][4] || 'Pending'),
        paymentDate: pd,
        remarks: String(data[i][6] || ''),
        postsOverride: String(data[i][7] || ''),
        totalOverride: String(data[i][8] || ''),
        postsCredit: String(data[i][9] || ''),
        rateOverride: String(data[i][10] || '')
      };
      const m = {
        bonusViews: f.bonusViews !== undefined ? f.bonusViews : cur.bonusViews,
        specialBonus: f.specialBonus !== undefined ? f.specialBonus : cur.specialBonus,
        paymentStatus: f.paymentStatus !== undefined ? f.paymentStatus : cur.paymentStatus,
        paymentDate: f.paymentDate !== undefined ? f.paymentDate : cur.paymentDate,
        remarks: f.remarks !== undefined ? f.remarks : cur.remarks,
        postsOverride: f.postsOverride !== undefined ? f.postsOverride : cur.postsOverride,
        totalOverride: f.totalOverride !== undefined ? f.totalOverride : cur.totalOverride,
        postsCredit: f.postsCredit !== undefined ? f.postsCredit : cur.postsCredit,
        rateOverride: f.rateOverride !== undefined ? f.rateOverride : cur.rateOverride
      };
      sheet.getRange(i + 1, 1, 1, 11).setValues([["'" + month, name, (m.bonusViews ? "'" + m.bonusViews : ''), m.specialBonus, m.paymentStatus, (m.paymentDate ? ("'" + m.paymentDate) : ''), m.remarks, m.postsOverride, m.totalOverride, m.postsCredit, m.rateOverride]]);
      return;
    }
  }
  sheet.appendRow(["'" + month, name, (f.bonusViews ? "'" + f.bonusViews : ''), f.specialBonus || '', f.paymentStatus || 'Pending', (f.paymentDate ? ("'" + f.paymentDate) : ''), f.remarks || '', f.postsOverride || '', f.totalOverride || '', f.postsCredit || '', f.rateOverride || '']);
}








// ==========================================================
// DELETE A CREATOR FROM A SPECIFIC MONTH
// Removes their posts from Posting Log + their row in Payment Manual for
// the given month. Does NOT delete them from the Creators sheet
// (use Manage Creators for that).
// ==========================================================
function handleDeletePaymentRow(params) {
  const name = String(params.name || '').trim();
  const month = String(params.month || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return { status: 'error', message: 'Month required (YYYY-MM)' };








  const ss = getSpreadsheet_();
  let deletedPosts = 0;








  // 1. Delete from Posting Log — rows where name matches and date falls in this month.
  const posting = ss.getSheetByName(SHEET_NAME);
  if (posting) {
    const data = posting.getDataRange().getValues();
    // Walk bottom-up so deletions don't shift indices.
    for (let i = data.length - 1; i >= 1; i--) {
      const rowName = String(data[i][1] || '').trim();
      const rowDate = data[i][2];
      let rowMonth;
      if (rowDate instanceof Date) {
        rowMonth = rowDate.getFullYear() + '-' + String(rowDate.getMonth() + 1).padStart(2, '0');
      } else {
        rowMonth = String(rowDate || '').substring(0, 7);
      }
      if (rowName.toLowerCase() === name.toLowerCase() && rowMonth === month) {
        posting.deleteRow(i + 1);
        deletedPosts++;
      }
    }
  }








  // 2. Delete from Payment Manual — row matching month + name.
  const manual = ss.getSheetByName(MANUAL_SHEET);
  if (manual) {
    const mdata = manual.getDataRange().getValues();
    for (let i = mdata.length - 1; i >= 1; i--) {
      const rowMonth = String(mdata[i][0]).replace(/^'/, '').trim();
      const rowName = String(mdata[i][1] || '').trim();
      if (rowMonth === month && rowName.toLowerCase() === name.toLowerCase()) {
        manual.deleteRow(i + 1);
      }
    }
  }








  Logger.log('Deleted ' + name + ' from ' + month + ' (' + deletedPosts + ' posts + payment record)');
  if (deletedPosts > 0) nqBumpLogVersion_(name);
  nqInvalidateCreatorPay_(name);
  return { status: 'success', deletedPosts: deletedPosts };
}








// Update a creator's bank details (cols 5-7). Only fields actually sent are changed.
function handleSetCreatorBank(params) {
  const name = (params.name || '').trim();
  if (!name) return { status: 'error', message: 'Name required' };
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === name.toLowerCase()) {
      if (params.bankName !== undefined) sheet.getRange(i + 1, 5).setValue(params.bankName);
      if (params.acctNum !== undefined) sheet.getRange(i + 1, 6).setValue(params.acctNum);
      if (params.acctName !== undefined) sheet.getRange(i + 1, 7).setValue(params.acctName);
      return { status: 'success' };
    }
  }
  // Creator not in Creators sheet yet — auto-add them so the edit goes through
  sheet.appendRow([
    name, 'Active', new Date(), DEFAULT_MONTHLY_SALARY,
    params.bankName || '', params.acctNum || '', params.acctName || ''
  ]);
  nqInvalidateCreatorRoster_();
  nqInvalidateCreatorPay_(name);
  return { status: 'success', message: 'Auto-added to Creators sheet' };
}








// ==========================================================
// CREATOR TIER — the content type picked at onboarding decides the monthly
// salary, so it no longer has to be set by hand in the payment register
// afterwards.
//
//   WhatsApp & picture content -> ₦100,000
//   Video content              -> ₦150,000
//
// ₦200,000 is deliberately NOT offered on the form. It is the discretionary
// bump for creators who did exceptionally well, and it stays admin-only in
// Manage Creators. Onboarding can never cut a bump — see the first rule.
// ==========================================================
function nqTierRate_(params, existingRate) {
  var existing = parseFloat(existingRate);








  // Never lower a deliberate bump. Someone already above the standard salary
  // keeps it, so re-running intake to fix bank details cannot cost them money.
  if (!isNaN(existing) && existing > DEFAULT_MONTHLY_SALARY) return existing;








  // 'rate' arrives in the query string, so a creator could edit it in the URL.
  // Only ever accept the two values the form can legitimately produce.
  var ALLOWED = [100000, 150000];
  var picked = parseInt(params.rate, 10);
  if (ALLOWED.indexOf(picked) >= 0) return picked;








  // A tier was chosen but the amount is not one we issue — treat that as
  // tampering and use the lower tier. Someone underpaid says so immediately;
  // someone overpaid never will.
  if (params.creatorType) return 100000;








  // No tier at all, so this is an older copy of the form. Behave exactly as
  // this function's code did before the tier feature existed.
  if (!isNaN(existing) && existing > 0) return existing;
  return NEW_CREATOR_MONTHLY_SALARY;
}








// ==========================================================
// CALC_BONUS — used by the monthly register sheets
// ==========================================================
function CALC_BONUS(viewsList) {
  if (!viewsList) return 0;
  // Reads live from the Bonus Tiers sheet — change the amounts there (or via
  // Manage Creators → Edit bonus tiers in the app) and every register,
  // formula, and legend picks it up automatically. No code edits needed.
  const TIERS = readBonusTiers_();
  const values = String(viewsList).split(',').map(v => parseInt(v.trim().replace(/[^\d]/g,'')) || 0);
  let total = 0;
  values.forEach(v => {
    for (let i = 0; i < TIERS.length; i++) {
      if (v >= TIERS[i][0]) { total += TIERS[i][1]; break; }
    }
  });
  return total;
}








// ==========================================================
// PAYMENT REGISTER (monthly sheets) — KEPT as a backup.
// Once the in-app register is confirmed, run pauseRegisterTriggers().
// ==========================================================
function buildPaymentRegisterV2() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const posting = ss.getSheetByName(SHEET_NAME);
  const creators = getCreatorsSheet();








  function clean(s) {
    return String(s || '').replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\uFEFF\u2060\u180E]/g,'').replace(/\s+/g,' ').trim();
  }








  const pdata = posting.getDataRange().getValues();
  const counts = {};
  const months = new Set();
  for (let i = 1; i < pdata.length; i++) {
    const name = clean(pdata[i][1]);
    const d = pdata[i][2];
    if (!name || !d) continue;
    let ym;
    if (d instanceof Date) ym = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
    else ym = String(d).substring(0,7);
    months.add(ym);
    counts[name + '|' + ym] = (counts[name + '|' + ym] || 0) + 1;
  }








  const cdata = creators.getDataRange().getValues();
  const info = {};
  for (let i = 1; i < cdata.length; i++) {
    const name = clean(cdata[i][0]);
    if (!name) continue;
    info[name] = {
      rate: parseFloat(cdata[i][3]) || DEFAULT_MONTHLY_SALARY,
      bank: String(cdata[i][4] || ''),
      acct: String(cdata[i][5] || ''),
      acctName: String(cdata[i][6] || '')
    };
  }








  [...months].sort().forEach(ym => buildOneMonth(ss, ym, counts, info));
  Logger.log('Registers rebuilt for: ' + [...months].sort().join(', '));
}








function buildOneMonth(ss, ym, counts, info) {
  function clean(s) {
    return String(s || '').replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\uFEFF\u2060\u180E]/g,'').replace(/\s+/g,' ').trim();
  }
  const name = 'Payments ' + ym;
  let sheet = ss.getSheetByName(name);








  const preserved = {};
  if (sheet) {
    const old = sheet.getDataRange().getValues();
    let hr = -1, cols = {};
    for (let i = 0; i < old.length; i++) {
      const row = old[i].map(c => String(c).toLowerCase());
      if (row.some(c => c.indexOf('creator name') >= 0)) {
        hr = i;
        row.forEach((c, idx) => {
          if (c.indexOf('creator name') >= 0) cols.name = idx;
          if (c.indexOf('rate per post') >= 0) cols.rate = idx;
          if (c.indexOf('bonus views') >= 0) cols.bonusViews = idx;
          if (c.indexOf('special bonus') >= 0) cols.special = idx;
          if (c.indexOf('payment status') >= 0) cols.status = idx;
          if (c.indexOf('payment date') >= 0) cols.payDate = idx;
          if (c.indexOf('remarks') >= 0) cols.remarks = idx;
        });
        break;
      }
    }
    if (hr >= 0) {
      for (let i = hr+1; i < old.length; i++) {
        const n = String(old[i][cols.name] || '').trim();
        if (!n || n.toLowerCase() === 'total') continue;
        // Rate is intentionally NOT preserved — it's always derived from Creators sheet (salary ÷ 60).
        // Preserving it caused stale per-video rates (e.g. ₦200) to keep coming back.
        preserved[n] = {
          bonusViews: cols.bonusViews != null ? String(old[i][cols.bonusViews] || '') : '',
          special: cols.special != null ? old[i][cols.special] : '',
          status: cols.status != null ? String(old[i][cols.status] || '') : '',
          payDate: cols.payDate != null ? old[i][cols.payDate] : '',
          remarks: cols.remarks != null ? String(old[i][cols.remarks] || '') : ''
        };
      }
    }
    ss.deleteSheet(sheet);
  }








  sheet = ss.insertSheet(name);








  const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(ym.split('-')[1])-1];
  const year = ym.split('-')[0];
  const lastDay = new Date(parseInt(year), parseInt(ym.split('-')[1]), 0).getDate();








  sheet.getRange(1,1).setValue('NORTHQUEST FINANCE  ·  CREATOR PAYMENT REGISTER').setFontWeight('bold').setFontSize(13);
  sheet.getRange(2,1).setValue('Payment Period:  1st ' + monthName + ' ' + year + ' – ' + lastDay + ' ' + monthName + ' ' + year).setFontStyle('italic');








  const headers = ['S/N','Creator Name','No. of Posts','Rate per Post (₦)','Base Amount (₦)','Bonus Views','Perf. Bonus (₦)','Special Bonus (₦)','Total Payable (₦)','Bank Name','Account Number','Account Name','Payment Status','Payment Date','Remarks'];
  const HR = 4;
  sheet.getRange(HR,1,1,headers.length).setValues([headers])
    .setFontWeight('bold').setBackground('#6d4ce0').setFontColor('#FFFFFF').setHorizontalAlignment('center');
  sheet.setFrozenRows(HR);








  const here = new Set();
  Object.keys(counts).forEach(k => {
    const idx = k.lastIndexOf('|');
    if (k.substring(idx+1) === ym) here.add(k.substring(0, idx));
  });
  const sorted = [...here].sort();








  const rows = sorted.map((cname, i) => {
    const posts = counts[cname + '|' + ym] || 0;
    const ci = info[cname] || { rate: DEFAULT_MONTHLY_SALARY, bank:'', acct:'', acctName:'' };
    const p = preserved[cname] || {};
    // Rate per Post (column D) = monthly salary ÷ 60 (flat divisor).
    const perVideoRate = (parseFloat(ci.rate) || DEFAULT_MONTHLY_SALARY) / 60;
    return [
      i+1, cname, posts, perVideoRate, '', p.bonusViews || '', '', p.special || '', '',
      ci.bank, ci.acct, ci.acctName, p.status || 'Pending', p.payDate || '', p.remarks || ''
    ];
  });








  if (rows.length) {
    sheet.getRange(HR+1, 1, rows.length, headers.length).setValues(rows);
    for (let i = 0; i < rows.length; i++) {
      const r = HR+1+i;
      sheet.getRange(r,5).setFormula('=C'+r+'*D'+r);
      sheet.getRange(r,7).setFormula('=IF(F'+r+'="",0,CALC_BONUS(F'+r+'))');
      sheet.getRange(r,9).setFormula('=E'+r+'+G'+r+'+IF(H'+r+'="",0,H'+r+')');
    }
    [4,5,7,8,9].forEach(col => sheet.getRange(HR+1, col, rows.length, 1).setNumberFormat('"₦"#,##0.00'));








    const statusRange = sheet.getRange(HR+1, 13, rows.length, 1);
    statusRange.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Paid','Pending'], true).setAllowInvalid(false).build());
    sheet.setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Paid').setBackground('#d4edda').setFontColor('#155724').setRanges([statusRange]).build(),
      SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pending').setBackground('#fff3cd').setFontColor('#856404').setRanges([statusRange]).build()
    ]);








    const tr = HR+1+rows.length;
    sheet.getRange(tr,2).setValue('TOTAL').setFontWeight('bold');
    sheet.getRange(tr,3).setFormula('=SUM(C'+(HR+1)+':C'+(tr-1)+')').setFontWeight('bold');
    [5,7,8,9].forEach(col => {
      const L = String.fromCharCode(64+col);
      sheet.getRange(tr,col).setFormula('=SUM('+L+(HR+1)+':'+L+(tr-1)+')').setFontWeight('bold').setNumberFormat('"₦"#,##0.00');
    });
    sheet.getRange(tr,1,1,headers.length).setBackground('#f0eaff');
  }








  const widths = [45,230,80,120,130,200,130,130,140,130,130,200,120,120,160];
  widths.forEach((w,i) => sheet.setColumnWidth(i+1, w));








  const legendStart = (rows.length ? HR+1+rows.length : HR) + 3;
  const legend = [
    ['ASSUMPTIONS & LEGEND'],
    [''],
    ['Default salary: ₦150,000/month | Legacy tier: ₦100,000/month (older creators only — editable in Creators tab)'],
    ['Per-video rate = Monthly salary ÷ 60 (flat divisor). 100k tier = ₦1,666.67/video. 150k tier = ₦2,500/video.'],
    ['Pay = (videos posted that month) × per-video rate. In 31-day months a full-quota creator earns slightly more than their tier.'],
    [''],
    ['PERFORMANCE BONUS TIERS:'],
    ['• 50,000 views    = ₦50,000'],
    ['• 100,000 views   = ₦100,000'],
    ['• 500,000 views   = ₦200,000'],
    ['• 1,000,000 views = ₦500,000'],
    ['• 2,000,000 views = ₦900,000'],
    [''],
    ['HOW TO ENTER MULTIPLE BONUSES:'],
    ['Enter view counts in the Bonus Views column separated by commas, no thousands separators.'],
    ['    Example: 100000,50000     NOT: 100,000, 50,000'],
    ['Perf. Bonus and Total Payable calculate automatically. Special Bonus is entered by hand.']
  ];
  sheet.getRange(legendStart, 1, legend.length, 1).setValues(legend);
  sheet.getRange(legendStart, 1).setFontWeight('bold');
  sheet.getRange(legendStart+5, 1).setFontWeight('bold');
  sheet.getRange(legendStart+12, 1).setFontWeight('bold');
}








// ==========================================================
// ONE-TIME MERGE — name fixes (kept from the cleanup pass)
// ==========================================================
function mergeBatch2() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const MAP = {
    'ezeokoye anita chubuniem': 'Anita Ezeokoye Chubuniem',
    'anita ezeokoye chubuniem': 'Anita Ezeokoye Chubuniem',
    'ella ayebanua': 'Emmanuella Ayebanoa Digitemie',
    'emmanuella ayebanoa digitemie': 'Emmanuella Ayebanoa Digitemie',
    'emmanuella ayebanua': 'Emmanuella Ayebanoa Digitemie'
  };
  function clean(s) {
    return String(s || '').replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\uFEFF\u2060\u180E]/g,'').replace(/\s+/g,' ').trim();
  }
  function canon(s) { const c = clean(s); return MAP[c.toLowerCase()] || c; }








  const posting = ss.getSheetByName(SHEET_NAME);
  const pdata = posting.getDataRange().getValues();
  let renamed = 0;
  for (let i = 1; i < pdata.length; i++) {
    const raw = pdata[i][1];
    if (!raw) continue;
    const fixed = canon(raw);
    if (fixed !== clean(raw)) { posting.getRange(i+1, 2).setValue(fixed); renamed++; Logger.log('Posting Log row '+(i+1)+': "'+raw+'" -> "'+fixed+'"'); }
  }








  const creators = getCreatorsSheet();
  let cdata = creators.getDataRange().getValues();
  for (let i = 1; i < cdata.length; i++) {
    const raw = cdata[i][0];
    if (!raw) continue;
    const fixed = canon(raw);
    if (fixed !== clean(raw)) { creators.getRange(i+1, 1).setValue(fixed); Logger.log('Creators row '+(i+1)+': "'+raw+'" -> "'+fixed+'"'); }
  }
  cdata = creators.getDataRange().getValues();
  const seen = {};
  const dupes = [];
  for (let i = 1; i < cdata.length; i++) {
    const nm = clean(cdata[i][0]);
    if (!nm) { dupes.push(i+1); continue; }
    const lower = nm.toLowerCase();
    if (seen[lower]) {
      if (String(cdata[i][1]||'').toLowerCase() === 'active') creators.getRange(seen[lower], 2).setValue('Active');
      dupes.push(i+1);
      Logger.log('Removed duplicate creator row '+(i+1)+': "'+nm+'"');
    } else { seen[lower] = i+1; }
  }
  dupes.sort((a,b) => b-a).forEach(r => creators.deleteRow(r));








  Logger.log('Merge done: '+renamed+' posts renamed, '+dupes.length+' duplicate creators removed.');
  buildPaymentRegisterV2();
  Logger.log('Registers rebuilt.');
}








// ==========================================================
// FORENSIC CHECK — read-only audit, changes nothing.
// ==========================================================
function forensicCheck() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  function stripHidden(s) {
    return String(s || '').replace(/[\u0000-\u001F\u007F-\u00A0\u200B-\u200F\uFEFF\u2060\u180E]/g,'').replace(/\s+/g,' ').trim();
  }
  Logger.log('====== NORTHQUEST FORENSIC CHECK — ' + new Date() + ' ======');
  const posting = ss.getSheetByName(SHEET_NAME);
  const pdata = posting.getDataRange().getValues();
  const rawCounts = {}, cleanCounts = {}, badDateRows = [], monthCounts = {};
  for (let i = 1; i < pdata.length; i++) {
    const rawName = String(pdata[i][1] || '');
    if (!rawName.trim()) continue;
    const cleanName = stripHidden(rawName);
    rawCounts[rawName] = (rawCounts[rawName] || 0) + 1;
    cleanCounts[cleanName] = (cleanCounts[cleanName] || 0) + 1;
    const dv = pdata[i][2];
    let ym = null;
    if (dv instanceof Date) ym = dv.getFullYear()+'-'+String(dv.getMonth()+1).padStart(2,'0');
    else if (typeof dv === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dv)) ym = dv.substring(0,7);
    else badDateRows.push({row:i+1, name:cleanName, value:String(dv)});
    if (ym) monthCounts[cleanName+'|'+ym] = (monthCounts[cleanName+'|'+ym]||0)+1;
  }
  Logger.log('--- 2. HIDDEN-CHAR / WHITESPACE SPLITS ---');
  const cleanToRaws = {};
  Object.keys(rawCounts).forEach(raw => { const c = stripHidden(raw); if(!cleanToRaws[c]) cleanToRaws[c]=[]; cleanToRaws[c].push(raw); });
  let splits = 0;
  Object.keys(cleanToRaws).forEach(c => { if (cleanToRaws[c].length>1){ splits++; Logger.log('SPLIT: "'+c+'" stored as '+cleanToRaws[c].length+' variants'); cleanToRaws[c].forEach(v=>Logger.log('   "'+v+'" count='+rawCounts[v])); }});
  if (!splits) Logger.log('None found. Posting Log names clean.');








  Logger.log('--- 3. DUPLICATE NAMES IN CREATORS ---');
  const creators = ss.getSheetByName(CREATORS_SHEET);
  const cdata = creators.getDataRange().getValues();
  const seenC = {}; let cd = 0;
  for (let i=1;i<cdata.length;i++){ const raw=String(cdata[i][0]||''); if(!raw.trim())continue; const lo=stripHidden(raw).toLowerCase(); if(seenC[lo]!==undefined){cd++;Logger.log('DUP: row '+(i+1)+' "'+raw+'" matches row '+seenC[lo]);}else seenC[lo]=i+1; }
  if (!cd) Logger.log('None found. Creators clean.');








  Logger.log('--- 4. POSTING NAMES WITH NO MATCHING CREATOR ---');
  let orph=0;
  Object.keys(cleanCounts).forEach(c=>{ if(!seenC[c.toLowerCase()]){orph++;Logger.log('ORPHAN: "'+c+'" has '+cleanCounts[c]+' posts, not in Creators');}});
  if (!orph) Logger.log('None found.');








  Logger.log('--- 5. MISSING/MALFORMED DATES ---');
  if (!badDateRows.length) Logger.log('None found.');
  else badDateRows.forEach(b=>Logger.log('Row '+b.row+' | '+b.name+' | "'+b.value+'"'));








  Logger.log('--- 6. TRUE COUNTS PER CREATOR PER MONTH ---');
  const byMonth = {};
  Object.keys(monthCounts).forEach(k=>{ const i=k.lastIndexOf('|'); const n=k.substring(0,i); const ym=k.substring(i+1); if(!byMonth[ym])byMonth[ym]={}; byMonth[ym][n]=monthCounts[k]; });
  Object.keys(byMonth).sort().forEach(ym=>{ Logger.log('  === '+ym+' ==='); let t=0; Object.keys(byMonth[ym]).sort().forEach(n=>{Logger.log('    '+n+': '+byMonth[ym][n]); t+=byMonth[ym][n];}); Logger.log('    --- TOTAL: '+t+' ---'); });








  Logger.log('--- 7. REGISTER vs POSTING LOG MISMATCHES ---');
  let mm=0;
  ss.getSheets().forEach(sheet=>{
    const nm=sheet.getName();
    if(nm.indexOf('Payments ')!==0)return;
    const ym=nm.replace('Payments ','').trim();
    const truth=byMonth[ym]||{};
    const sdata=sheet.getDataRange().getValues();
    let hr=-1,nameCol=-1,postsCol=-1;
    for(let i=0;i<sdata.length;i++){ const row=sdata[i].map(c=>String(c).toLowerCase()); const ni=row.findIndex(c=>c.indexOf('creator name')>=0); const pi=row.findIndex(c=>c.indexOf('posts')>=0); if(ni>=0&&pi>=0){hr=i;nameCol=ni;postsCol=pi;break;} }
    if(hr<0){Logger.log('  '+nm+': no header, skipped');return;}
    Logger.log('  Checking '+nm+':');
    const seenS={};
    for(let i=hr+1;i<sdata.length;i++){ const n=stripHidden(String(sdata[i][nameCol]||'')); if(!n||n.toLowerCase()==='total')continue; const sc=parseInt(sdata[i][postsCol])||0; if(seenS[n.toLowerCase()]!==undefined){Logger.log('    DUP ROW: "'+n+'" at row '+(i+1));mm++;}else seenS[n.toLowerCase()]=i+1; const tc=truth[n]||0; if(sc!==tc){Logger.log('    MISMATCH: "'+n+'" register='+sc+' log='+tc);mm++;} }
    Object.keys(truth).forEach(n=>{ if(seenS[n.toLowerCase()]===undefined){Logger.log('    MISSING: "'+n+'" has '+truth[n]+' posts but no row');mm++;} });
  });
  if(!mm) Logger.log('  No mismatches. Registers match the Posting Log exactly.');
  Logger.log('====== CHECK COMPLETE ======');
}








// ==========================================================
// ONE-TIME SETUP HELPERS (run manually from the editor)
// ==========================================================








// Grant Drive + Docs + trigger permissions. Run once, approve the prompts.
function authorizeOnce() {
  DriveApp.getFolderById(SIGNED_FOLDER_ID).getName();
  DocumentApp.openById(DB_DOC_ID).getName();
  ScriptApp.getProjectTriggers();
  Logger.log('Authorized: Drive, Docs, and triggers.');
}








// Run once from the Apps Script editor to fill in missing bank details for
// every creator in the Creators tab, using the UGC Database as source of truth.
//
// HOW TO RUN (in Apps Script):
//   1. Click the function name dropdown at the top of the editor
//   2. Choose:  backfillBankDetails
//   3. Click  Run
//   4. Open View → Logs to see what was filled in
//
// Safe to run multiple times. Never overwrites a cell that already has data.
// Uses fuzzy matching so partial names ("Vivian", "Promise", "Bio") still match.
// Batches all writes at the end — completes in seconds, will never time out.
// ── Run this ONCE manually from the Apps Script editor. Reads the "NQ UGC
// DATABASE" Google Doc (the master creator database — same doc appendToDatabaseDoc
// writes to at intake) and fills in any BLANK phone numbers in the Creators
// sheet by matching on "Full name". Never overwrites a phone number that's
// already there. Logs which names got filled and which still have no phone
// number in either place, so you know exactly who to chase manually.
//
// Built 21 July 2026 after discovering some creators (the ones who never went
// through the intake flow) have no phone number in the Creators sheet at all,
// which is why their WhatsApp contact icon shows as greyed out.
function backfillPhoneNumbersFromDatabaseDoc() {
  const text = DocumentApp.openById(DB_DOC_ID).getBody().getText();
  const lines = text.split('\n');
  const records = {}; // name (lowercased) -> phone number
  let currentName = '';
  lines.forEach(function (line) {
    const nameMatch = line.match(/^\s*Full name:\s*(.+)/i);
    if (nameMatch) { currentName = nameMatch[1].trim(); return; }
    // Covers "Phone number:", "Phone no:", and "Phone number / WhatsApp number:" —
    // all three phrasings appear in the doc.
    const phoneMatch = line.match(/^\s*Phone\s*(?:number)?\s*(?:\/\s*WhatsApp\s*number)?\s*:\s*(.+)/i);
    if (phoneMatch && currentName) {
      const phone = phoneMatch[1].trim();
      if (phone) records[currentName.toLowerCase()] = phone;
    }
  });








  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  let filled = 0;
  const stillMissing = [];
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0] || '').trim();
    if (!name) continue;
    const existingPhone = String(data[i][7] || '').trim();
    if (existingPhone) continue; // already has one — never overwrite
    const found = records[name.toLowerCase()];
    if (found) {
      sheet.getRange(i + 1, 8).setValue(found);
      filled++;
      Logger.log('Filled phone for ' + name + ': ' + found);
    } else {
      stillMissing.push(name);
    }
  }
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('Backfill complete. Filled: ' + filled + '.');
  if (stillMissing.length) Logger.log('Still missing (no phone in Creators sheet AND no match found in the database doc): ' + stillMissing.join(', '));
  Logger.log('═══════════════════════════════════════════════════════');
}








function backfillBankDetails() {
  // Each entry: [array of any name fragments that should match, bankName, acctNum, acctName]
  // Lookup matches a Creators-tab name if ALL fragments appear in that name (case-insensitive).
  const ENTRIES = [
    [['george','omoruyi'],         'First Bank',   '3124756231', 'George-Omoruyi Uyiosariema Lois'],
    [['lawrence','inikio'],        'OPay',         '9057775071', 'Lawrence Inikio Emmanuella'],
    [['pere','sonia'],             'OPay',         '8164563353', 'Pere Sonia Tamaraukuro'],
    [['ejairu','rukevwe'],         'OPay',         '8104168896', 'Ejairu Rukevwe'],
    [['judith','edenbo'],          'Moniepoint',   '8161423488', 'Tamaratutarebi Judith Edenbo'],
    [['ofiyo','tamaraebi'],        'Wema Bank',    '0284900018', 'Ofiyo Tamaraebi Florence'],
    [['lawrence','baradoutei'],    'First Bank',   '3054363628', 'Lawrence Baradoutei Alexandra'],
    [['ayebanoa'],                 'GTBank',       '0609424941', 'Emmanuella Ayebanoa-Digitemie'],
    [['ella','ayebanua'],          'GTBank',       '0609424941', 'Emmanuella Ayebanoa-Digitemie'],
    [['joan','edenbo'],            'Moniepoint',   '8134869067', 'Joan Edenbo Tamaraudiyerin'],
    [['tubonanyo'],                'OPay',         '8086908562', 'Tubonanyo Azibator Victoria'],
    [['abraham','izibeglim'],      'OPay',         '8082193894', 'Abraham Izibeglim Marshal'],
    [['calista'],                  'OPay',         '8066061238', 'Enemali Calista'],
    [['ayibatari','akpeki'],       'UBA',          '2340871551', 'Ayibatari Akpeki'],
    [['iwale','destiny'],          'Zenith Bank',  '2254166918', 'IWALE Destiny Chineye'],
    [['dorothy','omokhui'],        'Ecobank',      '5540023125', 'Dorothy Omokhui'],
    [['kunkala'],                  'OPay',         '9028686819', 'Kunkala Biodoumoye'],
    [['donatus','izibekpenze'],    'OPay',         '9132340912', 'Izibekpenze Esther Donatus'],
    [['ebilade','bridget'],        'Access Bank',  '1400017043', 'Ebilade Bridget Sibisaba'],
    [['iteghie','promise'],        'OPay',         '8073246063', 'Iteghie Promise'],
    [['bio'],                      'OPay',         '8143281524', 'Amaerite H. Biobelemoye'],
    [['amaerite'],                 'OPay',         '8143281524', 'Amaerite H. Biobelemoye'],
    [['ohia','promise'],           'UBA',          '2113605967', 'Ohia Promise'],
    [['chiamaka','promise'],       'UBA',          '2113605967', 'Ohia Promise'],
    [['chiamaka','ohia'],          'UBA',          '2113605967', 'Ohia Promise'],
    [['tariere'],                  'First Bank',   '3220560015', 'Tariere Adolphus'],
    [['temi'],                     'Sterling',     '0099192955', 'Oluwabusolami Turton'],
    [['turton'],                   'Sterling',     '0099192955', 'Oluwabusolami Turton'],
    [['jessica','lawal'],          'Opay',         '7031130312', 'Jessica Lawal'],
    [['sharon','dada'],            'UBA',          '2189173858', 'Sharon Eberechukwu Dada'],
    [['chiamaka','uchegod'],       'Opay',         '9058211592', 'Chiamaka UcheGod Modesta'],
    [['chiamaka','modesta'],       'Opay',         '9058211592', 'Chiamaka UcheGod Modesta'],
    [['omolabake'],                'Stanbic IBTC', '0037230547', 'Omolabake Racheal Ogundare'],
    [['owhofasa'],                 'Palmpay',      '8119005458', 'Owhofasa Onuoha Favour'],
    [['onuoha','gabriella'],       'Zenith Bank',  '2270166828', 'Gabriella Nmesoma Onuoha'],
    [['gabriella','nmesoma'],      'Zenith Bank',  '2270166828', 'Gabriella Nmesoma Onuoha'],
    [['anita','ugbaja'],           'Access Bank',  '1696799241', 'Anita Ugbaja Chidera'],
    [['ezeokoye','anita'],         'OPay',         '7031550834', 'Ezeokoye Anita Chibuniem'],
    [['anita','chibuniem'],        'OPay',         '7031550834', 'Ezeokoye Anita Chibuniem'],
    [['taritein','eleanor'],       'Opay',         '7045668750', 'Taritein Eleanor Ayebawanate'],
    [['eleanor','ayebawanate'],    'Opay',         '7045668750', 'Taritein Eleanor Ayebawanate'],
    [['opeyemi','abdulazeez'],     'Polaris Bank', '3125987699', 'Opeyemi Abdulazeez Arike'],
    [['salako','bola'],            'Zenith Bank',  '2402802435', 'Salako Saida'],
    [['james-agonor'],             'Opay',         '9163768444', 'James-Agonor Joys'],
    [['agonor','joys'],            'Opay',         '9163768444', 'James-Agonor Joys'],
    [['adenekan','vivian'],        'Moniepoint',   '8023226814', 'Adenekan Vivian Mayowa'],
    [['ojagbeghru'],               'First Bank',   '3210105497', 'Ojagbeghru-Williams Anointing'],
    [['rejoice','edewhor'],        'Opay',         '8119038838', 'ISREAL OMEFE EDEWHOR'],
    [['igwe','uzoma'],             'Opay',         '9076315654', 'Igwe Uzoma Favour'],
    [['uzoma','favour'],           'Opay',         '9076315654', 'Igwe Uzoma Favour'],
    [['prudence'],                 'Ecobank',      '4420044665', 'Okorie-Richard Prudence Chisom'],
    [['richard','chisom'],         'Ecobank',      '4420044665', 'Okorie-Richard Prudence Chisom'],
  ];








  function findEntry(creatorName) {
    const lc = creatorName.toLowerCase();
    // Most-specific match wins (entries with more fragments are scored higher).
    let best = null, bestScore = 0;
    for (let i = 0; i < ENTRIES.length; i++) {
      const frags = ENTRIES[i][0];
      let allHit = true;
      for (let j = 0; j < frags.length; j++) {
        if (lc.indexOf(frags[j]) === -1) { allHit = false; break; }
      }
      if (allHit && frags.length > bestScore) { best = ENTRIES[i]; bestScore = frags.length; }
    }
    return best;
  }








  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(CREATORS_SHEET);
  if (!sheet) { Logger.log('ERROR: Creators sheet not found'); return; }
  const data = sheet.getDataRange().getValues();








  // Collect all the updates first (fast), then write them in one batch (very fast).
  const updates = []; // { row, col, value }
  const filled = [], unmatched = [];








  for (let i = 1; i < data.length; i++) {
    const rawName = String(data[i][0]).trim();
    if (!rawName) continue;
    const entry = findEntry(rawName);
    if (!entry) { unmatched.push(rawName); continue; }








    const [, bankName, acctNum, acctName] = entry;
    const hasBank = String(data[i][4]).trim() !== '';
    const hasNum  = String(data[i][5]).trim() !== '';
    const hasNm   = String(data[i][6]).trim() !== '';








    let wrote = [];
    if (!hasBank) { updates.push({ row: i + 1, col: 5, value: bankName }); wrote.push('bank'); }
    if (!hasNum)  { updates.push({ row: i + 1, col: 6, value: "'" + acctNum }); wrote.push('acct#'); }
    if (!hasNm)   { updates.push({ row: i + 1, col: 7, value: acctName }); wrote.push('name'); }
    if (wrote.length) filled.push(rawName + '  ←  ' + wrote.join(', '));
  }








  // Batch-write everything at once.
  updates.forEach(u => sheet.getRange(u.row, u.col).setValue(u.value));
  SpreadsheetApp.flush();








  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('BANK DETAILS BACKFILL — DONE');
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('Cells written: ' + updates.length);
  Logger.log('Creators filled in: ' + filled.length);
  if (filled.length) {
    Logger.log('---');
    filled.forEach(n => Logger.log('  ✓ ' + n));
  }
  if (unmatched.length) {
    Logger.log('---');
    Logger.log('NO MATCH IN DATABASE (add manually if needed):');
    unmatched.forEach(n => Logger.log('  ⚠ ' + n));
  }
  Logger.log('═══════════════════════════════════════════════════');
}








// One-shot: add Prudence (Richard Prudence Chisom) to both the Creators tab
// and the master UGC Database Google Doc. Safe to run twice — it checks first
// and skips whichever destination already has her.
//
// HOW TO RUN: select  addPrudence  in the function dropdown, click Run.
function addPrudence() {
  const p = {
    name:        'Richard Prudence Chisom',
    email:       'prudencerichard79@gmail.com',
    phone:       '+2349112646365',
    nqEmail:     'finance.prudence14@gmail.com',
    nqEmailPass: 'finance.prudence123',
    igUser:      'FinanceWithPrudence',
    igPass:      'finance.prudence123',
    ttUser:      'FinanceWithPrudence',
    ttPass:      'finance.prudence123',
    bankName:    'Ecobank',
    acctNum:     '4420044665',
    acctName:    'Okorie-Richard Prudence Chisom'
  };








  let addedToSheet = false, addedToDoc = false;








  // 1) Creators tab — only add if she's not already there
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CREATORS_SHEET);
  if (!sheet) { Logger.log('ERROR: Creators sheet not found'); return; }
  const data = sheet.getDataRange().getValues();
  let existsInSheet = false;
  for (let i = 1; i < data.length; i++) {
    const n = String(data[i][0] || '').toLowerCase();
    if (n.indexOf('prudence') !== -1) { existsInSheet = true; break; }
  }
  if (!existsInSheet) {
    sheet.appendRow([
      p.name, 'Active', new Date(), NEW_CREATOR_MONTHLY_SALARY,
      p.bankName, "'" + p.acctNum, p.acctName,
      p.phone, p.email,
      p.nqEmail, p.nqEmailPass,
      p.igUser, p.igPass,
      p.ttUser, p.ttPass,
      '', new Date()
    ]);
    addedToSheet = true;
  }








  // 2) Master UGC Database Doc — only add if she's not already there
  const docBody = DocumentApp.openById(DB_DOC_ID).getBody();
  const docText = docBody.getText().toLowerCase();
  if (docText.indexOf('prudence') === -1 && docText.indexOf('okorie-richard') === -1) {
    appendToDatabaseDoc(p);
    addedToDoc = true;
  }








  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('ADD PRUDENCE — DONE');
  Logger.log('═══════════════════════════════════════════════════');
  Logger.log('Creators tab:    ' + (addedToSheet ? '✓ added' : '— already present, skipped'));
  Logger.log('UGC Database doc:' + (addedToDoc   ? '✓ added' : '— already present, skipped'));
  Logger.log('═══════════════════════════════════════════════════');
}








// Copy existing Paid/bonus data from the monthly Payments sheets into the
// in-app Payment Manual tab, so nothing is lost when we switch over. Safe to re-run.
function migratePaymentsToManual() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let migrated = 0;
  ss.getSheets().forEach(sheet => {
    const nm = sheet.getName();
    if (nm.indexOf('Payments ') !== 0) return;
    const ym = nm.replace('Payments ', '').trim();
    const data = sheet.getDataRange().getValues();
    let hr = -1, col = {};
    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(c => String(c).toLowerCase());
      if (row.some(c => c.indexOf('creator name') >= 0)) {
        hr = i;
        row.forEach((c, idx) => {
          if (c.indexOf('creator name') >= 0) col.name = idx;
          if (c.indexOf('bonus views') >= 0) col.bonus = idx;
          if (c.indexOf('special bonus') >= 0) col.special = idx;
          if (c.indexOf('payment status') >= 0) col.status = idx;
          if (c.indexOf('payment date') >= 0) col.date = idx;
          if (c.indexOf('remarks') >= 0) col.remarks = idx;
        });
        break;
      }
    }
    if (hr < 0) return;
    for (let i = hr + 1; i < data.length; i++) {
      const n = String(data[i][col.name] || '').trim();
      if (!n || n.toLowerCase() === 'total') continue;
      let pd = col.date != null ? data[i][col.date] : '';
      if (pd instanceof Date) pd = pd.getFullYear() + '-' + String(pd.getMonth()+1).padStart(2,'0') + '-' + String(pd.getDate()).padStart(2,'0');
      else pd = String(pd || '');
      upsertManual(ym, n, {
        bonusViews: col.bonus != null ? String(data[i][col.bonus] || '') : '',
        specialBonus: col.special != null ? String(data[i][col.special] || '') : '',
        paymentStatus: col.status != null ? String(data[i][col.status] || 'Pending') : 'Pending',
        paymentDate: pd,
        remarks: col.remarks != null ? String(data[i][col.remarks] || '') : ''
      });
      migrated++;
    }
  });
  Logger.log('Migrated ' + migrated + ' rows from monthly sheets into Payment Manual.');
}








// ==========================================================
// DUPLICATE LOG AUDIT & CLEANUP
// ==========================================================








// STEP 1: Run this first. It shows every duplicate and the cleaned count
// per creator — does NOT change any data.
//
// HOW TO RUN:
//   1. Select  auditDuplicateLogs  in the function dropdown
//   2. Click Run → then View → Logs
function auditDuplicateLogs() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();








  function dateStr(v) {
    if (v instanceof Date) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
    return String(v||'').substring(0,10);
  }








  // Group rows by creator+date, recording each post number and sheet row index
  const groups = {};
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][1]||'').trim();
    if (!name) continue;
    const d    = dateStr(data[i][2]);
    const post = String(data[i][3]||'');
    const ts   = data[i][0] instanceof Date ? data[i][0].toISOString() : String(data[i][0]||'');
    const key  = name.toLowerCase() + '|' + d;
    if (!groups[key]) groups[key] = { name, date: d, entries: [] };
    groups[key].entries.push({ rowIdx: i+1, post, ts });
  }








  // Find groups where any post number appears more than once
  const problems = [];
  let totalExtra = 0;
  Object.values(groups).forEach(g => {
    const p1 = g.entries.filter(e => e.post === '1');
    const p2 = g.entries.filter(e => e.post === '2');
    const extra = Math.max(0, p1.length-1) + Math.max(0, p2.length-1);
    if (extra > 0) { problems.push({ ...g, p1, p2, extra }); totalExtra += extra; }
  });








  // Per-creator summary (raw vs clean count for the month)
  const creatorRaw = {}, creatorClean = {};
  Object.values(groups).forEach(g => {
    const n = g.name;
    creatorRaw[n]   = (creatorRaw[n]||0)   + g.entries.length;
    const p1 = g.entries.filter(e => e.post==='1').length > 0 ? 1 : 0;
    const p2 = g.entries.filter(e => e.post==='2').length > 0 ? 1 : 0;
    creatorClean[n] = (creatorClean[n]||0) + p1 + p2;
  });








  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('DUPLICATE LOG AUDIT — ' + new Date().toDateString());
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('Total duplicate rows found: ' + totalExtra + '  (safe to remove)');
  Logger.log('');








  if (!problems.length) {
    Logger.log('✓ No duplicates found. Log is clean.');
  } else {
    Logger.log('PROBLEM ENTRIES (each date should have at most Post 1 + Post 2):');
    Logger.log('─────────────────────────────────────────────────────');
    problems.forEach(p => {
      Logger.log('⚠ ' + p.name + ' | ' + p.date +
        '  →  Post1 ×'+p.p1.length + ', Post2 ×'+p.p2.length +
        '  ('+p.extra+' extra)');
      p.entries.forEach(e => Logger.log('     Row '+e.rowIdx+' | Post '+e.post+' | submitted '+e.ts));
    });
  }








  Logger.log('');
  Logger.log('PER-CREATOR COUNT — RAW vs AFTER CLEANUP:');
  Logger.log('─────────────────────────────────────────────────────');
  Object.keys(creatorRaw).sort().forEach(n => {
    const raw = creatorRaw[n], clean = creatorClean[n];
    if (raw !== clean) Logger.log('  ' + n + ':  '+raw+' logged  →  '+clean+' after cleanup  (−'+(raw-clean)+')');
  });
  Logger.log('');
  Logger.log('Run  cleanDuplicateLogs  when you are satisfied with the above.');
  Logger.log('═══════════════════════════════════════════════════════');
}








// STEP 2: Run this AFTER reviewing the audit. It removes all duplicate rows,
// keeping the first valid Post 1 and first valid Post 2 per creator per date.
// All other copies are permanently deleted.
//
// HOW TO RUN:
//   1. Select  cleanDuplicateLogs  in the function dropdown
//   2. Click Run → View → Logs to confirm what was removed
function cleanDuplicateLogs() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();








  function dateStr(v) {
    if (v instanceof Date) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
    return String(v||'').substring(0,10);
  }








  // Walk rows top to bottom; the FIRST time we see a name+date+post combo
  // we keep it. All later duplicates get queued for deletion.
  const seen = {};
  const toDelete = []; // sheet row indices (1-based), collected in order








  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][1]||'').trim();
    if (!name) continue;
    const d    = dateStr(data[i][2]);
    const post = String(data[i][3]||'');
    const key  = name.toLowerCase() + '|' + d + '|' + post;
    if (seen[key]) {
      toDelete.push(i+1); // mark as duplicate
    } else {
      seen[key] = true;
    }
  }








  // Delete from bottom to top so earlier row indices stay valid
  toDelete.reverse().forEach(r => sheet.deleteRow(r));
  SpreadsheetApp.flush();








  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('DUPLICATE CLEANUP — DONE');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('Duplicate rows removed: ' + toDelete.length);
  Logger.log('Rows kept:              ' + (data.length - 1 - toDelete.length));
  if (!toDelete.length) Logger.log('(Nothing to remove — log was already clean.)');
  Logger.log('═══════════════════════════════════════════════════════');
}








// ==========================================================
// SAME-LINK DUPLICATE CLEANUP
//
// Catches the "false failure" double-logs: the SAME video link logged twice
// on the same day under DIFFERENT post numbers (e.g. once as Video 1 and
// again as Video 2). cleanDuplicateLogs cannot catch these because it only
// compares post numbers — this one compares the actual video links.
//
// Keeps the EARLIEST submission of each link, deletes the later copies.
// Rows with no links at all are never touched.
//
// SAFE TO RUN MULTIPLE TIMES.
//
// HOW TO RUN:
//   1. Select  cleanDuplicateLinks  in the function dropdown
//   2. Click Run → View → Logs to see exactly what was removed
// ==========================================================
function cleanDuplicateLinks() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();








  function dateStr(v) {
    if (v instanceof Date) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
    return String(v||'').substring(0,10);
  }








  // Walk rows top to bottom (earliest first). The FIRST time we see a
  // name+date+link we keep it; any later row repeating that link that day
  // is queued for deletion.
  const seenLinks = {};   // key: name|date|link  → true
  const toDelete  = [];
  const removed   = [];








  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][1]||'').trim();
    if (!name) continue;
    const d      = dateStr(data[i][2]);
    const post   = String(data[i][3]||'');
    const tiktok = String(data[i][4]||'').trim();
    const insta  = String(data[i][5]||'').trim();
    if (!tiktok && !insta) continue; // no links — leave the row alone








    const base = name.toLowerCase() + '|' + d + '|';
    const tkKey = tiktok ? base + 'tk:' + tiktok : null;
    const igKey = insta  ? base + 'ig:' + insta  : null;








    const isDup = (tkKey && seenLinks[tkKey]) || (igKey && seenLinks[igKey]);
    if (isDup) {
      toDelete.push(i+1);
      removed.push(name + ' | ' + d + ' | Post ' + post + ' | (same link logged earlier that day)');
    } else {
      if (tkKey) seenLinks[tkKey] = true;
      if (igKey) seenLinks[igKey] = true;
    }
  }








  // Delete from bottom to top so earlier row indices stay valid
  toDelete.reverse().forEach(r => sheet.deleteRow(r));
  SpreadsheetApp.flush();








  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('SAME-LINK DUPLICATE CLEANUP — DONE');
  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('Rows removed: ' + toDelete.length);
  if (removed.length) {
    Logger.log('');
    removed.forEach(r => Logger.log('  ✂ ' + r));
  } else {
    Logger.log('(Nothing to remove — no same-link duplicates found.)');
  }
  Logger.log('═══════════════════════════════════════════════════════');
}








// ==========================================================
// SALARY MIGRATION — run ONCE after updating to monthly salary format.
// Converts old per-video rates (e.g. 1785.71) to monthly salaries (100000 or 150000).
// Safe to run more than once — already-migrated rows are skipped automatically.
// ==========================================================
function migrateRatesToMonthlySalaries() {
  const sheet = getCreatorsSheet();
  const data = sheet.getDataRange().getValues();
  let migrated = 0, skipped = 0;








  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('SALARY MIGRATION');
  Logger.log('═══════════════════════════════════════════════════════');








  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][0] || '').trim();
    const existing = parseFloat(data[i][3]);
    if (!name) continue;
    if (isNaN(existing) || existing <= 0) {
      // No rate at all — set the standard default
      sheet.getRange(i + 1, 4).setValue(DEFAULT_MONTHLY_SALARY);
      Logger.log(name + ': no rate set → assigned ₦' + DEFAULT_MONTHLY_SALARY + '/month (standard)');
      migrated++;
      continue;
    }
    // Already a monthly salary (10,000 or above is obviously not a per-video rate)
    if (existing >= 10000) {
      Logger.log(name + ': already ₦' + existing + ' — skipped');
      skipped++;
      continue;
    }
    // Old per-video rate — decide which tier
    const newSalary = existing < 2200 ? 100000 : 150000;
    sheet.getRange(i + 1, 4).setValue(newSalary);
    Logger.log(name + ': ₦' + existing.toFixed(2) + '/video → ₦' + newSalary + '/month');
    migrated++;
  }








  Logger.log('═══════════════════════════════════════════════════════');
  Logger.log('Migrated: ' + migrated + '   Skipped (already correct): ' + skipped);
  Logger.log('═══════════════════════════════════════════════════════');
}








// Turn OFF the twice-weekly auto-rebuild of the monthly sheets.
// Run this ONLY after you confirm the in-app register is the source of truth.
function pauseRegisterTriggers() {
  const trs = ScriptApp.getProjectTriggers();
  let removed = 0;
  trs.forEach(t => { if (t.getHandlerFunction() === 'buildPaymentRegisterV2') { ScriptApp.deleteTrigger(t); removed++; } });
  Logger.log('Removed ' + removed + ' register trigger(s).');
}








// Wipes a messy/old-layout Payment Manual tab and rebuilds it cleanly from the
// monthly sheets, then marks April + May as Paid (both confirmed fully paid).
// The monthly sheets and the Posting Log are NOT touched.
function rebuildPaymentManual() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const old = ss.getSheetByName(MANUAL_SHEET);
  if (old) ss.deleteSheet(old);
  getManualSheet();
  migratePaymentsToManual();
  const sheet = getManualSheet();
  const data = sheet.getDataRange().getValues();
  let paid = 0;
  for (let i = 1; i < data.length; i++) {
    const month = String(data[i][0]).replace(/^'/, '').trim();
    const name = String(data[i][1]).trim();
    if (!month || !name) continue;
    if (month === '2026-04') { upsertManual(month, name, { paymentStatus: 'Paid', paymentDate: '2026-06-05' }); paid++; }
    else if (month === '2026-05') { upsertManual(month, name, { paymentStatus: 'Paid' }); paid++; }
  }
  Logger.log('Payment Manual rebuilt clean. ' + paid + ' April/May rows marked Paid.');
}








// ==========================================================
// FIX BACKDATED ROWS
//
// A creator who used the old date-picker could enter (for example) "2026-06-26"
// as the date even though they were actually submitting on "2026-06-27". The
// row gets:
//   Column A (server timestamp) = 2026-06-27 04:50  ← when they actually submitted
//   Column C (entered date)     = 2026-06-26        ← the date they typed
//
// The backend rate-limit counts by Column A, so this burns today's quota on
// yesterday's videos. The creator can't submit today's real videos because
// the system thinks they have already used today's 2 slots.
//
// This function walks the entire sheet and, for every row where Column A's
// date is different from Column C's date, rewrites Column A to match Column C
// (keeping the same time of day). After running, the rate limit will correctly
// count rows against the date the creator intended.
//
// SAFE TO RUN MULTIPLE TIMES — idempotent. Run it any time you suspect
// backdating has eaten someone's daily quota.
//
// HOW TO RUN:
//   1. Select  fixBackdatedTimestamps  in the function dropdown
//   2. Click Run ▶
//   3. Check View → Logs to see which rows were fixed
// ==========================================================
function fixBackdatedTimestamps() {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  let fixed = 0;
  const byCreator = {};








  function ymd(v) {
    if (v instanceof Date) {
      return v.getFullYear() + '-' + String(v.getMonth()+1).padStart(2,'0') + '-' + String(v.getDate()).padStart(2,'0');
    }
    return String(v||'').substring(0,10);
  }








  for (let i = 1; i < data.length; i++) {
    const tsRaw    = data[i][0];
    const name     = String(data[i][1]||'').trim();
    const dateRaw  = data[i][2];
    if (!(tsRaw instanceof Date) || !name || !dateRaw) continue;








    const tsYMD   = ymd(tsRaw);
    const dateYMD = ymd(dateRaw);
    if (!dateYMD || tsYMD === dateYMD) continue;








    // Build a new timestamp using the entered date but preserving the time of day
    const parts = dateYMD.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) continue;
    const newTs = new Date(parts[0], parts[1]-1, parts[2], tsRaw.getHours(), tsRaw.getMinutes(), tsRaw.getSeconds());








    sheet.getRange(i + 1, 1).setValue(newTs);
    Logger.log('Row ' + (i+1) + '  |  ' + name + '  |  ' + tsYMD + ' -> ' + dateYMD);
    fixed++;
    byCreator[name] = (byCreator[name] || 0) + 1;
  }








  Logger.log('');
  Logger.log('======================================================');
  Logger.log('Fixed ' + fixed + ' backdated row(s).');
  if (fixed > 0) {
    Logger.log('');
    Logger.log('Per-creator counts:');
    Object.keys(byCreator).sort().forEach(n => Logger.log('  ' + n + ':  ' + byCreator[n] + ' row(s) fixed'));
  }
  Logger.log('======================================================');
}
