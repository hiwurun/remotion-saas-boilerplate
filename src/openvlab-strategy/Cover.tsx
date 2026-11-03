import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";

/** Brand wordmark — same stack as openvlab-surf Cover (Geist / SANS). */
export const BRAND = SANS;

const W = 1920;
const H = 1080;

/**
 * Strategy cover Still — art from public/openvlab-strategy/covers/cover-art.jpg
 * (title + 3D surface), brand lockup top-left: logo.svg + OpenVlab in SANS.
 */
export const OpenVlabStrategyCover: React.FC = () => {
  const mark = 96;
  const pad = 72;
  const gap = 22;
  const wordSize = 52;

  return (
    <AbsoluteFill style={{ background: "#0a0a0e", overflow: "hidden" }}>
      <Img
        src={staticFile("openvlab-strategy/covers/cover-art.jpg")}
        style={{ position: "absolute", inset: 0, width: W, height: H, objectFit: "cover" }}
      />

      <div
        style={{
          position: "absolute",
          left: pad,
          top: pad,
          display: "flex",
          alignItems: "center",
          gap,
          padding: "14px 28px 14px 14px",
          borderRadius: 18,
          background: "rgba(0,0,0,0.45)",
        }}
      >
        <BrandMark size={mark} src="openvlab-strategy/logo.svg" />
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
    </AbsoluteFill>
  );
};
