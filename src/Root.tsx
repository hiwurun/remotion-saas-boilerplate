import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { HybridSaaSVideo, calculateMetadata } from "./templates/HybridSaaSVideo";
import { VideoInputSchema } from "./schema";
import { AppleMasterTemplate, calculateAppleMetadata } from "./apple/templates/AppleMasterTemplate";
import { AppleVideoSchema } from "./apple/schema";
import { LuminaSlider, calculateLuminaMetadata } from "./lumina/LuminaSlider";
import { LuminaVideoSchema } from "./lumina/schema";

// 注意：每个 Composition 的 defaultProps 必须直接写成内联对象字面量，
// Remotion Studio 右侧面板的「保存」按钮才能把修改写回这个文件。
// 横竖屏两个版本各自独立保存。

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* SaaS 混排模板：60fps，945 − 3×15 = 900 帧 = 15s */}
      <Composition
        id="SaaS-Landscape"
        component={HybridSaaSVideo}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={900}
        schema={VideoInputSchema}
        calculateMetadata={calculateMetadata}
        defaultProps={{
          themeColor: "#6366f1",
          bgmSrc: "audio/bgm.mp3",
          scenes: [
            { type: "hook" as const, durationInFrames: 195, badge: "全新发布 · v2.0", title: "Ship your SaaS 10x faster", highlightWord: "faster" },
            { type: "screenshot" as const, durationInFrames: 255, src: "demo/screenshot.png", zoomScale: 1.35, focusX: 0.3, focusY: 0.25, cursorTarget: [0.36, 0.2] as [number, number], caption: "一眼看清核心指标" },
            { type: "screen-record" as const, durationInFrames: 315, src: "demo/recording.mp4", playbackRate: 1.25, calloutText: "实时同步，零延迟" },
            { type: "outro" as const, durationInFrames: 180, logoSrc: "demo/logo.png", title: "Acme Cloud", ctaText: "免费试用", url: "acme.io" },
          ],
        }}
      />
      <Composition
        id="SaaS-Portrait"
        component={HybridSaaSVideo}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={900}
        schema={VideoInputSchema}
        calculateMetadata={calculateMetadata}
        defaultProps={{
          themeColor: "#6366f1",
          bgmSrc: "audio/bgm.mp3",
          scenes: [
            { type: "hook" as const, durationInFrames: 195, badge: "全新发布 · v2.0", title: "Ship your SaaS 10x faster", highlightWord: "faster" },
            { type: "screenshot" as const, durationInFrames: 255, src: "demo/screenshot.png", zoomScale: 1.35, focusX: 0.3, focusY: 0.25, cursorTarget: [0.36, 0.2] as [number, number], caption: "一眼看清核心指标" },
            { type: "screen-record" as const, durationInFrames: 315, src: "demo/recording.mp4", playbackRate: 1.25, calloutText: "实时同步，零延迟" },
            { type: "outro" as const, durationInFrames: 180, logoSrc: "demo/logo.png", title: "Acme Cloud", ctaText: "免费试用", url: "acme.io" },
          ],
        }}
      />

      {/* Apple 电影级模板：60fps，1110 − 3×20 = 1050 帧 ≈ 17.5s */}
      <Composition
        id="Apple-SaaS-Landscape"
        component={AppleMasterTemplate}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1050}
        schema={AppleVideoSchema}
        calculateMetadata={calculateAppleMetadata}
        defaultProps={{
          accentColor: "#6366F1",
          bgmSrc: "audio/bgm.mp3",
          scenes: [
            { type: "hero-title" as const, durationInFrames: 180, eyebrow: "Introducing Acme 2.0", title: "数据，从未如此清晰。", subtitle: "为现代团队打造的实时分析平台，一切尽在掌握。" },
            { type: "macro-screenshot" as const, durationInFrames: 330, src: "demo/screenshot.png", caption: "每一个指标，纤毫毕现。", subCaption: "实时 MRR、留存与流失，一屏洞察。", cameraMode: "macro-angle" as const, loupe: { x: 0.25, y: 0.2, zoom: 2.2, label: "实时 MRR 追踪" } },
            { type: "cinematic-record" as const, durationInFrames: 300, src: "demo/recording.mp4", playbackRate: 1.2, caption: "快，快到不可思议。", floatingBadge: "⚡ 0.4s 极速渲染" },
            { type: "bento-summary" as const, durationInFrames: 300, heading: "专为增长而生。", cards: [
              { title: "月度经常性收入", metric: "+218%", description: "上线 90 天内，客户平均收入增长。", imgSrc: "demo/screenshot.png" },
              { title: "响应速度", metric: "0.4s", description: "全球边缘节点，毫秒级查询。" },
              { title: "活跃团队", metric: "12k+", description: "遍布 60 个国家与地区。" },
              { title: "可用性", metric: "99.99%", description: "企业级 SLA 保障（此卡图片故意缺失，演示占位）。", imgSrc: "demo/missing-card.png" },
            ] },
          ],
        }}
      />
      <Composition
        id="Apple-SaaS-Portrait"
        component={AppleMasterTemplate}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1050}
        schema={AppleVideoSchema}
        calculateMetadata={calculateAppleMetadata}
        defaultProps={{
          accentColor: "#6366F1",
          bgmSrc: "audio/bgm.mp3",
          scenes: [
            { type: "hero-title" as const, durationInFrames: 180, eyebrow: "Introducing Acme 2.0", title: "数据，从未如此清晰。", subtitle: "为现代团队打造的实时分析平台，一切尽在掌握。" },
            { type: "macro-screenshot" as const, durationInFrames: 330, src: "demo/screenshot.png", caption: "每一个指标，纤毫毕现。", subCaption: "实时 MRR、留存与流失，一屏洞察。", cameraMode: "macro-angle" as const, loupe: { x: 0.25, y: 0.2, zoom: 2.2, label: "实时 MRR 追踪" } },
            { type: "cinematic-record" as const, durationInFrames: 300, src: "demo/recording.mp4", playbackRate: 1.2, caption: "快，快到不可思议。", floatingBadge: "⚡ 0.4s 极速渲染" },
            { type: "bento-summary" as const, durationInFrames: 300, heading: "专为增长而生。", cards: [
              { title: "月度经常性收入", metric: "+218%", description: "上线 90 天内，客户平均收入增长。", imgSrc: "demo/screenshot.png" },
              { title: "响应速度", metric: "0.4s", description: "全球边缘节点，毫秒级查询。" },
              { title: "活跃团队", metric: "12k+", description: "遍布 60 个国家与地区。" },
              { title: "可用性", metric: "99.99%", description: "企业级 SLA 保障（此卡图片故意缺失，演示占位）。", imgSrc: "demo/missing-card.png" },
            ] },
          ],
        }}
      />

      {/* Lumina 玻璃折射轮播：时长 = 张数 × 每张秒数 */}
      <Composition
        id="Lumina-Landscape"
        component={LuminaSlider}
        width={1920}
        height={1080}
        fps={60}
        durationInFrames={1800}
        schema={LuminaVideoSchema}
        calculateMetadata={calculateLuminaMetadata}
        defaultProps={{
          secondsPerSlide: 5,
          transitionSeconds: 2.5,
          accentColor: "#d4af37",
          bgmSrc: "audio/bgm.mp3",
          brandLabel: "Lumina — Collection",
          slides: [
            { title: "Ethereal Glow", description: "A soft luminescence that dissolves the boundary between light and form.", src: "lumina/slide-01.jpg" },
            { title: "Rose Mirage", description: "Petal tones drifting through a haze of warm, refracted colour.", src: "lumina/slide-02.jpg" },
            { title: "Velvet Mystique", description: "Deep, tactile shadows wrapped in a quiet, velvet darkness.", src: "lumina/slide-03.jpg" },
            { title: "Golden Hour", description: "The fleeting moment when everything turns to amber and gold.", src: "lumina/slide-04.jpg" },
            { title: "Midnight Dreams", description: "Nocturnal blues and silent reflections beneath a sleeping sky.", src: "lumina/slide-05.jpg" },
            { title: "Silver Light", description: "Cool metallic highlights tracing the edges of the unseen.", src: "lumina/slide-06.jpg" },
          ],
        }}
      />
      <Composition
        id="Lumina-Portrait"
        component={LuminaSlider}
        width={1080}
        height={1920}
        fps={60}
        durationInFrames={1800}
        schema={LuminaVideoSchema}
        calculateMetadata={calculateLuminaMetadata}
        defaultProps={{
          secondsPerSlide: 5,
          transitionSeconds: 2.5,
          accentColor: "#d4af37",
          bgmSrc: "audio/bgm.mp3",
          brandLabel: "Lumina — Collection",
          slides: [
            { title: "Ethereal Glow", description: "A soft luminescence that dissolves the boundary between light and form.", src: "lumina/slide-01.jpg" },
            { title: "Rose Mirage", description: "Petal tones drifting through a haze of warm, refracted colour.", src: "lumina/slide-02.jpg" },
            { title: "Velvet Mystique", description: "Deep, tactile shadows wrapped in a quiet, velvet darkness.", src: "lumina/slide-03.jpg" },
            { title: "Golden Hour", description: "The fleeting moment when everything turns to amber and gold.", src: "lumina/slide-04.jpg" },
            { title: "Midnight Dreams", description: "Nocturnal blues and silent reflections beneath a sleeping sky.", src: "lumina/slide-05.jpg" },
            { title: "Silver Light", description: "Cool metallic highlights tracing the edges of the unseen.", src: "lumina/slide-06.jpg" },
          ],
        }}
      />
    </>
  );
};
