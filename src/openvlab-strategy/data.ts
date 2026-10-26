/** Frozen IM2611 long-call snapshot — numbers from vendor-strategy + strategy-core (not OCR).
 *  Source: IM2611 DTO · definitionId=1 Long Call · MO2611-C-6600 · ask basis 220.8 · mult 100
 *  Pipeline: VendorStrategyAdapter.initialize → generateTimeline/generatePricePoints/calculateStrategyTable
 *  Params: range=0.08348859054197721 (implied), ivMult=1, tableHeight=360, tableWidth=1210
 *  As-of Asia/Shanghai 2026-10-26.
 */

export const PRODUCT = {
  name: "中证1000期货",
  code: "IM",
  price: 6604.8,
  changePct: -1.54,
  spot: 6605,
} as const;

/** Simplified header: only the current main month chip. */
export const MAIN_MONTH = {
  code: "2611",
  days: 25,
  main: true,
} as const;

export const LEG = {
  strike: 6600,
  type: "C" as const,
  qty: 1,
} as const;

/** IM options multiplier → yuan. Premium 220.8 pts × 100 = ¥22080. */
export const MULTIPLIER = 100;
export const PREMIUM_PTS = 220.8;

/** Market quote / morph helpers (heatmap cells themselves are engine-frozen). */
export const MODEL = {
  forward: 6601.69,
  rate: 0.02398,
  iv: 0.3035,
  asof: "2026-10-26",
  expiry: "2026-11-20",
  engineIv: 0.3176116943359375,
} as const;

export const METRICS = {
  netOutlay: 22080,
  maxProfit: "无限大",
  breakeven: 6820.8,
  maxLoss: 22080,
  winRate: 34,
  delta: 51.7,
  vega: 721.21,
  gamma: 0.0723,
  theta: -576.07,
} as const;

export const TOOLBAR = {
  rangePct: 8.3,
  ivPct: 30.35,
  ivMult: 1,
} as const;

/** IM2611 strike chain — from DTO result.context.i.c.IM2611.s (28 strikes). */
export const STRIKES = [
  5900, 6000, 6100, 6200, 6300, 6400, 6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300,
  7400, 7500, 7600, 7700, 7800, 7900, 8000, 8100, 8200, 8300, 8400, 8500, 8600,
] as const;

/** Raw open interest (DTO field `o` → quote.oi). Max = 7000C = 18818. */
export const MAX_OI = 18818;

export const OI_CALL: Record<number, number> = {
  5900: 230, 6000: 665, 6100: 488, 6200: 779, 6300: 815, 6400: 1693, 6500: 2181, 6600: 3716,
  6700: 5163, 6800: 7972, 6900: 7391, 7000: 18818, 7100: 6826, 7200: 9684, 7300: 7679,
  7400: 7496, 7500: 9307, 7600: 6249, 7700: 4169, 7800: 4332, 7900: 2915, 8000: 6492,
  8100: 1484, 8200: 1606, 8300: 1099, 8400: 1539, 8500: 995, 8600: 2827,
};

export const OI_PUT: Record<number, number> = {
  5900: 3321, 6000: 7619, 6100: 2622, 6200: 4619, 6300: 3704, 6400: 4135, 6500: 3978, 6600: 5815,
  6700: 4688, 6800: 4756, 6900: 2776, 7000: 5165, 7100: 2000, 7200: 1992, 7300: 1131,
  7400: 957, 7500: 1656, 7600: 1122, 7700: 600, 7800: 493, 7900: 245, 8000: 601,
  8100: 141, 8200: 201, 8300: 174, 8400: 154, 8500: 194, 8600: 276,
};

export const CHART = {
  xMin: 6053,
  xMax: 7156,
  yMin: -24000,
  yMax: 40000,
  spot: PRODUCT.spot,
  price: PRODUCT.price,
  breakeven: METRICS.breakeven,
  strike: LEG.strike,
  premiumPts: PREMIUM_PTS,
  multiplier: MULTIPLIER,
} as const;

/** Engine chart series (same getTheoreticalProfitAs as ProfitTable). */
export const ENGINE_CHART = {
  prices: [7156, 7095, 7034, 6972, 6911, 6850, 6789, 6727, 6666, 6605, 6544, 6482, 6421, 6360, 6298, 6237, 6176, 6115, 6053] as const,
  nowPnL: [38116, 33041, 28130, 23324, 18798, 14489, 10414, 6525, 2959, -339, -3364, -6157, -8628, -10829, -12800, -14488, -15941, -17177, -18230] as const,
  expiryPnL: [33520, 27420, 21320, 15120, 9020, 2920, -3180, -9380, -15480, -21580, -22080, -22080, -22080, -22080, -22080, -22080, -22080, -22080, -22080] as const,
  nowDte: 24.229166666666668,
} as const;

/** Heatmap columns — trading weekdays 10/27 → expiry 11/20 (settlement). */
export const HEATMAP_DATES = [
  { d: "10/27", w: "周二" },
  { d: "10/28", w: "周三" },
  { d: "10/29", w: "周四" },
  { d: "10/30", w: "周五" },
  { d: "11/02", w: "周一" },
  { d: "11/03", w: "周二" },
  { d: "11/04", w: "周三" },
  { d: "11/05", w: "周四" },
  { d: "11/06", w: "周五" },
  { d: "11/09", w: "周一" },
  { d: "11/10", w: "周二" },
  { d: "11/11", w: "周三" },
  { d: "11/12", w: "周四" },
  { d: "11/13", w: "周五" },
  { d: "11/16", w: "周一" },
  { d: "11/17", w: "周二" },
  { d: "11/18", w: "周三" },
  { d: "11/19", w: "周四" },
  { d: "11/20", w: "周五" },
] as const;

/** IM2611 engine heatmap (±8.3% implied · ask 220.8 · mult 100). */
export const HEATMAP_ROWS: {
  price: number;
  pct: number;
  showLine?: boolean;
  values: number[];
}[] = [
  { price: 7156, pct: 8.3, showLine: false, values: [38116, 37835, 37555, 37274, 36436, 36160, 35886, 35615, 35348, 34578, 34336, 34102, 33876, 33657, 33520, 33520, 33520, 33520, 33520] },
  { price: 7095, pct: 7.4, showLine: false, values: [33041, 32732, 32422, 32111, 31172, 30858, 30545, 30234, 29924, 29017, 28726, 28444, 28172, 27913, 27420, 27420, 27420, 27420, 27420] },
  { price: 7034, pct: 6.5, showLine: false, values: [28130, 27793, 27454, 27112, 26070, 25719, 25366, 25011, 24656, 23595, 23247, 22905, 22572, 22251, 21383, 21320, 21320, 21320, 21320] },
  { price: 6972, pct: 5.6, showLine: false, values: [23324, 22961, 22593, 22221, 21079, 20689, 20296, 19897, 19495, 18271, 17859, 17449, 17041, 16640, 15533, 15214, 15120, 15120, 15120] },
  { price: 6911, pct: 4.6, showLine: false, values: [18798, 18411, 18018, 17619, 16384, 15959, 15527, 15088, 14641, 13258, 12782, 12301, 11815, 11326, 9898, 9471, 9089, 9020, 9020] },
  { price: 6850, pct: 3.7, showLine: false, values: [14489, 14081, 13666, 13243, 11926, 11470, 11004, 10527, 10040, 8509, 7972, 7423, 6859, 6281, 4488, 3898, 3350, 2920, 2920] },
  { price: 6789, pct: 2.8, showLine: false, values: [10414, 9989, 9555, 9113, 7729, 7246, 6751, 6244, 5722, 4063, 3474, 2863, 2229, 1569, -588, -1366, -2155, -2889, -3180] },
  { price: 6727, pct: 1.9, showLine: false, values: [6525, 6087, 5640, 5183, 3748, 3246, 2729, 2198, 1650, -108, -740, -1399, -2090, -2818, -5291, -6249, -7298, -8441, -9380] },
  { price: 6666, pct: 0.9, showLine: false, values: [2959, 2514, 2059, 1594, 130, -384, -913, -1459, -2022, -3841, -4499, -5189, -5916, -6687, -9372, -10457, -11705, -13220, -15480] },
  { price: 6605, pct: 0, showLine: false, values: [-339, -786, -1242, -1709, -3180, -3697, -4230, -4780, -5348, -7184, -7850, -8550, -9289, -10074, -12835, -13969, -15297, -16977, -21580] },
  { price: 6544, pct: -0.9, showLine: true, values: [-3364, -3806, -4258, -4720, -6176, -6687, -7213, -7756, -8316, -10126, -10781, -11469, -12194, -12962, -15647, -16737, -17997, -19542, -22080] },
  { price: 6482, pct: -1.9, showLine: false, values: [-6157, -6588, -7029, -7480, -8896, -9392, -9901, -10426, -10967, -12705, -13330, -13982, -14667, -15389, -17849, -18808, -19866, -21035, -22080] },
  { price: 6421, pct: -2.8, showLine: false, values: [-8628, -9044, -9468, -9901, -11255, -11728, -12212, -12709, -13220, -14847, -15425, -16025, -16648, -17298, -19427, -20200, -20989, -21722, -22080] },
  { price: 6360, pct: -3.7, showLine: false, values: [-10829, -11225, -11627, -12036, -13310, -13752, -14203, -14664, -15136, -16618, -17137, -17670, -18216, -18775, -20511, -21081, -21601, -21981, -22080] },
  { price: 6298, pct: -4.6, showLine: false, values: [-12800, -13170, -13544, -13925, -15101, -15505, -15916, -16334, -16758, -18070, -18520, -18975, -19433, -19892, -21217, -21597, -21897, -22059, -22080] },
  { price: 6237, pct: -5.6, showLine: false, values: [-14488, -14829, -15173, -15521, -16588, -16952, -17318, -17689, -18062, -19193, -19571, -19946, -20316, -20677, -21633, -21865, -22018, -22076, -22080] },
  { price: 6176, pct: -6.5, showLine: false, values: [-15941, -16251, -16562, -16875, -17826, -18145, -18466, -18786, -19106, -20054, -20361, -20659, -20946, -21216, -21864, -21993, -22062, -22080, -22080] },
  { price: 6115, pct: -7.4, showLine: false, values: [-17177, -17454, -17730, -18008, -18838, -19113, -19387, -19658, -19926, -20696, -20936, -21164, -21377, -21571, -21983, -22048, -22075, -22080, -22080] },
  { price: 6053, pct: -8.4, showLine: false, values: [-18230, -18472, -18714, -18954, -19664, -19895, -20122, -20345, -20562, -21168, -21348, -21515, -21665, -21796, -22041, -22070, -22079, -22080, -22080] },
];

/** Color scale range — max/min of HEATMAP_ROWS values. */
export const HEATMAP_MAX = 38116;
export const HEATMAP_MIN = -22080;

/** @deprecated use HEATMAP_ROWS */
export const HEATMAP_PRICES: { price: number; pct: number }[] = HEATMAP_ROWS.map(({ price, pct }) => ({ price, pct }));

export const STRATEGY_TEMPLATES = [
  { id: "long-call", label: "买入认购", desc: "看涨 · 风险有限" },
  { id: "long-put", label: "买入认沽", desc: "看跌 · 风险有限" },
  { id: "bull-call", label: "牛市看涨价差", desc: "两腿 Call" },
  { id: "bear-put", label: "熊市看跌价差", desc: "两腿 Put" },
  { id: "straddle", label: "买入跨式", desc: "波动扩大" },
] as const;

/** Abramowitz–Stegun erf approx for Black-76 morph helpers only (heatmap is engine-frozen). */
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) *
      Math.exp(-ax * ax);
  return sign * y;
}

function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/** Black-76 call on futures (discounted) — IV-morph fallback only. */
export function black76Call(
  F: number,
  strike = CHART.strike,
  T = MAIN_MONTH.days / 365,
  iv = MODEL.iv,
  rate = MODEL.rate,
): number {
  if (T <= 1e-12) return Math.max(F - strike, 0);
  if (iv <= 1e-12) return Math.exp(-rate * T) * Math.max(F - strike, 0);
  const vol = iv * Math.sqrt(T);
  const d1 = (Math.log(F / strike) + 0.5 * iv * iv * T) / vol;
  const d2 = d1 - vol;
  return Math.exp(-rate * T) * (F * normCdf(d1) - strike * normCdf(d2));
}

/** Long-call expiry PnL in ¥ (engine-aligned: ask basis × mult). */
export function expiryPayoff(
  x: number,
  premiumPts = CHART.premiumPts,
  strike = CHART.strike,
  mult = CHART.multiplier,
): number {
  return (Math.max(x - strike, 0) - premiumPts) * mult;
}

/**
 * Pre-expiry PnL via Black-76 morph helper.
 * Heatmap ivMorph=1 uses frozen engine cells; this is only for curve morph / fallback.
 */
export function processPayoff(
  x: number,
  tRemain: number,
  ivMorph = 1,
  premiumPts = CHART.premiumPts,
  strike = CHART.strike,
  mult = CHART.multiplier,
): number {
  const T = Math.max(0, tRemain) * (MAIN_MONTH.days / 365);
  const model = black76Call(x, strike, T, MODEL.iv * ivMorph, MODEL.rate);
  return (model - premiumPts) * mult;
}

export function sampleCurve(
  fn: (x: number) => number,
  n = 96,
  xMin = CHART.xMin,
  xMax = CHART.xMax,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + ((xMax - xMin) * i) / n;
    pts.push({ x, y: fn(x) });
  }
  return pts;
}

/** Cell PnL for heatmap — frozen engine snapshot, optionally morph with IV. */
export function heatmapCell(price: number, colIdx: number, nCols: number, ivMorph = 1): number {
  const row = HEATMAP_ROWS.find((r) => r.price === price);
  if (row && colIdx >= 0 && colIdx < row.values.length) {
    const base = row.values[colIdx]!;
    if (ivMorph === 1) return base;
    const tRemain = 1 - colIdx / Math.max(1, nCols - 1);
    const modeled = processPayoff(price, tRemain * 0.85 + 0.05, ivMorph);
    const blend = Math.min(1, Math.abs(ivMorph - 1) * 1.2);
    return Math.round(base * (1 - blend) + modeled * blend);
  }
  const tRemain = 1 - colIdx / Math.max(1, nCols - 1);
  return Math.round(processPayoff(price, tRemain * 0.85 + 0.05, ivMorph));
}

export const LEGEND = [
  { label: "周一 10月26日 (当前)", dash: null as string | null, solid: true },
  { label: "周六 11月14日 (19天)", dash: "5 4", solid: false },
  { label: "到期日 (25天)", dash: "3 3", solid: false },
] as const;
