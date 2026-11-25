/**
 * EDITOR-APPROVED World-Vision attention beats.
 *
 * These are precise source-film frames, never inferred from a script or SRT.
 * Word beats annotate the ORIGINAL spoken text; soundtrack/SFX are separate
 * time-aligned licensed local assets. No API, voice or new effects engine.
 */
// Identical in Node and Chromium: AUDIO validation must run in the Studio
// before a project is imported, not only on the server during H264 export.
// Only the basename's final suffix counts; the path itself is checked below.
const audioExtension=(value)=>{
  if(typeof value!=='string')return '';
  const basename=value.slice(value.lastIndexOf('/')+1);
  const dot=basename.lastIndexOf('.');
  return dot>0?basename.slice(dot).toLowerCase():'';
};

const error=(field,reason)=>({field,reason});
const AUDIO_FILES=new Set(['.wav','.mp3','.m4a','.aac','.flac']);
const localFile=(value)=>typeof value==='string'&&value.length>0&&
  !value.includes('\\')&&!value.includes('\0')&&!value.startsWith('/')&&
  !value.startsWith('//')&&!/^[a-z]+:/i.test(value)&&
  value.split('/').every(s=>s&&s!=='.'&&s!=='..');

export function attentionCueIssues(project,totalFrames){
  const issues=[];
  const words=project.wordCaptions;
  if(words!=null){
    if(!Array.isArray(words)||words.length>1200){
      issues.push(error('wordCaptions','Supply 0-1200 editor-approved spoken-word timings.'));
    }else{
      let previousEnd=0;
      words.forEach((word,i)=>{
        const field='wordCaptions['+i+']';
        if(!word||typeof word!=='object'||Array.isArray(word)){
          issues.push(error(field,'Word cue must be an object.'));return;
        }
        if(!Number.isInteger(word.startFrame)||!Number.isInteger(word.endFrame)||
          word.startFrame<0||word.endFrame<=word.startFrame||
          word.endFrame>totalFrames||word.startFrame<previousEnd){
          issues.push(error(field+'.time','Word beat must be ordered, inside the original narration, nonoverlapping.'));
        }
        if(typeof word.text!=='string'||!word.text.trim()||
          word.text.length>60||/\s/u.test(word.text.trim())||
          /[<>\u0000-\u001f\u007f]/u.test(word.text)){
          issues.push(error(field+'.text','One supplied, unmodified spoken word with punctuation (max 60 chars), no markup.'));
        }
        if(word.emphasis!==undefined&&typeof word.emphasis!=='boolean')
          issues.push(error(field+'.emphasis','Use true or false.'));
        if(Number.isInteger(word.endFrame))previousEnd=word.endFrame;
      });
    }
  }
  const cues=project.soundCues;
  if(cues!=null){
    if(!Array.isArray(cues)||cues.length>80)
      issues.push(error('soundCues','Supply at most 80 sourced audio cues.'));
    else cues.forEach((cue,i)=>{
      const field='soundCues['+i+']';
      if(!cue||typeof cue!=='object'||Array.isArray(cue)){
        issues.push(error(field,'Sound cue must be an object.'));return;
      }
      if(!Number.isInteger(cue.startFrame)||!Number.isInteger(cue.durationFrames)||
        cue.startFrame<0||cue.durationFrames<4||cue.durationFrames>450||
        cue.startFrame+cue.durationFrames>totalFrames)
        issues.push(error(field+'.time','SFX must occupy 4-450 frames inside the original film.'));
      if(!localFile(cue.file)||!AUDIO_FILES.has(audioExtension(cue.file)))
        issues.push(error(field+'.file','A licensed local audio file under the supplied asset directory is required.'));
      if(cue.volume!==undefined&&(!Number.isFinite(cue.volume)||cue.volume<0||cue.volume>.8))
        issues.push(error(field+'.volume','SFX gain must be between 0 and 0.8, leaving headroom for narration.'));
      if(cue.label!==undefined&&(typeof cue.label!=='string'||cue.label.length>90))
        issues.push(error(field+'.label','Keep a short source/role label (max 90 chars).'));
    });
  }
  return issues;
}
