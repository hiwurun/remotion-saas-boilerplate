import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { Background } from "../components/Background";
import { BrowserMockup, FloatingCallout, SimulatedCursor } from "../components/BrowserMockup";
import {
  HookScene as HookSceneProps,
  OutroScene as OutroSceneProps,
  ScreenRecordScene as ScreenRecordSceneProps,
  ScreenshotScene as ScreenshotSceneProps,
  TRANSITION_FRAMES,
  VideoInput,
} from "../schema";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const useLayout = () => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const pad = isPortrait ? 70 : 110;
  const mockW = isPortrait ? width - pad * 2 : width * 0.72;
  const mockH = isPortrait ? mockW * (10 / 16) + 48 : height * 0.68;
  return { width, height, isPortrait, pad, mockW, mockH };
};

/* ---------------- Hook ---------------- */
const HookScene: React.FC<{ scene: HookSceneProps; themeColor: string }> = ({ scene, themeColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, pad } = useLayout();
  const words = scene.title.split(" ");
  const titleSize = isPortrait ? 120 : 130;

  const badgeIn = spring({ frame, fps, config: { damping: 14 } });
  const hl = scene.highlightWord.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

  return (
    <AbsoluteFill className="items-center justify-center text-center" style={{ padding: pad }}>
      <div
        className="rounded-full border font-semibold uppercase tracking-widest"
        style={{
          fontSize: isPortrait ? 34 : 28,
          padding: "12px 32px",
          color: themeColor,
          borderColor: themeColor,
          background: "rgba(255,255,255,0.05)",
          opacity: badgeIn,
          transform: `translateY(${interpolate(badgeIn, [0, 1], [-40, 0], CLAMP)}px)`,
          marginBottom: isPortrait ? 60 : 48,
        }}
      >
        {scene.badge}
      </div>
      <div
        className="flex flex-wrap justify-center font-black text-white leading-none"
        style={{ fontSize: titleSize, columnGap: titleSize * 0.28, rowGap: titleSize * 0.15, maxWidth: isPortrait ? "100%" : "85%" }}
      >
        {words.map((w, i) => {
          const s = spring({ frame: frame - 8 - i * 5, fps, config: { damping: 12, stiffness: 140 } });
          const isHl = w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "") === hl;
          const underline = spring({ frame: frame - 8 - words.length * 5 - 6, fps, config: { damping: 200 } });
          return (
            <span
              key={i}
              className="relative inline-block"
              style={{
                opacity: interpolate(s, [0, 0.5], [0, 1], CLAMP),
                transform: `translateY(${interpolate(s, [0, 1], [80, 0], CLAMP)}px) scale(${interpolate(s, [0, 1], [0.7, 1], CLAMP)})`,
                color: isHl ? themeColor : "white",
              }}
            >
              {w}
              {isHl ? (
                <span
                  className="absolute left-0 rounded-full"
                  style={{ bottom: -titleSize * 0.12, height: titleSize * 0.08, width: `${underline * 100}%`, background: themeColor }}
                />
              ) : null}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Screenshot ---------------- */
const ScreenshotScene: React.FC<{ scene: ScreenshotSceneProps }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, pad, mockW, mockH } = useLayout();
  const barH = Math.round(Math.max(36, mockW * 0.03));
  const contentH = mockH - barH;
  const capIn = spring({ frame: frame - 15, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill className="items-center justify-center" style={{ padding: pad, flexDirection: "column", gap: isPortrait ? 80 : 50 }}>
      <div
        className="text-white font-bold text-center"
        style={{
          fontSize: isPortrait ? 64 : 56,
          opacity: capIn,
          transform: `translateY(${interpolate(capIn, [0, 1], [30, 0], CLAMP)}px)`,
          order: isPortrait ? 0 : 1,
        }}
      >
        {scene.caption}
      </div>
      <BrowserMockup
        width={mockW}
        height={mockH}
        zoomScale={scene.zoomScale}
        focusX={scene.focusX}
        focusY={scene.focusY}
        overlay={
          scene.cursorTarget ? (
            <SimulatedCursor
              target={[scene.cursorTarget[0] * mockW, scene.cursorTarget[1] * contentH]}
              containerWidth={mockW}
              containerHeight={contentH}
              startFrame={70}
              travelFrames={55}
              size={isPortrait ? 34 : 30}
            />
          ) : null
        }
      >
        <Img src={staticFile(scene.src)} className="w-full h-full" style={{ objectFit: "cover", objectPosition: "top left" }} />
      </BrowserMockup>
    </AbsoluteFill>
  );
};

/* ---------------- Screen recording ---------------- */
const ScreenRecordScene: React.FC<{ scene: ScreenRecordSceneProps }> = ({ scene }) => {
  const { isPortrait, pad, mockW, mockH } = useLayout();
  return (
    <AbsoluteFill className="items-center justify-center" style={{ padding: pad }}>
      <div className="relative">
        <BrowserMockup width={mockW} height={mockH} url="app.acme.io/live">
          <OffthreadVideo
            src={staticFile(scene.src)}
            playbackRate={scene.playbackRate}
            muted
            className="w-full h-full"
            style={{ objectFit: "cover" }}
          />
        </BrowserMockup>
        <div className="absolute" style={isPortrait ? { left: 0, right: 0, bottom: -150, display: "flex", justifyContent: "center" } : { right: -60, bottom: -40 }}>
          <FloatingCallout text={scene.calloutText} delay={Math.round(scene.durationInFrames / 2)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Outro ---------------- */
const OutroScene: React.FC<{ scene: OutroSceneProps; themeColor: string }> = ({ scene, themeColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { isPortrait, pad } = useLayout();
  const logoIn = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const titleIn = spring({ frame: frame - 10, fps, config: { damping: 16 } });
  const ctaIn = spring({ frame: frame - 22, fps, config: { damping: 12 } });
  const urlIn = spring({ frame: frame - 32, fps, config: { damping: 200 } });
  const glow = interpolate(Math.sin((frame / fps) * Math.PI * 1.5), [-1, 1], [0.4, 0.9], CLAMP);
  const logo = isPortrait ? 220 : 180;

  return (
    <AbsoluteFill className="items-center justify-center text-center" style={{ padding: pad, gap: isPortrait ? 56 : 40 }}>
      <Img
        src={staticFile(scene.logoSrc)}
        style={{ width: logo, height: logo, transform: `scale(${logoIn}) rotate(${interpolate(logoIn, [0, 1], [-20, 0], CLAMP)}deg)` }}
      />
      <div
        className="font-black text-white leading-tight"
        style={{ fontSize: isPortrait ? 96 : 100, opacity: titleIn, transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0], CLAMP)}px)` }}
      >
        {scene.title}
      </div>
      <div
        className="rounded-full font-bold text-white"
        style={{
          fontSize: isPortrait ? 48 : 40,
          padding: isPortrait ? "28px 72px" : "22px 60px",
          background: themeColor,
          boxShadow: `0 0 ${60 * glow}px ${themeColor}`,
          transform: `scale(${interpolate(ctaIn, [0, 1], [0.5, 1], CLAMP)})`,
          opacity: interpolate(ctaIn, [0, 0.3], [0, 1], CLAMP),
        }}
      >
        {scene.ctaText} →
      </div>
      <div className="text-slate-400 font-medium" style={{ fontSize: isPortrait ? 40 : 34, opacity: urlIn }}>
        {scene.url}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- Main template ---------------- */
export const HybridSaaSVideo: React.FC<VideoInput> = ({ themeColor, bgmSrc, scenes }) => {
  const { isPortrait } = useLayout();
  return (
    <AbsoluteFill className="bg-slate-950" style={{ fontFamily: "Inter, 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif" }}>
      <Background themeColor={themeColor} />
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const items: React.ReactNode[] = [];
          if (i > 0) {
            const presentation =
              i % 2 === 1 ? slide({ direction: isPortrait ? "from-bottom" : "from-right" }) : fade();
            items.push(
              <TransitionSeries.Transition
                key={`t-${i}`}
                presentation={presentation}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />,
            );
          }
          items.push(
            <TransitionSeries.Sequence key={`s-${i}`} durationInFrames={scene.durationInFrames}>
              {scene.type === "hook" ? <HookScene scene={scene} themeColor={themeColor} /> : null}
              {scene.type === "screenshot" ? <ScreenshotScene scene={scene} /> : null}
              {scene.type === "screen-record" ? <ScreenRecordScene scene={scene} /> : null}
              {scene.type === "outro" ? <OutroScene scene={scene} themeColor={themeColor} /> : null}
            </TransitionSeries.Sequence>,
          );
          return items;
        })}
      </TransitionSeries>
      {bgmSrc ? <Audio src={staticFile(bgmSrc)} volume={0.5} /> : null}
    </AbsoluteFill>
  );
};

export const calculateMetadata: CalculateMetadataFunction<VideoInput> = ({ props }) => {
  const sum = props.scenes.reduce((acc, s) => acc + s.durationInFrames, 0);
  const n = props.scenes.length;
  return { durationInFrames: Math.max(1, sum - TRANSITION_FRAMES * Math.max(0, n - 1)) };
};
