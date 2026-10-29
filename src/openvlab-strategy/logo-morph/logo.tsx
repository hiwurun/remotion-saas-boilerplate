import React from "react";
import { Img, staticFile } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { GLYPH_D } from "./glyph";

/** Logo V ⇄ payoff-V geometry. All path strings share one structure ("M C C") so interpolatePath can morph them. */
export type Pt = { x: number; y: number };

/** Hand-placed centerline of the logo's V, in the glyph's raw path units (see glyph.ts). */
export const CENTERLINE: Pt[] = [
  { x: 428, y: 438 },
  { x: 430, y: 520 },
  { x: 470, y: 650 },
  { x: 507, y: 722 },
  { x: 575, y: 668 },
  { x: 655, y: 540 },
  { x: 705, y: 430 },
];
/** Raw glyph units -> 512 logo box (group translate(-18 -42) scale(1.07), path scale(.5)). */
const toLogo = (p: Pt): Pt => ({ x: p.x * 0.535 - 18, y: p.y * 0.535 - 42 });
export const logoToScreen = (p: Pt, cx: number, cy: number, size: number): Pt => {
  const l = toLogo(p);
  return { x: cx + ((l.x - 256) * size) / 512, y: cy + ((l.y - 256) * size) / 512 };
};
export const glyphStrokeWidth = (size: number) => (82 * 0.535 * size) / 512;

const fmt = (n: number) => n.toFixed(2);
const P = (p: Pt) => `${fmt(p.x)} ${fmt(p.y)}`;
const cubic = (pts: Pt[]) => `M ${P(pts[0])} C ${P(pts[1])}, ${P(pts[2])}, ${P(pts[3])} C ${P(pts[4])}, ${P(pts[5])}, ${P(pts[6])}`;

export const logoCenterline = (cx: number, cy: number, size: number): string => cubic(CENTERLINE.map((p) => logoToScreen(p, cx, cy, size)));

const third = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
/** Straight V through three points, written as two degenerate cubics ("M C C"). */
export const straightV = (a: Pt, v: Pt, b: Pt): string => cubic([a, third(a, v, 1 / 3), third(a, v, 2 / 3), v, third(v, b, 1 / 3), third(v, b, 2 / 3), b]);

/** The screen-space payoff V used by the hook and the cliffhanger. */
export const SCREEN_V = { a: { x: 150, y: 640 }, v: { x: 960, y: 930 }, b: { x: 1770, y: 640 } };
export const SCREEN_V_D = straightV(SCREEN_V.a, SCREEN_V.v, SCREEN_V.b);

/** `light`: variant for light grounds (pale thin glass rim instead of the dark edge shade). */
export const LogoDisc: React.FC<{ cx: number; cy: number; size: number; opacity?: number; scale?: number; light?: boolean }> = ({ cx, cy, size, opacity = 1, scale = 1, light = false }) => (
  <Img
    src={staticFile(light ? "openvlab-strategy/logo-disc-light.svg" : "openvlab-strategy/logo-disc.svg")}
    style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}
  />
);

/** Full-frame svg overlay. Draws the filled glyph exactly where the logo's V sits. */
export const LogoGlyph: React.FC<{ cx: number; cy: number; size: number; opacity?: number; scale?: number }> = ({ cx, cy, size, opacity = 1, scale = 1 }) => {
  const k = size / 512;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible" }}>
      <defs>
        <filter id="strategyVShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000" floodOpacity="0.16" />
        </filter>
      </defs>
      <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-size / 2} ${-size / 2}) scale(${k}) translate(-18 -42) scale(1.07)`} filter="url(#strategyVShadow)">
        <path transform="scale(0.5)" d={GLYPH_D} fill="#1d1816" />
      </g>
    </svg>
  );
};

/** A stroked V path on a full-frame svg, with an optional "second hand" dot sliding along it (dotT 0..1). */
export const VStroke: React.FC<{
  d: string;
  width: number;
  color: string;
  opacity?: number;
  dotT?: number | null;
  dotOpacity?: number;
  glow?: number;
  trail?: number;
}> = ({ d, width, color, opacity = 1, dotT = null, dotOpacity = 1, glow = 0, trail = 0.12 }) => {
  const len = dotT === null ? 0 : getLength(d);
  const dot = dotT === null ? null : getPointAtLength(d, len * Math.max(0, Math.min(1, dotT)));
  const start = dotT === null ? 0 : Math.max(0, dotT - trail);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity, overflow: "visible", filter: glow > 0 ? `drop-shadow(0 0 ${glow}px ${color})` : undefined }}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {dot ? (
        <>
          <path d={d} pathLength={1} fill="none" stroke="#fff" strokeWidth={width + 3} strokeLinecap="round" strokeDasharray={`${Math.max(0.0001, (dotT ?? 0) - start)} 2`} strokeDashoffset={-start} opacity={0.9 * dotOpacity} />
          <circle cx={dot.x} cy={dot.y} r={16} fill="#fff" opacity={0.25 * dotOpacity} />
          <circle cx={dot.x} cy={dot.y} r={8} fill="#fff" opacity={dotOpacity} style={{ filter: "drop-shadow(0 0 14px #fff)" }} />
        </>
      ) : null}
    </svg>
  );
};
