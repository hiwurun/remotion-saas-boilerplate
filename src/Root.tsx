import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { LuminaSlider, calculateLuminaMetadata } from "./lumina/LuminaSlider";
import { LuminaVideoSchema } from "./lumina/schema";

// 注意：defaultProps 必须直接写成内联对象字面量，
// Remotion Studio 右侧面板的「保存」按钮才能把修改写回这个文件。
// 横竖屏两个版本各自独立保存。

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
