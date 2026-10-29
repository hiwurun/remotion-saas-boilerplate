import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Camera } from "../shared/components/Camera";
import { AppStage, StageCaptions, StageOverlay, stageCamera } from "./scenes/AppStage";
import { End } from "./scenes/End";
import { Opening } from "./open/Opening";
import { ClickSfx } from "./components/ClickSfx";
import { B } from "./beats";
import { C } from "./tokens";
import { FPS, H, HOOK, TOTAL, W } from "./timeline";

export { FPS, H, TOTAL, W };

/**
 * v6 「一秒之后，不只是少了一秒」 — story-first cut (37.5 s):
 * Play -> 3D (price stays, the combo bleeds) -> the 6550 row, day by day -> two brackets -> conclusion ->
 * 曲线 sweep -> seller's view -> 1-day, −1 % band -> question -> V -> logo -> f2249 == f0.
 * All frames are global (see beats.ts / open/timeline.ts).
 */
export const OpenVlabStrategyVideo: React.FC<{ debug?: string }> = ({ debug = "" }) => {
  const f = useCurrentFrame();
  const cam = stageCamera(f);
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <Audio src={staticFile("audio/bgm.mp3")} volume={(fr) => interpolate(fr, [0, 0.8 * FPS, TOTAL - 2.2 * FPS, TOTAL - 1], [0, 0.8, 0.8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
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
      {/* sfx: the Play click lives in Opening; one soft click on 曲线; no thud / impact */}
      {/* 「曲线」 toggle: press is deepest / view switches at B.click + 1 */}
      <ClickSfx at={B.click + 1} />
    </AbsoluteFill>
  );
};
