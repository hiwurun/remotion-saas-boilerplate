import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { HybridSaaSVideo, calculateMetadata } from "./templates/HybridSaaSVideo";
import { VideoInput, VideoInputSchema } from "./schema";
import { AppleCompositions } from "./apple/AppleCompositions";
import { LuminaCompositions } from "@/lumina/LuminaCompositions";

// 60fps, 15s = 900 frames. 3 transitions × 15 frames overlap → scenes sum to 945.
// hook 0–3s, screenshot 3–7s, screen-record 7–12s, outro 12–15s
export const defaultProps: VideoInput = {
  themeColor: "#6366f1",
  bgmSrc: "audio/bgm.mp3",
  scenes: [
    { type: "hook", durationInFrames: 195, badge: "全新发布 · v2.0", title: "Ship your SaaS 10x faster", highlightWord: "faster" },
    {
      type: "screenshot",
      durationInFrames: 255,
      src: "demo/screenshot.png",
      zoomScale: 1.35,
      focusX: 0.3,
      focusY: 0.25,
      cursorTarget: [0.36, 0.2],
      caption: "一眼看清核心指标",
    },
    { type: "screen-record", durationInFrames: 315, src: "demo/recording.mp4", playbackRate: 1.25, calloutText: "实时同步，零延迟" },
    { type: "outro", durationInFrames: 180, logoSrc: "demo/logo.png", title: "Acme Cloud", ctaText: "免费试用", url: "acme.io" },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SaaS-Landscape"
        component={HybridSaaSVideo}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={900}
        schema={VideoInputSchema}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="SaaS-Portrait"
        component={HybridSaaSVideo}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={900}
        schema={VideoInputSchema}
        defaultProps={defaultProps}
        calculateMetadata={calculateMetadata}
      />
      <AppleCompositions />
      <LuminaCompositions />
    </>
  );
};
