import { MODEL } from "./data";
import { DTE0 } from "./model/model";
import { lerp } from "./timeline";
import { B, IV_CRUSH, IV_UP, mo } from "./beats";

const T = MODEL.timeline;

/** dte at a fractional timeline index (piecewise linear between the table columns) */
const idxToDte = (x: number) => {
  const i = Math.max(0, Math.min(T.length - 1.000001, x));
  const k = Math.floor(i);
  return lerp(T[k].dte, T[Math.min(T.length - 1, k + 1)].dte, i - k);
};

/**
 * One full pass, today → expiry, on B.sweep (linear in column index).
 * After the drain, B.restore brings dte back to today for the IV act; then it holds.
 */
export const dteAt = (f: number) => {
  if (f < B.sweep[0]) return DTE0;
  if (f < B.sweep[1]) return idxToDte((T.length - 1) * mo(f, B.sweep, (t) => t));
  if (f < B.restore[0]) return 0;
  if (f < B.restore[1]) return lerp(0, DTE0, mo(f, B.restore));
  return DTE0;
};

/**
 * Calibrated-vol multiplier for the IV act.
 * 1 until ivUp, rises to IV_UP, then crushes to IV_CRUSH and holds.
 */
export const volScaleAt = (f: number) => {
  if (f < B.ivUp[0]) return 1;
  if (f < B.ivCrush[0]) return lerp(1, IV_UP, mo(f, B.ivUp));
  return lerp(IV_UP, IV_CRUSH, mo(f, B.ivCrush));
};

/** Absolute sigma for the live curve. */
export const sigmaAt = (f: number) => MODEL.vol * volScaleAt(f);

/** Ghost vol scale under the live curve (base during lift, peak during crush). */
export const ghostScaleAt = (f: number) => {
  if (f < B.ivUp[0]) return 1;
  if (f < B.ivCrush[0]) return 1;
  return IV_UP;
};
