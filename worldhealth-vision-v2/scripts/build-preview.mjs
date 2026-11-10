import {readFileSync,writeFileSync,copyFileSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const dist=join(root,"frontend","web-v2","dist");
const source=join(root,"services","catalog-service","src","main","resources","seed","worldbank-countries.json");
const records=JSON.parse(readFileSync(source,"utf8").replace(/^\uFEFF/,""));
const countries=records
  .filter(r=>r.region?.value?.trim()!=="Aggregates" && /^[A-Z]{3}$/.test(r.id))
  .map(r=>({
    iso3:r.id,iso2:r.iso2Code||null,displayName:r.name,
    regionCode:r.region?.id||null,regionName:r.region?.value?.trim()||null,
    subregionCode:r.adminregion?.id||null,subregionName:r.adminregion?.value?.trim()||null,
    capitalCity:r.capitalCity||null,
    currencyCode:null,currencyName:null,currencySymbol:null,
    aggregate:false,active:true,
    worldBankIncomeGroup:r.incomeLevel?.value||null,lendingType:r.lendingType?.value||null,
    latitude:Number.isFinite(Number(r.latitude))?Number(r.latitude):null,
    longitude:Number.isFinite(Number(r.longitude))?Number(r.longitude):null,
    sovereignState:null,currencyMinorUnit:null,dataQualityTier:0
  })).sort((a,b)=>a.displayName.localeCompare(b.displayName));
if(countries.length<200)throw Error("Source country list incomplete");
writeFileSync(join(dist,"preview-countries.js"),
  "window.__WHV_PREVIEW_COUNTRIES__="+JSON.stringify(countries)+";");
copyFileSync(join(root,"scripts","preview-bootstrap.js"),
             join(dist,"preview-bootstrap.js"));
const html=join(dist,"index.html");
let document=readFileSync(html,"utf8");
document=document.replace(/<head>/i,
  '<head>\n<meta name="robots" content="noindex,nofollow">\n'+
  '<script src="./preview-countries.js"></script>\n'+
  '<script src="./preview-bootstrap.js"></script>\n');
if(!document.includes("./preview-bootstrap.js"))throw Error("Failed to inject preview bootstrap");
writeFileSync(html,document);
console.log("Built original V2 interface with "+countries.length+" country metadata entries.");
