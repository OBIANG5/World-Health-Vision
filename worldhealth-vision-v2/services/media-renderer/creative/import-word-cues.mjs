#!/usr/bin/env node
/**
 * Safe bridge between OFFICIAL Remotion Caption[] from an external aligner
 * (e.g. Whisper.cpp) and World-Vision's existing wordCaptions timeline.
 * No TTS, account connection, script rewriting or media synthesis.
 * Produces a NEW project and mandatory review report, leaving inputs intact.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {importWordTiming} from './word-alignment-import.mjs';
import {inspectProject,durationFrames,resolveLocalFile} from './validate-project.mjs';

function parse(argv) {
  const opts={};
  const allowed=['--project','--assets','--captions','--output','--emphasis-file','--voice-offset-frames'];
  if (!argv.length || argv.length % 2 !== 0) throw Error('Usage: --project project.json --assets DIR --captions Caption[].json --output NEW.json [--emphasis-file words.json] [--voice-offset-frames N]');
  for (let i=0;i<argv.length;i+=2) {
    const key=argv[i],value=argv[i+1];
    if (!allowed.includes(key) || !value || value.startsWith('--') || opts[key]) throw Error('Invalid or duplicate option: '+key);
    opts[key]=value;
  }
  for(const k of ['--project','--assets','--captions','--output']) if(!opts[k]) throw Error('Missing '+k);
  return opts;
}
function shaFile(file) {return createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
export function runImport(argv) {
  const o=parse(argv);
  const source=path.resolve(o['--project']);
  const raw=path.resolve(o['--captions']);
  const target=path.resolve(o['--output']);
  const root=path.resolve(o['--assets']);
  if (target===source || target===raw || fs.existsSync(target) || fs.existsSync(target+'.alignment-review.json'))
    throw Error('Output must be a NEW project path. Refusing to overwrite user files.');
  const original=JSON.parse(fs.readFileSync(source,'utf8'));
  const inspection=inspectProject(original);
  if(!inspection.ok) throw Error('Original project invalid: '+JSON.stringify(inspection.errors));
  if (original.wordCaptions?.length || original.captions?.length)
    throw Error('Project already has wordCaptions or captions; review existing work before replacing.');
  if(!original.voice?.file) throw Error('A real, editor-provided voice file is required for source-aligned word captions.');
  const voiceFile=resolveLocalFile(root,original.voice.file);
  const aligned=JSON.parse(fs.readFileSync(raw,'utf8'));
  const captions=Array.isArray(aligned)?aligned:aligned?.captions;
  const emphasis=o['--emphasis-file']?JSON.parse(fs.readFileSync(o['--emphasis-file'],'utf8')):[];
  const offset=o['--voice-offset-frames']??'0';
  if(!/^[0-9]+$/.test(offset))throw Error('voice offset must be a nonnegative integer in frames');
  const result=importWordTiming({script:original.script,captions,
    durationFrames:durationFrames(original)-(original.outro?.durationFrames??0),
    fps:original.fps,offsetFrames:Number(offset),emphasis});
  const updated={...original,wordCaptions:result.wordCaptions};
  const after=inspectProject(updated);
  if(!after.ok)throw Error('Output project failed World-Vision safety gates: '+JSON.stringify(after.errors));
  const report={...result.report,source_project_sha256:shaFile(source),
    aligned_caption_json_sha256:shaFile(raw),source_voice_sha256:shaFile(voiceFile),
    output_project_path:target,confidence_policy:'timestamps from an external aligner, NOT verified against voice in this command',
    final_release_approval:'NOT APPROVED — requires human listen, image check and source rights'};
  // Validate all data before any write; original inputs are always read only.
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(updated,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(target+'.alignment-review.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  return report;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{process.stdout.write(JSON.stringify(runImport(process.argv.slice(2)),null,2)+'\n');}
  catch(e){process.stderr.write('Word timing import failed: '+e.message+'\n');process.exitCode=1;}
}
