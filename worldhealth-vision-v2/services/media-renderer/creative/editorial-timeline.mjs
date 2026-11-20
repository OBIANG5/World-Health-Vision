/**
 * One precise cinematic edit decision list from a supplied storyboard.
 * All frames are [start, end) at 30fps; a cross-dissolve is a real overlap.
 * Never infer story beats from external content or alter source dates.
 */
export function buildEditorialTimeline(shots){
  if(!Array.isArray(shots)||shots.length===0)throw Error("Timeline requires source-directed shots");
  let end=0;
  const rows=[];
  const junctions=[];
  for(let index=0;index<shots.length;index++){
    const shot=shots[index],previous=shots[index-1];
    if(!shot||!Number.isInteger(shot.durationFrames)||shot.durationFrames<1)
      throw Error("Invalid storyboard shot duration at index "+index);
    const overlap=previous?(previous.transitionFrames??0):0;
    if(!Number.isInteger(overlap)||overlap<0||overlap>18||
      (overlap>0&&previous.transitionAfter!=="dissolve"&&previous.transitionAfter!=="slide")||
      overlap>=shot.durationFrames||overlap>=(previous?.durationFrames??Infinity))
      throw Error("Invalid overlap before storyboard shot "+shot.id);
    const start=end-overlap;
    const finish=start+shot.durationFrames;
    if(previous&&overlap>0)
      junctions.push({from:previous.id,to:shot.id,startFrame:start,endFrame:end,
        durationFrames:overlap,transition:previous.transitionAfter});
    rows.push({index,id:shot.id,template:shot.template,startFrame:start,endFrame:finish,
      durationFrames:shot.durationFrames,enterOverlapFrames:overlap,
      startsWith:previous?.id??null});
    end=finish;
  }
  return {
    fps:30,durationFrames:end,durationSeconds:end/30,
    shots:rows,junctions
  };
}
export function activeAtFrame(timeline,frame){
  if(!Number.isInteger(frame)||frame<0||frame>=timeline.durationFrames)
    throw Error("Frame outside editorial master");
  return timeline.shots.filter(shot=>shot.startFrame<=frame&&frame<shot.endFrame)
    .map(shot=>shot.id);
}
export function checkEditorialFiveScene(timeline){
  const required=["geo_story","country_focus","photo_story","data_story","document_focus"];
  if(timeline.shots.length!==5||
    !timeline.shots.every((s,i)=>s.template===required[i]))
    throw Error("Film-1 must prove GEO→PAYS→PHOTO→DATA→DOCUMENT in that order.");
  if(timeline.junctions.length!==4)
    throw Error("Four intentional overlaps required; no arbitrary black between stories.");
  for(let f=0;f<timeline.durationFrames;f++){
    const active=activeAtFrame(timeline,f);
    if(active.length===0||active.length>2)throw Error("Timeline black hole or triple collision at "+f);
  }
  return true;
}
