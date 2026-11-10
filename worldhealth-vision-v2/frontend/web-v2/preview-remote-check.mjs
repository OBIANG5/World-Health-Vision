import {chromium,webkit} from "playwright";

const commit="98fb74b5b556f2a6bd259a3caf79a713229f2c8c";
const base="https://rawcdn.githack.com/OBIANG5/World-Health-Vision/"+commit+"/";
const url=base+"index.html";
for(const [engineName,engine] of [["Chromium",chromium],["WebKit",webkit]]) {
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.addCookies([{name:"__Http-phish",value:"1",domain:"rawcdn.githack.com",path:"/",httpOnly:true,secure:true}]);
 const page=await context.newPage();
 const errors=[],badResponses=[],requestsFailed=[];
 page.on("pageerror",e=>errors.push(String(e)));
 page.on("response",r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url().slice(0,160)});});
 page.on("requestfailed",r=>requestsFailed.push({url:r.url().slice(0,160),failure:r.failure()}));
 try {
  const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:35000});
  await page.waitForTimeout(3000);
  const title=await page.title();
  const body=(await page.locator("body").innerText().catch(()=>"")).slice(0,900);
  const brand=await page.locator(".whv-brand").count();
  const overview=await page.locator(".whv-mobile-overview").count();
  console.log(JSON.stringify({engineName,url,http:response?.status(),title,brand,overview,body,errors:errors.slice(0,6),badResponses:badResponses.slice(0,15),requestsFailed:requestsFailed.slice(0,15)}));
  await page.screenshot({path:"remote-"+engineName+".png",fullPage:false});
  if(!brand||!overview||errors.length||badResponses.some(r=>r.url.includes("/assets/"))) process.exitCode=1;
 } catch(error) {console.log(JSON.stringify({engineName,error:String(error),badResponses,requestsFailed,errors}));process.exitCode=1;}
 finally {await browser.close();}
}
