import {Player} from "@remotion/player";
import {CreativeEdit} from "../../../../services/media-renderer/src/CreativeEdit";
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
  props,shotId
}:{
  props:CreativeEditProps;
  shotId:string;
}){
  const frames=Math.max(1,props.shots[0]?.durationFrames??1);
  return <div className="wvc-composition-preview" aria-label={"Véritable composition Remotion du plan "+shotId}>
    <Player
      key={shotId}
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
        Le lecteur ne peut pas interpréter ce fichier ou ce codec dans ton navigateur. Le plan n'a pas été remplacé.
        <small>{error instanceof Error ? error.message : String(error)}</small>
      </div>}
    />
  </div>;
}
