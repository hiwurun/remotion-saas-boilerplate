import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { SANS } from "../../shared/fonts";
import { Camera } from "../../shared/components/Camera";
import { Cursor } from "../components/Cursor";
import { SfxTrack } from "../components/Sfx";
import type { MarketModel } from "../data";
import type { OpenVLabProps } from "../schema";
import { useMarketTimeline } from "../timeline";
import { GridOverlay, GridWorld } from "./GridScene";
import { WindowScene } from "./WindowScene";
import { MetricFilterScene } from "./MetricFilterScene";
import { PremiumSelection } from "./PremiumScene";
import { ColumnNotes } from "./TableScene";
import { PromptScene } from "./PromptScene";
import { ShotCaptions } from "./Captions";
import { OutroScene } from "./OutroScene";

/** The market story (scene-local frames, starts after the title card): camera world, captions, cursor, SFX, grid and outro overlays. */
export const MarketScene: React.FC<OpenVLabProps & { model: MarketModel }> = (props) => {
  const tl = useMarketTimeline(props);
  const { accent, f, W, H, cam, clickFrames, sfxEvents, cursorScreen, cursorOpacity, showWorld } = tl;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, overflow: "hidden" }}>
      {showWorld ? (
        <Camera state={cam} width={W} height={H}>
          <GridWorld tl={tl} />

          <WindowScene tl={tl} />

          {/* 数值筛选 dialog (DialogOverlay covers the page = the app window) */}
          <MetricFilterScene tl={tl} />

          {/* SHOT 6 selection on the 溢价 column */}
          <PremiumSelection tl={tl} />

          {/* SHOT 7 column notes */}
          <ColumnNotes tl={tl} />

          {/* SHOT 1: label + input box with typewriter prompt */}
          <PromptScene tl={tl} />
        </Camera>
      ) : null}

      {/* captions (screen space) */}
      <ShotCaptions tl={tl} />

      <Cursor x={cursorScreen.x} y={cursorScreen.y} size={40} opacity={cursorOpacity} clickFrames={clickFrames} frame={f} ripple={`${accent}b3`} />
      <SfxTrack events={sfxEvents} />

      {/* SHOT 10 grid shading, caption, stat reel */}
      <GridOverlay tl={tl} />

      {/* SHOT 11 */}
      <OutroScene tl={tl} />
    </AbsoluteFill>
  );
};
