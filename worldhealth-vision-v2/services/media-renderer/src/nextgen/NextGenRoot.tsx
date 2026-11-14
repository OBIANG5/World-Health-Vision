import React from "react";
import {Composition} from "remotion";
import {WorldVisionBrandOutroCandidate} from "./WorldVisionBrandCandidate";

export const NextGenRoot: React.FC = () => (
  <>
    <Composition id="WVOriginalG0Midnight"
      component={WorldVisionBrandOutroCandidate}
      defaultProps={{tone:"midnight" as const}}
      width={1080} height={1920} fps={30} durationInFrames={90}/>
    <Composition id="WVOriginalG0Graphite"
      component={WorldVisionBrandOutroCandidate}
      defaultProps={{tone:"graphite" as const}}
      width={1080} height={1920} fps={30} durationInFrames={90}/>
  </>
);
