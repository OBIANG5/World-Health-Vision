/**
 * Build a strictly labeled, static SOURCING snapshot from canonical V2 SQL.
 * No news/country statistics are fetched or fabricated. The global source
 * catalog lives in build-preview.mjs; this builder only produces the local
 * directory and the already documented national release in V24/V26.
 *
 * Source of truth: V24 (2 Gabon organizations + RGPL), V25 (remove stale
 * hardcoded WB comparison) and V26 (6 national + BEAC for 6 CEMAC members).
 * Any future migration changing this schema must update the builder and
 * its count assertions before a public mobile preview can be published.
 */
import {readFileSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root=join(dirname(fileURLToPath(import.meta.url)),"..");
const dir=join(root,"services","catalog-service","src","main","resources","db","migration");
const dist=join(root,"frontend","web-v2","dist");
const sql24=readFileSync(join(dir,"V24__country_local_sources_and_documented_evidence.sql"),"utf8");
const sql25=readFileSync(join(dir,"V25__remove_stale_hardcoded_international_population_value.sql"),"utf8");
const sql26=readFileSync(join(dir,"V26__country_source_scope_connection_and_initial_institutional_registry.sql"),"utf8");
const rawCountries=JSON.parse(readFileSync(join(root,"services","catalog-service","src","main","resources","seed","worldbank-countries.json"),"utf8"));
const countries=rawCountries.filter(c=>c.region?.value?.trim()!=="Aggregates" && /^[A-Z]{3}$/.test(c.id));
if(countries.length!==217)throw Error("Preview country registry changed; re-audit snapshot before publishing");

function splitCells(tuple) {
  const cells=[];let cell="",quoted=false;
  for(let i=0;i<tuple.length;i++){
    const ch=tuple[i];
    if(ch==="'"){
      if(quoted && tuple[i+1]==="'"){cell+="''";i++;continue;}
      quoted=!quoted;
    }
    if(ch==="," && !quoted){cells.push(cell.trim());cell="";}
    else cell+=ch;
  }
  if(quoted)throw Error("Unbalanced SQL string literal");
  cells.push(cell.trim());
  return cells;
}
function fromSql(raw) {
  if(/^null$/i.test(raw))return null;
  const literal=[...raw.matchAll(/'(?:''|[^'])*'/g)]
    .map(x=>x[0].slice(1,-1).replace(/''/g,"'"));
  return literal.length?literal.join(""):raw.trim();
}
function insertValues(sql,table){
  const out=[];let match;
  const re=new RegExp("insert\\s+into\\s+catalog\\."+table+"\\s*\\(([^)]*)\\)\\s*values\\b","gi");
  while((match=re.exec(sql))!==null){
    const columns=match[1].split(",").map(x=>x.trim());
    let i=re.lastIndex;
    while(i<sql.length) {
      while(/\s/.test(sql[i]??""))i++;
      if(sql[i]!=="(")break;
      i++;
      let tuple="",quoted=false;
      while(i<sql.length){
        const char=sql[i++];
        if(char==="'"){
          if(quoted && sql[i]==="'"){tuple+="''";i++;continue;}
          quoted=!quoted;tuple+=char;continue;
        }
        if(char===")" && !quoted)break;
        tuple+=char;
      }
      if(quoted)throw Error("Unclosed SQL tuple in "+table);
      const cells=splitCells(tuple);
      if(cells.length!==columns.length){
        throw Error("SQL "+table+" has "+columns.length+" columns and "+cells.length+" values");
      }
      out.push(Object.fromEntries(columns.map((x,j)=>[x,fromSql(cells[j])])));
      while(/\s/.test(sql[i]??""))i++;
      if(sql[i]!==",")break;
      i++;
    }
  }
  return out;
}

const organizations=[
  ...insertValues(sql24,"country_local_source"),
  ...insertValues(sql26,"country_local_source"),
];
if(organizations.length!==8)throw Error("Unexpected national + local migration records; do not publish a stale snapshot");

// A shared CEMAC central bank is inserted through a SQL SELECT that expands
// member country codes, rather than by six independent institutional claims.
const shared=sql26.match(/insert\s+into\s+catalog\.country_local_source\s*\(([^)]*)\)\s*select\s+([\s\S]*?)\s+from\s*\(values\s+([\s\S]*?)\)\s+as\s+member\s*\(\s*iso3\s*\)/i);
if(!shared)throw Error("V26 shared regional central bank SQL no longer matches audit assumptions");
const columns=shared[1].split(",").map(x=>x.trim());
const values=splitCells(shared[2]);
if(columns.length!==values.length || fromSql(values[1])!=="BEAC_CEMAC" || values[0]!=="member.iso3")
  throw Error("Unexpected shared BEAC source schema");
const beac=Object.fromEntries(columns.map((name,i)=>[name,fromSql(values[i])]));
const memberCodes=[...shared[3].matchAll(/\(\s*'([A-Z]{3})'\s*\)/g)].map(x=>x[1]);
if(memberCodes.sort().join(",")!=="CAF,CMR,COG,GAB,GNQ,TCD")
  throw Error("Shared BEAC countries changed without review");
for(const iso3 of memberCodes)organizations.push({...beac,country_iso3:iso3});
if(organizations.length!==14 || new Set(organizations.map(x=>x.source_code)).size!==9)
  throw Error("Unexpected national source count; audit V24-V26 before release");

const intervalOverrides=[...sql26.matchAll(/update\s+catalog\.country_local_source\s+set\s+review_interval_days\s*=\s*(\d+)\s+where\s+country_iso3\s*=\s*'([A-Z]{3})'\s+and\s+source_code\s*=\s*'([^']+)'/gi)];
const intervals=new Map(intervalOverrides.map(x=>[x[2]+"/"+x[3],Number(x[1])]));
function reviewDue(value,days){
  const d=new Date(value+"T00:00:00Z");
  if(!Number.isFinite(d.getTime()))throw Error("Invalid source review date");
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
const byCountry=new Map();
const countryIds=new Set(countries.map(c=>c.id));
for(const source of organizations) {
  const iso3=source.country_iso3;
  if(!countryIds.has(iso3))throw Error("Nonexistent V2 country in local registry: "+iso3);
  const interval=Number(intervals.get(iso3+"/"+source.source_code)??source.review_interval_days??180);
  const lastReviewed=source.last_reviewed_on;
  const record={
    countryIso3:iso3,sourceCode:source.source_code,
    displayName:source.display_name,organizationName:source.organization_name,
    sourceRole:source.source_role,sourceType:source.source_type,
    homepageUrl:source.homepage_url,evidenceUrl:source.evidence_url,
    verificationState:source.verification_state,
    lastReviewedOn:lastReviewed,
    methodologyCaveat:source.methodology_caveat,
    reuseRightsNote:source.reuse_rights_note,
    geographicScopeKind:source.geographic_scope_kind??"NATIONAL",
    connectionState:source.connection_state??"CATALOG_ONLY",
    reviewIntervalDays:interval,
    reviewDueOn:reviewDue(lastReviewed,interval),
  };
  if(!byCountry.has(iso3))byCountry.set(iso3,[]);
  byCountry.get(iso3).push(record);
}
const order={NATIONAL_OFFICIAL:0,REGIONAL_OFFICIAL:1,LOCAL_RESEARCH:2,LOCAL_MEDIA:3,LOCAL_COMMUNITY:4};
for(const records of byCountry.values()){
  records.sort((a,b)=>(order[a.sourceType]??9)-(order[b.sourceType]??9) || a.displayName.localeCompare(b.displayName));
}
const documented=insertValues(sql24,"country_documented_release");
if(documented.length!==1 || documented[0].release_code!=="GAB-RGPL-2026-RESIDENTS")
  throw Error("Unexpected RGPL migration; do not invent local data");
const changedNote=sql25.match(/set\s+international_comparison_note\s*=\s*('(?:''|[^'])*')/i);
if(!changedNote)throw Error("V25 dynamic comparison caveat missing");
const doc=documented[0];
const release={
  releaseCode:doc.release_code,
  countryIso3:doc.country_iso3,
  sourceCode:doc.source_code,
  indicatorCode:doc.indicator_code,
  referenceYear:Number(doc.reference_year),
  valueNumeric:Number(doc.value_numeric),
  unitLabel:doc.unit_label,
  populationScope:doc.population_scope,
  methodKind:doc.method_kind,
  publicationStatus:doc.publication_status,
  releaseDate:doc.release_date,
  title:doc.title,
  primaryEvidenceUrl:doc.primary_evidence_url,
  corroborationUrl:doc.corroboration_url,
  methodologyCaveat:doc.methodology_caveat,
  internationalComparisonNote:fromSql(changedNote[1]),
  verificationStatus:doc.verification_status,
  reviewedOn:doc.reviewed_on,
};
if(release.valueNumeric!==3518621 || release.referenceYear!==2026 ||
   release.verificationStatus!=="DOCUMENTED_NOT_INGESTED")
  throw Error("RGPL primary documented evidence changed and needs manual review");

const contexts={};
const coverageItems=[];
const now=new Date().toISOString().slice(0,10);
for(const country of countries){
  const iso3=country.id;
  const sources=byCountry.get(iso3)??[];
  const releases=iso3==="GAB"?[release]:[];
  contexts[iso3]={
    countryIso3:iso3,
    localSourceCount:sources.length,localSources:sources,
    documentedReleaseCount:releases.length,documentedReleases:releases,
  };
  const count=kind=>sources.filter(s=>s.sourceType===kind).length;
  const nationalOfficial=count("NATIONAL_OFFICIAL"),
    regional=count("REGIONAL_OFFICIAL"),media=count("LOCAL_MEDIA"),
    research=count("LOCAL_RESEARCH")+count("LOCAL_COMMUNITY");
  coverageItems.push({
    countryIso3:iso3,displayName:country.name,regionCode:country.region?.id??null,
    listedSourceCount:sources.length,
    nationalOfficialCount:nationalOfficial,
    regionalOfficialCount:regional,
    localMediaCount:media,localResearchCount:research,
    connectedSourceCount:sources.filter(s=>s.connectionState==="INGESTION_VERIFIED").length,
    overdueReviewCount:sources.filter(s=>s.reviewDueOn<now).length,
    lastReviewedOn:sources.reduce((last,s)=>!last||s.lastReviewedOn>last?s.lastReviewedOn:last,null),
    researchStatus:nationalOfficial+media+research>0
      ?"PARTIAL_CATALOGUED"
      :regional>0?"REGIONAL_REFERENCE_ONLY":"NOT_RESEARCHED",
  });
}
coverageItems.sort((a,b)=>a.displayName.localeCompare(b.displayName));
const overview={
  totalCountryCount:coverageItems.length,
  countriesWithCountrySpecificSources:coverageItems.filter(x=>x.researchStatus==="PARTIAL_CATALOGUED").length,
  countriesNotResearchedLocally:coverageItems.filter(x=>x.researchStatus!=="PARTIAL_CATALOGUED").length,
  countriesWithRegionalReferencesOnly:coverageItems.filter(x=>x.researchStatus==="REGIONAL_REFERENCE_ONLY").length,
  cataloguedSourceLinks:organizations.length,
  verifiedIngestionLinks:coverageItems.reduce((a,x)=>a+x.connectedSourceCount,0),
  overdueReviewLinks:coverageItems.reduce((a,x)=>a+x.overdueReviewCount,0),
  matchingCountryCount:coverageItems.length,offset:0,limit:500,returnedCount:coverageItems.length,
  coverageInterpretation:"STATIC_PREVIEW_OF_VERSIONED_V24_V26_SQL_NOT_LIVE_DATABASE",
  items:coverageItems,
};
if(overview.countriesWithCountrySpecificSources!==4 ||
   overview.countriesWithRegionalReferencesOnly!==5 ||
   overview.verifiedIngestionLinks!==0 ||
   contexts.GAB.localSourceCount!==3 ||
   contexts.FRA.localSourceCount!==2 ||
   contexts.CMR.localSourceCount!==1)
  throw Error("Static source research snapshot changed: manual audit required");

writeFileSync(join(dist,"preview-local-catalog.js"),
  "window.__WHV_PREVIEW_LOCAL_CONTEXT__="+JSON.stringify(contexts)+";\n"+
  "window.__WHV_PREVIEW_COUNTRY_COVERAGE__="+JSON.stringify(overview)+";\n");
const htmlPath=join(dist,"index.html");
const html=readFileSync(htmlPath,"utf8");
if(!html.includes('<script src="./preview-bootstrap.js"></script>'))
  throw Error("Cannot inject national sourcing snapshot before preview bootstrap");
writeFileSync(htmlPath,html.replace(
  '<script src="./preview-bootstrap.js"></script>',
  '<script src="./preview-local-catalog.js"></script>\n<script src="./preview-bootstrap.js"></script>'
));
console.log("Static sourcing snapshot from V24–V26: "+
  organizations.length+" country-source links, "+
  new Set(organizations.map(x=>x.source_code)).size+" distinct institutions, "+
  overview.countriesWithCountrySpecificSources+" partial countries, "+
  overview.countriesWithRegionalReferencesOnly+" regional-only countries, "+
  "one documented local census (not ingested).");
