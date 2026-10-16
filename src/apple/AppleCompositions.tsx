import React from "react";
import { Composition } from "remotion";
import { AppleMasterTemplate, calculateAppleMetadata } from "./templates/AppleMasterTemplate";
import { AppleVideoProps, AppleVideoSchema } from "./schema";

// 60fps: 180 + 330 + 300 + 300 = 1110 − 3×20 = 1050 帧 ≈ 17.5s
export const appleDefaultProps: AppleVideoProps = {
  accentColor: "#6366F1",
  bgmSrc: "audio/bgm.mp3",
  scenes: [
    { type: "hero-title", durationInFrames: 180, eyebrow: "Introducing Acme 2.0", title: "数据，从未如此清晰。", subtitle: "为现代团队打造的实时分析平台，一切尽在掌握。" },
    {
      type: "macro-screenshot",
      durationInFrames: 330,
      src: "demo/screenshot.png",
      caption: "每一个指标，纤毫毕现。",
      subCaption: "实时 MRR、留存与流失，一屏洞察。",
      cameraMode: "macro-angle",
      loupe: { x: 0.25, y: 0.2, zoom: 2.2, label: "实时 MRR 追踪" },
    },
    { type: "cinematic-record", durationInFrames: 300, src: "demo/recording.mp4", playbackRate: 1.2, caption: "快，快到不可思议。", floatingBadge: "⚡ 0.4s 极速渲染" },
    {
      type: "bento-summary",
      durationInFrames: 300,
      heading: "专为增长而生。",
      cards: [
        { title: "月度经常性收入", metric: "+218%", description: "上线 90 天内，客户平均收入增长。", imgSrc: "demo/screenshot.png" },
        { title: "响应速度", metric: "0.4s", description: "全球边缘节点，毫秒级查询。" },
        { title: "活跃团队", metric: "12k+", description: "遍布 60 个国家与地区。" },
        { title: "可用性", metric: "99.99%", description: "企业级 SLA 保障（此卡图片故意缺失，演示占位）。", imgSrc: "demo/missing-card.png" },
      ],
    },
  ],
};

export const AppleCompositions: React.FC = () => (
  <>
    <Composition
      id="Apple-SaaS-Landscape"
      component={AppleMasterTemplate}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={1050}
      schema={AppleVideoSchema}
      defaultProps={appleDefaultProps}
      calculateMetadata={calculateAppleMetadata}
    />
    <Composition
      id="Apple-SaaS-Portrait"
      component={AppleMasterTemplate}
      width={1080}
      height={1920}
      fps={60}
      durationInFrames={1050}
      schema={AppleVideoSchema}
      defaultProps={appleDefaultProps}
      calculateMetadata={calculateAppleMetadata}
    />
  </>
);
