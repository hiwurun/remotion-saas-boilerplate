/**
 * Port of the frontend 2D volatility-curve chart option builder:
 *   shared-core/src/domain/volatility/chart-options.ts  (createVolatilityChartOptions, full mode)
 *   shared-core/src/domain/volatility/open-interest-bars.ts (CHART_OI_COLORS, createStrikeOpenInterestBarSeries, buildStrikeOpenInterestBars)
 *   shared-core/src/domain/volatility/chart-builders.ts (calculateVolatilityRange, appendVolatilitySmileData, appendStrikeOIData, appendMktVolSeries)
 * Option values are copied verbatim; CSS vars are resolved to the .dark tokens because the SVG is rendered via
 * echarts SSR. Tooltips/interaction removed. `reveal` lets the video bring layers in one at a time.
 */
const VOLATILITY_YESTERDAY_LINE_DASH: [number, number] = [1.5, 1.5];
const FORWARD_LINE_DASH: [number, number] = [4, 2];

export const DARK = {
  axis: "#a0a5ac", // --vlab-chart-axis = --muted-foreground (dark)
  future: "#1380b3", // --vlab-future
  iv: "#a21caf", // --vlab-purple
  ivText: "#b071e8", // --vlab-iv
  text: "#eff2f6", // --foreground (dark)
  muted: "#a0a5ac",
  red: "#ea3943",
  green: "#16c784",
  popover: "#181818", // dialog surface (--popover dark, oklch(0.21 0 0))
};

export const CHART_OI_COLORS = {
  call: { current: "#cd0e2c", previous: "rgba(205, 14, 44, 0.35)" },
  put: { current: "#157f37", previous: "rgba(21, 127, 55, 0.35)" },
} as const;

const STRIKE_OPEN_INTEREST_SERIES_NAMES = ["strike_oid_p", "strike_oid_c", "strike_poi_p", "strike_poi_c"] as const;
type OiName = (typeof STRIKE_OPEN_INTEREST_SERIES_NAMES)[number];
const SERIES_META: Record<OiName, { color: string; stack: string }> = {
  strike_oid_p: { color: CHART_OI_COLORS.put.current, stack: "OI_P" },
  strike_oid_c: { color: CHART_OI_COLORS.call.current, stack: "OI_C" },
  strike_poi_p: { color: CHART_OI_COLORS.put.previous, stack: "OI_P" },
  strike_poi_c: { color: CHART_OI_COLORS.call.previous, stack: "OI_C" },
};

const isValidVol = (vol: number | undefined): vol is number => vol !== undefined && vol !== 100 && vol > 0;

export type RawExpiry = {
  theovol_tday: [number, number][];
  theovol_yday: [number, number][];
  mktvol_tday_call_bid: [number, number][];
  mktvol_tday_call_ask: [number, number][];
  mktvol_tday_put_bid: [number, number][];
  mktvol_tday_put_ask: [number, number][];
  strike_poi_c: Record<string, number>;
  strike_poi_p: Record<string, number>;
  strike_oid_c: Record<string, number>;
  strike_oid_p: Record<string, number>;
  display_strike: [number, number];
  forward_td: number;
  forward_yd: number;
  atmvol_tday: number;
  atmvol_yday: number;
  days: number;
  expiry: string;
};

export type Reveal = { today: number; yday: number; fwd: number; oi: number; quotes: number };

const createStrikeOpenInterestBarSeries = (barWidth: number): any[] =>
  STRIKE_OPEN_INTEREST_SERIES_NAMES.map((seriesName, index) => {
    const meta = SERIES_META[seriesName];
    const series: any = { name: seriesName, type: "bar", xAxisIndex: 0, yAxisIndex: 1, itemStyle: { color: meta.color }, barWidth, stack: meta.stack, data: [] };
    if (index === 0) {
      series.markLine = { silent: true, symbol: ["none", "none"], label: { show: false }, lineStyle: { color: "#666666", width: 1 }, data: [{ yAxis: 0, name: "zero" }] };
    }
    return series;
  });

export const createVolatilityChartOptions = (barWidth = 6): any => {
  const axisColor = DARK.axis;
  const axisConfig = { axisTick: { show: false }, axisLine: { show: false }, splitLine: { show: false }, nameTextStyle: { fontSize: 11, color: axisColor } };
  return {
    title: { text: "", left: "center", textStyle: { fontSize: 13 } },
    legend: {
      top: 10,
      left: "center",
      itemWidth: 15,
      itemHeight: 10,
      textStyle: { fontSize: 12, color: DARK.text },
      formatter: (name: string) => (name === "今日波动率" ? "今日" : name === "昨日波动率" ? "昨日" : name),
      selected: { 今日波动率: true, 昨日波动率: true },
      data: ["今日波动率", "昨日波动率"],
      show: true,
    },
    grid: { top: "40px", left: "34px", right: "60px", bottom: "30px" },
    animation: false,
    xAxis: [
      { type: "value", min: "dataMin", max: "dataMax", show: true, ...axisConfig, axisLabel: { color: axisColor } },
      { type: "category", show: false, boundaryGap: false, position: "bottom", ...axisConfig },
    ],
    yAxis: [
      { type: "value", scale: true, ...axisConfig, name: "隐波", axisLabel: { formatter: (v: number) => `${Math.round(v)}%`, color: axisColor } },
      { type: "value", name: "持仓量", ...axisConfig, axisLabel: { color: axisColor } },
    ],
    series: [
      {
        name: "今日波动率",
        type: "line",
        symbol: "emptyCircle",
        symbolSize: 9,
        itemStyle: { color: DARK.iv },
        showSymbol: true,
        lineStyle: { color: DARK.iv, width: 2.2 },
        smooth: 0.25,
        markLine: {
          symbol: "none",
          precision: 4,
          data: [
            { name: "today_forward", lineStyle: { color: DARK.future, type: "solid", width: 2 }, label: { show: false } },
            { name: "yesterday_forward", lineStyle: { color: "rgba(96, 98, 102, 0.5)", dashOffset: 0, type: FORWARD_LINE_DASH, width: 1 }, label: { show: false } },
          ],
          silent: false,
        },
        data: [],
      },
      {
        name: "昨日波动率",
        type: "line",
        symbol: "circle",
        symbolSize: 9,
        itemStyle: { color: "rgba(158, 158, 158, 0.5)" },
        showSymbol: true,
        lineStyle: { color: "rgba(158, 158, 158, 0.5)", dashOffset: 0, type: VOLATILITY_YESTERDAY_LINE_DASH, width: 1.5 },
        smooth: 0.25,
        data: [],
      },
      ...createStrikeOpenInterestBarSeries(barWidth),
    ],
  };
};

const VOLATILITY_RANGE_METRICS = ["mktvol_tday_call_bid", "mktvol_tday_call_ask", "mktvol_tday_put_bid", "mktvol_tday_put_ask", "theovol_tday", "theovol_yday"] as const;
const calculateVolatilityRange = (data: RawExpiry): [number, number] => {
  let [min, max] = [Infinity, -Infinity];
  const ds = data.display_strike;
  VOLATILITY_RANGE_METRICS.forEach((key) => {
    (data[key] ?? []).forEach((v) => {
      const value = Number(v[1]);
      if (v[0] < ds[0] || v[0] > ds[1] || !isValidVol(value)) return;
      min = Math.min(min, value);
      max = Math.max(max, value);
    });
  });
  if (min === Infinity) return [0, 0];
  return [Number((min - 1).toFixed(1)), Number((max + 1).toFixed(1))];
};

/** buildStrikeOpenInterestBars */
export const oiBars = (rec: Record<string, number>): [number, number][] =>
  Object.keys(rec ?? {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b)
    .map((k) => [k, Number(rec[String(k)] ?? rec[k.toFixed(1)] ?? 0)]);

/** truncate a polyline at fraction p of the x range (adds an interpolated head point) */
const partial = (pts: [number, number][], x0: number, x1: number, p: number): [number, number][] => {
  if (p >= 1) return pts;
  if (p <= 0) return [];
  const xe = x0 + (x1 - x0) * p;
  const out = pts.filter(([x]) => x <= xe);
  const next = pts.find(([x]) => x > xe);
  const prev = out[out.length - 1];
  if (next && prev) out.push([xe, prev[1] + ((next[1] - prev[1]) * (xe - prev[0])) / (next[0] - prev[0])]);
  return out;
};

export const buildVolChartOption = (d: RawExpiry, r: Reveal, barWidth = 6) => {
  const chart = createVolatilityChartOptions(barWidth);
  const [minY, maxY] = calculateVolatilityRange(d);
  const [minX, maxX] = d.display_strike;
  chart.xAxis[0].min = minX;
  chart.xAxis[0].max = maxX;
  chart.yAxis[0].min = minY;
  chart.yAxis[0].max = maxY;
  const today = d.theovol_tday.filter((p) => isValidVol(p[1]));
  const yday = d.theovol_yday.filter((p) => isValidVol(p[1]));
  chart.series[0].data = partial(today, minX, maxX, r.today);
  chart.series[1].data = partial(yday, minX, maxX, r.yday);
  const ml = chart.series[0].markLine.data;
  ml[0].xAxis = d.forward_td;
  ml[0].value = d.forward_td;
  ml[1].xAxis = d.forward_yd;
  ml[1].value = d.forward_yd;
  ml[0].lineStyle.opacity = r.fwd;
  ml[1].lineStyle.opacity = r.fwd;
  // appendStrikeOIData – bars scaled by reveal (axis kept at the final range)
  for (const s of chart.series.slice(2)) {
    s.data = oiBars((d as any)[s.name]).map(([k, v]) => [k, v * r.oi]);
    if (s.markLine) s.markLine.lineStyle.opacity = Math.min(1, r.oi * 2);
  }
  // appendMktVolSeries (full mode)
  (
    [
      { name: "mktvol_tday_call_bid", color: "green", formatter: "C" },
      { name: "mktvol_tday_call_ask", color: "red", formatter: "C" },
      { name: "mktvol_tday_put_bid", color: "green", formatter: "P" },
      { name: "mktvol_tday_put_ask", color: "red", formatter: "P" },
    ] as const
  ).forEach(({ name, color, formatter }) => {
    chart.series.push({ name: `${name}@${d.expiry}`, itemStyle: { color }, symbol: "circle", symbolSize: 0, label: { show: r.quotes > 0, formatter, color, fontSize: 10, opacity: r.quotes }, data: d[name], type: "scatter" });
  });
  return chart;
};
