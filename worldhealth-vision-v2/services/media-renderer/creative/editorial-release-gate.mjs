/**
 * WORLD-VISION EDITORIAL RELEASE GATE (Stage A: offline dossier integrity).
 *
 * This checks the evidence PACKET that accompanies a finished Remotion master:
 * byte-level provenance, rights/permission attachments, numeric claims mapped
 * to citations, editorial review and a supplied voice/transcript attestation.
 * It does NOT determine truth, authenticate signatures or grant legal rights.
 * No external requests; all evidence is local, hash checked, and fail closed.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";

export const RELEASE_FORMAT="worldvision-editorial-release-v1";
const RE_HEX=/^[0-9a-f]{64}$/i;
const RE_DATE=/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const RE_ID=/^[a-z0-9][a-z0-9_-]{2,79}$/;
const RE_LANG=/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;
const NON_PRODUCTION=/\b(syntheti(?:c|que)|ficti(?:f|ve)|simulation|fixture|non.?journalistique|not.?news|not.?real|demo|exemple.?technique)\b/i;
const isText=(x,max=250)=>typeof x==="string"&&x.trim().length>0&&x.length<=max;
const dateOK=x=>typeof x==="string"&&RE_DATE.test(x)&&
  Number.isFinite(Date.parse(x+"T12:00:00Z"))&&
  new Date(x+"T12:00:00Z").toISOString().slice(0,10)===x;
const unique=values=>new Set(values).size===values.length;
const shaFile=f=>createHash("sha256").update(fs.readFileSync(f)).digest("hex");

/** No path traversal, absolute path, directories or escaping symlink allowed. */
export function resolveEvidenceFile(root,relative){
  if(typeof relative!=="string"||relative.length>320||!relative.trim()||
    path.isAbsolute(relative)||relative.includes("\\")||relative.includes("\0")||
    relative.split("/").some(x=>x===""||x==="."||x===".."))
    throw Error("Unsafe evidence path");
  const canonical=fs.realpathSync(root);
  const file=fs.realpathSync(path.join(canonical,relative));
  if(!file.startsWith(canonical+path.sep)||!fs.statSync(file).isFile())
    throw Error("Evidence path is not a regular file under supplied root");
  return file;
}
export function referencedMediaFiles(project){
  const files=[];
  for(const shot of project.shots??[]){
    if(shot?.media?.file)files.push(shot.media.file);
    if(shot?.foreground?.file)files.push(shot.foreground.file);
  }
  for(const key of ["voice","music","outro"]){
    if(project[key]?.file)files.push(project[key].file);
  }
  return [...new Set(files)].sort();
}
export function referencedClaimSlots(project){
  const slots=[];
  for(const shot of project.shots??[]){
    if(shot.template==="data_story"&&shot.data?.series?.length)
      slots.push({shotId:shot.id,kind:"data_series"});
    if(shot.geo?.metric)slots.push({shotId:shot.id,kind:"geo_metric"});
    if(shot.photo?.metric)slots.push({shotId:shot.id,kind:"photo_metric"});
  }
  return slots;
}
/**
 * The return status is NEVER "published" or "approved by OpenAI". If all
 * machine-checkable criteria pass, a human must still verify authenticity,
 * editorial fairness, licenses, voice consent, and platform law.
 */
export function auditEditorialRelease({project,manifest,assetRoot,evidenceRoot}){
  const blockers=[],warnings=[],observedHashes={};
  const block=(field,reason)=>blockers.push({field,reason});
  const observe=(field,relative,expected,root)=>{
    if(!isText(relative,320)||typeof expected!=="string"||!RE_HEX.test(expected)){
      block(field,"Missing path or expected SHA-256 of original evidence");
      return;
    }
    try{
      const real=resolveEvidenceFile(root,relative);
      const digest=shaFile(real);
      observedHashes[field]=digest;
      if(digest!==expected.toLowerCase())
        block(field,"Source/evidence bytes changed from approved SHA-256");
    }catch(e){block(field,"Original evidence inaccessible or unsafe: "+String(e.message).slice(0,125));}
  };
  if(!project||typeof project!=="object"||!Array.isArray(project.shots)){
    return {status:"BLOCKED",blockers:[{field:"project",reason:"Original authored project required"}],warnings,observedHashes};
  }
  if(!manifest||typeof manifest!=="object"||Array.isArray(manifest))
    return {status:"BLOCKED",blockers:[{field:"manifest",reason:"Signed-off documentary packet required"}],warnings,observedHashes};
  if(manifest.format!==RELEASE_FORMAT)
    block("format","Unrecognized documentary release packet format");
  if(manifest.projectId!==project.id)block("projectId","Release packet targets a different source project");
  if(manifest.environment!=="production_candidate")
    block("environment","Synthetic/demo/research-only packet is not a publication candidate");
  const editorial=manifest.editorial;
  if(!editorial||!isText(editorial.headline,180)||
    !isText(editorial.summary,1200)||!isText(editorial.methodology,2000)||
    !isText(editorial.editor,160)||!dateOK(editorial.reviewedAt)||
    !RE_LANG.test(editorial.language??"")||
    editorial.decision!=="approved_for_human_release_review")
    block("editorial","Editor, methodology, language, reviewed date, and deliberate review decision required");
  if(NON_PRODUCTION.test(project.title??"")||
    NON_PRODUCTION.test(manifest.editorial?.headline??""))
    block("editorial","Synthetic/technical material cannot masquerade as released news");
  if(!isText(manifest.projectSha256,64)||!RE_HEX.test(manifest.projectSha256))
    block("projectSha256","Fingerprint of exact source project JSON bytes required");
  else if(manifest.sourceProjectFile)
    observe("projectSha256",manifest.sourceProjectFile,manifest.projectSha256,evidenceRoot);
  else
    block("sourceProjectFile","Original machine-readable storyboard file required for exact-byte replay");
  const sources=Array.isArray(manifest.sources)?manifest.sources:[];
  if(sources.length===0)block("sources","At least one grounded primary documentary source required");
  if(sources.length>120)block("sources","Source registry exceeds reviewable packet limit");
  const ids=sources.map(s=>s?.id);
  if(ids.some(id=>typeof id!=="string"||!RE_ID.test(id))||!unique(ids))
    block("sources","Unique stable source IDs required");
  const bySource=new Map(sources.filter(Boolean).map(s=>[s.id,s]));
  for(const [i,s] of sources.entries()){
    const k="sources["+i+"]";
    if(!s||!isText(s.publisher,140)||!isText(s.title,250)||
      !["primary","secondary"].includes(s.type)||
      !/^https:\/\/[a-z0-9]/i.test(s.url??"")||s.url.length>1800||
      !dateOK(s.publishedAt)||!dateOK(s.accessedAt)||s.accessedAt<s.publishedAt)
      block(k,"Source requires publisher, title, type, HTTPS URL and chronological dates");
    observe(k+".evidence",s?.evidenceFile,s?.evidenceSha256,evidenceRoot);
  }
  const claims=Array.isArray(manifest.claims)?manifest.claims:[];
  if(!unique(claims.map(c=>c?.id)))block("claims","Duplicate claim IDs");
  for(const [i,c] of claims.entries()){
    const k="claims["+i+"]";
    if(!c||!RE_ID.test(c.id??"")||!isText(c.statement,1000)||
      !isText(c.method,1200)||!dateOK(c.checkedAt)||
      c.status!=="checked_by_editor"||
      !Array.isArray(c.sourceIds)||c.sourceIds.length===0||
      c.sourceIds.some(id=>!bySource.has(id)))
      block(k,"Each stated figure requires a check method, date and known source citation");
    else if(!c.sourceIds.some(id=>bySource.get(id)?.type==="primary"))
      block(k,"Numerical claim must identify at least one primary source");
  }
  const slotIds=new Map();
  for(const claim of claims){
    if(claim?.shotId&&claim?.kind)
      slotIds.set(claim.shotId+"::"+claim.kind,(slotIds.get(claim.shotId+"::"+claim.kind)??0)+1);
  }
  for(const slot of referencedClaimSlots(project)){
    if(slotIds.get(slot.shotId+"::"+slot.kind)!==1)
      block("claims."+slot.shotId+"."+slot.kind,"Every source numerical series/metric must have exactly one explicit claim record");
  }
  if(claims.some(c=>c?.shotId&&!project.shots.some(s=>s.id===c.shotId)))
    block("claims","Claim references a nonexistent storyboard shot");
  const needed=referencedMediaFiles(project);
  const rights=Array.isArray(manifest.assets)?manifest.assets:[];
  if(!unique(rights.map(a=>a?.file)))
    block("assets","Duplicated asset rights entries");
  const registered=new Map(rights.filter(Boolean).map(a=>[a.file,a]));
  for(const file of needed){
    const rec=registered.get(file);
    if(!rec){block("assets."+file,"Missing rights packet for this exact source asset");continue;}
    if(!isText(rec.rightsholder,160)||!isText(rec.licenseId,160)||
      !["owned","licensed"].includes(rec.legalBasis)||
      !["editor_reviewed"].includes(rec.reviewStatus)||
      !Array.isArray(rec.platforms)||!rec.platforms.includes("social")||
      !rec.platforms.includes("web")||!isText(rec.usageScope,400))
      block("assets."+file,"Rightsholder, evidence-based permission, commercial/social/web coverage and human review required");
    observe("assets."+file+".original",file,rec.sha256,assetRoot);
    observe("assets."+file+".grant",rec.evidenceFile,rec.evidenceSha256,evidenceRoot);
    if(rec.expiryAt!==null&&rec.expiryAt!==undefined&&!dateOK(rec.expiryAt))
      block("assets."+file+".expiryAt","Invalid rights expiration date");
    if(dateOK(rec.expiryAt)&&dateOK(editorial?.reviewedAt)&&rec.expiryAt<editorial.reviewedAt)
      block("assets."+file+".expiryAt","Permission expired before editorial review");
  }
  for(const a of rights){
    if(a?.file&&!needed.includes(a.file))
      warnings.push({field:"assets."+a.file,reason:"Unused rights record; remove unreviewed files from packet"});
  }
  const audio=manifest.audio;
  if(project.voice){
    if(!audio||audio.voiceFile!==project.voice.file||
      !isText(audio.transcriptApproval,350)||!isText(audio.speakerConsent,350))
      block("audio","Voice needs source-aligned approved transcript and permission/consent evidence");
    if(!project.captions||project.captions.kind!=="verbatim")
      block("captions","Narrated releases require external verbatim timed subtitles, not test captions");
  }else warnings.push({field:"audio",reason:"Silent film: explicit editorial decision required before publishing to video platforms"});
  // This gate intentionally cannot authenticate signatures, actual news truth,
  // image provenance, defamation, country laws or consent. No auto-publication.
  warnings.push({field:"human_approval",reason:"Rights authenticity, factual truth, consent, jurisdiction and final editorial authorization require independent human verification"});
  const status=blockers.length?"BLOCKED":"REVIEW_REQUIRED";
  return {format:RELEASE_FORMAT,status,blockers,warnings,observedHashes,
    expectedMedia:needed,expectedClaimSlots:referencedClaimSlots(project)};
}
