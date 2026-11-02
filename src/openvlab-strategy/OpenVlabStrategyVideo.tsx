import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Camera } from "../shared/components/Camera";
import { AppStage, StageCaptions, StageOverlay, stageCamera } from "./scenes/AppStage";
import { End } from "./scenes/End";
import { Opening } from "./open/Opening";
import { B } from "./beats";
import { C } from "./tokens";
import { FPS, H, HOOK, TOTAL, W } from "./timeline";

export { FPS, H, TOTAL, W };

/**
 * v8.1 「一秒之后，不只是少了一秒」 — 79.1 s (tightened from v8's 128.4 s).
 * Play -> 3D -> the 6550 row, day by day -> two brackets -> conclusion ->
 * auto morph table→curve -> one curve drag (6550 gap named, then drains to zero) -> seller's view ->
 * 1-day, −2% band -> last-day TV vs shock (不够赔) -> an open question about when a seller should step in ->
 * SoftBg wash -> elastic logo drop + left hop -> OpenVlab/theme slide-in -> f4744 == f0.
 * All frames are global (see beats.ts / open/timeline.ts). The bed is 20s and loops, fading on the last frames.
 */
export const OpenVlabStrategyVideo: React.FC<{ debug?: string }> = ({ debug = "" }) => {
  const f = useCurrentFrame();
  const cam = stageCamera(f);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio loop src={staticFile("audio/bgm.mp3")} volume={(fr) => interpolate(fr, [0, 0.8 * FPS, TOTAL - 2.2 * FPS, TOTAL - 1], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
      <Sequence from={0} durationInFrames={HOOK} premountFor={FPS}>
        <Opening f={f} debug={debug} />
      </Sequence>
      <Sequence from={HOOK} durationInFrames={B.lift[1] + 2 - HOOK} premountFor={FPS}>
        <Camera state={cam} width={W} height={H}>
          <AppStage f={f} cam={cam} />
        </Camera>
        <StageOverlay f={f} />
        <StageCaptions f={f} />
      </Sequence>
      <Sequence from={B.lift[0]} durationInFrames={TOTAL - B.lift[0]}>
        <End f={f} />
      </Sequence>
      {/* sfx: the Play click lives in Opening; table→curve is an auto morph (no toggle click) */}
    </AbsoluteFill>
  );
};
