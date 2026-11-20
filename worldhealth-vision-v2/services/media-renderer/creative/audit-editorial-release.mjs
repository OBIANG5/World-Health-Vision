#!/usr/bin/env node
/**
 * Offline-only audit. This CLI produces a detailed JSON receipt; it NEVER
 * sends, approves or publishes an article and NEVER checks live rights APIs.
 *
 * Example:
 *   node creative/audit-editorial-release.mjs --project source.json
 *     --manifest evidence/release.json --assets ./assets --evidence ./evidence
 *     --report ./out/release-audit.json --mode inspect
 * A production publish-gate intentionally fails until a distinct authorized
 * human decision/review process exists. No hidden API tokens or network calls.
 */
import fs from "node:fs";
import path from "node:path";
import {auditEditorialRelease} from "./editorial-release-gate.mjs";
const args=process.argv.slice(2);
const opts={};
for(let i=0;i<args.length;i++){
  const key=args[i];
  if(!/^--(project|manifest|assets|evidence|report|mode)$/.test(key)||
    !args[i+1]||args[i+1].startsWith("--")||opts[key.slice(2)]!==undefined)
    throw Error("Invalid/duplicated option: "+key);
  opts[key.slice(2)]=args[++i];
}
if(["project","manifest","assets","evidence"].some(k=>!opts[k]))
  throw Error("Required: --project FILE --manifest FILE --assets DIR --evidence DIR");
const mode=opts.mode??"inspect";
if(!["inspect","publish-gate"].includes(mode))
  throw Error("mode must be inspect or publish-gate");
let result;
try{
  const project=JSON.parse(fs.readFileSync(opts.project,"utf8"));
  const manifest=JSON.parse(fs.readFileSync(opts.manifest,"utf8"));
  result=auditEditorialRelease({
    project,manifest,assetRoot:opts.assets,evidenceRoot:opts.evidence
  });
}catch(e){
  result={status:"BLOCKED",blockers:[{
    field:"files",reason:"Dossier unreadable: "+String(e.message).slice(0,200)
  }],warnings:[]};
}
const report={...result,mode,
  verdict:result.status==="BLOCKED"
    ?"BLOCKED — incomplete/untrusted publication dossier"
    :"REVIEW REQUIRED — never an automatic publishing authorization"};
if(opts.report){
  fs.mkdirSync(path.dirname(opts.report),{recursive:true});
  fs.writeFileSync(opts.report,JSON.stringify(report,null,2)+"\n");
}
process.stdout.write(JSON.stringify(report,null,2)+"\n");
if(result.status==="BLOCKED")process.exitCode=2;
else if(mode==="publish-gate")process.exitCode=3;
