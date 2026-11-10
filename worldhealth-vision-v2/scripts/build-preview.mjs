import {readFileSync,writeFileSync,copyFileSync,readdirSync} from "node:fs";
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

// Preview source metadata must come from the EXACT V2 migrations rather than
// a one-source placeholder. Registered != ingested: no economic values are faked.
function splitSqlCells(tuple) {
  const cells = [];
  let current = "", quoted = false;
  for (let i = 0; i < tuple.length; i++) {
    const ch = tuple[i];
    if (ch === "'") {
      if (quoted && tuple[i + 1] === "'") { current += "''"; i++; continue; }
      quoted = !quoted;
    }
    if (ch === "," && !quoted) { cells.push(current.trim()); current = ""; }
    else current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function decodeSqlValue(value) {
  if (/^null$/i.test(value)) return null;
  // PostgreSQL accepts adjacent string literals separated by a newline.
  // Double apostrophes inside a literal are a single apostrophe.
  const literals = [...value.matchAll(/'(?:''|[^'])*'/g)]
    .map(match => match[0].slice(1, -1).replace(/''/g, "'"));
  return literals.length ? literals.join("") : value.trim();
}

function extractSourcesFromMigration(sql) {
  const rows = [];
  const insert = /insert\s+into\s+catalog\.source\s*\(([^)]*)\)\s*values\b/gi;
  let match;
  while ((match = insert.exec(sql)) !== null) {
    const columns = match[1].split(",").map(value => value.trim());
    let i = insert.lastIndex;
    while (i < sql.length) {
      while (/\s/.test(sql[i] || "")) i++;
      if (sql[i] !== "(") break;
      i++;
      let quoted = false, tuple = "";
      while (i < sql.length) {
        const char = sql[i++];
        if (char === "'") {
          if (quoted && sql[i] === "'") { tuple += "''"; i++; continue; }
          quoted = !quoted;
          tuple += char;
          continue;
        }
        if (char === ")" && !quoted) break;
        tuple += char;
      }
      const cells = splitSqlCells(tuple);
      if (cells.length !== columns.length) {
        throw Error("Invalid V2 source migration: " + columns.length + " columns / " + cells.length + " values");
      }
      rows.push(Object.fromEntries(columns.map((name,index) => [name,decodeSqlValue(cells[index])])));
      while (/\s/.test(sql[i] || "")) i++;
      if (sql[i] !== ",") break;
      i++;
    }
  }
  return rows;
}

const sourceMigrationsDir = join(root,"services","catalog-service","src","main","resources","db","migration");
const sqlFiles = readdirSync(sourceMigrationsDir)
  .filter(file => /^V\d+__.*\.sql$/.test(file))
  .sort((a,b) => Number(a.match(/^V(\d+)/)[1]) - Number(b.match(/^V(\d+)/)[1]));
const registry = new Map();
for (const file of sqlFiles) {
  const sql = readFileSync(join(sourceMigrationsDir,file),"utf8");
  for (const source of extractSourcesFromMigration(sql)) {
    if (!source.code || !source.display_name) throw Error("Malformed source record in " + file);
    registry.set(source.code,{
      code:source.code,
      displayName:source.display_name,
      type:source.type,
      organizationName:source.organization_name,
      homepageUrl:source.homepage_url,
      documentationUrl:source.documentation_url,
      accessModel:source.access_model,
      licenseSummary:source.license_summary,
      geographicScope:source.geographic_scope,
      temporalGranularity:source.temporal_granularity,
      updateCadence:source.update_cadence,
      biasNotes:source.bias_notes,
      qualityNotes:source.quality_notes,
      enabled:true
    });
  }
}
const registeredSources = [...registry.values()]
  .sort((a,b) => a.displayName.localeCompare(b.displayName));
if (registeredSources.length < 20) {
  throw Error("The original V2 source catalogue has not been fully restored (" + registeredSources.length + ")");
}
writeFileSync(join(dist,"preview-sources.js"),
  "window.__WHV_PREVIEW_SOURCES__=" + JSON.stringify(registeredSources) + ";");

copyFileSync(join(root,"scripts","preview-bootstrap.js"),
             join(dist,"preview-bootstrap.js"));
const html=join(dist,"index.html");
let document=readFileSync(html,"utf8");
document=document.replace(/<head>/i,
  '<head>\n<meta name="robots" content="noindex,nofollow">\n'+
  '<script src="./preview-countries.js"></script>\n'+
  '<script src="./preview-sources.js"></script>\n'+
  '<script src="./preview-bootstrap.js"></script>\n');
if(!document.includes("./preview-bootstrap.js") || !document.includes("./preview-sources.js"))
  throw Error("Failed to inject V2 source catalogue and preview bootstrap");
writeFileSync(html,document);
console.log("Built original V2 interface with "+countries.length+" country metadata entries and "+registeredSources.length+" real V2 registered sources.");
