/**
 * Port of vlab-frontend `packages/components/src/strategy-chart` data/layout pipeline
 * (StrategyChart.tsx → useStrategyChartLayout.ts → chart-math.ts / chart-series.ts / chart-ticks.ts),
 * evaluated for a frozen snapshot so every frame renders deterministic geometry.
 *
 * Snapshot: IM2611, underlying 6645.4, multiplier 100, settlement 2026-11-20 15:00 (+08:00), 24.41 DTE, Black-76
 * with the engine IV / rate of the existing openvlab-strategy snapshot (0.3176116943359375 / 0.02398).
 * Default strategy (matches the reference screenshot): long 1× MO2611-C-6600 @ 240.4.
 *
 * Not in the source package (vendor-strategy / strategy-core internals) and therefore reconstructed:
 * - `getTheoreticalAs` → Σ qty × (Black-76 value − cost) × multiplier.
 * - `chartStyleUtils.getLineDtes` / `getStyle` → the strategy's line DTEs with solid / dashed / dotted styles.
 * - `chartStyleUtils.getYDomain` → series min/max padded by 10% of the span.
 */

export type ChartPoint = { underlying: number; values: number[] };
export type AxisTickX = { value: number; x: number };
export type AxisTickY = { value: number; y: number };
export type ChartExtent = { max: number; min: number };
export type Leg = { type: "C" | "P"; strike: number; qty: number; cost: number };
export type StrategyDef = { legs: Leg[]; lineDtes: number[] };

/* ---------------- snapshot ---------------- */
const MULTIPLIER = 100;
const IV = 0.3176116943359375;
const RATE = 0.02398;
const UNDERLYING = 6645.4;
const RANGE = 0.082;
/** Settlement 2026-11-20 15:00 Asia/Shanghai, as UTC ms. */
const SETTLEMENT_UTC_MS = Date.UTC(2026, 10, 20, 7, 0, 0);
/** `strategy.earliestSeries.dte` at capture time. */
const SERIES_DTE = 24.41;
export const BASE_IV = IV;

/** Logical (CSS px) size of the product chart container. */
export const CONTAINER_WIDTH = 1400;
export const CONTAINER_HEIGHT = 380;

/* ---------------- pricing ---------------- */
const erf = (x: number) => {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};
const normCdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
/** Black-76 option on a future, discounted. */
export const black76 = (type: "C" | "P", forward: number, strike: number, dte: number, ivMult = 1) => {
  const t = dte / 365;
  if (t <= 0) return Math.max(type === "C" ? forward - strike : strike - forward, 0);
  const vt = IV * ivMult * Math.sqrt(t);
  const d1 = (Math.log(forward / strike) + 0.5 * vt * vt) / vt;
  const d2 = d1 - vt;
  const df = Math.exp(-RATE * t);
  return type === "C" ? df * (forward * normCdf(d1) - strike * normCdf(d2)) : df * (strike * normCdf(-d2) - forward * normCdf(-d1));
};
/** Model mark of a contract at the snapshot (used to price legs that have no captured quote). */
export const snapshotMark = (type: "C" | "P", strike: number) => black76(type, UNDERLYING, strike, SERIES_DTE);

/* ---------------- formatting ---------------- */
/** underlying.profile.priceFormat for IM (0.2 tick → up to 1 decimal, grouped). */
const priceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, minimumFractionDigits: 0 });
export const formatUnderlyingPrice = (value: number) => priceFormat.format(value);
/** chart-ticks.ts formatYAxisTickLabel → formatNumber(value, 2). */
export const formatYAxisTickLabel = (value: number) => String(Number(value.toFixed(2)));

/* ---------------- d3-scale linear + ticks ---------------- */
const E10 = Math.sqrt(50);
const E5 = Math.sqrt(10);
const E2 = Math.sqrt(2);
const tickSpec = (start: number, stop: number, count: number): [number, number, number] => {
  const step = (stop - start) / Math.max(0, count);
  const power = Math.floor(Math.log10(step));
  const error = step / Math.pow(10, power);
  const factor = error >= E10 ? 10 : error >= E5 ? 5 : error >= E2 ? 2 : 1;
  const inc = Math.pow(10, power) * factor;
  let i1 = Math.round(start / inc);
  let i2 = Math.round(stop / inc);
  if (i1 * inc < start) ++i1;
  if (i2 * inc > stop) --i2;
  return [i1, i2, inc];
};
const d3Ticks = (start: number, stop: number, count: number) => {
  const reverse = stop < start;
  const [i1, i2, inc] = reverse ? tickSpec(stop, start, count) : tickSpec(start, stop, count);
  if (!(i2 >= i1)) return [];
  const n = i2 - i1 + 1;
  return Array.from({ length: n }, (_, i) => (reverse ? (i2 - i) * inc : (i1 + i) * inc));
};
type Scale = ((v: number) => number) & { ticks: (count: number) => number[] };
const scaleLinear = (domain: [number, number], range: [number, number]): Scale => {
  const s = ((v: number) => range[0] + ((v - domain[0]) / (domain[1] - domain[0])) * (range[1] - range[0])) as Scale;
  s.ticks = (count: number) => d3Ticks(domain[0], domain[1], count);
  return s;
};

const buildCompactXTicks = (scaleX: Scale, containerWidth: number): AxisTickX[] => {
  const rawTicks = scaleX.ticks(Math.max(2, Math.floor(containerWidth / 80)));
  const minSpacing = 44;
  const compact: AxisTickX[] = [];
  for (const value of rawTicks) {
    const x = Math.round(scaleX(value));
    const prev = compact[compact.length - 1];
    if (!prev || x - prev.x >= minSpacing) compact.push({ value, x });
  }
  const last = rawTicks[rawTicks.length - 1];
  if (last != null) {
    const lastX = Math.round(scaleX(last));
    const prev = compact[compact.length - 1];
    if (!prev || prev.value !== last) {
      if (prev && lastX - prev.x < minSpacing) compact[compact.length - 1] = { value: last, x: lastX };
      else compact.push({ value: last, x: lastX });
    }
  }
  return compact;
};
const buildCompactYTicks = (scaleY: Scale, containerHeight: number): AxisTickY[] => {
  const rawTicks = scaleY.ticks(Math.max(2, Math.floor(containerHeight / 50)));
  const compact: AxisTickY[] = [];
  for (const value of rawTicks) {
    const y = Math.round(scaleY(value));
    const prev = compact[compact.length - 1];
    if (!prev || Math.abs(y - prev.y) >= 18) compact.push({ value, y });
  }
  return compact;
};

/* ---------------- chart-series.ts labels / styles ---------------- */
const WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;
export const lineLabel = (lineDte: number) => {
  const base = (() => {
    if (lineDte === 0) return "到期日";
    const local = new Date(SETTLEMENT_UTC_MS - lineDte * 86_400_000 + 8 * 3_600_000);
    const weekday = local.getUTCDay() === 0 ? 7 : local.getUTCDay();
    return `${WEEKDAY_CN[weekday - 1]} ${local.getUTCMonth() + 1}月${local.getUTCDate()}日`;
  })();
  const suffix = SERIES_DTE <= lineDte ? " (当前)" : ` (${Math.max(0, Math.floor(SERIES_DTE - lineDte))}天)`;
  return `${base}${suffix}`;
};

/** chartStyleUtils.getStyle(lineIndex, lineCount): first line solid, then dashed, last (expiry) dotted. */
const LINE_STYLES: Array<{ dashArray?: string; opacity: number }> = [
  { opacity: 1 },
  { dashArray: "6,4", opacity: 0.75 },
  { dashArray: "1,4", opacity: 0.6 },
];

/** StrategyChartView getGradientMiddleOffset. */
export const getGradientMiddleOffset = (extent: ChartExtent) => {
  const span = extent.max - extent.min;
  if (!Number.isFinite(span) || span === 0) {
    if (extent.max > 0 && extent.min >= 0) return 1;
    if (extent.max <= 0 && extent.min < 0) return 0;
    return 0.5;
  }
  return Math.max(0, Math.min(1, extent.max / span));
};

const fmt = (v: number) => Number(v.toFixed(3));
const toOverlayPercent = (value: number, total: number) => (value / total) * 100;

/* ---------------- placement of the chart in the 1920×1080 frame ---------------- */
/** Uniform zoom applied to the logical container (like viewing the product at 130%). */
export const STAGE_SCALE = 1.3;
export const STAGE_LEFT = (1920 - CONTAINER_WIDTH * STAGE_SCALE) / 2;
export const STAGE_TOP = (1080 - CONTAINER_HEIGHT * STAGE_SCALE) / 2;
/** Product series stroke width (2 CSS px) in frame pixels. */
export const T0_SCREEN_STROKE = 2 * STAGE_SCALE;

export type LiveLine = {
  key: string;
  label: string;
  path: string;
  extent: ChartExtent;
  gradientIdBase: string;
  dashArray?: string;
  opacity: number;
};

/** The whole chart pipeline for one strategy. */
export const createStrategyModel = (def: StrategyDef) => {
  const { legs, lineDtes } = def;
  const pnl = (price: number, lineDte: number, ivMult = 1) =>
    legs.reduce((sum, leg) => sum + leg.qty * (black76(leg.type, price, leg.strike, lineDte, ivMult) - leg.cost), 0) * MULTIPLIER;

  const priceMin = Math.max(UNDERLYING - UNDERLYING * RANGE, 0);
  const priceMax = UNDERLYING + UNDERLYING * RANGE;
  const sampleStep = (priceMax - priceMin) / CONTAINER_WIDTH;
  const samplePrices: number[] = [];
  for (let price = priceMin; price <= priceMax; price += sampleStep) samplePrices.push(price);

  /** StrategyStats.getBreakevens for one line: every sign change on the sampling grid, refined by bisection. */
  const breakEvens = (lineDte: number, ivMult = 1) => {
    const out: number[] = [];
    const grid = [priceMin, ...samplePrices.slice(1), priceMax];
    for (let k = 1; k < grid.length; k++) {
      let lo = grid[k - 1];
      let hi = grid[k];
      const flo = pnl(lo, lineDte, ivMult);
      const fhi = pnl(hi, lineDte, ivMult);
      if (flo === 0 || flo * fhi >= 0) continue;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (pnl(mid, lineDte, ivMult) * flo > 0) lo = mid;
        else hi = mid;
      }
      out.push((lo + hi) / 2);
    }
    return out;
  };

  /* chart-math.ts calculateChartPoints */
  const extents: ChartExtent[] = lineDtes.map(() => ({ max: -Infinity, min: Infinity }));
  const points: ChartPoint[] = [];
  const appendPoint = (price: number) => {
    const values = lineDtes.map((dte, i) => {
      const v = pnl(price, dte);
      extents[i].max = Math.max(extents[i].max, v);
      extents[i].min = Math.min(extents[i].min, v);
      return v;
    });
    points.push({ underlying: price, values });
  };
  samplePrices.forEach(appendPoint);
  const breakEven = breakEvens(lineDtes[0])[0] ?? null;
  if (breakEven != null && breakEven > priceMin && breakEven < priceMax) appendPoint(breakEven);
  points.sort((a, b) => a.underlying - b.underlying);

  /* useStrategyChartLayout.ts */
  const minY = Math.min(...extents.map((e) => e.min));
  const maxY = Math.max(...extents.map((e) => e.max));
  const yPad = 0.1 * (maxY - minY);
  const verticalMargins = { top: 6, bottom: 26 };
  const chartHeight = Math.max(1, CONTAINER_HEIGHT - verticalMargins.top - verticalMargins.bottom);
  const yScale = scaleLinear([maxY + yPad, minY - yPad], [0, chartHeight]);
  const yAxisLeftMargin =
    6 * Math.max(formatYAxisTickLabel(minY).length, formatYAxisTickLabel(maxY).length, formatYAxisTickLabel(0).length) + 4;
  const horizontalMargins = { left: Math.max(0, yAxisLeftMargin), right: 24 };
  const chartWidth = Math.max(1, CONTAINER_WIDTH - horizontalMargins.left - horizontalMargins.right);
  const layout = { ...verticalMargins, ...horizontalMargins, width: chartWidth, height: chartHeight };
  const xScale = scaleLinear([priceMin, priceMax], [0, chartWidth]);
  const underlyingX = xScale(UNDERLYING);
  const zeroAxisY = Math.min(Math.max(yScale(0), 0), chartHeight);

  const breakEvenOverlay = (be: number) => {
    const chartX = layout.left + xScale(be);
    return { at: be, chartX, leftPercent: toOverlayPercent(chartX, CONTAINER_WIDTH), value: formatUnderlyingPrice(be) };
  };

  const linePath = (index: number) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(xScale(p.underlying))},${fmt(yScale(p.values[index] ?? 0))}`).join("");
  const lineSeries = lineDtes.map((lineDte, index) => ({
    key: `${index}/${lineDte}`,
    label: lineLabel(lineDte),
    path: linePath(index),
    extent: extents[index],
    gradientIdBase: `strat-graph-${index}-ovl`,
    ...LINE_STYLES[index],
  }));
  const areaPath = (() => {
    const bottom = points
      .slice()
      .reverse()
      .map((p) => `L${fmt(xScale(p.underlying))},${fmt(zeroAxisY)}`)
      .join("");
    return `${linePath(0)}${bottom}Z`;
  })();

  /* live series: same pipeline, evaluated per frame for date / IV changes */
  const sampleLine = (lineDte: number, ivMult: number) => {
    const be = breakEvens(lineDte, ivMult);
    const prices = [...samplePrices, ...be.filter((b) => b > priceMin && b < priceMax)].sort((a, b) => a - b);
    const extent: ChartExtent = { max: -Infinity, min: Infinity };
    const values = prices.map((price) => {
      const v = pnl(price, lineDte, ivMult);
      extent.max = Math.max(extent.max, v);
      extent.min = Math.min(extent.min, v);
      return v;
    });
    return { prices, values, extent };
  };
  const toPath = (prices: number[], values: number[]) =>
    prices.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(xScale(p))},${fmt(yScale(values[i]))}`).join("");

  const buildLine = (opts: { lineDte: number; ivMult?: number; index: number; idBase: string; opacity?: number; dashArray?: string }): LiveLine => {
    const { prices, values, extent } = sampleLine(opts.lineDte, opts.ivMult ?? 1);
    return {
      key: `${opts.index}/${opts.lineDte.toFixed(3)}`,
      label: lineLabel(Math.round(opts.lineDte * 10) / 10),
      path: toPath(prices, values),
      extent,
      gradientIdBase: opts.idBase,
      dashArray: opts.dashArray ?? LINE_STYLES[opts.index]?.dashArray,
      opacity: opts.opacity ?? LINE_STYLES[opts.index]?.opacity ?? 1,
    };
  };
  const buildArea = (lineDte: number, ivMult = 1) => {
    const { prices, values } = sampleLine(lineDte, ivMult);
    const bottom = prices
      .slice()
      .reverse()
      .map((p) => `L${fmt(xScale(p))},${fmt(zeroAxisY)}`)
      .join("");
    return `${toPath(prices, values)}${bottom}Z`;
  };
  const liveBreakEven = (lineDte: number, ivMult = 1) => {
    const be = breakEvens(lineDte, ivMult)[0];
    return be == null ? null : breakEvenOverlay(be);
  };
  /** Line 0 of the given date in 1920×1080 frame px (where the chart stage draws it). */
  const screenPoints = (lineDte: number = lineDtes[0], ivMult = 1) => {
    const { prices, values } = sampleLine(lineDte, ivMult);
    return prices.map((p, i) => ({
      x: STAGE_LEFT + STAGE_SCALE * (layout.left + xScale(p)),
      y: STAGE_TOP + STAGE_SCALE * (layout.top + yScale(values[i])),
    }));
  };

  return {
    legs,
    lineDtes,
    pnl,
    breakEvens,
    priceMin,
    priceMax,
    CHART_POINTS: points,
    SERIES_EXTENTS: extents,
    CHART_LAYOUT: layout,
    xScale,
    yScale,
    UNDERLYING_X: underlyingX,
    ZERO_AXIS_Y: zeroAxisY,
    X_TICKS: buildCompactXTicks(xScale, CONTAINER_WIDTH),
    Y_TICKS: buildCompactYTicks(yScale, CONTAINER_HEIGHT),
    BREAK_EVEN: breakEven,
    OVERLAY_LABELS: {
      currentPriceLabelLeftPercent: toOverlayPercent(layout.left + underlyingX, CONTAINER_WIDTH),
      currentPriceLabelTopPercent: toOverlayPercent(layout.top + layout.height, CONTAINER_HEIGHT),
      currentPriceValue: formatUnderlyingPrice(UNDERLYING),
      breakEven: {
        ...(breakEven != null ? breakEvenOverlay(breakEven) : { at: NaN, chartX: NaN, leftPercent: NaN, value: "" }),
        priceLabelTopPercent: toOverlayPercent(layout.top, CONTAINER_HEIGHT),
        tagLabelTopPercent: toOverlayPercent(layout.top + 12, CONTAINER_HEIGHT),
      },
    },
    LINE_SERIES: lineSeries,
    AREA_PATH: areaPath,
    LEGEND_ITEMS: lineSeries.map((s) => ({ key: s.key, label: s.label, dashArray: s.dashArray, opacity: s.opacity })),
    buildLine,
    buildArea,
    liveBreakEven,
    screenPoints,
    /** Chart-space point (container px) of a line at a price, for hover-style read-outs. */
    pointAt: (price: number, lineDte: number, ivMult = 1) => {
      const value = pnl(price, lineDte, ivMult);
      return { x: layout.left + xScale(price), y: layout.top + yScale(value), value };
    },
    /** Container-space x of a price. */
    priceX: (price: number) => layout.left + xScale(price),
  };
};
export type StrategyModel = ReturnType<typeof createStrategyModel>;

export const SNAPSHOT = {
  multiplier: MULTIPLIER,
  underlying: UNDERLYING,
  range: RANGE,
  seriesDte: SERIES_DTE,
  settlementUtcMs: SETTLEMENT_UTC_MS,
};

/* ---------------- default: the reference screenshot's long call ---------------- */
export const LINE_DTES = [24.4, 6.4, 0];
export const LONG_CALL = createStrategyModel({ legs: [{ type: "C", strike: 6600, qty: 1, cost: 240.4 }], lineDtes: LINE_DTES });

export const {
  CHART_POINTS,
  SERIES_EXTENTS,
  CHART_LAYOUT,
  xScale,
  yScale,
  UNDERLYING_X,
  ZERO_AXIS_Y,
  X_TICKS,
  Y_TICKS,
  OVERLAY_LABELS,
  LINE_SERIES,
  AREA_PATH,
  LEGEND_ITEMS,
} = LONG_CALL;
export const BREAK_EVEN = LONG_CALL.BREAK_EVEN as number;

/** The "now" (T+0) series in frame pixels — the logo-curve morph lands exactly on this line. */
export const T0_SCREEN_POINTS = CHART_POINTS.map((p) => ({
  x: STAGE_LEFT + STAGE_SCALE * (CHART_LAYOUT.left + xScale(p.underlying)),
  y: STAGE_TOP + STAGE_SCALE * (CHART_LAYOUT.top + yScale(p.values[0] ?? 0)),
}));
