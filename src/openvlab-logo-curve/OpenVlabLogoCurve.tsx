import React from "react";
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";
import {
  COUNT,
  CURVE,
  CURVE_FRAME_ANGLE,
  CURVE_PATH,
  CURVE_SEG_ANGLE,
  CURVE_SEG_LEN,
  CURVE_WIDTH,
  LOGO_CENTER,
  LOGO_SIZE,
  type Pt,
  V_CENTER,
  V_FRAME_ANGLE,
  V_INNER_LOCAL,
  V_OUTER_LOCAL,
  V_SEG_ANGLE,
  V_SEG_LEN,
  VERTEX_INDEX,
  geom,
} from "./vMark";

/**
 * Single trial shot: the OpenVlab mark settles, its amber disc drains into the V, and the V's stroke unbends
 * into the smooth T+0 PnL curve of the strategy chart (bare stroke, ready for axes/colour overlays).
 */
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const TOTAL = Math.round(3.9 * FPS);

const LOGO_SRC = "openvlab-market/logo.svg";
const BG = "#050608";
const GOLD = "#FFD84A";
const LINE = "#F4EFE4";

const SOFT_IN = Easing.bezier(0.33, 0, 0.2, 1);

const fmt = (p: Pt) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`;

/**
 * Bends the V's centreline into the curve: every tangent angle and segment length is interpolated toward the
 * curve's, then re-integrated outward from the vertex, so the stroke unfolds like a wire instead of cross-fading.
 * Outline points ride along in each centreline point's local frame while the stroke thins to CURVE_WIDTH.
 */
const morphOutline = (opts: { k: number; bend: number; grow: number; thin: number; travel: number }) => {
  const { k, bend, grow, thin, travel } = opts;
  const toScreen = (p: Pt): Pt => ({ x: W / 2 + (p.x - LOGO_CENTER) * k, y: H / 2 + (p.y - LOGO_CENTER) * k });

  const center: Pt[] = new Array(COUNT);
  center[VERTEX_INDEX] = geom.lerpPt(toScreen(V_CENTER[VERTEX_INDEX]), CURVE[VERTEX_INDEX], travel);
  const step = (i: number) => {
    const ang = V_SEG_ANGLE[i] + (CURVE_SEG_ANGLE[i] - V_SEG_ANGLE[i]) * bend;
    const len = V_SEG_LEN[i] * k + (CURVE_SEG_LEN[i] - V_SEG_LEN[i] * k) * grow;
    return { x: Math.cos(ang) * len, y: Math.sin(ang) * len };
  };
  for (let i = VERTEX_INDEX; i < COUNT - 1; i++) center[i + 1] = geom.add(center[i], step(i));
  for (let i = VERTEX_INDEX - 1; i >= 0; i--) center[i] = geom.sub(center[i + 1], step(i));

  const half = CURVE_WIDTH / 2;
  const inner: string[] = [];
  const outer: string[] = [];
  for (let i = 0; i < COUNT; i++) {
    const frame = V_FRAME_ANGLE[i] + (CURVE_FRAME_ANGLE[i] - V_FRAME_ANGLE[i]) * bend;
    const a = V_INNER_LOCAL[i];
    const b = V_OUTER_LOCAL[i];
    const aOff = geom.rotate({ x: a.x * k * (1 - thin), y: a.y * k + (-half - a.y * k) * thin }, frame);
    const bOff = geom.rotate({ x: b.x * k * (1 - thin), y: b.y * k + (half - b.y * k) * thin }, frame);
    inner.push(fmt(geom.add(center[i], aOff)));
    outer.push(fmt(geom.add(center[i], bOff)));
  }
  return [...inner, ...outer.reverse()].join(" ");
};

export const OpenVlabLogoCurve: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const fadeIn = interpolate(t, [0, 0.8], [0, 1], { ...CLAMP, easing: SOFT_IN });
  const intro = interpolate(t, [0, 1.45], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const ignite = interpolate(t, [1.0, 1.45], [0, 1], { ...CLAMP, easing: EASE });
  const discOut = interpolate(t, [1.1, 1.6], [0, 1], { ...CLAMP, easing: EASE });
  const ring = interpolate(t, [1.12, 1.95], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const bend = interpolate(t, [1.45, 2.65], [0, 1], { ...CLAMP, easing: EASE });
  const grow = interpolate(t, [1.55, 2.85], [0, 1], { ...CLAMP, easing: EASE });
  const thin = interpolate(t, [1.45, 2.35], [0, 1], { ...CLAMP, easing: EASE });
  const travel = interpolate(t, [1.5, 2.8], [0, 1], { ...CLAMP, easing: EASE });
  // Every morph envelope has finished by 2.85s; from here the identical smooth path replaces the ribbon in one frame.
  const settled = t >= 2.86;

  const k = 0.86 + 0.09 * intro;
  const discOpacity = fadeIn * (1 - discOut);
  const points = morphOutline({ k, bend, grow, thin, travel });
  const fill = interpolateColors(t, [1.9, 2.8], [GOLD, LINE]);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: W / 2 - LOGO_CENTER * k,
          top: H / 2 - LOGO_CENTER * k,
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          transformOrigin: "0 0",
          transform: `scale(${k})`,
          opacity: discOpacity,
          visibility: discOpacity > 0.001 ? "visible" : "hidden",
        }}
      >
        <BrandMark size={LOGO_SIZE} src={LOGO_SRC} glow={0.9 * (1 - discOut * 0.6)} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <circle
          cx={W / 2}
          cy={H / 2}
          r={(206 + 120 * ring) * k}
          fill="none"
          stroke="#FFE9A0"
          strokeWidth={2.5}
          opacity={0.55 * (1 - ring) * Math.min(1, ring * 6)}
        />
        <g opacity={ignite}>
          <polygon points={points} fill={fill} visibility={settled ? "hidden" : "visible"} />
          <path
            d={CURVE_PATH}
            fill="none"
            stroke={LINE}
            strokeWidth={CURVE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            visibility={settled ? "visible" : "hidden"}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
