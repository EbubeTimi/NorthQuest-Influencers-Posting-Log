// Drives the two Manage Creators fixes against the real page source: the bonus
// column must follow the selected month (not today), and a specific bonus must
// be deletable (not only the last one).
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const code = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/.exec(html)[1];

// Minimal stubs: enough for the functions under test, nothing more.
const saved = [];
const toasts = [];
const els = {};
function el(id) {
  if (!els[id]) els[id] = { id, innerHTML: "", textContent: "", style: {}, contains: () => false };
  return els[id];
}

const sandbox = {
  console,
  document: {
    getElementById: el,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: () => {},
    body: { classList: { add() {}, remove() {} } },
    activeElement: null,
    documentElement: { style: { setProperty() {} } },
  },
  window: {},
  navigator: { userAgent: "node" },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  setTimeout, clearTimeout, setInterval, clearInterval,
  location: { href: "", search: "", hash: "" },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
// `let` at script top level creates lexical bindings that are NOT properties of
// globalThis, so fixtures have to be injected from inside that scope. A direct
// eval in a function declared there can see them.
const bridge = "\n;globalThis.__set = function (k, v) { eval(k + ' = v'); };" +
               "\n globalThis.__get = function (k) { return eval(k); };\n";
try { vm.runInContext(code + bridge, sandbox); } catch (e) { /* DOM-dependent init may throw; functions are still defined */ }
const set = (k, v) => sandbox.__set(k, v);

// Replace the network layer so we can observe exactly what would be written.
sandbox.savePaymentField = (month, name, field, value) => saved.push({ month, name, field, value });
sandbox.showToast = (kind, title, msg) => toasts.push({ kind, title, msg });
sandbox.renderManageCreators = () => {};
sandbox.renderPayments = () => {};
set("paysLoaded", true);

const THIS_MONTH = sandbox.todayStr().substring(0, 7);
let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log((ok ? "PASS  " : "FAIL  ") + label +
    (ok ? "" : "\n        expected " + JSON.stringify(expected) + "\n        actual   " + JSON.stringify(actual)));
}

// ---- Fixture: one creator with three bonuses recorded in JULY, none in the current month.
set("allRows", [
  { name: "Ada", date: "2026-07-04" },
  { name: "Ada", date: "2026-07-19" },
]);
set("allPayments", [
  { month: "2026-07", name: "Ada", bonusViews: "50000,100000,500000" },
]);
set("bonusTiers", [[500000, 200000], [100000, 100000], [50000, 50000]]);

// ---- 1. Default behaviour is unchanged: the current month.
set("manageMonth", null);
check("defaults to the current month", sandbox.manageMonthOrToday(), THIS_MONTH);

// ---- 2. The month list offers July even though it is in the past.
set("manageMonth", null);
const months = sandbox.getManageMonths();
check("offers July and the current month", [months.includes("2026-07"), months.includes(THIS_MONTH)], [true, true]);

// ---- 3. THE JULY/AUGUST BUG. Pointed at the current month, July's bonuses are invisible.
set("manageMonth", null);
const currentView = sandbox.bonusControl("Ada");
check("current month shows no bonus for Ada", /No bonus yet/.test(currentView), true);

// ---- 4. Switching to July surfaces the real July total (50k + 100k + 200k = 350,000).
set("manageMonth", "2026-07");
const julyView = sandbox.bonusControl("Ada");
check("July shows the July bonus total", /350,000 bonus/.test(julyView), true);
check("July offers a delete option per bonus", (julyView.match(/value="del:\d+"/g) || []).length, 3);
check("the middle option is labelled with its own value", /value="del:1"[^>]*>[^<]*100,000 views/.test(julyView), true);

// ---- 5. THE DELETE BUG. Remove the MIDDLE bonus (100000), not the last.
saved.length = 0;
set("manageMonth", "2026-07");
sandbox.onBonusPick("Ada", { value: "del:1" });
check("writes to July, not the current month", saved.map(s => s.month), ["2026-07"]);
check("removes only the middle entry", saved.map(s => s.value), ["50000,500000"]);

// ---- 6. Adding a bonus while pointed at July lands in July.
saved.length = 0;
set("allPayments", [{ month: "2026-07", name: "Ada", bonusViews: "50000" }]);
set("manageMonth", "2026-07");
sandbox.onBonusPick("Ada", { value: "100000" });
check("adds into the selected month", saved, [{ month: "2026-07", name: "Ada", field: "bonusViews", value: "50000,100000" }]);

// ---- 7. Out-of-range index is ignored rather than corrupting the list.
saved.length = 0;
set("allPayments", [{ month: "2026-07", name: "Ada", bonusViews: "50000" }]);
sandbox.onBonusPick("Ada", { value: "del:9" });
check("ignores an out-of-range delete", saved, []);

// ---- 8. Clear-all still works.
saved.length = 0;
set("allPayments", [{ month: "2026-07", name: "Ada", bonusViews: "50000,100000" }]);
sandbox.onBonusPick("Ada", { value: "clear" });
check("clear all empties the list", saved.map(s => s.value), [""]);

// ---- 9. The header names the month being edited.
set("manageMonth", "2026-07");
sandbox.renderManageMonthPicker();
check("header names the selected month", el("manage-bonus-th").textContent, "Bonus (Jul 2026)");
set("manageMonth", null);
sandbox.renderManageMonthPicker();
check("header reverts for the current month", el("manage-bonus-th").textContent, "Bonus (This Month)");

console.log(failures ? "\n" + failures + " FAILING" : "\nAll checks passed");
process.exit(failures ? 1 : 0);
