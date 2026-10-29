import { CHAIN, MODEL } from "../openvlab-strategy/data";

/**
 * P&L surface of the 6600 Call + 6600 Put long combo, computed from the real Black-76 model (MODEL.profit).
 *  X = underlying price (S0 ± SPAN), Z = calendar time (first day -> expiry, t 0..1), Y = profit (CNY).
 */
export const S0 = CHAIN.underlyingLast; // 6550.2
export const SPAN = 0.075; // ±7.5 % so both expiry break-evens (-5.7 % / +7.2 %) sit inside the surface
export const NX = 161; // odd -> the centre column is exactly S0
export const CX = (NX - 1) / 2;
export const X_HALF = 5; // world half-width
export const DEPTH = 9; // world depth (first day -> expiry)
export const DEPTH_UNITS = 3.7; // world height of the deepest loss
export const ZC = DEPTH / 2;

const T = MODEL.timeline; // 18 points: now(10/29) ... 11/20 09:30, expiry
const DTE0 = T[0].dte;
export const LAYER_T = T.map((p) => 1 - p.dte / DTE0); // 0..1, non-uniform (weekends)
const round6 = (t: number) => Math.round(t * 1e6) / 1e6;

/** z samples: dense near expiry (sqrt decay) + the 18 timeline layers */
const NZ0 = 118;
const baseTs = Array.from({ length: NZ0 }, (_, j) => 1 - Math.pow(1 - j / (NZ0 - 1), 1.7));
export const TS: number[] = Array.from(new Set([...baseTs, ...LAYER_T].map(round6))).sort((a, b) => a - b);
export const NZ = TS.length;
export const LAYER_J: number[] = LAYER_T.map((t) => TS.indexOf(round6(t)));

export const PRICES: number[] = Array.from({ length: NX }, (_, i) => S0 * (1 + SPAN * ((2 * i) / (NX - 1) - 1)));
export const xOf = (i: number) => ((i / (NX - 1)) * 2 - 1) * X_HALF;
export const zOf = (t: number) => t * DEPTH;

/** profit grid [j * NX + i] in CNY */
export const PROFIT: Float32Array = (() => {
  const a = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) {
    const dte = Math.max(0, DTE0 * (1 - TS[j]));
    for (let i = 0; i < NX; i++) a[j * NX + i] = MODEL.profit(PRICES[i], dte);
  }
  return a;
})();

let mn = Infinity;
let mx = -Infinity;
for (const v of PROFIT) {
  mn = Math.min(mn, v);
  mx = Math.max(mx, v);
}
export const P_MIN = mn;
export const P_MAX = mx;
const Y_SCALE = DEPTH_UNITS / Math.abs(mn);
export const HEIGHT = (j: number, i: number) => PROFIT[j * NX + i] * Y_SCALE;
/** world height of the price = S0 line at calendar fraction t (linear interpolation between z samples) */
export const centerY = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  let lo = 0;
  let hi = NZ - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (TS[m] <= c) lo = m;
    else hi = m;
  }
  const k = (c - TS[lo]) / (TS[hi] - TS[lo] || 1);
  return HEIGHT(lo, CX) * (1 - k) + HEIGHT(hi, CX) * k;
};

/** value (-1..1) used for colouring: red = profit, green = loss, each side normalised by its own extreme */
export const colorValue = (p: number) => (p >= 0 ? Math.min(1, p / P_MAX) : -Math.min(1, -p / Math.abs(P_MIN)));

/* ---- heat-table texture: 25 price rows x 18 timeline columns baked into a hi-res texture (u = price, v = calendar t) ---- */
export const HEAT_ROWS = 25;
export const HEAT_W = 1024; // price axis
export const HEAT_H = 2048; // time axis (18 equal columns)
export const COLS = LAYER_T.length;
/** equal-width column space: layer k -> k/(COLS-1), piecewise linear between layers */
export const uniformT = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  let k = 0;
  while (k < COLS - 2 && c > LAYER_T[k + 1]) k++;
  const f = (c - LAYER_T[k]) / (LAYER_T[k + 1] - LAYER_T[k] || 1);
  return (k + f) / (COLS - 1);
};
export const UT: number[] = TS.map(uniformT);
export const heatTexture = (): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(HEAT_W * HEAT_H * 4);
  const rowP = Array.from({ length: HEAT_ROWS }, (_, r) => S0 * (1 + SPAN * ((2 * r) / (HEAT_ROWS - 1) - 1)));
  const cell: number[][] = rowP.map((p) => T.map((pt) => MODEL.profit(p, pt.dte)));
  const ROW_GAP = 0.03; // half-gap, fraction of a row
  const COL_GAP = 0.016; // half-gap, fraction of a column
  for (let y = 0; y < HEAT_H; y++) {
    const cf = (y / (HEAT_H - 1)) * (COLS - 1); // column space
    const k = Math.min(COLS - 1, Math.max(0, Math.round(cf)));
    const dC = 0.5 - Math.abs(cf - k);
    for (let x = 0; x < HEAT_W; x++) {
      const pf = (x / (HEAT_W - 1)) * (HEAT_ROWS - 1);
      const r = Math.round(pf);
      const dB = 0.5 - Math.abs(pf - r);
      const v = colorValue(cell[r][k]);
      const m = Math.pow(Math.abs(v), 0.72);
      const base = [14, 16, 19];
      const tgt = v >= 0 ? [168, 46, 56] : [22, 140, 102];
      const gap = dB < ROW_GAP || dC < COL_GAP ? 0.3 : 1;
      const o = (y * HEAT_W + x) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = Math.round((base[c] + (tgt[c] - base[c]) * m) * gap);
      out[o + 3] = 255;
    }
  }
  return out;
};
