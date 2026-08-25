const path = require("path");
const { chromium } = require("playwright");

const baseUrl = "http://127.0.0.1:4173/unified-tdt-creator-ops.html";
const evidence = path.join(__dirname, "..", "evidence", "flows", "TDT_Prototype");
const results = [];
const consoleProblems = [];

function pass(name, detail = "") {
  results.push({ name, status: "PASS", detail });
  console.log("PASS ", name, detail);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.on("console", message => {
    if (["error", "warning"].includes(message.type())) consoleProblems.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", error => consoleProblems.push(`pageerror: ${error.message}`));

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("h2", { hasText: "Good morning, Amara." }).waitFor();
  const phoneOverflow = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    device: document.querySelector(".device").scrollWidth - document.querySelector(".device").clientWidth
  }));
  if (phoneOverflow.document !== 0 || phoneOverflow.device !== 0) throw new Error(`phone overflow: ${JSON.stringify(phoneOverflow)}`);
  const panelsFit = await page.locator("#app .panel").evaluateAll((panels) => panels.every(panel => {
    const box = panel.getBoundingClientRect();
    return box.left >= -0.5 && box.right <= document.documentElement.clientWidth + 0.5 && box.width > 250;
  }));
  if (!panelsFit) throw new Error("a phone panel is clipped or crushed");
  pass("390px dashboard has one readable column", JSON.stringify(phoneOverflow));
  await page.screenshot({ path: path.join(evidence, "revision2-phone-dashboard.png"), fullPage: true });

  await page.locator('[data-state="chooser"]').click();
  const choices = await page.locator("#app [data-business]").allTextContents();
  if (choices.length !== 2 || !choices.some(x => x.includes("NorthQuest")) || !choices.some(x => x.includes("Aura")) || choices.some(x => x.includes("CashDrive"))) {
    throw new Error(`unexpected assigned choices: ${choices.join(", ")}`);
  }
  pass("chooser shows assigned memberships only");

  await page.locator('[data-state="dashboard"]').click();
  await page.locator("#business-menu-button").click();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.id === "business-menu-button");
  const focused = await page.evaluate(() => document.activeElement?.id);
  if (focused !== "business-menu-button") throw new Error(`focus restored to ${focused}`);
  pass("business sheet closes with Escape and restores focus");

  await page.locator('[data-state="grace"]').click();
  await page.getByText("You can add it until 12:00 PM today.").waitFor();
  pass("noon grace is visible in plain language");

  await page.locator('[data-state="dashboard"]').click();
  await page.locator("#video-form button[type=submit]").click();
  const invalidFocus = await page.evaluate(() => ({ id: document.activeElement?.id, invalid: document.activeElement?.getAttribute("aria-invalid") }));
  if (invalidFocus.id !== "tiktok-link" || invalidFocus.invalid !== "true") throw new Error(`video validation focus: ${JSON.stringify(invalidFocus)}`);
  pass("video validation focuses the first useful field");

  await page.locator('[data-state="gate"]').click();
  await page.locator("#qualify-action").evaluate(button => button.click());
  await page.locator("#gate-form button[type=submit]").click();
  await page.getByText("We’ve sent this video for checking.").waitFor();
  await page.getByText(/does not unlock onboarding/i).waitFor();
  pass("10,240 views creates review pending, not onboarding");
  await page.screenshot({ path: path.join(evidence, "revision2-phone-review-pending.png"), fullPage: true });

  await page.locator('[data-state="management"]').click();
  await page.getByText("Self-reported views never approve onboarding by themselves.").waitFor();
  await page.screenshot({ path: path.join(evidence, "revision2-phone-management-review.png"), fullPage: true });
  await page.locator("#manager-approve").click();
  await page.getByText("Management verified your video.").waitFor();
  pass("management approval unlocks creator onboarding");
  await page.screenshot({ path: path.join(evidence, "revision2-phone-approved.png"), fullPage: true });

  await page.locator("#deactivate-action").evaluate(button => button.click());
  await page.getByText("Your Aura access still works.").waitFor();
  await page.getByRole("button", { name: "Choose another account" }).click();
  await page.getByRole("button", { name: /Aura/ }).click();
  await page.getByText("Good morning, Amara.").waitFor();
  pass("NorthQuest deactivation leaves Aura usable");

  await page.locator("#motion-action").evaluate(button => button.click());
  const reduced = await page.evaluate(() => document.body.classList.contains("reduce-motion"));
  if (!reduced) throw new Error("reduced motion class missing");
  pass("reduced motion review mode is applied");

  for (const viewport of [{ width: 768, height: 900 }, { width: 1280, height: 900 }]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow !== 0) throw new Error(`${viewport.width}px overflow: ${overflow}`);
    pass(`${viewport.width}px viewport has no horizontal overflow`);
  }

  if (consoleProblems.length) throw new Error(`console problems: ${consoleProblems.join(" | ")}`);
  pass("browser console has no warnings or errors");
  await browser.close();
  console.log(`\nAll ${results.length} runtime checks passed`);
}

main().catch(error => {
  console.error("FAIL ", error.stack || error.message);
  process.exit(1);
});
