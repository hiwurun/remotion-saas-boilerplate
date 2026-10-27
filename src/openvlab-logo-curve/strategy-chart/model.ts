/**
 * Static port of vlab-frontend `packages/components/src/strategy-chart` data/layout pipeline
 * (StrategyChart.tsx → useStrategyChartLayout.ts → chart-math.ts / chart-series.ts / chart-ticks.ts),
 * evaluated once for a frozen snapshot so every frame renders identical geometry.
 *
 * Snapshot (matches the reference screenshot): IM2611, long 1× MO2611-C-6600 @ 240.4, multiplier 100,
 * underlying 6645.4, settlement 2026-11-20 15:00 (+08:00), 24.4 DTE, Black-76 with the engine IV / rate of the
 * existing openvlab-strategy snapshot (0.3176116943359375 / 0.02398).
 *
 * Not in the source package (vendor-strategy / strategy-core internals) and therefore reconstructed:
 * - `getTheoreticalAs` → Black-76 call value × multiplier − cost.
 * - `chartStyleUtils.getLineDtes` / `getStyle` → [now, 11/14, expiry] with solid / dashed / dotted styles.
 * - `chartStyleUtils.getYDomain` → series min/max padded by 10% of the span.
 */

export type ChartPoint = { underlying: number; values: number[] };
export type AxisTickX = { value: number; x: number };
export type AxisTickY = { value: number; y: number };
export type ChartExtent = { max: number; min: number };

/* ---------------- snapshot ---------------- */
const STRIKE = 6600;
const COST = 240.4;
const MULTIPLIER = 100;
const IV = 0.3176116943359375;
const RATE = 0.02398;
const UNDERLYING = 6645.4;
const RANGE = 0.082;
/** Settlement 2026-11-20 15:00 Asia/Shanghai, as UTC ms. */
const SETTLEMENT_UTC_MS = Date.UTC(2026, 10, 20, 7, 0, 0);
/** `strategy.earliestSeries.dte` at capture time; lines are drawn at `LINE_DTES`. */
const SERIES_DTE = 24.41;
export const LINE_DTES = [24.4, 6.4, 0];

/** Logical (CSS px) size of the product chart container. */
export const CONTAINER_WIDTH = 1400;
export const CONTAINER_HEIGHT = 380;

/* ---------------- pricing (strategy.getTheoreticalAs, OutputType.ProfitLoss) ---------------- */
const erf = (x: number) => {
  const s = Math.sign(x);
  const a = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * a);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a);
  return s * y;
};
const normCdf = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
const black76Call = (forward: number, dte: number) => {
  const t = dte / 365;
  if (t <= 0) return Math.max(forward - STRIKE, 0);
  const vt = IV * Math.sqrt(t);
  const d1 = (Math.log(forward / STRIKE) + 0.5 * vt * vt) / vt;
  return Math.exp(-RATE * t) * (forward * normCdf(d1) - STRIKE * normCdf(d1 - vt));
};
const theoreticalProfitLoss = (price: number, lineDte: number) => (black76Call(price, lineDte) - COST) * MULTIPLIER;

/** StrategyStats.getBreakevens for the "now" line (monotone for a long call → bisection). */
const solveBreakEven = () => {
  let lo = UNDERLYING * (1 - RANGE);
  let hi = UNDERLYING * (1 + RANGE);
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (theoreticalProfitLoss(mid, LINE_DTES[0]) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

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

/* ---------------- StrategyChart.tsx ---------------- */
const priceMin = Math.max(UNDERLYING - UNDERLYING * RANGE, 0);
const priceMax = UNDERLYING + UNDERLYING * RANGE;
export const BREAK_EVEN = solveBreakEven();

/* ---------------- chart-math.ts calculateChartPoints ---------------- */
const extents: ChartExtent[] = LINE_DTES.map(() => ({ max: -Infinity, min: Infinity }));
const points: ChartPoint[] = [];
const appendPoint = (price: number) => {
  const values = LINE_DTES.map((dte, i) => {
    const v = theoreticalProfitLoss(price, dte);
    extents[i].max = Math.max(extents[i].max, v);
    extents[i].min = Math.min(extents[i].min, v);
    return v;
  });
  points.push({ underlying: price, values });
};
const sampleStep = (priceMax - priceMin) / CONTAINER_WIDTH;
for (let price = priceMin; price <= priceMax; price += sampleStep) appendPoint(price);
if (BREAK_EVEN > priceMin && BREAK_EVEN < priceMax) appendPoint(BREAK_EVEN);
points.sort((a, b) => a.underlying - b.underlying);
export const CHART_POINTS = points;
export const SERIES_EXTENTS = extents;

/* ---------------- useStrategyChartLayout.ts ---------------- */
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
export const CHART_LAYOUT = { ...verticalMargins, ...horizontalMargins, width: chartWidth, height: chartHeight };
export const xScale = scaleLinear([priceMin, priceMax], [0, chartWidth]);
export { yScale };
export const UNDERLYING_X = xScale(UNDERLYING);
export const ZERO_AXIS_Y = Math.min(Math.max(yScale(0), 0), chartHeight);

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
export const X_TICKS = buildCompactXTicks(xScale, CONTAINER_WIDTH);
export const Y_TICKS = buildCompactYTicks(yScale, CONTAINER_HEIGHT);

const toOverlayPercent = (value: number, total: number) => (value / total) * 100;
export const OVERLAY_LABELS = {
  currentPriceLabelLeftPercent: toOverlayPercent(CHART_LAYOUT.left + UNDERLYING_X, CONTAINER_WIDTH),
  currentPriceLabelTopPercent: toOverlayPercent(CHART_LAYOUT.top + CHART_LAYOUT.height, CONTAINER_HEIGHT),
  currentPriceValue: formatUnderlyingPrice(UNDERLYING),
  breakEven: {
    chartX: CHART_LAYOUT.left + xScale(BREAK_EVEN),
    leftPercent: toOverlayPercent(CHART_LAYOUT.left + xScale(BREAK_EVEN), CONTAINER_WIDTH),
    priceLabelTopPercent: toOverlayPercent(CHART_LAYOUT.top, CONTAINER_HEIGHT),
    tagLabelTopPercent: toOverlayPercent(CHART_LAYOUT.top + 12, CONTAINER_HEIGHT),
    value: formatUnderlyingPrice(BREAK_EVEN),
  },
};

/* ---------------- chart-series.ts ---------------- */
const WEEKDAY_CN = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;
const lineLabel = (lineDte: number) => {
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

const fmt = (v: number) => Number(v.toFixed(3));
const linePath = (index: number) =>
  CHART_POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(xScale(p.underlying))},${fmt(yScale(p.values[index] ?? 0))}`).join("");

export const LINE_SERIES = LINE_DTES.map((lineDte, index) => ({
  key: `${index}/${lineDte}`,
  label: lineLabel(lineDte),
  path: linePath(index),
  extent: SERIES_EXTENTS[index],
  gradientIdBase: `strat-graph-${index}-ovl`,
  ...LINE_STYLES[index],
}));

/** d3 area().y0(zeroAxisY).y1(line 0). */
export const AREA_PATH = (() => {
  const top = CHART_POINTS.map((p, i) => `${i === 0 ? "M" : "L"}${fmt(xScale(p.underlying))},${fmt(yScale(p.values[0] ?? 0))}`).join("");
  const bottom = CHART_POINTS.slice()
    .reverse()
    .map((p) => `L${fmt(xScale(p.underlying))},${fmt(ZERO_AXIS_Y)}`)
    .join("");
  return `${top}${bottom}Z`;
})();

export const LEGEND_ITEMS = LINE_SERIES.map((s) => ({ key: s.key, label: s.label, dashArray: s.dashArray, opacity: s.opacity }));

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

/* ---------------- placement of the chart in the 1920×1080 frame ---------------- */
/** Uniform zoom applied to the logical container (like viewing the product at 130%). */
export const STAGE_SCALE = 1.3;
export const STAGE_LEFT = (1920 - CONTAINER_WIDTH * STAGE_SCALE) / 2;
export const STAGE_TOP = (1080 - CONTAINER_HEIGHT * STAGE_SCALE) / 2;

/** The "now" (T+0) series in frame pixels — the morph lands exactly on this line. */
export const T0_SCREEN_POINTS = CHART_POINTS.map((p) => ({
  x: STAGE_LEFT + STAGE_SCALE * (CHART_LAYOUT.left + xScale(p.underlying)),
  y: STAGE_TOP + STAGE_SCALE * (CHART_LAYOUT.top + yScale(p.values[0] ?? 0)),
}));
/** Product series stroke width (2 CSS px) in frame pixels. */
export const T0_SCREEN_STROKE = 2 * STAGE_SCALE;
