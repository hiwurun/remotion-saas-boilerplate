import { MODEL } from "./data";
import { DTE0 } from "./model/model";
import { lerp } from "./timeline";
import { B, mo } from "./beats";

const T = MODEL.timeline;

/** dte at a fractional timeline index (piecewise linear between the table columns) */
const idxToDte = (x: number) => {
  const i = Math.max(0, Math.min(T.length - 1.000001, x));
  const k = Math.floor(i);
  return lerp(T[k].dte, T[Math.min(T.length - 1, k + 1)].dte, i - k);
};

/**
 * One full pass, today → expiry, on B.sweep (linear in column index, so the
 * curve's own decay is what speeds up). Later the seller only steps back one
 * day, then the unflip returns that one day to the expiry V.
 */
export const dteAt = (f: number) => {
  if (f < B.sweep[0]) return DTE0;
  if (f < B.sweep[1]) return idxToDte((T.length - 1) * mo(f, B.sweep, (t) => t));
  if (f < B.back1d[0]) return 0;
  if (f < B.unflip[0]) return lerp(0, 1, mo(f, B.back1d));
  return lerp(1, 0, mo(f, B.unflip));
};

/** seller sign: 1 = buyer view, −1 = mirrored about zero */
export const signAt = (f: number) => 1 - 2 * mo(f, B.flip) + 2 * mo(f, B.unflip);
