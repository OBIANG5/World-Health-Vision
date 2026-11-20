#!/usr/bin/env node
/**
 * FILM-2B NASA asset ingestion — original JPEGs fetched only from NASA-owned
 * image CDN. Files NEVER enter Git history. No downloaded audio/video.
 * This is provenance and technical validation, not a public release license.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";

const here=path.dirname(fileURLToPath(import.meta.url));
const source=JSON.parse(fs.readFileSync(path.join(here,"sources.json"),"utf8"));
const root=process.argv[2]&&path.resolve(process.argv[2]);
if(!root||!path.isAbsolute(root)||!root.startsWith("/tmp/"))
  throw Error("Specify /tmp/... as a dedicated non-public asset output directory.");
fs.mkdirSync(root,{recursive:true});
const MEDIA_HOST="images-assets.nasa.gov";
const maxBytes=45*1024*1024;
async function fetchOriginal(entry){
  const input=new URL(entry.original_url);
  if(input.protocol!=="https:"||input.hostname!==MEDIA_HOST||input.search||
     !/^[a-z0-9_-]+$/.test(entry.id)||
     !/^[a-z0-9-]+\.jpg$/.test(entry.file)||
     !input.pathname.endsWith("/"+entry.id+"~orig.jpg"))
    throw Error("Source is not the approved NASA original for "+entry.id);
  const response=await fetch(entry.original_url,{signal:AbortSignal.timeout(45000),redirect:"follow",
    headers:{"User-Agent":"WorldVision-NASA-SourcedEditorialPreview/1.0 (nonpublication)"}});
  const finalUrl=new URL(response.url);
  if(finalUrl.hostname!==MEDIA_HOST||finalUrl.protocol!=="https:")
    throw Error("Unexpected redirect domain for "+entry.id+": "+finalUrl.hostname);
  if(!response.ok)throw Error("NASA original "+entry.id+" returned HTTP "+response.status);
  const contentType=(response.headers.get("content-type")||"").toLowerCase();
  if(!contentType.includes("image/jpeg")&&!contentType.includes("image/jpg")&&
     !contentType.includes("application/octet-stream"))
    throw Error("NASA returned unexpected MIME "+contentType+" for "+entry.id);
  const declared=Number(response.headers.get("content-length")||0);
  if(declared>maxBytes)throw Error("Original image exceeds 45MB cap: "+entry.id);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length<25000||bytes.length>maxBytes||bytes[0]!==0xff||bytes[1]!==0xd8)
    throw Error("Missing/invalid JPEG original: "+entry.id+" bytes="+bytes.length);
  const target=path.join(root,entry.file);
  fs.writeFileSync(target,bytes,{flag:"w",mode:0o600});
  const [width,height]=execFileSync("ffprobe",[
    "-v","error","-select_streams","v:0","-show_entries","stream=width,height",
    "-of","csv=s=x:p=0",target],{encoding:"utf8",timeout:18000}).trim().split("x").map(Number);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<2300||height<1080)
    throw Error("NASA asset resolution too low for cinematic review "+entry.id+" "+width+"x"+height);
  return {id:entry.id,file:entry.file,sha256:createHash("sha256").update(bytes).digest("hex"),
    original_url:entry.original_url,source_page:entry.source_page,credit:entry.source_credit,
    media_type:entry.media_type,is_impact_observation:false,
    width,height,bytes:bytes.length,verified_host:finalUrl.hostname,
    rights_review:entry.rights_review,public_release_allowed:false};
}
const ledger=[];
try{
  for(const entry of source.assets){
    const info=await fetchOriginal(entry);ledger.push(info);
    process.stdout.write("[NASA verified download] "+info.id+" "+info.width+"x"+info.height+" SHA "+info.sha256+"\n");
  }
  const result={schema_version:"worldvision-pilot-source-ledger-v1",
    generated_at:new Date().toISOString(),project:"wv-artemis2-impact-report-2026-11-20-v01",
    internal_review_only:true,video_contains_observed_flashes:false,
    assets:ledger,publication_blockers:[
      "No approved final French narration / word-aligned SRT",
      "Rights review for each source and credit not signed off",
      "No approved mastering/loudness and smartphone QA",
      "No explicit final editorial publication approval"
    ]};
  const output=path.join(root,"nasa-asset-ledger.json");
  fs.writeFileSync(output,JSON.stringify(result,null,2)+"\n");
  process.stdout.write("NASA asset ledger written outside Git: "+output+"\n");
}catch(e){
  for(const entry of source.assets)fs.rmSync(path.join(root,entry.file),{force:true});
  throw e;
}
