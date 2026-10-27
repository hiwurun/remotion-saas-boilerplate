/**
 * Geometry for the V → PnL-curve morph, computed once at module load.
 *
 * The V path and its transform are copied verbatim from public/openvlab-market/logo.svg (512×512 viewBox), so the
 * sampled outline sits exactly on top of the rendered <Img> of the logo.
 */
import { T0_SCREEN_POINTS } from "./strategy-chart/model";

export type Pt = { x: number; y: number };

export const LOGO_SIZE = 512;
export const LOGO_CENTER = 256;

/** The asset nests the path in `translate(-18 -42) scale(1.07)` then `scale(0.5)`. */
const PATH_SCALE = 0.535;
const PATH_DX = -18;
const PATH_DY = -42;

const V_PATH =
  "M665.6 393.846154c-19.692308-3.938462-39.384615-3.938462-59.076923 7.876923-19.692308 7.876923-35.446154 19.692308-47.261539 31.507692-3.938462 7.876923-7.876923 11.815385-11.815384 19.692308-3.938462 7.876923 0 15.753846 7.876923 15.753846h3.938461c7.876923 0 15.753846 0 23.63077 7.876923 11.815385 11.815385 15.753846 27.569231 7.876923 43.323077-7.876923 19.692308-15.753846 35.446154-27.569231 55.138462-15.753846 19.692308-23.630769 27.569231-31.507692 31.507692-7.876923 3.938462-11.815385-3.938462-15.753846-11.815385-7.876923-15.753846-11.815385-31.507692-15.753847-47.261538-7.876923-27.569231-15.753846-70.892308-19.692307-98.461539 0-15.753846-7.876923-31.507692-15.753846-43.323077-7.876923-11.815385-23.630769-15.753846-35.446154-11.815384-23.630769 7.876923-43.323077 19.692308-59.076923 35.446154-15.753846 15.753846-31.507692 27.569231-47.261539 43.323077-3.938462 3.938462-3.938462 11.815385 0 15.753846 3.938462 3.938462 11.815385 7.876923 15.753846 3.938461 3.938462-3.938462 11.815385-3.938462 15.753846-7.876923 3.938462-3.938462 19.692308-11.815385 27.569231 7.876923s11.815385 43.323077 23.630769 78.769231c11.815385 43.323077 19.692308 63.015385 27.569231 86.646154 3.938462 19.692308 15.753846 39.384615 31.507693 55.138461 15.753846 11.815385 35.446154 15.753846 55.138461 7.876924 23.630769-15.753846 47.261538-35.446154 66.953846-55.138462 43.323077-39.384615 78.769231-90.584615 102.4-145.723077 15.753846-27.569231 19.692308-59.076923 15.753846-90.584615-3.938462-11.815385-19.692308-31.507692-39.384615-35.446154z";

/** Stroke thickness of the bare curve at the end of the morph, px. */
export const CURVE_WIDTH = 5;

const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y });
const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const rotate = (p: Pt, ang: number): Pt => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

/** Samples the (relative-command) path; result[k] holds the points of command k, ending at anchor k. */
const sampleSegments = (d: string, steps = 24): Pt[][] => {
  const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const segs: Pt[][] = [];
  let i = 0;
  let cmd = "";
  let cur: Pt = { x: 0, y: 0 };
  let prevCtrl: Pt | null = null;
  const num = () => Number(toks[i++]);
  const rel = (): Pt => ({ x: cur.x + num(), y: cur.y + num() });
  const cubic = (p0: Pt, p1: Pt, p2: Pt, p3: Pt): Pt[] =>
    Array.from({ length: steps }, (_, k) => {
      const t = (k + 1) / steps;
      const u = 1 - t;
      return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
      };
    });
  while (i < toks.length) {
    if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
    if (cmd === "z" || cmd === "Z") break;
    if (cmd === "M") {
      cur = { x: num(), y: num() };
      segs.push([cur]);
      prevCtrl = null;
      cmd = "l";
    } else if (cmd === "c") {
      const p1 = rel();
      const p2 = rel();
      const p3 = rel();
      segs.push(cubic(cur, p1, p2, p3));
      prevCtrl = p2;
      cur = p3;
    } else if (cmd === "s") {
      const p1 = prevCtrl ? { x: 2 * cur.x - prevCtrl.x, y: 2 * cur.y - prevCtrl.y } : cur;
      const p2 = rel();
      const p3 = rel();
      segs.push(cubic(cur, p1, p2, p3));
      prevCtrl = p2;
      cur = p3;
    } else if (cmd === "h" || cmd === "v" || cmd === "l") {
      const p = cmd === "h" ? { x: cur.x + num(), y: cur.y } : cmd === "v" ? { x: cur.x, y: cur.y + num() } : rel();
      segs.push([p]);
      prevCtrl = null;
      cur = p;
    } else {
      throw new Error(`Unsupported path command ${cmd}`);
    }
  }
  return segs.map((s) => s.map((p) => ({ x: p.x * PATH_SCALE + PATH_DX, y: p.y * PATH_SCALE + PATH_DY })));
};

const SEGS = sampleSegments(V_PATH);
const between = (a: number, b: number): Pt[] => [SEGS[a][SEGS[a].length - 1], ...SEGS.slice(a + 1, b + 1).flat()];

/** Resamples a polyline to `n` points evenly spaced by arc length (end point excluded unless `withEnd`). */
const resample = (pts: Pt[], n: number, withEnd = false): Pt[] => {
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + dist(pts[k - 1], pts[k]));
  const total = cum[cum.length - 1];
  const count = withEnd ? n - 1 : n;
  const out: Pt[] = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const s = (total * k) / count;
    while (j < cum.length - 1 && cum[j] < s) j++;
    const seg = cum[j] - cum[j - 1] || 1;
    out.push(lerpPt(pts[j - 1], pts[j], Math.min(1, Math.max(0, (s - cum[j - 1]) / seg))));
  }
  return out;
};

/**
 * The outline runs anchor 0 (right-arm tip) → inner edge → 16 (hook tip) → 17 → outer edge → 28 (= 0).
 * Both edges are split at matching landmarks (hook tip · top of left stroke · vertex · right tip) so paired
 * points stay across the stroke from each other.
 */
const PIECES = [
  { inner: [14, 16], outer: [17, 20], n: 56, u: [0, 0.12] },
  { inner: [10, 14], outer: [20, 24], n: 128, u: [0.12, 0.48] },
  { inner: [0, 10], outer: [24, 28], n: 194, u: [0.48, 1] },
] as const;

const INNER: Pt[] = [];
const OUTER: Pt[] = [];
export const U: number[] = [];
PIECES.forEach((p, idx) => {
  const last = idx === PIECES.length - 1;
  INNER.push(...resample(between(p.inner[0], p.inner[1]).reverse(), p.n, last));
  OUTER.push(...resample(between(p.outer[0], p.outer[1]), p.n, last));
  for (let k = 0; k < p.n; k++) U.push(p.u[0] + ((p.u[1] - p.u[0]) * k) / (last ? p.n - 1 : p.n));
});
export const COUNT = U.length;
/** Index of the V's vertex; the morph is integrated outward from here. */
export const VERTEX_INDEX = PIECES[0].n + PIECES[1].n;

const unwrap = (angles: number[]) => {
  const out = [angles[0]];
  for (let k = 1; k < angles.length; k++) {
    let a = angles[k];
    while (a - out[k - 1] > Math.PI) a -= 2 * Math.PI;
    while (a - out[k - 1] < -Math.PI) a += 2 * Math.PI;
    out.push(a);
  }
  return out;
};
const pointAngles = (pts: Pt[]) =>
  unwrap(pts.map((_, k) => {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    return Math.atan2(b.y - a.y, b.x - a.x);
  }));
const segAngles = (pts: Pt[]) => unwrap(pts.slice(0, -1).map((p, k) => Math.atan2(pts[k + 1].y - p.y, pts[k + 1].x - p.x)));
const segLengths = (pts: Pt[]) => pts.slice(0, -1).map((p, k) => dist(p, pts[k + 1]));

const rawCenter = INNER.map((p, k) => lerpPt(p, OUTER[k], 0.5));
/**
 * Arc-length pairing of the two edges leaves small zig-zags in their midpoints. The morph stretches the
 * centreline ~5×, which would turn that residue into a visible ripple, so it is box-filtered a few passes.
 * The outline itself stays exact: edge points are stored relative to this centreline.
 */
const SMOOTH = 6;
const SMOOTH_PASSES = 3;
const boxFilter = (pts: Pt[]): Pt[] =>
  pts.map((p, k) => {
    if (k === 0 || k === pts.length - 1) return p;
    const r = Math.min(SMOOTH, k, pts.length - 1 - k);
    let sx = 0;
    let sy = 0;
    for (let j = k - r; j <= k + r; j++) {
      sx += pts[j].x;
      sy += pts[j].y;
    }
    return { x: sx / (2 * r + 1), y: sy / (2 * r + 1) };
  });
/** Smoothed centreline of the V stroke, logo units. */
export const V_CENTER: Pt[] = Array.from({ length: SMOOTH_PASSES }).reduce<Pt[]>((pts) => boxFilter(pts), rawCenter);
export const V_FRAME_ANGLE = pointAngles(V_CENTER);
export const V_SEG_ANGLE = segAngles(V_CENTER);
export const V_SEG_LEN = segLengths(V_CENTER);
/** Each outline point relative to its centreline point, in the centreline's local frame (tangent = +x). */
export const V_INNER_LOCAL = INNER.map((p, k) => rotate(sub(p, V_CENTER[k]), -V_FRAME_ANGLE[k]));
export const V_OUTER_LOCAL = OUTER.map((p, k) => rotate(sub(p, V_CENTER[k]), -V_FRAME_ANGLE[k]));

/** Morph target: a polyline in screen px, sampled at the same arc-length fractions U as the V. */
export type CurveTarget = {
  CURVE: Pt[];
  CURVE_FRAME_ANGLE: number[];
  CURVE_SEG_ANGLE: number[];
  CURVE_SEG_LEN: number[];
  /** SVG path of the finished curve through every sample, for the settled end state. */
  CURVE_PATH: string;
};

export const buildCurveTarget = (dense: Pt[]): CurveTarget => {
  const denseCum = [0];
  for (let k = 1; k < dense.length; k++) denseCum.push(denseCum[k - 1] + dist(dense[k - 1], dense[k]));
  const denseTotal = denseCum[denseCum.length - 1];
  const curve: Pt[] = U.map((u) => {
    const s = u * denseTotal;
    let j = 1;
    while (j < dense.length - 1 && denseCum[j] < s) j++;
    return lerpPt(dense[j - 1], dense[j], (s - denseCum[j - 1]) / (denseCum[j] - denseCum[j - 1] || 1));
  });
  const frame = pointAngles(curve);
  const seg = segAngles(curve);
  // Unwrapped V and curve angles must describe the same winding, otherwise a segment would spin a full turn.
  const align = Math.round((seg[VERTEX_INDEX] - V_SEG_ANGLE[VERTEX_INDEX]) / (2 * Math.PI)) * 2 * Math.PI;
  return {
    CURVE: curve,
    CURVE_FRAME_ANGLE: frame.map((a) => a - align),
    CURVE_SEG_ANGLE: seg.map((a) => a - align),
    CURVE_SEG_LEN: segLengths(curve),
    CURVE_PATH: `M${dense.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`,
  };
};

/**
 * Default target: the product chart's T+0 series exactly where the chart stage draws it, so the morph line and
 * the chart's primary line coincide.
 */
export const T0_TARGET = buildCurveTarget(T0_SCREEN_POINTS);
export const { CURVE_PATH } = T0_TARGET;

export const geom = { add, sub, lerpPt, rotate };
