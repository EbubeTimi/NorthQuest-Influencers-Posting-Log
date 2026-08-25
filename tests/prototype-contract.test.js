const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "prototypes", "unified-tdt-creator-ops.html");
const html = fs.readFileSync(file, "utf8");
let failures = 0;

function check(name, condition) {
  if (condition) console.log("PASS ", name);
  else { failures += 1; console.error("FAIL ", name); }
}

check("prototype is explicitly read-only", /Read-only prototype/.test(html) && /Nothing is sent/.test(html));
check("personal Google account is the login direction", /personal Google account/.test(html) && /Continue with Google/.test(html));
check("chooser contains assigned work only", /accounts assigned to you/.test(html) && /assigned:\["northquest","aura"\]/.test(html));
check("business invitation is email-bound and single use", /amara@gmail\.com/.test(html) && /used once/.test(html));
check("phone-first layout is one column by default", /grid-template-columns:minmax\(0,1fr\)/.test(html) && /order:-1/.test(html));
check("plain dates replace creator-facing cycle language", /13 August/.test(html) && !/shared weekly cycle/i.test(html));
check("yesterday grace ends at noon", /until 12:00 PM/.test(html) && /Missed yesterday/.test(html));
check("one video must reach protected 10,000", /One video must reach 10,000 views/.test(html) && /Videos are not added together/.test(html));
check("10,000 creates review instead of automatic unlock", /Management review created once/.test(html) && /does not unlock/i.test(html));
check("management approval unlocks onboarding", /Approve onboarding/.test(html) && /Management verified your video/.test(html));
check("deactivation preserves another membership", /Aura access still works/.test(html));
check("all required states are deterministic", ["invite","signin","chooser","walkthrough","dashboard","grace","gate","pending","management","approved","deactivated","loading","empty","error"].every(state=>html.includes(`data-state="${state}"`)));
check("accessibility and reduced motion exist", /aria-live="polite"/.test(html) && /prefers-reduced-motion/.test(html) && /aria-modal="true"/.test(html));
check("prototype contains no production endpoints", !/zuuhlowjqniadtcpdypv|mcp\.vercel|script\.google\.com|api\.apify\.com/.test(html));
check("qualification and deactivation are business-scoped", /status:\{northquest:/.test(html) && /deactivated:\{northquest:/.test(html));
check("review controls are separate from creator UI", /Creators will not see them/.test(html));

if (failures) {
  console.error(`\n${failures} prototype contract check(s) failed`);
  process.exit(1);
}
console.log("\nAll prototype contract checks passed");
