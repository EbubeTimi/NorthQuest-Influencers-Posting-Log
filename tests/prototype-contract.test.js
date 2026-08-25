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
check("sign-in uses short TDT and Google copy", /Welcome back\./.test(html) && /Continue with Google/.test(html) && /Use your personal account\./.test(html));
check("chooser contains assigned work only", /accounts assigned to you/.test(html) && /assigned:\["northquest","aura"\]/.test(html));
check("generic invitation does not invent an email or redemption state", /invited to your NorthQuest Creator dashboard/.test(html) && !/amara@gmail\.com|used once|NorthQuest invitation/.test(html));
check("phone-first layout is one column by default", /grid-template-columns:minmax\(0,1fr\)/.test(html) && /order:-1/.test(html));
check("dates are locked to Today and eligible Yesterday", /Today · 25 August/.test(html) && /Yesterday · 24 August/.test(html) && !/type="date"/.test(html));
check("yesterday grace ends at noon", /only until 12:00 PM/.test(html) && /only when you did not already log it/.test(html));
check("dashboard uses requested plain task and has no recent-video clutter", /Track your videos/.test(html) && /Submit video/.test(html) && !/Recent videos|I missed yesterday/.test(html));
check("walkthrough is a non-skippable spotlight over the dashboard", /walkthrough-layer/.test(html) && /aria-modal="true"/.test(html) && !/>Skip</.test(html));
check("success waits for simulated backend confirmation", /model\.saving=true/.test(html) && /Saved and confirmed in the prototype backend/.test(html));
check("weekly gate uses date and platform-video fields", /Log your views\./.test(html) && /between 4 and 7 August/.test(html) && ["TikTok Video 1","Instagram Video 1","TikTok Video 2","Instagram Video 2"].every(label=>html.includes(label)));
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
