import type {DirectorBeat} from './director-beats.mjs';
import type {WordCaption} from './word-caption-contract.mjs';
import type {SourceSoundCue} from './attention-cues.mjs';
type FilmShot={id:string;template:string;durationFrames:number;transitionAfter?:string;transitionFrames?:number};
type BeatProject={
  shots:FilmShot[];directorBeats:DirectorBeat[];script:string;
  wordCaptions?:WordCaption[];voice?:{file:string}|null;
  captions?:Array<unknown>;soundCues?:SourceSoundCue[];
};
type PhotoTrack={startFrame:number;endFrame:number;[key:string]:unknown};
export declare function alignBeatToSpokenWords(project:BeatProject,beatId:string):{
  directorBeats:DirectorBeat[];sourceStartFrame:number;sourceEndFrame:number;wordStartIndex:number
};
export declare function snapPhotoTrackToBeat(
  project:Pick<BeatProject,'shots'|'directorBeats'|'script'>,beatId:string,
  track:PhotoTrack,layer:'comparison'|'metric'|'focus'
):{track:PhotoTrack;sourceStartFrame:number;shotLocalStartFrame:number};
export declare function snapSoundCueToBeat(
  project:Pick<BeatProject,'shots'|'directorBeats'|'soundCues'>,beatId:string,cueIndex:number
):{soundCues:SourceSoundCue[];sourceStartFrame:number};
