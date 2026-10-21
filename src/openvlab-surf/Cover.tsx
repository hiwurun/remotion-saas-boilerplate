import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../openvlab-market/theme";
import { MONO, SANS } from "../shared/fonts";
import { SurfaceCanvas } from "./components/SurfaceCanvas";
import { EXPIRIES, NEAR, PRODUCT, PRODUCT_NAME } from "./data";
import { H, W, cameraAt } from "./timeline";
import type { SceneState } from "./surface3d";

/** Static cover (thumbnail): the real IM surface from the front (v7 framing), title block left, brand bottom-right. */
const AMBER = "#F7931A";
/** horizontal shift of the whole title + surface group so its bounding box is centred in the frame */
const DX = 92;
const AMBER_HI = "#FFB454";
const FAR = EXPIRIES[EXPIRIES.length - 1]!;

// v7 front framing (near month nearest, 6000 put wing rising on the right), surface right of centre, vertically centred
const POSE = { t: 0, theta: -160, phi: 17, r: 2.85, target: [0.12, 0.3, -0.1] as [number, number, number], fov: 40 };
const STATE: SceneState = {
  camera: cameraAt(0, [POSE, { ...POSE, t: 1 }]),
  fan: 1,
  hookDays: NEAR.days,
  surfaceOpacity: 1,
  wireOpacity: 1,
  colorSweep: 1,
  axisStrike: 0,
  axisDays: 0,
  axisVol: 0,
  axisOi: 0,
  grid: 0.5,
  smileDraw: 0,
  smileAlpha: 0,
  smileDays: NEAR.days,
  termDraw: 0,
  termAlpha: 0,
  hookAlpha: 0,
  edgeDraw: 1,
  dim: 0,
  vMorph: 0,
  vColor: 0,
  vShape: null,
  peak: 0,
  oiGrow: 0,
  glow: 0.6,
};

export const OpenVlabSurfCover: React.FC = () => (
  <AbsoluteFill style={{ background: "#050608", fontFamily: SANS, overflow: "hidden" }}>
    {/* soft violet bloom behind the surface */}
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 60% at 66% 50%, rgba(176,113,232,0.16) 0%, rgba(5,6,8,0) 70%)" }} />
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${DX}px)` }}>
      <SurfaceCanvas state={STATE} width={W} height={H} />
    </div>
    {/* left fade so the title reads; vignette on the frame edges */}
    <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(5,6,8,0.96) 0px, rgba(5,6,8,0.96) ${DX}px, rgba(5,6,8,0.8) ${576 + DX}px, rgba(5,6,8,0) ${998 + DX}px)` }} />
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 85% at 55% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)" }} />

    {/* brand row, as in the video */}
    <div style={{ position: "absolute", left: 96, top: 84, display: "flex", alignItems: "center", gap: 22 }}>
      <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1 }}>{PRODUCT}</div>
      <div style={{ width: 2, height: 46, background: `linear-gradient(${AMBER_HI}, ${AMBER})`, borderRadius: 1 }} />
      <div style={{ fontSize: 28, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{PRODUCT_NAME}</div>
    </div>

    {/* title block */}
    {/* vertically centred in the frame */}
    <div style={{ position: "absolute", left: 96 + DX, top: 0, height: 1080, width: 860, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ fontSize: 132, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.08, color: C.ink }}>
        如何看懂
        <br />
        <span style={{ fontFamily: SANS }}>3D 波动率曲面</span>
      </div>
      <div style={{ width: 96, height: 4, borderRadius: 2, background: `linear-gradient(90deg, ${AMBER_HI}, ${AMBER})`, margin: "52px 0 34px" }} />
      <div style={{ fontSize: 34, color: C.muted, fontFamily: MONO, letterSpacing: "0.01em" }}>{`${EXPIRIES.length} 个到期月 · ${NEAR.days}–${FAR.days} 天`}</div>
    </div>
  </AbsoluteFill>
);
