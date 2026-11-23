/**
 * P0: move EXISTING licensed audiovisual effects to an EXACT spoken-word beat.
 * Pure + browser safe. No invented words, captions, facts, music, or effects.
 * Original film frames are the ONLY clock; photo tracks use shot-local frames.
 */
import {buildEditorialTimeline} from './editorial-timeline.mjs';
import {directorBeatIssues} from './director-beats.mjs';
import {approvedScriptWords,wordCaptionIssues} from './word-caption-contract.mjs';
import {attentionCueIssues} from './attention-cues.mjs';

const fail=message=>{throw Error(message);};
const position=(project,beatId)=>{
  const timeline=buildEditorialTimeline(project.shots);
  const beat=project.directorBeats?.find(beat=>beat.id===beatId);
  if(!beat)fail('Séquence éditoriale introuvable.');
  const shot=timeline.shots.find(shot=>shot.id===beat.shotId);
  if(!shot)fail('Plan source introuvable.');
  return {timeline,beat,shot};
};
/**
 * Align ONLY one authored spokenExcerpt which occurs unambiguously in the
 * selected source shot. Keep every other beat, word and SFX untouched.
 */
export function alignBeatToSpokenWords(project,beatId){
  const {timeline,beat,shot}=position(project,beatId);
  if(!beat.spokenExcerpt?.trim()||!project.script.includes(beat.spokenExcerpt))
    fail('Copie une phrase exacte du script approuvé avant de la synchroniser.');
  const invalid=wordCaptionIssues(project,timeline.durationFrames);
  if(invalid.length)fail('Alignement source invalide : '+invalid[0].field+' — '+invalid[0].reason);
  const scriptWords=approvedScriptWords(project.script);
  const excerpt=approvedScriptWords(beat.spokenExcerpt);
  if(!excerpt.length)fail('La phrase du re-hook ne contient aucun mot approuvé.');
  const candidates=[];
  for(let i=0;i+excerpt.length<=scriptWords.length;i++){
    if(!excerpt.every((word,j)=>scriptWords[i+j]===word))continue;
    const first=project.wordCaptions[i],last=project.wordCaptions[i+excerpt.length-1];
    if(first.startFrame>=shot.startFrame&&last.endFrame<=shot.endFrame)
      candidates.push({startFrame:first.startFrame,endFrame:last.endFrame,wordStartIndex:i});
  }
  if(candidates.length!==1)
    fail('Phrase absente ou répétée dans ce plan : choisir un extrait unique, sans deviner le bon passage.');
  const candidate=candidates[0];
  if(candidate.endFrame-candidate.startFrame<6)
    fail('L’extrait est trop bref pour créer une séquence de six images.');
  const next=project.directorBeats.map(row=>row.id===beatId
    ?{...row,startFrame:candidate.startFrame,endFrame:candidate.endFrame}:row)
    .sort((a,b)=>a.startFrame-b.startFrame);
  const issues=directorBeatIssues({...project,directorBeats:next},timeline.durationFrames)
    .filter(issue=>issue.field.endsWith('.time')||issue.field.endsWith('.startFrame'));
  if(issues.length)fail('Déplacement incompatible avec les autres séquences : '+issues[0].reason);
  return {directorBeats:next,sourceStartFrame:candidate.startFrame,
    sourceEndFrame:candidate.endFrame,wordStartIndex:candidate.wordStartIndex};
}
/**
 * Place only an EXISTING photo comparison, sourced numeric metric or photo
 * focus. Keep original reveal duration, labels, numbers, pixels and provenance.
 * Never reveal under an entering/outgoing transition without explicit review.
 */
export function snapPhotoTrackToBeat(project,beatId,track,layer){
  if(!['comparison','metric','focus'].includes(layer))
    fail('Seules les pistes PHOTO existantes sont prises en charge.');
  const {timeline,beat,shot}=position(project,beatId);
  if(shot.template!=='photo_story')fail('Ce re-hook ne se trouve pas sur un plan PHOTO.');
  const minimum={comparison:30,metric:25,focus:20}[layer];
  if(!track||!Number.isInteger(track.startFrame)||!Number.isInteger(track.endFrame)||
     track.startFrame<0||track.endFrame>shot.durationFrames||
     track.endFrame-track.startFrame<minimum)
    fail('La piste PHOTO doit exister et posséder une durée valide avant synchronisation.');
  const authored=project.directorBeats??[];
  if(directorBeatIssues({...project,directorBeats:authored},timeline.durationFrames)
    .some(issue=>issue.field.endsWith('.time')||issue.field.endsWith('.startFrame')))
    fail('Corriger les timecodes du conducteur avant de caler une piste visuelle.');
  const current=project.shots[shot.index];
  const outgoing=current.transitionAfter!=='cut'?(current.transitionFrames??0):0;
  const fullyVisibleStart=shot.startFrame+shot.enterOverlapFrames;
  const fullyVisibleEnd=shot.endFrame-outgoing;
  const start=beat.startFrame;
  const end=start+(track.endFrame-track.startFrame);
  if(start<fullyVisibleStart||end>fullyVisibleEnd)
    fail('Révélation impossible sans couper sa durée ou la masquer par un raccord. Ajuster le plan ou le beat.');
  return {track:{...track,startFrame:start-shot.startFrame,endFrame:end-shot.startFrame},
    sourceStartFrame:start,shotLocalStartFrame:start-shot.startFrame};
}
/** Move one already-imported sound accent, preserving the file and its length. */
export function snapSoundCueToBeat(project,beatId,cueIndex){
  const {timeline,beat}=position(project,beatId);
  const cues=project.soundCues??[];
  if(!Number.isInteger(cueIndex)||!cues[cueIndex])
    fail('Choisir un effet sonore réellement importé.');
  const invalid=attentionCueIssues({soundCues:cues},timeline.durationFrames);
  if(invalid.length)fail('Piste audio invalide : '+invalid[0].reason);
  const cue=cues[cueIndex];
  if(beat.startFrame+cue.durationFrames>timeline.durationFrames)
    fail('Le fichier sonore ne tient pas dans le film : aucune durée ne sera tronquée.');
  return {soundCues:cues.map((row,index)=>index===cueIndex
    ?{...row,startFrame:beat.startFrame}:row),sourceStartFrame:beat.startFrame};
}
