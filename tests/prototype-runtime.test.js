const fs=require("node:fs"),http=require("node:http"),path=require("node:path"),assert=require("node:assert/strict"),{createRequire}=require("node:module");
const project=path.join(__dirname,".."),evidence=path.join(project,"evidence/flows/TDT_Prototype");
async function verifyPrototype(page,{viewport=async()=>{},capture=async()=>{},file=null}={}){
  const results=[];
  const check=(name,condition=true)=>{assert.ok(condition,name);results.push({name,status:"PASS"});};
  const click=name=>page.getByRole("button",{name,exact:true}).click();
  const waitHeading=name=>page.getByRole("heading",{name,exact:true}).waitFor({state:"visible"});
  const text=()=>page.locator("#app").innerText();
  const openDetails=async name=>{const details=page.locator("details").filter({has:page.getByText(name,{exact:true})});if(await details.getAttribute("open")===null)await page.getByText(name,{exact:true}).click();};
  await viewport({width:390,height:844});
  await click("Invitation");await waitHeading("Welcome to your NorthQuest Creator dashboard.");
  check("welcome: exact copy, TDT only, no personal account explanation",!(await text()).includes("Use your personal"));
  check("trial: no chooser or switcher",await page.locator("#app button").count()===1);
  await capture("welcome");
  await click("Continue with Google");await page.getByRole("dialog").waitFor({state:"visible"});
  await page.getByRole("button",{name:"Next",exact:true}).press("Tab");
  check("mandatory walkthrough retains keyboard focus",await page.evaluate(()=>document.activeElement?.id==="walk-next"));
  await click("Next");await click("Next");await click("Got it");await waitHeading("Good morning, Amara.");
  check("Google mock enters the single assigned dashboard",!(await text()).includes("Choose"));
  check("Yesterday visible when missed before noon",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===1);
  await capture("dashboard");
  await click("Yesterday logged");
  check("Yesterday absent when already logged",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("After noon");
  check("Yesterday absent at noon",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("First visit");
  check("first use is the logging form without a forced empty screen",await page.getByRole("button",{name:"Submit video",exact:true}).count()===1);
  check("first-day join cannot backdate before joining",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("Dashboard");await click("Submit video");
  check("empty video submission focuses useful input",await page.evaluate(()=>document.activeElement?.id==="tiktok-link"));
  await click("Yesterday · 7 August");
  const url="https://www.tiktok.com/@test/video/900000000000000001";
  await page.getByRole("textbox",{name:"TikTok link",exact:true}).fill(url);
  await click("Submit video");await waitHeading("Log your views.");
  check("yesterday submission adds only its posted platform",await page.locator("#gate-form input").count()===4);
  check("unposted day and missing Instagram pair are absent",!(await text()).includes("5 August"));
  await page.getByRole("textbox",{name:"TikTok Video 1",exact:true}).last().fill("0");
  await click("Save views");await waitHeading("Good morning, Amara.");
  check("zero views accepted, reports reopen Today",await page.getByRole("button",{name:"Submit video",exact:true}).count()===1);
  check("Yesterday hides after successful missed-day save",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("Log your views");
  check("sparse gate contains six actual links, not a sixteen-field grid",await page.locator("#gate-form input").count()===6);
  check("no threshold lecture or paused-form banner",!(/10,000|added together|form is paused/.test(await text())));
  await click("Save views");
  check("only an actual posted video requires a missing view value",await page.evaluate(()=>document.activeElement?.getAttribute("data-report")==="v4:tiktok"));
  await capture("views");
  await openDetails("Viewport and conditions");await click("Enter 10,240 views");await click("Save views");await waitHeading("Add your screenshot.");
  check("individual qualification asks for screenshot, not onboarding",!(await text()).includes("Onboarding is ready"));
  await click("Send for review");
  check("screenshot is required",await page.evaluate(()=>document.activeElement?.id==="proof-file"));
  if(file){
    const choose=page.waitForEvent("filechooser",{timeoutMs:10000});
    await page.getByRole("button",{name:"Screenshot",exact:true}).click();
    const chooser=await choose;await chooser.setFiles([file]);
    await page.getByRole("img",{name:"Screenshot of the submitted video views",exact:true}).waitFor({state:"visible"});
    check("chosen local raster file decodes and previews",await page.evaluate(()=>document.querySelector("#proof-preview").naturalWidth>0));
  }else{await click("Use demo screenshot");}
  await page.getByRole("textbox",{name:"Video link",exact:true}).fill(url);
  await capture("screenshot");
  await click("Offline: off");await click("Send for review");await waitHeading("You’re offline.");
  await click("Offline: on");await click("Try again");await waitHeading("Add your screenshot.");
  check("offline retry preserves screenshot and link",await page.getByRole("img",{name:"Screenshot of the submitted video views",exact:true}).count()===1);
  await click("Send for review");await waitHeading("Your video is being checked.");
  check("one review notification after retry",/notifications: 1\./.test(await page.locator("#review-transition").innerText()));
  await click("Manager review");await waitHeading("Check Amara’s video.");
  check("manager opens the exact submitted URL",await page.getByRole("link",{name:"Open TikTok video",exact:true}).getAttribute("href")===url);
  check("manager sees the submitted screenshot",await page.getByRole("img",{name:"Screenshot of the submitted video views",exact:true}).count()===1);
  await capture("management");
  await click("Keep in trial");await waitHeading("Add your screenshot.");
  check("keep-in-trial offers proof correction",/check your screenshot/.test(await text()));
  await click("Send for review");await waitHeading("Your video is being checked.");await click("Manager review");await click("Approve onboarding");await waitHeading("Onboarding is ready.");
  check("only management approval unlocks onboarding-ready");
  await click("Start onboarding");
  check("actual onboarding remains explicitly out of scope",/Actual onboarding is the next/.test(await text()));
  await capture("approved");
  await click("Manager review");
  check("trial pass is TDT-wide without automatic additional memberships",/Trial passed across TDT/.test(await text()));
  await click("Deactivated");await waitHeading("Your access has been paused.");
  check("paused state contains no other-business or sign-out escape",await page.locator("#app button,#app a").count()===0);
  await capture("paused");
  for(const [state,heading] of [["Expired link","This link has expired."],["Wrong Google account","This account does not have access."],["Error","Something went wrong."],["Sign in","Welcome back."]]){
    await click(state);await waitHeading(heading);check(state+" is reachable");
  }
  await click("Dashboard");await click("Reduced motion: off");
  check("reduced-motion setting is applied",await page.evaluate(()=>document.body.classList.contains("reduce-motion")));
  for(const width of [360,390,768,1280]){
    await viewport({width,height:900});
    for(const state of ["Dashboard","Log your views","Add screenshot","Manager review","Deactivated"]){
      await click(state);
      check(width+"px "+state+" no horizontal overflow",await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.querySelector("#app").scrollWidth<=document.querySelector("#app").clientWidth));
    }
  }
  await click("Invitation");
  return results;
}
module.exports={verifyPrototype};
async function main(){
  const {chromium}=createRequire(path.join(project,"smithstem/package.json"))("playwright-core");
  const server=http.createServer((req,res)=>{if(req.url!=="/prototype"){res.writeHead(404);res.end();return;}res.writeHead(200,{"Content-Type":"text/html","Cache-Control":"no-store"});fs.createReadStream(path.join(project,"prototypes/unified-tdt-creator-ops.html")).pipe(res);});
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  let browser;
  try{
    browser=await chromium.launch({headless:true,channel:"chrome"});
    const page=await browser.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto("http://127.0.0.1:"+server.address().port+"/prototype");
    const checks=await verifyPrototype(page,{viewport:s=>page.setViewportSize(s),file:path.join(evidence,"revision3-phone-dashboard.png"),capture:name=>page.screenshot({path:path.join(evidence,"revision4-phone-"+name+".png"),fullPage:true})});
    assert.equal(errors.length,0,errors.join("\n"));
    fs.writeFileSync(path.join(evidence,"revision4-runtime-proof.json"),JSON.stringify({generatedAt:new Date().toISOString(),checks,errors},null,2));
    for(const check of checks)console.log("PASS ",check.name);
    console.log(checks.length+" browser checks passed");
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)main().catch(e=>{console.error("FAIL",e.stack);process.exitCode=1;});
