const fs=require("node:fs"),http=require("node:http"),path=require("node:path"),assert=require("node:assert/strict"),{createRequire}=require("node:module");
const project=path.join(__dirname,".."),evidence=path.join(project,"evidence/flows/TDT_Prototype");
function helpers(page){
  const checks=[],check=(name,value=true)=>{assert.ok(value,name);checks.push({name,status:"PASS"});};
  return {checks,check,click:name=>page.getByRole("button",{name,exact:true}).click(),heading:name=>page.getByRole("heading",{name,exact:true}).waitFor({state:"visible"}),
    details:async()=>{const d=page.locator("details").filter({has:page.getByText("Viewport and conditions",{exact:true})});if(await d.getAttribute("open")===null)await page.getByText("Viewport and conditions",{exact:true}).click();}};
}
async function verifyWalkthrough(page,{viewport=async()=>{},capture=async()=>{}}={}){
  const {checks,check,click,heading,details}=helpers(page);
  await viewport({width:840,height:900});await click("Invitation");await click("Continue with Google");await page.getByRole("dialog").waitFor({state:"visible"});
  check("tour starts on the video form",await page.evaluate(()=>document.querySelector(".tour-focus")?.id==="track-panel"));
  await click("Next");check("second step highlights Today and Yesterday",await page.evaluate(()=>document.querySelector(".tour-focus")?.id==="day-panel"));
  await click("Next");await heading("Log your views.");
  check("third step opens the real weekly form and highlights its first day",await page.evaluate(()=>document.querySelector(".tour-focus")?.classList.contains("gate-day")));
  await details();await click("Desktop");
  check("Desktop control works during the tour",await page.evaluate(()=>document.querySelector("#app").getBoundingClientRect().width>700));
  await click("Phone");
  check("Phone control works below the old 980px breakpoint",await page.evaluate(()=>Math.round(document.querySelector("#app").getBoundingClientRect().width)===390));
  check("Phone mode is announced",await page.getByRole("button",{name:"Phone",exact:true}).getAttribute("aria-pressed")==="true");
  await viewport({width:390,height:844});
  check("highlight is not hidden by the guide",await page.evaluate(()=>{const target=document.querySelector(".tour-focus").getBoundingClientRect(),card=document.querySelector(".walkthrough-card").getBoundingClientRect();return target.top>=0&&target.bottom<=card.top+1;}));
  await capture("walkthrough-views");await click("Got it");await heading("Good morning, Amara.");
  await click("First visit");await click("Help");await click("Next");await click("Next");
  check("first-use tour has a no-reports spotlight and keeps guide inside phone",await page.evaluate(()=>{const app=document.querySelector("#app").getBoundingClientRect(),card=document.querySelector(".walkthrough-card").getBoundingClientRect();return Boolean(document.querySelector(".tour-focus"))&&card.left>=app.left-1&&card.right<=app.right+1;}));
  check("first-use guide does not invent posted videos",await page.locator("#gate-form [data-report]").count()===0);
  await click("Got it");await heading("Good morning, Amara.");return checks;
}
async function verifyWeekly(page,{capture=async()=>{}}={}){
  const {checks,check,click,heading}=helpers(page);
  await click("Dashboard");await click("Yesterday · 7 August");await click("Log your views");await heading("Log your views.");
  check("dashboard views button opens form, not yesterday logging",await page.locator("#gate-form").count()===1);
  await click("Weekly views due");
  check("all four dates since joining appear",await page.locator(".gate-day").count()===4);
  check("each date has four boxes",await page.locator(".gate-day").evaluateAll(days=>days.every(day=>day.querySelectorAll("input").length===4)));
  check("six logged links required; ten unposted slots disabled",await page.locator("#gate-form [data-report]").count()===6&&await page.locator("#gate-form input:disabled").count()===10);
  check("no Video 3",!(await page.locator("#app").innerText()).includes("Video 3"));
  await capture("weekly-views");await click("Save views");
  check("blank actual views focus the missing entry",await page.evaluate(()=>document.activeElement?.getAttribute("data-report")==="v4:tiktok"));
  const inputs=await page.locator("#gate-form [data-report]").all();
  for(const input of inputs)await input.fill((await input.getAttribute("data-report"))==="v7a:tiktok"?"10000":"0");
  await click("Save views");await heading("Good morning, Amara.");
  check("weekly high count returns to dashboard without a screenshot task",await page.getByRole("button",{name:"Add screenshot",exact:true}).count()===0);
  check("weekly counts alone create no manager review",/notifications: 0\./.test(await page.locator("#review-transition").innerText()));
  await click("Submit for review");await heading("Submit your video.");
  check("weekly qualification prefills the combined form",await page.locator("#milestone-views").getAttribute("value")==="10000"&&await page.locator("#proof-link").getAttribute("value")==="https://www.tiktok.com/@sample/video/1234567890123456782");
  await click("Send for review");check("combined form requires screenshot",await page.evaluate(()=>document.activeElement?.id==="proof-file"));
  await click("First visit");
  for(const id of ["900000000000000001","900000000000000002"]){
    await page.getByRole("textbox",{name:"TikTok link",exact:true}).fill("https://www.tiktok.com/@test/video/"+id);
    await click("Submit video");
    if(id.endsWith("002"))await heading("Both videos are logged.");else await page.getByText("Video 2 · 8 August.",{exact:true}).waitFor({state:"visible"});
  }
  check("two saved videos remove a third submission option",await page.getByRole("button",{name:"Submit video",exact:true}).count()===0);
  check("daily completion is clear",(await page.locator("#app").innerText()).includes("Both videos are logged."));
  await click("Yesterday logged");check("Yesterday hidden when logged",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("After noon");check("Yesterday hidden after noon",await page.getByRole("button",{name:"Yesterday · 7 August",exact:true}).count()===0);
  await click("Invitation");return checks;
}
async function verifyMilestone(page,{file=null,capture=async()=>{}}={}){
  const {checks,check,click,heading,details}=helpers(page);
  await click("Midweek dashboard");await click("Submit for review");await heading("Submit your video.");
  await click("Send for review");check("choose a logged video first",await page.evaluate(()=>document.activeElement.id==="milestone-video"));
  await page.getByRole("combobox",{name:"Video",exact:true}).selectOption("v6:instagram");
  await page.getByRole("textbox",{name:"Views",exact:true}).fill("9999");await click("Send for review");
  check("below-10000 claim refused",await page.evaluate(()=>document.activeElement.id==="milestone-views"));
  await page.getByRole("textbox",{name:"Views",exact:true}).fill("10240");await click("Send for review");
  check("screenshot required for review",await page.evaluate(()=>document.activeElement.id==="proof-file"));
  if(file){const chooser=page.waitForEvent("filechooser",{timeoutMs:10000});await page.locator("#proof-file").click();await (await chooser).setFiles([file]);await page.getByRole("img",{name:"Screenshot of the submitted video views",exact:true}).waitFor({state:"visible"});}
  else{await details();await click("Use demo screenshot");}
  check("image decoded and shown",await page.evaluate(()=>document.querySelector("#proof-preview").naturalWidth>0));
  await capture("submission");await details();await click("Offline: off");await click("Send for review");await heading("You’re offline.");
  await click("Offline: on");await click("Try again");await heading("Submit your video.");
  check("retry retains screenshot and count",await page.locator("#proof-preview").count()===1&&await page.locator("#milestone-views").getAttribute("value")==="10240");
  await click("Send for review");
  check("proof fields are locked while sending",await page.evaluate(()=>{const fields=[...document.querySelectorAll("#proof-form input,#proof-form select,#proof-form button")];return fields.length>0&&fields.every(f=>f.disabled);}));
  await heading("Your video is being checked.");await capture("pending");
  check("one complete submission creates one review",/notifications: 1\./.test(await page.locator("#review-transition").innerText()));
  await click("Back to dashboard");await heading("Good morning, Amara.");await click("Simulate week ending");await heading("Log your views.");
  check("early submission does not complete weekly reports",await page.locator("#gate-form [data-report]").evaluateAll(inputs=>inputs.every(input=>input.value==="")));
  for(const input of await page.locator("#gate-form [data-report]").all())await input.fill("0");
  await click("Save views");await heading("Good morning, Amara.");await click("Manager review");
  check("manager gets exact recorded post URL",await page.getByRole("link",{name:"Open Instagram video",exact:true}).getAttribute("href")==="https://www.instagram.com/reel/DEMO6/");
  check("manager sees submitted screenshot",await page.locator("#proof-preview").count()===1);
  check("reported date stays on actual submission date",(await page.locator(".fact").filter({has:page.getByText("Reported",{exact:true})}).innerText()).includes("6 August"));
  await capture("management");await click("Keep in trial");await heading("Submit your video.");
  check("correction uses the same combined form",await page.locator("#milestone-video,#milestone-views,#proof-file").count()===3);
  await click("Send for review");await heading("Your video is being checked.");await click("Manager review");await click("Approve onboarding");await heading("Onboarding is ready.");
  await click("Dashboard");await heading("Onboarding is ready.");
  check("approved dashboard has only Start onboarding",await page.locator("#app button").count()===1&&await page.getByRole("button",{name:"Start onboarding",exact:true}).count()===1);
  await capture("approved");await click("Invitation");return checks;
}
async function verifyScreens(page,{viewport=async()=>{},capture=async()=>{}}={}){
  const {checks,check,click,heading,details}=helpers(page);
  await click("Sign in");check("sign-in says personal Google account",(await page.locator("#app").innerText()).includes("Use your personal Google account."));
  await click("Deactivated");check("paused page has no icon or alternate action",await page.locator("#app .state-icon,#app button,#app a").count()===0);
  await click("Expired link");check("expired message is centred",await page.locator("#app .center-state").count()===1);await capture("expired");
  await click("Wrong Google account");await heading("This account does not have access.");
  await click("Error");await click("Try again");await heading("Good morning, Amara.");
  await details();await click("Reduced motion: off");check("reduced motion applied",await page.evaluate(()=>document.body.classList.contains("reduce-motion")));
  for(const width of [360,390,840,1280]){
    await viewport({width,height:900});
    for(const state of ["Dashboard","Weekly views due","10,000-view submission","Manager review","Expired link"]){
      await click(state);
      check(width+"px "+state+" fits phone preview",await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth&&document.querySelector("#app").scrollWidth<=document.querySelector("#app").clientWidth&&document.querySelector("#app").getBoundingClientRect().width<=390));
    }
  }
  await viewport({width:390,height:844});await click("Invitation");await click("Dashboard");await capture("dashboard");return checks;
}
module.exports={verifyWalkthrough,verifyWeekly,verifyMilestone,verifyScreens};
async function main(){
  const {chromium}=createRequire(path.join(project,"smithstem/package.json"))("playwright-core");
  const server=http.createServer((req,res)=>{if(req.url!=="/prototype"){res.writeHead(404);res.end();return;}res.writeHead(200,{"Content-Type":"text/html","Cache-Control":"no-store"});fs.createReadStream(path.join(project,"prototypes/unified-tdt-creator-ops.html")).pipe(res);});
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  let browser;
  try{
    browser=await chromium.launch({headless:true,channel:"chrome"});const page=await browser.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));await page.goto("http://127.0.0.1:"+server.address().port+"/prototype");
    const options={viewport:size=>page.setViewportSize(size),capture:name=>page.screenshot({path:path.join(evidence,"revision6-phone-"+name+".png"),fullPage:false}),file:path.join(evidence,"revision3-phone-dashboard.png")};
    const checks=[];for(const verify of [verifyWalkthrough,verifyWeekly,verifyMilestone,verifyScreens])checks.push(...await verify(page,options));
    assert.equal(errors.length,0,errors.join("\n"));fs.writeFileSync(path.join(evidence,"revision6-runtime-proof.json"),JSON.stringify({generatedAt:new Date().toISOString(),checks,errors},null,2));
    for(const check of checks)console.log("PASS ",check.name);console.log(checks.length+" browser checks passed");
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
if(require.main===module)main().catch(e=>{console.error("FAIL",e.stack);process.exitCode=1;});
