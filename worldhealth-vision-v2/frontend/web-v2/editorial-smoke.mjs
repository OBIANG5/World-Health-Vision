import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdirSync} from "node:fs";

const base="http://127.0.0.1:5192/";
const proc=spawn("python3",["-m","http.server","5192","--bind","127.0.0.1","--directory","dist"],{stdio:"ignore"});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sleep=t=>new Promise(r=>setTimeout(r,t));
mkdirSync("editorial-artifacts",{recursive:true});
try{
 let ready=false;
 for(let attempt=0;attempt<50;attempt++){
  try{if((await fetch(base+"countries.geojson")).ok){ready=true;break}}catch{}
  await sleep(250);
 }
 assert(ready,"Static V2 server not ready");
 for(const screen of [
  {name:"iphone",width:390,height:844,isMobile:true,hasTouch:true},
  {name:"tablet",width:820,height:1100,isMobile:false,hasTouch:false},
  {name:"desktop",width:1440,height:900,isMobile:false,hasTouch:false}
 ]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},isMobile:screen.isMobile,hasTouch:screen.hasTouch,deviceScaleFactor:1});
  const faults=[];
  page.on("pageerror",e=>faults.push("JS "+e.message));
  await page.goto(base,{waitUntil:"domcontentloaded"});
  await page.locator("canvas.whv-globe-canvas").waitFor({state:"visible",timeout:20000});
  await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),null,{timeout:20000});
  const bg=await page.locator(".whv-page").evaluate(el=>getComputedStyle(el).backgroundColor);
  assert(!bg.includes("6, 21, 34"),screen.name+" still uses the original navy page");
  const story=page.locator(".whv-desktop-story");
  if(screen.width>720)assert(await story.isVisible(),screen.name+" desktop editorial content missing");
  else assert(!(await story.isVisible()),"Mobile must use its own compact landing");
  const nav=page.locator(".whv-nav");
  assert(await nav.isVisible(),"Navigation hidden");
  await page.screenshot({path:"editorial-artifacts/"+screen.name+"-home.png",fullPage:true});
  await page.getByRole("button",{name:/Pays & régions|Countries & regions/}).click();
  const explore=page.locator('.whv-domain-menu[data-domain="explore"]');
  await explore.waitFor({state:"visible",timeout:15000});
  assert(await explore.getByText(/Explorer les pays|Explore countries/).count()>=1,"Country exploration unavailable");
  await explore.getByRole("button",{name:/Régions du monde|World regions/}).click();
  await page.locator(".region-drawer.open").waitFor({state:"visible",timeout:20000});
  await page.locator(".region-drawer.open").getByRole("button",{name:/fermer|close/i}).first().click().catch(async()=>{
    await page.keyboard.press("Escape");
  });
  await page.getByRole("button",{name:/Économie & marchés|Economy & markets/}).click();
  const finance=page.locator('.whv-domain-menu[data-domain="markets"]');
  await finance.waitFor({state:"visible"});
  await finance.getByRole("button",{name:/Devises & taux de change|Currencies & FX/}).click();
  await page.locator(".cur-panel").waitFor({state:"visible",timeout:20000});
  await page.locator(".cur-panel button").last().focus();
  await page.getByRole("button",{name:/Voyager & vivre|Travel & living/}).click();
  const travel=page.locator('.whv-domain-menu[data-domain="travel"]');
  await travel.waitFor({state:"visible"});
  assert(await travel.getByRole("button",{name:/Score destination|Destination score/}).count()===1,"Destination score missing");
  await page.getByRole("button",{name:/Sécurité|Safety/}).click();
  const safety=page.locator('.whv-domain-menu[data-domain="safety"]');
  await safety.waitFor({state:"visible"});
  assert((await safety.innerText()).includes("Alertes") || (await safety.innerText()).includes("Alerts"),"Safety section lacks alert entry");
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:/Tous les outils|All tools/}).click();
  await page.locator('.whv-domain-menu[data-domain="all"]').waitFor({state:"visible"});
  const menuNames=await page.locator(".whv-domain-group h3").allTextContents();
  assert(menuNames.length===4,"Thematic menu should expose four domains, got "+menuNames.length);
  await page.screenshot({path:"editorial-artifacts/"+screen.name+"-navigation.png",fullPage:true});
  await page.keyboard.press("Escape");
  await page.getByRole("button",{name:/Sources/}).click();
  await page.locator(".whv-modal").waitFor({state:"visible",timeout:20000});
  const backdrop=await page.locator(".whv-modal").evaluate(el=>getComputedStyle(el).backgroundColor);
  assert(!backdrop.includes("6, 20"),"Sources modal is still dark");
  await page.screenshot({path:"editorial-artifacts/"+screen.name+"-sources.png",fullPage:true});
  const horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
  assert(!horizontalOverflow,screen.name+" horizontal viewport overflow");
  assert.deepEqual(faults,[],screen.name+" browser errors");
  console.log("PASS "+screen.name+" editorial design, 4 menus, real country/region/FX tools, sources and layout");
  await page.close();
 }
}finally{await browser.close();proc.kill("SIGTERM")}
