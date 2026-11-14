import React from "react";
import {Composition} from "remotion";
import report from "../../../docs/media/pilots/cop31-risk-finance-2026-11-12.json";
import {WorldVisionFirstReport, type FirstReportStory, type FirstReportProps} from "./WorldVisionFirstReport";

const initialProps:FirstReportProps = {
  story: report as FirstReportStory,
  durationSeconds: 40,
  audioFilename: null,
  renderProfile:"canonical_newsroom_v1",
};

export const FirstReportRoot:React.FC = () =>
  <Composition
    id="WorldVisionFirstReport"
    component={WorldVisionFirstReport}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={1200}
    defaultProps={initialProps}
    calculateMetadata={({props})=>({
      width:1080,height:1920,fps:30,
      durationInFrames:Math.max(1,Math.ceil(props.durationSeconds*30)),
    })}
  />;
