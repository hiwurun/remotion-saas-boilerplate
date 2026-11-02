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
 * v9 「IV 升降如何改写时间价值」 — ~67.8 s (TOTAL from beats.ts).
 * Play -> 3D -> ATM 6550 row lit + fast day-over-day strip -> two brackets -> conclusion ->
 * auto morph table→curve -> one TV drain to expiry -> restore today ->
 * IV up (TV thickens) -> IV crush (spot fixed, TV shrinks) -> takeaway card ->
 * SoftBg wash -> elastic logo drop + left hop -> OpenVlab/theme slide-in.
 * Removed seller flip / 2% shock / 不够赔 / Gamma entry question.
 * All frames are global (see beats.ts / open/timeline.ts). The bed loops, fading on the last frames.
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
