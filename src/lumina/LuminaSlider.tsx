import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GlassTransitionCanvas } from "./GlassTransitionCanvas";
import { KineticTitle } from "./KineticTitle";
import { LuminaVideoProps } from "./schema";
import { CLAMP, getSlideState } from "./timing";
import { display, mono, sans } from "./fonts";

const pad2 = (n: number) => String(n).padStart(2, "0");

export const LuminaSlider: React.FC<LuminaVideoProps> = ({ slides, secondsPerSlide, transitionSeconds, accentColor, bgmSrc, brandLabel }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;
  const n = slides.length;
  const { S, index, local, progress, from, to } = getSlideState(frame, fps, n, secondsPerSlide, transitionSeconds);

  // Title timing: slide 0 enters at 0.3s; later slides enter 0.6s after their transition starts.
  const enterDelay = Math.round((index === 0 ? 0.3 : 0.6) * fps);
  const titleT = local - enterDelay;
  const showPrev = index > 0 && local < enterDelay;
  const prevOutT = local;

  const m = isPortrait ? 64 : 80;
  const titleSize = isPortrait ? 150 : 210;
  const descSize = isPortrait ? 30 : 24;
  const monoSize = isPortrait ? 20 : 15;
  const descP = interpolate(titleT, [0.3 * fps, 1.1 * fps], [0, 1], CLAMP);
  const descOut = showPrev ? interpolate(prevOutT, [0, 0.4 * fps], [1, 0], CLAMP) : 1;
  const textSlide = showPrev ? index - 1 : index;
  const navCols = isPortrait ? 3 : n;

  return (
    <AbsoluteFill style={{ background: "#0a0a0a", color: "#f5f2ea", fontFamily: sans }}>
      <GlassTransitionCanvas width={width} height={height} sources={slides.map((s) => s.src)} from={from} to={to} progress={progress} />

      {/* neutral legibility scrims – black only, no colour gradients */}
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.35) 38%, rgba(10,10,10,0) 60%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.45) 0%, rgba(10,10,10,0) 18%)" }} />

      {/* header */}
      <div style={{ position: "absolute", top: m * 0.75, left: m, right: m, display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: mono, fontSize: monoSize, letterSpacing: "0.3em", textTransform: "uppercase" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span style={{ color: "#f5f2ea" }}>{pad2(index + 1)}</span>
          <span style={{ width: 36, height: 1, background: "rgba(245,242,234,0.4)", display: "inline-block", transform: "translateY(-4px)" }} />
          <span style={{ color: "rgba(245,242,234,0.5)" }}>{pad2(n)}</span>
        </div>
        {brandLabel ? <div style={{ color: "rgba(245,242,234,0.75)" }}>{brandLabel}</div> : null}
      </div>

      {/* title + description */}
      <div style={{ position: "absolute", left: m, right: m, bottom: isPortrait ? 420 : 210, display: "flex", flexDirection: isPortrait ? "column" : "row", alignItems: isPortrait ? "flex-start" : "flex-end", justifyContent: "space-between", gap: isPortrait ? 36 : 60 }}>
        <div style={{ position: "relative", minHeight: titleSize }}>
          {showPrev ? (
            <KineticTitle text={slides[index - 1].title} variant={index - 1} t={9999} outT={prevOutT} fps={fps} fontFamily={display} fontSize={titleSize} seed={`p${index - 1}`} />
          ) : (
            <KineticTitle text={slides[index].title} variant={index} t={titleT} outT={-1} fps={fps} fontFamily={display} fontSize={titleSize} seed={`t${index}`} />
          )}
        </div>
        <div
          style={{
            maxWidth: isPortrait ? 760 : 380,
            fontSize: descSize,
            lineHeight: 1.55,
            fontWeight: 300,
            color: "rgba(245,242,234,0.72)",
            opacity: (showPrev ? 1 : descP) * descOut,
            transform: `translateY(${showPrev ? 0 : (1 - descP) * 20}px)`,
            paddingBottom: isPortrait ? 0 : titleSize * 0.12,
          }}
        >
          <div style={{ width: 28, height: 1, background: accentColor, marginBottom: 18 }} />
          {slides[textSlide].description}
        </div>
      </div>

      {/* bottom nav with frame-driven progress lines */}
      <div style={{ position: "absolute", left: m, right: m, bottom: m * 0.8, display: "grid", gridTemplateColumns: `repeat(${navCols}, minmax(0, 1fr))`, columnGap: isPortrait ? 28 : 32, rowGap: 36 }}>
        {slides.map((s, i) => {
          const fill = i < index ? 1 : i > index ? 0 : interpolate(frame - index * S, [0, S], [0, 1], CLAMP);
          const active = i === index;
          return (
            <div key={i}>
              <div style={{ height: 1, background: "rgba(245,242,234,0.18)", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, top: 0, height: 1, width: `${fill * 100}%`, background: active ? accentColor : "rgba(245,242,234,0.55)" }} />
              </div>
              <div style={{ marginTop: 14, fontFamily: mono, fontSize: monoSize, letterSpacing: "0.18em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: active ? "#f5f2ea" : "rgba(245,242,234,0.38)" }}>
                <span style={{ color: active ? accentColor : "rgba(245,242,234,0.3)", marginRight: 10 }}>{pad2(i + 1)}</span>
                {s.title}
              </div>
            </div>
          );
        })}
      </div>

      {bgmSrc ? <Audio src={staticFile(bgmSrc)} volume={0.4} /> : null}
    </AbsoluteFill>
  );
};

export const calculateLuminaMetadata: CalculateMetadataFunction<LuminaVideoProps> = ({ props }) => {
  const fps = 60;
  return { durationInFrames: props.slides.length * Math.round(props.secondsPerSlide * fps) };
};
