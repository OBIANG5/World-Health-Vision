import type {CreativeShot} from "../src/CreativeEdit";
import type {CaptionCue} from "../src/caption-timeline.mjs";
import type {DirectorBeat} from "./director-beats.mjs";
import type {SourceSoundCue} from "./attention-cues.mjs";
type SavedShot=Omit<CreativeShot,"media"|"foreground"> & {
  media?:{kind:"image"|"video";file:string;credit?:string;trimBefore?:number};
  foreground?:{file:string;credit?:string};
};
export type SavedStudioProject={
 schema_version:"worldvision-creative-project-v1";id:string;title:string;script:string;fps:30;aspect_ratio:"9:16";
 style?:{background?:string;ink?:string;accent?:string};
 shots:SavedShot[];voice?:{file:string;label?:string;volume?:number}|null;
 music?:{file:string;label?:string;volume?:number}|null;
 outro?:{file:string;durationFrames:number}|null;captions?:CaptionCue[];directorBeats?:DirectorBeat[];soundCues?:SourceSoundCue[];
};
export const STUDIO_PROJECT_FORMAT:"worldvision-creative-project-v1";
export function parseStudioProject(text:string):SavedStudioProject;
export function frameCaptionsToSrt(cues?:CaptionCue[]):string;
export function studioAssetNames(project:SavedStudioProject):string[];
export function studioShotToEditor<T extends object>(shot:SavedShot,defaults:T):T;
