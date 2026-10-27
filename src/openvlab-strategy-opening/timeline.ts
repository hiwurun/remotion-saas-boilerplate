import { Easing, interpolate } from "remotion";
import { CLAMP, EASE } from "../shared/motion";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 56;
export const TOTAL = DURATION_S * FPS;

/** Shot boundaries (s). */
export const SHOTS = {
  s0: [0, 6],
  s1: [6, 13],
  s2: [13, 24],
  s3: [24, 34],
  s4: [34, 42],
  s5: [42, 50],
  s6: [50, 56],
} as const;

/** Soft in-out for camera and slider moves (gentler than EASE so moves read as deliberate, not snappy). */
export const SOFT = Easing.bezier(0.45, 0, 0.2, 1);

export const ramp = (t: number, a: number, b: number, easing = EASE) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing });
/** 0 → 1 over [a, b], back to 0 over [c, d]. */
export const window4 = (t: number, a: number, b: number, c: number, d: number) => ramp(t, a, b) * (1 - ramp(t, c, d));

/* ---------------- camera (world = the 1920×1080 frame layout at the end of S0) ---------------- */
type CamKey = { t: number; z: number; x: number; y: number };
const CAM: CamKey[] = [
  { t: 0, z: 0.9, x: 960, y: 540 }, // S0: logo on black
  { t: 5.6, z: 1, x: 960, y: 540 }, // push-in until the chart has landed full-frame
  { t: 6.0, z: 1, x: 960, y: 540 },
  { t: 9.8, z: 1.38, x: 1040, y: 470 }, // S1: slow push onto the T+0 mid segment, ruler in frame above
  { t: 13.0, z: 1.38, x: 1040, y: 470 },
  { t: 14.8, z: 1.05, x: 960, y: 590 }, // S2: slight pull-back to reveal the date slider
  { t: 24.6, z: 1.05, x: 960, y: 590 },
  { t: 27.4, z: 1.55, x: 1150, y: 480 }, // S3: push into the split between the two lines, ruler kept whole
  { t: 33.6, z: 1.55, x: 1150, y: 480 },
  { t: 35.0, z: 1, x: 960, y: 540 }, // S4: frame the whole panel for the table slide
  { t: 41.6, z: 1, x: 960, y: 540 },
  { t: 43.4, z: 1.08, x: 975, y: 600 }, // S5: chart + IV slider, legend kept in frame
  { t: 50.4, z: 1.08, x: 975, y: 600 },
  { t: 54.8, z: 0.84, x: 960, y: 540 }, // S6: slow pull-back
  { t: DURATION_S, z: 0.82, x: 960, y: 540 },
];

export const cameraAt = (t: number) => {
  let i = 0;
  while (i < CAM.length - 2 && t >= CAM[i + 1].t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const p = SOFT(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))));
  return {
    z: Math.exp(Math.log(a.z) + (Math.log(b.z) - Math.log(a.z)) * p),
    x: a.x + (b.x - a.x) * p,
    y: a.y + (b.y - a.y) * p,
  };
};

/* ---------------- story state ---------------- */
export const NOW_DTE = 24.4;
export const NEAR_EXPIRY_DTE = 2.4;
export const MID_DTE = 6.4;
export const IV_LOW = 0.6;
/** Spot price used for the confrontation read-out. */
export const SPOT_PRICE = 6740;

/** Date slider: now → 11/18 during S2, then frozen. */
export const solidDteAt = (t: number) => NOW_DTE + (NEAR_EXPIRY_DTE - NOW_DTE) * ramp(t, 15.2, 19.6, SOFT);
/** IV slider: once, 1x → 0.6x in S5. */
export const ivMultAt = (t: number) => 1 + (IV_LOW - 1) * ramp(t, 43.6, 46.2, SOFT);
/** Ghost of the "now" line splits off the solid in S3 and merges back in S6. */
export const ghostSplitAt = (t: number) => ramp(t, 24.8, 27.0, SOFT) * (1 - ramp(t, 50.0, 51.8, SOFT));
export const ghostVisible = (t: number) => t >= 24.8 && t < 51.8;

/** Panel slide to the table (S4): 0 = chart, 1 = table. */
export const tableSlideAt = (t: number) => ramp(t, 35.0, 36.3, SOFT) * (1 - ramp(t, 39.8, 41.1, SOFT));

export const CAPTIONS: Array<{ from: number; to: number; text: string }> = [
  { from: 7.2, to: 12.6, text: "先看现在这条线 · 横轴是标的价格" },
  { from: 15.6, to: 23.6, text: "时间一动，同一个策略的盈亏形状就变了" },
  { from: 27.8, to: 33.4, text: "到期好看，不等于现在好看" },
  { from: 36.8, to: 40.0, text: "曲线的形状，就是表里的这些数字" },
  { from: 44.0, to: 49.6, text: "波动率假设错了，哪条线“好看”也会跟着变" },
];
