import {
  SNAPSHOT,
  type StrategyModel,
  createStrategyModel,
  snapshotMark,
} from "../openvlab-logo-curve/strategy-chart/model";

/**
 * Promo strategy: IM2611 bull call spread — long 1× 6600 C @ 240.4 (captured fill), short 1× 6800 C at the model
 * mark (no captured quote). Line DTEs: the "pretty" near-expiry date first, so the morph lands on it.
 */
export const PRETTY_DTE = 2;
export const NOW_DTE = 24.4;
export const SPREAD: StrategyModel = createStrategyModel({
  legs: [
    { type: "C", strike: 6600, qty: 1, cost: 240.4 },
    { type: "C", strike: 6800, qty: -1, cost: snapshotMark("C", 6800) },
  ],
  lineDtes: [PRETTY_DTE, 6.4, 0],
});

/**
 * IM2611 strike chain open interest (DTO `result.context.i.c.IM2611.s`, field `o` → quote.oi), from the frozen
 * snapshot that the earlier openvlab-strategy StrikeRuler used. Max over the full chain = 7000C = 18818.
 */
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
const ALL_STRIKES = Object.keys(OI_CALL).map(Number);

/** Strikes inside the chart's price domain, positioned on the chart's own x axis (container px). */
export const rulerStrikes = (m: StrategyModel) =>
  ALL_STRIKES.filter((s) => s > m.priceMin && s < m.priceMax).map((strike) => ({
    strike,
    x: m.priceX(strike),
    call: OI_CALL[strike] ?? 0,
    put: OI_PUT[strike] ?? 0,
  }));

/* ---------------- ProfitTable (表格) ---------------- */
const DAY_MS = 86_400_000;
const WEEKDAY_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;

/** Trading weekdays from the snapshot day to settlement; each column is valued at that day's 15:00 close. */
export const TABLE_COLUMNS = (() => {
  const cols: Array<{ d: string; w: string; dte: number }> = [];
  const settleLocal = SNAPSHOT.settlementUtcMs + 8 * 3_600_000;
  const startLocal = settleLocal - Math.floor(SNAPSHOT.seriesDte) * DAY_MS;
  for (let ms = startLocal; ms <= settleLocal; ms += DAY_MS) {
    const d = new Date(ms);
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) continue;
    const dte = cols.length === 0 ? SNAPSHOT.seriesDte : (settleLocal - ms) / DAY_MS;
    cols.push({ d: `${d.getUTCMonth() + 1}/${String(d.getUTCDate()).padStart(2, "0")}`, w: WEEKDAY_CN[wd], dte });
  }
  return cols;
})();

/** 19 rows across ±range around the underlying (ProfitTable row count for this height), top = highest price. */
const ROW_HALF = 9;
export const buildTable = (m: StrategyModel) => {
  const rows = Array.from({ length: ROW_HALF * 2 + 1 }, (_, i) => {
    const k = ROW_HALF - i;
    const pct = (SNAPSHOT.range * k) / ROW_HALF;
    const price = SNAPSHOT.underlying * (1 + pct);
    return {
      price,
      pct: pct * 100,
      // ProfitTable draws its dashed accent rule under the row that holds the current price.
      showLine: k === -1,
      values: TABLE_COLUMNS.map((c) => m.pnl(price, c.dte)),
    };
  });
  const all = rows.flatMap((r) => r.values);
  return { rows, max: Math.max(...all), min: Math.min(...all) };
};
export type ProfitTable = ReturnType<typeof buildTable>;

/** ProfitLossTableHelper.calculateBackgroundColor (vlab-frontend strategy-core profit-loss-table-helper.ts). */
export const getBackgroundColor = (value: number, maxRange: number, minRange: number) => {
  const percent = (value / Math.max(Math.abs(maxRange), Math.abs(minRange))) * 100;
  const absolutePercent = Math.abs(percent || 0);
  const colorRatio = Math.min(1, absolutePercent / 100);
  const transparencyAdjust = Math.min(1, (absolutePercent - 100) / 500);
  const transparency = Math.round(absolutePercent) >= 100 ? 0.6 + 0.3 * (1 - transparencyAdjust) : 1;
  return percent >= 0
    ? `rgba(${220 * transparency}, ${45 * transparency}, ${45 * transparency}, ${colorRatio})`
    : `rgba(${40 * transparency}, ${180 * transparency}, ${90 * transparency}, ${colorRatio})`;
};

/** ProfitLossTableHelper.formatPercentage(value, addSign). */
export const formatPercentLabel = (pct: number, addSign = false) => {
  const abs = Math.abs(pct);
  const isDecimal = abs < 10 && (Math.round(pct * 10) / 10) % 1 !== 0;
  let body = `${isDecimal ? pct.toFixed(1) : pct.toFixed(0)}%`;
  if (addSign && pct > 0) body = `+${body}`;
  return body;
};

export const formatProfitLoss = (value: number) => Math.round(value).toLocaleString("en-US");
