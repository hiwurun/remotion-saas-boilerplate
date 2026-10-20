import raw from "./data/surface.json";
import { buildSurfaceModel, interpolateVolByStrike } from "./model/surface-model";
import type { SurfaceChartInput, SurfaceDataset } from "./model/types";

/**
 * Adapter: real `/volatility` API response (src/openvlab-surf/data/surface.json, keyed by expiry, values are
 * stringified arrays) → SurfaceChartInput[] → buildSurfaceModel (ported normalisation from shared-core).
 * Series naming follows the frontend chart builders: theovol_tday is drawn as「今日波动率」,
 * strike_poi_p / strike_poi_c are the put / call open interest series.
 */
type ApiExpiry = Record<string, string>;
export const RESULT = (raw as unknown as { result: Record<string, ApiExpiry> }).result;

const parsePairs = (s: string | undefined): [number, number][] => {
  if (!s) return [];
  try {
    const v = JSON.parse(s.replace(/NaN/g, "null")) as unknown;
    if (Array.isArray(v)) return (v as [unknown, unknown][]).map(([a, b]) => [Number(a), Number(b)] as [number, number]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
    if (v && typeof v === "object") return Object.entries(v as Record<string, unknown>).map(([k, b]) => [Number(k), Number(b)] as [number, number]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  } catch {
    /* ignore */
  }
  return [];
};
const num = (s: string | undefined) => (s == null ? NaN : Number(s));

export type ExpiryInfo = {
  exp: string;
  days: number;
  expiryDate: string;
  forward: number;
  forwardYd: number;
  atmVol: number;
  atmVolYd: number;
  theo: [number, number][];
  theoYd: [number, number][];
  callBid: [number, number][];
  callAsk: [number, number][];
  putBid: [number, number][];
  putAsk: [number, number][];
  poiC: [number, number][];
  poiP: [number, number][];
  sumOiCall: number;
  sumOiPut: number;
};

export const EXPIRIES: ExpiryInfo[] = Object.values(RESULT)
  .map((e) => ({
    exp: e.exp,
    days: num(e.days_to_expiry),
    expiryDate: e.expiry_date,
    forward: num(e.forward_td),
    forwardYd: num(e.forward_yd),
    atmVol: num(e.atmvol_tday),
    atmVolYd: num(e.atmvol_yday),
    theo: parsePairs(e.theovol_tday),
    theoYd: parsePairs(e.theovol_yday),
    callBid: parsePairs(e.mktvol_tday_call_bid),
    callAsk: parsePairs(e.mktvol_tday_call_ask),
    putBid: parsePairs(e.mktvol_tday_put_bid),
    putAsk: parsePairs(e.mktvol_tday_put_ask),
    poiC: parsePairs(e.strike_poi_c),
    poiP: parsePairs(e.strike_poi_p),
    sumOiCall: num(e.sum_oi_call),
    sumOiPut: num(e.sum_oi_put),
  }))
  .filter((e) => Number.isFinite(e.days))
  .sort((a, b) => a.days - b.days);

/** The API payload's `product` field reads "MO", but this dataset is 中证1000股指期权 (IM) – configured explicitly. */
export const PRODUCT = "IM";
export const PRODUCT_NAME = "中证1000股指期权";
export const API_PRODUCT = Object.values(RESULT)[0]?.product ?? "";
export const LAST_TIME = Object.values(RESULT)[0]?.last_time ?? "";

const charts: SurfaceChartInput[] = EXPIRIES.map((e) => ({
  daysToExpiry: e.days,
  options: {
    series: [
      { name: "今日波动率", type: "line", data: e.theo },
      { name: "strike_poi_p", type: "bar", data: e.poiP },
      { name: "strike_poi_c", type: "bar", data: e.poiC },
    ],
  },
}));

export const MODEL = buildSurfaceModel(charts);
export const DATASET: SurfaceDataset = MODEL.dataset;

/* ---------- facts used on screen (all derived from the data) ---------- */

/** Expiry used for the hook + smile slice: the one with the most pronounced put skew (left wing − ATM). */
const wingInfo = (e: ExpiryInfo) => {
  const pts = e.theo.filter(([, v]) => v > 0 && v !== 100);
  const left = pts[0]!;
  const right = pts[pts.length - 1]!;
  const min = pts.reduce((m, p) => (p[1] < m[1] ? p : m), pts[0]!);
  return { left, right, min };
};
export const SMILE_EXP: ExpiryInfo = [...EXPIRIES].filter((e) => e.days > EXPIRIES[0]!.days).sort((a, b) => {
  const wa = wingInfo(a);
  const wb = wingInfo(b);
  return wb.left[1] - wb.min[1] - (wa.left[1] - wa.min[1]);
})[0] ?? EXPIRIES[0]!;
export const SMILE = wingInfo(SMILE_EXP);

/** Expiry whose right wing is above its left wing (call-chasing shape), if any. */
export const CALL_SKEW_EXP = EXPIRIES.find((e) => {
  const w = wingInfo(e);
  return w.right[1] > w.left[1];
});
export const CALL_SKEW = CALL_SKEW_EXP ? wingInfo(CALL_SKEW_EXP) : null;

/** ATM term structure (atmvol_tday at forward_td for each expiry). */
export const TERM = EXPIRIES.map((e) => ({ days: e.days, forward: e.forward, vol: e.atmVol, exp: e.exp }));
export const TERM_FIRST = TERM[0]!;
export const TERM_LAST = TERM[TERM.length - 1]!;
export const TERM_MONOTONE_DOWN = TERM.every((t, i) => i === 0 || t.vol <= TERM[i - 1]!.vol + 1e-9);

/** Highest IV point on the surface. */
export const PEAK = DATASET.surfacePoints.reduce((m, p) => (p.vol > m.vol ? p : m), DATASET.surfacePoints[0]!);
export const LOW = DATASET.surfacePoints.reduce((m, p) => (p.vol < m.vol ? p : m), DATASET.surfacePoints[0]!);

/** Open interest: biggest call / put bar across the surface + totals. */
const maxOf = (side: "put" | "call") => DATASET.oiPoints.filter((p) => p.side === side).reduce((m, p) => (p.value > m.value ? p : m));
export const OI_MAX_CALL = maxOf("call");
export const OI_MAX_PUT = maxOf("put");
export const OI_TOTAL_CALL = DATASET.oiPoints.filter((p) => p.side === "call").reduce((a, p) => a + p.value, 0);
export const OI_TOTAL_PUT = DATASET.oiPoints.filter((p) => p.side === "put").reduce((a, p) => a + p.value, 0);

export const rowOf = (days: number) => DATASET.rows.find((r) => r.days === days)!;
export const volAt = (days: number, strike: number) => interpolateVolByStrike(rowOf(days), strike, { extrapolate: true }) ?? DATASET.domain.minVol;

export const fmt = (v: number, d = 2) => v.toFixed(d);
export const fmtInt = (v: number) => Math.round(v).toLocaleString("en-US");

import type { RawExpiry } from "./model/vol-chart";

/* ---------- raw expiry in the shape the frontend chart builders expect ---------- */
const parseAny = (s: string | undefined): unknown => {
  if (!s) return undefined;
  try {
    return JSON.parse(s.replace(/NaN/g, "null"));
  } catch {
    return undefined;
  }
};
export const rawExpiry = (exp: string): RawExpiry => {
  const e = RESULT[exp]!;
  const pairs = (k: string) => ((parseAny(e[k]) as [number, number | null][] | undefined) ?? []).filter((p) => p[1] != null) as [number, number][];
  const rec = (k: string) => (parseAny(e[k]) as Record<string, number> | undefined) ?? {};
  return {
    theovol_tday: pairs("theovol_tday"),
    theovol_yday: pairs("theovol_yday"),
    mktvol_tday_call_bid: pairs("mktvol_tday_call_bid"),
    mktvol_tday_call_ask: pairs("mktvol_tday_call_ask"),
    mktvol_tday_put_bid: pairs("mktvol_tday_put_bid"),
    mktvol_tday_put_ask: pairs("mktvol_tday_put_ask"),
    strike_poi_c: rec("strike_poi_c"),
    strike_poi_p: rec("strike_poi_p"),
    strike_oid_c: rec("strike_oid_c"),
    strike_oid_p: rec("strike_oid_p"),
    display_strike: (parseAny(e.display_strike) as [number, number]) ?? [0, 0],
    forward_td: Number(e.forward_td),
    forward_yd: Number(e.forward_yd),
    atmvol_tday: Number(e.atmvol_tday),
    atmvol_yday: Number(e.atmvol_yday),
    days: Number(e.days_to_expiry),
    expiry: exp,
  };
};

/* ---------- worked example: protecting an MO long with the lowest-strike put ---------- */
export const NEAR = EXPIRIES[0]!;
export const FAR = EXPIRIES[EXPIRIES.length - 1]!;
export const PROTECT_STRIKE = PEAK.strike;
export const PROTECT = EXPIRIES.map((e) => ({ days: e.days, exp: e.exp, vol: volAt(e.days, PROTECT_STRIKE) }));
export const PROTECT_NEAR = PROTECT[0]!;
export const PROTECT_FAR = PROTECT[PROTECT.length - 1]!;
export const PROTECT_MID = PROTECT.find((p) => p.days >= 120) ?? PROTECT[Math.floor(PROTECT.length / 2)]!;
