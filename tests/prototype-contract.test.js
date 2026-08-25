const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "prototypes", "unified-tdt-creator-ops.html");
const html = fs.readFileSync(file, "utf8");
let failures = 0;

function check(name, condition) {
  if (condition) console.log("PASS ", name);
  else { console.error("FAIL ", name); failures += 1; }
}

check("prototype is explicitly read-only", /Read-only prototype/i.test(html) && /local simulations/i.test(html));
check("all required flow states are deterministic", ["signin", "chooser", "dashboard", "gate", "unlocked", "deactivated", "loading", "empty", "error"].every((state) => html.includes(`data-state="${state}"`)));
check("three businesses are represented", ["NorthQuest", "CashDrive", "Aura"].every((name) => html.includes(name)));
check("fixed 10,000 single-video rule is stated", /One video must reach 10,000 views/.test(html) && /Separate videos are never added together/.test(html));
check("automatic transition has no approval step", /happened automatically/.test(html) && /there is no approval step/.test(html));
check("shared cycle and post-join obligation are stated", /shared August cycle/.test(html) && /logged after you joined/.test(html));
check("review decision surface exists", /value="approve"/.test(html) && /value="revise"/.test(html) && /value="reject"/.test(html));
check("accessibility live regions exist", (html.match(/aria-live=/g) || []).length >= 3 && /Skip review controls/.test(html));
check("reduced motion is supported", /prefers-reduced-motion/.test(html) && /reduce-motion/.test(html));
check("responsive phone, tablet, and desktop controls exist", ["desktop", "tablet", "phone"].every((value) => html.includes(`value="${value}"`)));
check("prototype contains no production endpoints", !/zuuhlowjqniadtcpdypv|mcp\.vercel|script\.google\.com|api\.apify\.com/.test(html));
check("qualification and drafts are business-scoped", /unlocked: \{ northquest: false, cashdrive: false, aura: false \}/.test(html) && /gateReports\[model\.business\]/.test(html));

if (failures) process.exit(1);
console.log("\nAll prototype contract checks passed");
