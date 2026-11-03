import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";

/** Brand wordmark — same stack as openvlab-surf Cover (Geist / SANS). */
export const BRAND = SANS;

const ART = "openvlab-strategy/covers/cover-art.jpg";
const LOGO = "openvlab-strategy/logo.svg";

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

type FrameProps = {
  width: number;
  height: number;
  /** CSS object-position so the baked title stays in frame when cropping. */
  objectPosition?: string;
  brand: BrandBarProps;
};

const CoverFrame: React.FC<FrameProps> = ({ width, height, objectPosition = "50% 45%", brand }) => (
  <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden" }}>
    <Img
      src={staticFile(ART)}
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        objectFit: "cover",
        objectPosition,
      }}
    />
    <BrandBar {...brand} />
  </AbsoluteFill>
);

/**
 * Strategy cover Still — art from public/openvlab-strategy/covers/cover-art.jpg
 * (title + 3D surface), brand lockup top-left: logo.svg + OpenVlab in SANS.
 */
export const OpenVlabStrategyCover: React.FC = () => (
  <CoverFrame
    width={1920}
    height={1080}
    objectPosition="50% 50%"
    brand={{ mark: 96, pad: 72, gap: 22, wordSize: 52 }}
  />
);

/** 4:3 cover (1440×1080): same art cropped to fill, brand top-left. */
export const OpenVlabStrategyCover43: React.FC = () => (
  <CoverFrame
    width={1440}
    height={1080}
    objectPosition="50% 48%"
    brand={{ mark: 88, pad: 64, gap: 20, wordSize: 48 }}
  />
);

/** 3:4 cover (1080×1440): same art cropped to fill, brand top-left. */
export const OpenVlabStrategyCover34: React.FC = () => (
  <CoverFrame
    width={1080}
    height={1440}
    objectPosition="50% 42%"
    brand={{ mark: 84, pad: 56, gap: 18, wordSize: 44, padY: 12, padX: 22, radius: 16 }}
  />
);
