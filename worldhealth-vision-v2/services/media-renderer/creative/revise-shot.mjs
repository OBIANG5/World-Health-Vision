#!/usr/bin/env node
/**
 * MEDIA P0.4: make one editor-approved change-set and request a real,
 * original-timeline audiovisual review with render-project.mjs --review-shot.
 * No source project, voice, script, media or existing output is overwritten.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reviseShot} from './surgical-revision.mjs';
import {inspectProject,resolveLocalFile} from './validate-project.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function parse(argv) {
  const allowed=new Set(['--project','--patch','--assets','--output']);
  if (argv.length!==8) throw Error('Usage: --project source.json --patch retake.json --assets DIR --output NEW.json');
  const opts={};
  for(let i=0;i<argv.length;i+=2) {
    const [key,value]=[argv[i],argv[i+1]];
    if(!allowed.has(key)||!value||value.startsWith('--')||opts[key])
      throw Error('Missing, duplicated or unexpected option: '+key);
    opts[key]=value;
  }
  if(Object.keys(opts).length!==4) throw Error('Four explicit options are required');
  return opts;
}
async function fileSha(file) {
  const h=createHash('sha256');
  for await(const chunk of fs.createReadStream(file)) h.update(chunk);
  return h.digest('hex');
}
function referencedAssets(project) {
  const files=[];
  const push = (v) => {if(v?.file) files.push(v.file);};
  push(project.voice);push(project.music);push(project.outro);
  for(const s of project.shots) {push(s.media);push(s.foreground);}
  for(const cue of project.soundCues??[]) push(cue);
  return [...new Set(files)].sort();
}
export async function runRevision(argv) {
  const o=parse(argv);
  const sourcePath=path.resolve(o['--project']);
  const patchPath=path.resolve(o['--patch']);
  const outPath=path.resolve(o['--output']);
  const reportPath=outPath+'.revision-review.json';
  if(path.extname(outPath).toLowerCase()!=='.json') throw Error('Output must be a new .json project');
  if(new Set([sourcePath,patchPath,outPath,reportPath]).size!==4 ||
     fs.existsSync(outPath)||fs.existsSync(reportPath))
    throw Error('Revision output must be a new path; never overwrite original, patch or prior review');
  const sourceBytes=fs.readFileSync(sourcePath);
  const patchBytes=fs.readFileSync(patchPath);
  const original=JSON.parse(sourceBytes.toString('utf8'));
  const revision=JSON.parse(patchBytes.toString('utf8'));
  const before=inspectProject(original);
  if(!before.ok) throw Error('Source project invalid: '+JSON.stringify(before.errors));
  const {project,report}=reviseShot(original,revision,sha(sourceBytes));
  const after=inspectProject(project);
  if(!after.ok) throw Error('Revised project invalid: '+JSON.stringify(after.errors));
  if(after.frames!==before.frames) throw Error('Source movie duration changed: refusing revision');
  const root=fs.realpathSync(path.resolve(o['--assets']));
  const assetDigests=[];
  // Check all referenced assets, including new SFX or replacement image.
  // ResolveLocalFile rejects traversal, external URLs and symlink escapes.
  for(const relative of referencedAssets(project)) {
    const resolved=resolveLocalFile(root,relative);
    assetDigests.push({file:relative,sha256:await fileSha(resolved)});
  }
  const outputContent=JSON.stringify(project,null,2)+'\n';
  const finalReport={
    ...report,
    revision_json_sha256:sha(patchBytes),
    output_project_sha256:sha(outputContent),
    output_project_path:outPath,
    output_project_validated:true,
    referenced_asset_sha256:assetDigests,
    rights_and_artistic_approval:'NOT VERIFIED — human editorial + licence + phone review required',
    review_instruction:'node creative/render-project.mjs --project NEW.json --assets DIR --review-shot '+revision.shot_id+' --output NEW.mp4'
  };
  fs.mkdirSync(path.dirname(outPath),{recursive:true});
  // Exclusive writes. If report creation fails, remove only our own new output.
  let created=false;
  try {
    fs.writeFileSync(outPath,outputContent,{flag:'wx'});
    created=true;
    fs.writeFileSync(reportPath,JSON.stringify(finalReport,null,2)+'\n',{flag:'wx'});
  }catch(error) {
    if(created) fs.unlinkSync(outPath);
    throw error;
  }
  return finalReport;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {process.stdout.write(JSON.stringify(await runRevision(process.argv.slice(2)),null,2)+'\n');}
  catch(error) {process.stderr.write('Surgical revision failed: '+error.message+'\n');process.exitCode=1;}
}
