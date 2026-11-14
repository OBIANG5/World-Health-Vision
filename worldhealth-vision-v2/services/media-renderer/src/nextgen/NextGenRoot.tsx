import React from "react";
import {Composition} from "remotion";
import {WorldVisionBrandOutroCandidate} from "./WorldVisionBrandCandidate";

export const NextGenRoot: React.FC = () => (
  <>
    <Composition id="WVNextGenBrandOutroCandidate"
      component={WorldVisionBrandOutroCandidate}
      width={1080} height={1920} fps={30} durationInFrames={90}/>
  </>
);
