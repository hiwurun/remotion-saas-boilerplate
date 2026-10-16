import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Img, OffthreadVideo, interpolate, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AmbientBackdrop } from "../components/AmbientBackdrop";
import { AppleStage3D, OpticalLoupe } from "../components/AppleStage3D";
import { AppleBentoGrid } from "../components/AppleBentoGrid";
import { CLAMP, Reveal, SkeletonPlaceholder, TITLE_CLASS, TopHighlight, revealStyle, useAppleSpring } from "../motion";
import {
  APPLE_TRANSITION_FRAMES,
  AppleVideoProps,
  BentoSummaryScene,
  CinematicRecordScene,
  HeroTitleScene,
  MacroScreenshotScene,
} from "../schema";

type Avail = (src: string) => boolean;

const useLayout = () => {
  const { width, height } = useVideoConfig();
  const isPortrait = height > width;
  const stageW = isPortrait ? width - 100 : width * 0.6;
  const stageH = (stageW - 20) * (9 / 16) + 20;
  return { width, height, isPortrait, stageW, stageH };
};

const Caption: React.FC<{ caption: string; sub?: string }> = ({ caption, sub }) => {
  const { isPortrait } = useLayout();
  return (
    <div className="text-center" style={{ maxWidth: isPortrait ? 900 : 1400 }}>
      <Reveal delay={12}>
        <div className={`${TITLE_CLASS} leading-[1.1]`} style={{ fontSize: isPortrait ? 76 : 68, paddingBottom: 6 }}>{caption}</div>
      </Reveal>
      {sub ? (
        <Reveal delay={22}>
          <div className="text-white/50 font-medium" style={{ fontSize: isPortrait ? 34 : 28, marginTop: 16 }}>{sub}</div>
        </Reveal>
      ) : null}
    </div>
  );
};

const HeroTitle: React.FC<{ scene: HeroTitleScene; accentColor: string }> = ({ scene, accentColor }) => {
  const { isPortrait } = useLayout();
  return (
    <AbsoluteFill className="items-center justify-center text-center" style={{ padding: isPortrait ? 70 : 160 }}>
      <Reveal delay={4}>
        <div className="font-semibold uppercase" style={{ color: accentColor, fontSize: isPortrait ? 32 : 26, letterSpacing: "0.3em", marginBottom: 32 }}>
          {scene.eyebrow}
        </div>
      </Reveal>
      <Reveal delay={14}>
        <div className={`${TITLE_CLASS} leading-[1.05]`} style={{ fontSize: isPortrait ? 92 : 150, paddingBottom: 12 }}>{scene.title}</div>
      </Reveal>
      <Reveal delay={28}>
        <div className="text-white/55 font-medium leading-snug" style={{ fontSize: isPortrait ? 36 : 38, marginTop: 28, maxWidth: isPortrait ? 900 : 1100 }}>
          {scene.subtitle}
        </div>
      </Reveal>
    </AbsoluteFill>
  );
};

const MacroScreenshot: React.FC<{ scene: MacroScreenshotScene; accentColor: string; available: Avail }> = ({ scene, accentColor, available }) => {
  const { isPortrait, stageW, stageH } = useLayout();
  const ok = available(scene.src);
  const imgW = stageW - 20;
  const imgH = stageH - 20;
  return (
    <AbsoluteFill className="items-center justify-center" style={{ flexDirection: "column", gap: isPortrait ? 90 : 56 }}>
      <Caption caption={scene.caption} sub={scene.subCaption} />
      <AppleStage3D
        width={stageW}
        height={stageH}
        cameraMode={scene.cameraMode}
        durationInFrames={scene.durationInFrames}
        overlay={
          scene.loupe && ok ? (
            <OpticalLoupe
              loupe={scene.loupe}
              src={scene.src}
              available={ok}
              imageWidth={imgW}
              imageHeight={imgH}
              offsetX={10}
              offsetY={10}
              diameter={isPortrait ? 300 : 340}
              accentColor={accentColor}
              delay={50}
            />
          ) : null
        }
      >
        {ok ? (
          <Img src={staticFile(scene.src)} className="absolute inset-0 h-full w-full" style={{ objectFit: "fill" }} />
        ) : (
          <SkeletonPlaceholder />
        )}
      </AppleStage3D>
    </AbsoluteFill>
  );
};

const CinematicRecord: React.FC<{ scene: CinematicRecordScene; accentColor: string; available: Avail }> = ({ scene, accentColor, available }) => {
  const { isPortrait, stageW, stageH } = useLayout();
  const badge = useAppleSpring(30);
  const ok = available(scene.src);
  return (
    <AbsoluteFill className="items-center justify-center" style={{ flexDirection: "column", gap: isPortrait ? 90 : 56 }}>
      <Caption caption={scene.caption} />
      <AppleStage3D
        width={stageW}
        height={stageH}
        cameraMode="center-float"
        durationInFrames={scene.durationInFrames}
        overlay={
          <div
            className={`absolute overflow-hidden bg-white/[0.03] border border-white/[0.08] backdrop-blur-2xl rounded-full text-white font-semibold whitespace-nowrap`}
            style={{
              ...(isPortrait ? { left: "50%", bottom: -110 } : { right: -50, top: -36 }),
              fontSize: isPortrait ? 34 : 30,
              padding: isPortrait ? "20px 40px" : "18px 36px",
              boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${accentColor}55`,
              ...revealStyle(badge),
              transform: `${isPortrait ? "translateX(-50%) " : ""}${revealStyle(badge).transform} scale(${interpolate(badge, [0, 1], [0.92, 1], CLAMP)})`,
            }}
          >
            <TopHighlight />
            {scene.floatingBadge}
          </div>
        }
      >
        {ok ? (
          <OffthreadVideo src={staticFile(scene.src)} playbackRate={scene.playbackRate} muted className="absolute inset-0 h-full w-full" style={{ objectFit: "cover" }} />
        ) : (
          <SkeletonPlaceholder />
        )}
      </AppleStage3D>
    </AbsoluteFill>
  );
};

const BentoSummary: React.FC<{ scene: BentoSummaryScene; accentColor: string; available: Avail }> = ({ scene, accentColor, available }) => {
  const { isPortrait, width, height } = useLayout();
  const padX = isPortrait ? 60 : 140;
  const gridH = isPortrait ? height * 0.66 : height * 0.66;
  return (
    <AbsoluteFill className="items-center justify-center" style={{ flexDirection: "column", gap: isPortrait ? 60 : 48 }}>
      <Reveal delay={4}>
        <div className={`${TITLE_CLASS} text-center leading-[1.1]`} style={{ fontSize: isPortrait ? 76 : 72, paddingBottom: 6 }}>{scene.heading}</div>
      </Reveal>
      <AppleBentoGrid cards={scene.cards} width={width - padX * 2} height={gridH} accentColor={accentColor} available={available} />
    </AbsoluteFill>
  );
};

export const AppleMasterTemplate: React.FC<AppleVideoProps> = ({ accentColor, bgmSrc, scenes, assetAvailability }) => {
  // Unknown (not checked) assets are assumed present; checked-and-missing ones get a skeleton.
  const available: Avail = (src) => assetAvailability?.[src] !== false;
  return (
    <AbsoluteFill className="bg-[#050507]" style={{ fontFamily: "'SF Pro Display', Inter, 'PingFang SC', 'Noto Sans SC', system-ui, sans-serif" }}>
      <AmbientBackdrop accentColor={accentColor} />
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const out: React.ReactNode[] = [];
          if (i > 0) {
            out.push(
              <TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: APPLE_TRANSITION_FRAMES })} />,
            );
          }
          out.push(
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={scene.durationInFrames}>
              {scene.type === "hero-title" ? <HeroTitle scene={scene} accentColor={accentColor} /> : null}
              {scene.type === "macro-screenshot" ? <MacroScreenshot scene={scene} accentColor={accentColor} available={available} /> : null}
              {scene.type === "cinematic-record" ? <CinematicRecord scene={scene} accentColor={accentColor} available={available} /> : null}
              {scene.type === "bento-summary" ? <BentoSummary scene={scene} accentColor={accentColor} available={available} /> : null}
            </TransitionSeries.Sequence>,
          );
          return out;
        })}
      </TransitionSeries>
      {bgmSrc && available(bgmSrc) ? <Audio src={staticFile(bgmSrc)} volume={0.45} /> : null}
    </AbsoluteFill>
  );
};

const collectAssets = (props: AppleVideoProps): string[] => {
  const s = new Set<string>();
  if (props.bgmSrc) s.add(props.bgmSrc);
  for (const sc of props.scenes) {
    if (sc.type === "macro-screenshot" || sc.type === "cinematic-record") s.add(sc.src);
    if (sc.type === "bento-summary") sc.cards.forEach((c) => c.imgSrc && s.add(c.imgSrc));
  }
  return [...s];
};

const assetExists = async (src: string): Promise<boolean> => {
  try {
    const res = await fetch(staticFile(src), { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
};

export const calculateAppleMetadata: CalculateMetadataFunction<AppleVideoProps> = async ({ props }) => {
  const sum = props.scenes.reduce((a, s) => a + s.durationInFrames, 0);
  const n = props.scenes.length;
  const assets = collectAssets(props);
  const results = await Promise.all(assets.map(assetExists));
  const assetAvailability: Record<string, boolean> = {};
  assets.forEach((a, i) => (assetAvailability[a] = results[i]));
  return {
    durationInFrames: Math.max(1, sum - APPLE_TRANSITION_FRAMES * Math.max(0, n - 1)),
    props: { ...props, assetAvailability },
  };
};
