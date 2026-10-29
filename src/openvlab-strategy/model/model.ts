/**
 * Straddle P&L model for the openvlab-strategy video.
 * Mirrors the vlab-frontend pricing path (vendor-strategy OptionPricingCalculator, Black-76 style:
 * dividend yield = risk-free rate for a futures underlying, Abramowitz-Stegun normal CDF),
 * the P&L table grid (profit-loss-table-helper), the metrics bar and the win rate (StrategyStats.getChanceOfProfit).
 * Self-contained (no imports) so `scripts/validate-strategy.mjs` can run it with node's type stripping.
 */

export type ChainLeg = { ask: number; bid: number; theo: number; iv: number; delta: number; vega: number; gamma: number; theta: number };
export type Chain = {
  updatedAt: string;
  underlyingLast: number;
  forward: number;
  multiplier: number;
  strike: number;
  call: ChainLeg;
  put: ChainLeg;
  rates: Record<string, number>;
};

/** Calibration (see validation report): the screenshot's first column is reproduced by sigma x1.0077 at dte 22.976. */
export const CAL_VOL_MULT = 0.314527 / 0.3121;
/** Table geometry from generatePricePoints: rowCount 24 -> 25 rows, +-8.027 % around the last price. */
export const ROW_RANGE = 0.08027;
export const ROW_COUNT = 24;

const DAY = 864e5;
export const EXPIRY_MS = Date.UTC(2026, 10, 20, 7, 0, 0); // 2026-11-20 15:00 CST
export const NOW_MS = Date.UTC(2026, 9, 28, 7, 34, 8); // chain.updatedAt
export const DTE0 = (EXPIRY_MS - NOW_MS) / DAY; // 22.976

export const cnd = (x: number): number => {
  if (x < 0) return 1 - cnd(-x);
  const t = 1 / (1 + 0.2316419 * x);
  return 1 - (Math.exp((-x * x) / 2) / 2.5066282746310002) * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + 1.330274429 * t))));
};

export const getRate = (rates: Record<string, number>, dte: number): number => {
  const ks = Object.keys(rates).map(Number).sort((a, b) => a - b);
  if (dte <= ks[0]) return rates[String(ks[0])];
  if (dte >= ks[ks.length - 1]) return rates[String(ks[ks.length - 1])];
  for (let i = 0; i < ks.length - 1; i++) {
    if (ks[i] <= dte && ks[i + 1] >= dte) {
      const a = rates[String(ks[i])];
      const b = rates[String(ks[i + 1])];
      return a + ((b - a) * (dte - ks[i])) / (ks[i + 1] - ks[i]);
    }
  }
  return rates[String(ks[0])];
};

export const optionPrice = (isCall: boolean, S: number, K: number, days: number, r: number, vol: number, q: number): number => {
  if (days <= 0) return isCall ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const T = days / 365;
  const dS = S * Math.exp(-q * T);
  const dK = K * Math.exp(-r * T);
  const sq = vol * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + (vol * vol) / 2) * T) / sq;
  const d2 = d1 - sq;
  return isCall ? dS * cnd(d1) - dK * cnd(d2) : dK * cnd(-d2) - dS * cnd(-d1);
};

const bisect = (f: (x: number) => number, a: number, b: number) => {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 70; i++) {
    const m = (lo + hi) / 2;
    if (Math.sign(f(m)) === Math.sign(f(lo))) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

export type TimePoint = { ms: number; dte: number; weekday: string; mmdd: string; hhmm: string; isExpiry: boolean };

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
/** Format a UTC instant in China time (UTC+8). */
export const cstParts = (ms: number) => {
  const d = new Date(ms + 8 * 3600e3);
  const p2 = (n: number) => String(n).padStart(2, "0");
  return {
    weekday: WEEKDAYS[d.getUTCDay()],
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    mmdd: `${p2(d.getUTCMonth() + 1)}/${p2(d.getUTCDate())}`,
    hhmm: `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`,
  };
};

/** 18 timeline points: now (labelled with the next trading day, 10/29), 16 trading-day 09:30 opens, expiry 15:00. */
export const buildTimeline = (): TimePoint[] => {
  const pts: TimePoint[] = [];
  const mk = (ms: number, labelMs: number, isExpiry: boolean): TimePoint => {
    const lp = cstParts(labelMs);
    return { ms, dte: Math.max(0, (EXPIRY_MS - ms) / DAY), weekday: lp.weekday, mmdd: lp.mmdd, hhmm: lp.hhmm, isExpiry };
  };
  const open = (y: number, m: number, d: number) => Date.UTC(y, m, d, 1, 30, 0);
  const first = open(2026, 9, 29);
  pts.push(mk(NOW_MS, first, false));
  // trading days 10/30 .. 11/20
  const days: number[] = [];
  for (let t = open(2026, 9, 30); t <= open(2026, 10, 20); t += DAY) {
    const wd = new Date(t + 8 * 3600e3).getUTCDay();
    if (wd !== 0 && wd !== 6) days.push(t);
  }
  days.forEach((t) => pts.push(mk(t, t, false)));
  pts.push(mk(EXPIRY_MS, EXPIRY_MS, true));
  return pts;
};

export const priceRows = (last: number): { price: number; pct: number; showLine: boolean }[] => {
  const lower = last * (1 - ROW_RANGE);
  const upper = last * (1 + ROW_RANGE);
  const size = upper - lower;
  const rows = [];
  for (let i = ROW_COUNT; i >= 0; i--) {
    const price = Math.round(lower + (i / ROW_COUNT) * size);
    rows.push({ price, pct: (price / last - 1) * 100, showLine: false });
  }
  const idx = rows.findIndex((r) => r.price <= last);
  if (idx >= 0) rows[idx].showLine = true;
  return rows;
};

export const createModel = (chain: Chain) => {
  const { strike: K, multiplier: M } = chain;
  const vol = (chain.call.iv / 100) * CAL_VOL_MULT;
  const basis = M * (chain.call.ask + chain.put.ask);
  const timeline = buildTimeline();

  /** Strategy value (not profit) at underlying price S with `dte` days left. */
  const value = (S: number, dte: number) => {
    const r = getRate(chain.rates, dte);
    return M * (optionPrice(true, S, K, dte, r, vol, r) + optionPrice(false, S, K, dte, r, vol, r));
  };
  const profit = (S: number, dte: number) => value(S, dte) - basis;

  /** Break-evens at a given dte: scan for sign changes of profit and bisect each. */
  const breakevens = (dte: number): number[] => {
    const lo = K * 0.7;
    const hi = K * 1.3;
    const n = 600;
    const out: number[] = [];
    let prev = profit(lo, dte);
    for (let i = 1; i <= n; i++) {
      const x0 = lo + ((hi - lo) * (i - 1)) / n;
      const x1 = lo + ((hi - lo) * i) / n;
      const cur = profit(x1, dte);
      if (Math.sign(cur) !== Math.sign(prev) && prev !== 0) out.push(bisect((s) => profit(s, dte), x0, x1));
      prev = cur;
    }
    return out;
  };

  const rows = priceRows(chain.underlyingLast);
  const table = rows.map((row) => timeline.map((pt) => profit(row.price, pt.dte)));
  const tableMax = Math.max(...table.flat());
  const tableMin = Math.min(...table.flat());

  /** backend-implied DTE: the days that make the file's own call theo match (file iv, no calibration). */
  const impliedDte = bisect(
    (d) => {
      const r = getRate(chain.rates, d);
      return optionPrice(true, chain.forward, K, d, r, chain.call.iv / 100, r) - chain.call.theo;
    },
    5,
    60,
  );
  const atmIv = ((chain.call.iv + chain.put.iv) / 2) / 100;
  const expiryBE = breakevens(0);
  const winRate = (() => {
    const S = chain.underlyingLast;
    const co = (t: number) => cnd(Math.log(t / S) / (atmIv * Math.sqrt(impliedDte / 365)));
    return 1 + co(expiryBE[0]) - co(expiryBE[1]);
  })();

  const fwd = chain.forward;
  const greeks = {
    delta: (chain.call.delta + chain.put.delta) * fwd * 0.01 * M,
    vega: (chain.call.vega + chain.put.vega) * M,
    gamma: (chain.call.gamma + chain.put.gamma) * (fwd * 0.01) ** 2 * M,
    theta: (chain.call.theta + chain.put.theta) * M,
  };

  const metrics = {
    netDebit: basis,
    maxProfit: Infinity,
    breakevens: expiryBE,
    maxLoss: basis,
    winRate,
    greeks,
  };

  return { vol, basis, timeline, rows, table, tableMax, tableMin, value, profit, breakevens, impliedDte, winRate, metrics, atmIv };
};

export type Model = ReturnType<typeof createModel>;

/* ---------- formatting & colours shared with the frontend table ---------- */
export const heatColor = (v: number, max: number, min: number): string => {
  const denom = Math.max(Math.abs(max), Math.abs(min)) || 1;
  const percent = (v / denom) * 100;
  const ratio = Math.min(1, Math.abs(percent) / 100);
  const big = Math.round(Math.abs(percent)) >= 100;
  const t = big ? 0.6 + 0.3 * (1 - Math.min(1, (Math.abs(percent) - 100) / 500)) : 1;
  if (v >= 0) return `rgba(${Math.round(220 * t)},${Math.round(45 * t)},${Math.round(45 * t)},${ratio.toFixed(3)})`;
  return `rgba(${Math.round(40 * t)},${Math.round(180 * t)},${Math.round(90 * t)},${ratio.toFixed(3)})`;
};

export const fmtCell = (v: number): string => String(Math.round(v));
export const fmtPct = (v: number): string => {
  const r1 = Math.round(v * 10) / 10;
  const s = Math.abs(v) < 10 && !Number.isInteger(r1) ? v.toFixed(1) : v.toFixed(0);
  return `${s}%`;
};
