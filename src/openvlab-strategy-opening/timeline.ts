import { Easing, interpolate } from "remotion";
import { CLAMP, EASE } from "../shared/motion";
import { NOW_DTE, PRETTY_DTE } from "./data";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const DURATION_S = 36;
export const TOTAL = DURATION_S * FPS;

/** Soft in-out for state changes (gentler than EASE so moves read as deliberate, not snappy). */
export const SOFT = Easing.bezier(0.45, 0, 0.2, 1);

export const ramp = (t: number, a: number, b: number, easing = EASE) => interpolate(t, [a, b], [0, 1], { ...CLAMP, easing });
/** 0 → 1 over [a, b], back to 0 over [c, d]. */
export const window4 = (t: number, a: number, b: number, c: number, d: number) => ramp(t, a, b) * (1 - ramp(t, c, d));

/* ---------------- camera (world = the 1920×1080 frame layout the morph lands in) ---------------- */
type CamKey = { t: number; z: number; x: number; y: number };
const CAM: CamKey[] = [
  { t: 0, z: 0.92, x: 960, y: 540 }, // S0: mark on black
  { t: 2.9, z: 0.95, x: 960, y: 532 },
  { t: 5.0, z: 1.04, x: 962, y: 520 }, // the real chart, ruler above
  { t: 9.6, z: 1.68, x: 1245, y: 548 }, // S1: the pretty ramp + plateau fills the frame, ruler a sliver at the top
  { t: 12.0, z: 1.72, x: 1240, y: 546 },
  { t: 21.4, z: 1.8, x: 1225, y: 540 }, // S2: same shot, barely drifting while time scrubs back
  { t: 24.6, z: 1.95, x: 640, y: 596 }, // S3: down onto the loss floor → cut
  { t: 25.4, z: 1.98, x: 600, y: 604 },
  { t: 27.8, z: 1.45, x: 1130, y: 525 }, // S4: now vs near-expiry
  { t: 30.2, z: 1.48, x: 1140, y: 522 },
  { t: 34.0, z: 0.86, x: 960, y: 520 }, // pull-back
  { t: DURATION_S, z: 0.84, x: 960, y: 520 },
];

/** Fritsch–Carlson monotone cubic: C1 through every key, no overshoot, so the camera never stops dead or wobbles. */
const monotone = (ts: number[], ys: number[]) => {
  const n = ts.length;
  const d = ts.slice(0, -1).map((t, i) => (ys[i + 1] - ys[i]) / (ts[i + 1] - t));
  const m = ys.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? d[n - 2] : d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2));
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return (t: number) => {
    if (t <= ts[0]) return ys[0];
    if (t >= ts[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && t >= ts[i + 1]) i++;
    const h = ts[i + 1] - ts[i];
    const u = (t - ts[i]) / h;
    const u2 = u * u;
    const u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1];
  };
};
const KEY_T = CAM.map((k) => k.t);
const camLogZ = monotone(KEY_T, CAM.map((k) => Math.log(k.z)));
const camX = monotone(KEY_T, CAM.map((k) => k.x));
const camY = monotone(KEY_T, CAM.map((k) => k.y));

export const cameraAt = (t: number) => ({ z: Math.exp(camLogZ(t)), x: camX(t), y: camY(t) });

/* ---------------- story state ---------------- */
/** Time scrubs back from the near-expiry date to today, in-camera (S2). */
export const solidDteAt = (t: number) => PRETTY_DTE + (NOW_DTE - PRETTY_DTE) * ramp(t, 12.6, 19.6, SOFT);

/** S4: the near-expiry line returns as a dashed date line above "now", then settles onto it. */
export const ghostOpacityAt = (t: number) => ramp(t, 27.3, 28.2, SOFT) * (1 - ramp(t, 31.1, 31.7));
export const ghostDteAt = (t: number) => PRETTY_DTE + (NOW_DTE - PRETTY_DTE) * ramp(t, 30.0, 31.6, SOFT);

/** Full-frame ProfitTable insert (hard cut in / out). */
export const INSERT_FROM = 24.6;
export const INSERT_TO = 25.4;
