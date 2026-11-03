import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";

/** Brand wordmark — same stack as openvlab-surf Cover (Geist / SANS). */
export const BRAND = SANS;

const LOGO = "openvlab-strategy/logo.svg";
const SURFACE = "openvlab-strategy/covers/surface-plate.png";

const TITLE_L1 = "如何理解";
const TITLE_L2 = "期权时间价值";

/** Match the approved cover: 期权 cool cyan → 时间价值 warm peach. */
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
  top?: number;
  fontSize: number;
  lineHeight?: number;
  vCenter?: boolean;
};

const TitleBlock: React.FC<TitleBlockProps> = ({
  left,
  top,
  fontSize,
  lineHeight = 1.12,
  vCenter,
}) => {
  const block = (
    <div
      style={{
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

  if (vCenter) {
    return (
      <div
        style={{
          position: "absolute",
          left,
          top: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        {block}
      </div>
    );
  }

  return (
    <div style={{ position: "absolute", left, top, zIndex: 3 }}>{block}</div>
  );
};

/**
 * 16:9 — remotion re-layout (left title, right surface). No baked typo.
 */
export const OpenVlabStrategyCover: React.FC = () => {
  const W = 1920;
  const H = 1080;
  return (
    <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden", fontFamily: SANS }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 68% 52%, rgba(220,80,40,0.14) 0%, rgba(10,10,14,0) 70%)",
        }}
      />
      <Img
        src={staticFile(SURFACE)}
        style={{
          position: "absolute",
          left: 780,
          top: 40,
          width: W - 740,
          height: H - 40,
          objectFit: "contain",
          objectPosition: "40% 45%",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, rgba(10,10,14,0.98) 0px, rgba(10,10,14,0.92) 520px, rgba(10,10,14,0.35) 900px, rgba(10,10,14,0) 1180px)`,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 88% 88% at 55% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
      <BrandBar mark={96} pad={72} gap={22} wordSize={52} />
      <TitleBlock left={96} fontSize={118} vCenter />
    </AbsoluteFill>
  );
};

/**
 * 4:3 (1440×1080) — brand + title on top, surface fills the lower half.
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
 * 3:4 (1080×1440) — stacked: brand + title on top, surface fills the lower frame.
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
