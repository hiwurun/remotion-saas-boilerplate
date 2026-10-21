import series from "./data/underlying-volatility-series-IM-202611.json";
import surface from "./data/volatility-surface-IM.json";
import futureTs from "./data/future-ts-IM.json";

/** /api/underlying-volatility-series/IM/202611 rows: [time, price, change%, openInterest, atmIV|null] */
type Row = [string, number, string, number, number | null];
export const INTRADAY = ((series as unknown as { result: Row[] }).result).map(([time, price, change, oi, atmv]) => ({ time, price, change, oi, atmv }));

/** /api/volatility-surface/IM — per expiry (only the fields the popup draws). */
type RawExp = Record<string, unknown>;
const surf = (surface as unknown as { result: Record<string, RawExp> }).result;
const pairs = (v: unknown): [number, number][] => {
  const a = typeof v === "string" ? (JSON.parse(v) as [number, number | string][]) : (v as [number, number | string][]);
  return (a ?? []).map(([k, y]) => [Number(k), Number(y)] as [number, number]).filter(([, y]) => Number.isFinite(y));
};
export const SURFACE = Object.keys(surf).sort().map((exp) => {
  const e = surf[exp];
  const ds = (JSON.parse(String(e.display_strike)) as number[]).map(Number);
  return {
    exp,
    days: Number(e.days_to_expiry),
    atmT: Number(e.atmvol_tday), atmY: Number(e.atmvol_yday),
    rhoT: Number(e.rho_tday), rhoY: Number(e.rho_yday),
    fwdT: Number(e.forward_td), fwdY: Number(e.forward_yd),
    lastTime: String(e.last_time),
    display: ds,
    tday: pairs(e.theovol_tday), yday: pairs(e.theovol_yday),
    callBid: pairs(e.mktvol_tday_call_bid), callAsk: pairs(e.mktvol_tday_call_ask),
    putBid: pairs(e.mktvol_tday_put_bid), putAsk: pairs(e.mktvol_tday_put_ask),
  };
});

/** /api/future-ts/IM */
type Fut = { future_tday: number; future_yday: number; days_to_expiry: number };
const fts = (futureTs as unknown as { result: Record<string, Fut> }).result;
export const FUTURE_TS = Object.keys(fts).sort().map((exp) => ({ exp, tday: fts[exp].future_tday, yday: fts[exp].future_yday }));
