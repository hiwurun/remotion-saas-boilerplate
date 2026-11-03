import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";

/** Brand wordmark — same stack as openvlab-surf Cover (Geist / SANS). */
export const BRAND = SANS;

const LOGO = "openvlab-strategy/logo.svg";
const ART_16 = "openvlab-strategy/covers/cover-art.jpg";
const SURFACE = "openvlab-strategy/covers/surface-plate.png";

const TITLE_L1 = "如何理解";
const TITLE_L2 = "期权时间价值";

/** Match the baked 16:9 title: 期权 cool cyan → 时间价值 warm peach. */
const TITLE_GRAD =
  "linear-gradient(90deg, #8ecfff 0%, #b8dfff 28%, #e8d4a0 62%, #e0b070 100%)";

type BrandBarProps = {
  mark: number;
  pad: number;
  gap: number;
  wordSize: number;
  padY?: number;
  padX?: number;
  radius?: number;
};

const BrandBar: React.FC<BrandBarProps> = ({
  mark,
  pad,
  gap,
  wordSize,
  padY = 14,
  padX = 28,
  radius = 18,
}) => (
  <div
    style={{
      position: "absolute",
      left: pad,
      top: pad,
      display: "flex",
      alignItems: "center",
      gap,
      padding: `${padY}px ${padX}px ${padY}px ${padY}px`,
      borderRadius: radius,
      background: "rgba(0,0,0,0.45)",
      zIndex: 3,
    }}
  >
    <BrandMark size={mark} src={LOGO} />
    <div
      style={{
        fontFamily: BRAND,
        fontSize: wordSize,
        fontWeight: 700,
        letterSpacing: "-0.04em",
        color: "#f5f5f7",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      OpenVlab
    </div>
  </div>
);

type TitleBlockProps = {
  left: number;
  top: number;
  fontSize: number;
  lineHeight?: number;
  maxWidth?: number;
};

const TitleBlock: React.FC<TitleBlockProps> = ({
  left,
  top,
  fontSize,
  lineHeight = 1.12,
  maxWidth,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      maxWidth,
      zIndex: 3,
      fontFamily: SANS,
      fontWeight: 800,
      fontSize,
      letterSpacing: "-0.03em",
      lineHeight,
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ color: "#f5f5f7" }}>{TITLE_L1}</div>
    <div
      style={{
        backgroundImage: TITLE_GRAD,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
      }}
    >
      {TITLE_L2}
    </div>
  </div>
);

/**
 * 16:9 — keep the approved baked cover-art (title + surface already composed).
 */
export const OpenVlabStrategyCover: React.FC = () => (
  <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden" }}>
    <Img
      src={staticFile(ART_16)}
      style={{ position: "absolute", inset: 0, width: 1920, height: 1080, objectFit: "cover" }}
    />
    <BrandBar mark={96} pad={72} gap={22} wordSize={52} />
  </AbsoluteFill>
);

/**
 * 4:3 (1440×1080) — re-layout like surf: brand + title on top, surface fills the lower half.
 */
export const OpenVlabStrategyCover43: React.FC = () => {
  const W = 1440;
  const H = 1080;
  return (
    <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden", fontFamily: SANS }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 55% 72%, rgba(220,80,40,0.14) 0%, rgba(10,10,14,0) 70%)",
        }}
      />
      {/* surface lower / slightly right */}
      <Img
        src={staticFile(SURFACE)}
        style={{
          position: "absolute",
          left: 80,
          top: 320,
          width: W - 100,
          height: H - 280,
          objectFit: "contain",
          objectPosition: "50% 40%",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.98) 0px, rgba(10,10,14,0.88) 280px, rgba(10,10,14,0.15) 520px, rgba(10,10,14,0) 640px)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
      <BrandBar mark={72} pad={72} gap={18} wordSize={40} padY={12} padX={22} radius={16} />
      <TitleBlock left={72} top={200} fontSize={96} />
    </AbsoluteFill>
  );
};

/**
 * 3:4 (1080×1440) — stacked re-layout: brand + title on top, surface fills the lower frame.
 */
export const OpenVlabStrategyCover34: React.FC = () => {
  const W = 1080;
  const H = 1440;
  return (
    <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden", fontFamily: SANS }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 70%, rgba(220,80,40,0.14) 0%, rgba(10,10,14,0) 70%)",
        }}
      />
      <Img
        src={staticFile(SURFACE)}
        style={{
          position: "absolute",
          left: 20,
          top: 420,
          width: W - 40,
          height: H - 400,
          objectFit: "contain",
          objectPosition: "50% 35%",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,14,0.98) 0px, rgba(10,10,14,0.9) 340px, rgba(10,10,14,0.2) 620px, rgba(10,10,14,0) 780px)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 55%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      <BrandBar mark={68} pad={56} gap={16} wordSize={36} padY={12} padX={20} radius={14} />
      <TitleBlock left={56} top={220} fontSize={84} lineHeight={1.14} />
    </AbsoluteFill>
  );
};
