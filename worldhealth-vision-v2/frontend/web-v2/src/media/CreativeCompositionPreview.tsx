import {Player, type PlayerRef} from "@remotion/player";
import {useEffect, useRef} from "react";
import {CreativeEdit, creativeDuration} from "../../../../services/media-renderer/src/CreativeEdit";
import type {CreativeEditProps} from "../../../../services/media-renderer/src/CreativeEdit";

/**
 * This is the EXACT same composition as the H.264 Remotion renderer.
 * No hand-drawn CSS "preview", fake captions, or separate animation engine.
 *
 * Assets come from local File object URLs in the current browser session.
 * Imported data is never sent to an API by this component.
 *
 * LIMITS: browser video codec support, font availability, frame decode latency,
 * and mobile playback policies differ from server-side Chromium/FFmpeg.
 * Always approve the actual exported MP4 before publishing.
 */
export default function CreativeCompositionPreview({
  props,previewId,label,initialFrame=0,reviewRequestId=0
}:{
  props:CreativeEditProps;
  previewId:string;
  label:string;
  /** Frame in the ORIGINAL complete film; the timeline and audio stay intact. */
  initialFrame?:number;
  /** Increment to repeat the same short review without rebuilding the Player. */
  reviewRequestId?:number;
}){
  const frames=Math.max(1,creativeDuration(props));
  const frame=Math.max(0,Math.min(frames-1,Math.floor(initialFrame)));
  const playerRef=useRef<PlayerRef>(null);
  useEffect(()=>{
    // The official Player keeps narration, soundtrack, captions and transitions
    // on their original frame clock. Do not splice or mute neighbouring shots.
    const player=playerRef.current;
    if(!player)return;
    player.pause();
    player.seekTo(frame);
  },[frame,reviewRequestId,previewId]);
  return <div className="wvc-composition-preview" aria-label={label}>
    <Player
      ref={playerRef}
      key={previewId}
      initialFrame={frame}
      component={CreativeEdit}
      durationInFrames={frames}
      compositionWidth={1080}
      compositionHeight={1920}
      fps={30}
      inputProps={props}
      controls
      autoPlay={false}
      loop={false}
      clickToPlay
      allowFullscreen
      style={{width:"100%",height:"100%",aspectRatio:"9 / 16"}}
      errorFallback={({error})=><div className="wvc-player-error" role="alert">
        Le lecteur ne peut pas interpréter un des médias ou ce codec dans ton navigateur. Le projet original reste inchangé.
        <small>{error instanceof Error ? error.message : String(error)}</small>
      </div>}
    />
  </div>;
}
