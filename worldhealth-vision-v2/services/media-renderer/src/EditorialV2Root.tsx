import React from "react";
import {Composition} from "remotion";
import {WorldVisionEditorialV2, V2_FPS, V2_DURATION_FRAMES} from "./WorldVisionEditorialV2";

export const EditorialV2Root:React.FC=()=>(
  <>
    <Composition
      id="WVEditorialV2"
      component={WorldVisionEditorialV2}
      durationInFrames={V2_DURATION_FRAMES}
      width={1080}
      height={1920}
      fps={V2_FPS}
    />
  </>
);
