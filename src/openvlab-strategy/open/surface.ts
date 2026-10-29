import { CHAIN, MODEL } from "../data";
import { TABLE, colX, colW, nativeToWorld, rowY, CONTENT, TABLE_HEAD_H } from "../layout";
import { heatColor } from "../model/model";

/**
 * P&L surface of the same combo the table shows. It is computed from MODEL.profit and aligned with the REAL table geometry:
 * price rows = MODEL.rows (25 rows), date columns = MODEL.timeline (18), colours = heatColor (same as ProfitTable).
 *   X = calendar time (first day at the left -> expiry at the right, like the table columns), Z = price (far = higher price, like the table rows top -> bottom), Y = profit.
 */
export const S0 = CHAIN.underlyingLast; // 6550.2 (label)
export const ROWS = MODEL.rows;
export const NROWS = ROWS.length; // 25
export const NCOLS = MODEL.timeline.length; // 18
const STEP = (ROWS[0].price - ROWS[NROWS - 1].price) / (NROWS - 1);
export const P_LO = ROWS[NROWS - 1].price - STEP / 2;
export const P_HI = ROWS[0].price + STEP / 2;
export const P_MID = (P_LO + P_HI) / 2; // 6550 = the table's ATM row
export const NX = 161; // odd -> the centre column is the ATM row price
export const CX = (NX - 1) / 2;
export const X_HALF = 5;
/** vertical exaggeration of profit height in the 3D phase (1 when flat) */
export const Y_EXAG = 1; // hook-lab proportions: no extra vertical exaggeration
export const DEPTH = 9; // length of the date axis (world X, first day at the near end, z)
export const ZC = DEPTH / 2;
export const DEPTH_UNITS = 3.7;

const T = MODEL.timeline;
const DTE0 = T[0].dte;
/** geometry only: the expiry payoff has a sharp kink at the money; a few % of the time value is kept so the last rows stay a smooth sheet instead of a folded flap */
const DTE_FLOOR = 0;
const softDte = (d: number) => Math.sqrt(Math.max(0, d) ** 2 + DTE_FLOOR ** 2); // smooth max(d, floor): C-infinity, so the glow point path has no kink
export const LAYER_T = T.map((p) => 1 - p.dte / DTE0);
const round6 = (t: number) => Math.round(t * 1e6) / 1e6;
const NZ0 = 118;
const baseTs = Array.from({ length: NZ0 }, (_, j) => 1 - Math.pow(1 - j / (NZ0 - 1), 1.7));
export const TS: number[] = Array.from(new Set([...baseTs, ...LAYER_T].map(round6))).sort((a, b) => a - b);
export const NZ = TS.length;
export const LAYER_J: number[] = LAYER_T.map((t) => TS.indexOf(round6(t)));

export const priceOf = (i: number) => P_LO + (P_HI - P_LO) * (i / (NX - 1));
export const xOf = (i: number) => ((i / (NX - 1)) * 2 - 1) * X_HALF;
export const zOf = (t: number) => t * DEPTH;

/** layer k (timeline point) -> k/(NCOLS-1); piecewise linear in between ("table time" used for uv.y and the flatten morph). */
export const uniformT = (t: number): number => {
  const c = Math.min(1, Math.max(0, t));
  let k = 0;
  while (k < NCOLS - 2 && c > LAYER_T[k + 1]) k++;
  const f = (c - LAYER_T[k]) / (LAYER_T[k + 1] - LAYER_T[k] || 1);
  return (k + f) / (NCOLS - 1);
};
export const UT: number[] = TS.map(uniformT);

export const PROFIT: Float32Array = (() => {
  const a = new Float32Array(NX * NZ);
  for (let j = 0; j < NZ; j++) {
    const dte = softDte(DTE0 * (1 - TS[j]));
    for (let i = 0; i < NX; i++) a[j * NX + i] = MODEL.profit(priceOf(i), dte);
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
export const Y_SCALE = DEPTH_UNITS / Math.abs(mn);
/**
 * display height: the loss side is kept 1:1, the profit wings (both price ends) are softly compressed (tanh, C1 at 0) so the surface reads as ONE smooth sheet
 * sinking over time instead of a tall standing wall next to a ground plane. Colours still use the raw profit.
 */
export const WING = 0.5;
export const shape = (h: number): number => h; // raw profit height, exactly like hook-lab (no wing compression)
export const HEIGHT = (j: number, i: number) => shape(PROFIT[j * NX + i] * Y_SCALE);
/** exact (analytic, continuous) height of the price line at calendar fraction t */
export const lineY = (t: number): number => shape(MODEL.profit(P_MID, softDte(DTE0 * (1 - Math.min(1, Math.max(0, t))))) * Y_SCALE);
export const colorValue = (p: number) => (p >= 0 ? Math.min(1, p / P_MAX) : -Math.min(1, -p / Math.abs(P_MIN)));

/* ---- flat table geometry (world px of the real ProfitTable body, at camera scale 1) ---- */
const tl = nativeToWorld(CONTENT.x + colX(2), CONTENT.y + TABLE_HEAD_H);
export const TABLE_BODY = { x: tl.x, y: tl.y, w: nativeToWorld(CONTENT.x + colX(2) + (NCOLS) * colW(2), 0).x - tl.x, h: NROWS * TABLE.rowH * 1.5 };
export const TABLE_CENTER = { x: TABLE_BODY.x + TABLE_BODY.w / 2, y: TABLE_BODY.y + TABLE_BODY.h / 2 };
/** z stretch so that the flat plane has the table's aspect (price spans 2*X_HALF) */
export const FLAT_SZ = ((TABLE_BODY.w / TABLE_BODY.h) * 2 * X_HALF) / DEPTH;
export { rowY };

/** 18 x 25 RGBA texture (u = price low->high = row 24 -> 0, v = column), exactly the table cells composited over the panel background. */
const PANEL_BG = [7, 7, 8];
export const heatTextureData = (): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(new ArrayBuffer(NROWS * NCOLS * 4));
  for (let k = 0; k < NCOLS; k++)
    for (let pi = 0; pi < NROWS; pi++) {
      const r = NROWS - 1 - pi;
      const m = /rgba\((\d+),(\d+),(\d+),([\d.]+)\)/.exec(heatColor(MODEL.table[r][k], MODEL.tableMax, MODEL.tableMin))!;
      const a = parseFloat(m[4]);
      const o = (k * NROWS + pi) * 4;
      for (let c = 0; c < 3; c++) out[o + c] = Math.round(PANEL_BG[c] * (1 - a) + parseInt(m[c + 1]) * a);
      out[o + 3] = 255;
    }
  return out;
};
