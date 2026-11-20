import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {createHash} from "node:crypto";
import {
  auditEditorialRelease,shaJSON,resolveEvidenceFile,referencedClaimSlots,
  RELEASE_FORMAT
} from "./editorial-release-gate.mjs";
const sha=b=>createHash("sha256").update(b).digest("hex");
function fixture(){
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"wv-release-"));
  const assetRoot=path.join(temp,"assets");
  const evidenceRoot=path.join(temp,"evidence");
  fs.mkdirSync(assetRoot);fs.mkdirSync(evidenceRoot);
  const save=(root,rel,content)=>{
    const f=path.join(root,rel);fs.mkdirSync(path.dirname(f),{recursive:true});
    fs.writeFileSync(f,content);
    return sha(Buffer.from(content));
  };
  const assetHash=save(assetRoot,"images/field.png",Buffer.from([137,80,78,71,13,10,26,10]));
  const licenseHash=save(evidenceRoot,"grants/image-license.txt","AUTHORED TEST FILE — not a valid real license");
  const sourceHash=save(evidenceRoot,"sources/table.csv","2026-08-01,10\n2026-09-01,12\n2026-10-01,11\n");
  const data={
    mode:"line",series:[
      {date:"2026-08-01",label:"AOÛT",value:10},
      {date:"2026-09-01",label:"SEPT",value:12},
      {date:"2026-10-01",label:"OCT",value:11}
    ],source:{publisher:"National Statistics Institute",dataset:"Index 2026",
      asOf:"2026-10-01",url:"https://example.org/index-2026"},
    domain:{min:0,max:20},unit:" %",precision:0
  };
  const project={
    schema_version:"worldvision-creative-project-v1",id:"wv-editorial-trial",
    title:"Indices et évolution des prix",script:"Voici la série observée.",
    fps:30,aspect_ratio:"9:16",
    shots:[{id:"index-series",template:"data_story",durationFrames:165,
      title:"La trajectoire de cet indicateur",media:{kind:"image",file:"images/field.png"},
      data,transitionAfter:"cut",transitionFrames:0}],
    voice:null,music:null,outro:null
  };
  const projectBytes=JSON.stringify(project,null,2);
  const projectSha=save(evidenceRoot,"project/source-project.json",projectBytes);
  const manifest={
    format:RELEASE_FORMAT,environment:"production_candidate",projectId:project.id,
    projectSha256:projectSha,sourceProjectFile:"project/source-project.json",
    editorial:{headline:"Évolution de l'indicateur observé",summary:"Illustration d'une série chiffrée.",
      methodology:"Contrôle des trois observations originales à l'aide du tableau archivé.",
      editor:"Rédaction humaine",reviewedAt:"2026-10-06",language:"fr-FR",
      decision:"approved_for_human_release_review"},
    sources:[{id:"primary-source",publisher:"National Statistics Institute",
      title:"Index 2026",dataset:"Index 2026",type:"primary",
      url:"https://example.org/index-2026",publishedAt:"2026-10-02",accessedAt:"2026-10-06",
      evidenceFile:"sources/table.csv",evidenceSha256:sourceHash}],
    claims:[{id:"index-claim",shotId:"index-series",kind:"data_series",
      valueSha256:shaJSON(data),statement:"Trois valeurs telles que déclarées dans la série.",
      method:"Comparaison avec les trois observations archivées.",
      checkedAt:"2026-10-06",status:"checked_by_editor",sourceIds:["primary-source"]}],
    assets:[{file:"images/field.png",sha256:assetHash,
      rightsholder:"Test media owner",licenseId:"agreement-2026-001",
      legalBasis:"licensed",reviewStatus:"editor_reviewed",
      platforms:["social","web"],usageScope:"Worldwide, editorial and commercial online publication",
      evidenceFile:"grants/image-license.txt",evidenceSha256:licenseHash,expiryAt:"2027-12-31"}]
  };
  return {
    temp,assetRoot,evidenceRoot,project,manifest,
    audit:()=>auditEditorialRelease({project,manifest,assetRoot,evidenceRoot})
  };
}
const cleanup=f=>fs.rmSync(f.temp,{recursive:true,force:true});
test("RELEASE-1 complete checked packet can only reach HUMAN REVIEW, never auto-publish",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  const a=f.audit();
  assert.equal(a.status,"REVIEW_REQUIRED",JSON.stringify(a.blockers));
  assert.deepEqual(a.blockers,[]);
  assert.deepEqual(a.expectedMedia,["images/field.png"]);
  assert.deepEqual(a.expectedClaimSlots,[{
    shotId:"index-series",kind:"data_series",valueSha256:shaJSON(f.project.shots[0].data)
  }]);
  assert.ok(a.warnings.some(w=>w.field==="human_approval"));
});
test("RELEASE-1 rejects altered original media, changed license bytes and stale claim hashes",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  fs.appendFileSync(path.join(f.assetRoot,"images/field.png"),"tamper");
  assert.ok(f.audit().blockers.some(b=>b.field.includes(".original")));
  f.manifest.assets[0].sha256=sha(fs.readFileSync(path.join(f.assetRoot,"images/field.png")));
  fs.appendFileSync(path.join(f.evidenceRoot,"grants/image-license.txt"),"tamper");
  assert.ok(f.audit().blockers.some(b=>b.field.includes(".grant")));
  f.manifest.assets[0].evidenceSha256=sha(fs.readFileSync(path.join(f.evidenceRoot,"grants/image-license.txt")));
  f.manifest.claims[0].valueSha256="0".repeat(64);
  assert.ok(f.audit().blockers.some(b=>b.field.endsWith(".valueSha256")));
});
test("RELEASE-1 refuses swapped storyboard JSON even if manifest describes original file",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  f.project.shots[0].data.series[1].value=888;
  assert.ok(f.audit().blockers.some(b=>b.field==="sourceProjectFile"));
  f.project.shots[0].data.series[1].value=12;
  f.manifest.projectSha256="a".repeat(64);
  assert.ok(f.audit().blockers.some(b=>b.field==="projectSha256"));
});
test("RELEASE-1 rejects ghost source, missing rights and expired license",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  f.manifest.claims[0].sourceIds=["not-recorded"];
  assert.ok(f.audit().blockers.some(b=>b.field==="claims[0]"));
  f.manifest.claims[0].sourceIds=["primary-source"];
  f.manifest.assets=[];
  assert.ok(f.audit().blockers.some(b=>b.field==="assets.images/field.png"));
  f.manifest.assets=[{file:"images/field.png"}];
  assert.ok(f.audit().blockers.some(b=>b.field==="assets.images/field.png.original"));
});
test("RELEASE-1 denies faked alternate dataset identity, unapproved audio and demo content",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  f.manifest.sources[0].publisher="Unrelated Publisher";
  assert.ok(f.audit().blockers.some(b=>b.field.endsWith(".sourceIdentity")));
  f.manifest.sources[0].publisher="National Statistics Institute";
  f.manifest.environment="test_only";
  assert.ok(f.audit().blockers.some(b=>b.field==="environment"));
  f.manifest.environment="production_candidate";
  f.project.voice={file:"narration.mp3"};
  const errors=f.audit().blockers.map(b=>b.field);
  assert.ok(errors.includes("audio")&&errors.includes("captions"));
});
test("RELEASE-1 rejects symlinks escaping evidence directory and path traversal",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  const outside=path.join(f.temp,"outside.txt");fs.writeFileSync(outside,"OUTSIDE");
  fs.symlinkSync(outside,path.join(f.evidenceRoot,"grants/external-link.txt"));
  assert.throws(()=>resolveEvidenceFile(f.evidenceRoot,"../outside.txt"));
  assert.throws(()=>resolveEvidenceFile(f.evidenceRoot,"grants/external-link.txt"));
  assert.throws(()=>resolveEvidenceFile(f.evidenceRoot,"/etc/passwd"));
  assert.throws(()=>resolveEvidenceFile(f.evidenceRoot,"images\\file.txt"));
});
test("RELEASE-1 validates source dates and does not accept impossible calendar days",t=>{
  const f=fixture();t.after(()=>cleanup(f));
  f.manifest.sources[0].publishedAt="2026-02-30";
  assert.ok(f.audit().blockers.some(b=>b.field==="sources[0]"));
  f.manifest.sources[0].publishedAt="2026-10-02";
  f.manifest.assets[0].expiryAt="2026-09-02";
  assert.ok(f.audit().blockers.some(b=>b.field.endsWith(".expiryAt")));
});
