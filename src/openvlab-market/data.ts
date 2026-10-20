/**
 * Market data → numbers → every derived figure shown on screen.
 * Logic ported 1:1 from vlab-frontend (read-only) so the video agrees with the real page:
 *  - rankings   : shared-core/src/domain/market/ctamap.ts:213-234 buildMarketRankingData
 *                 (top/bottom 5 of `atmv_1dchg` and `carry`; desktop slices 5 in MarketHeaderDesktop.tsx:192-213)
 *  - 溢价/carry  : the `carry` field (column id 'carry', MarketTableDesktop.tsx:294-311), tooltip
 *                 "隐含波动率与实际波动率的差值" (TooltipContent.tsx:230) → carry = atmv_current − rv22
 *  - quadrant   : shared-pages/src/market/panorama/model.ts:56-132 (x = ctn×100, y = atmv_1dchg,
 *                 collectDomain ±2·max|v|, symlog with linear threshold = order of magnitude of median |v|)
 *  - quadrants  : panorama/quadrant.ts (sign(ctn), sign(atmv_1dchg)), 0 counts as positive
 *  - remaining  : shared-core/src/domain/time/remaining.ts (expiry at 15:00, round to days)
 *  - table sort : shared-pages/src/market/market-table/MarketTable.tsx:23 DEFAULT_SORTING = ctn descend
 */

export type RawRow = Record<string, string>;

export type MarketRow = {
  product: string;
  alias: string;
  prodUnd: string;
  sector: string;
  sectorAlias: string;
  exchange: string;
  price: number;
  atmv: number;
  atmvChg: number;
  atmvPct: number;
  skew: number;
  skewChg: number;
  skewPct: number;
  valphaT: number;
  rv22: number;
  carry: number;
  ctn: number;
  exp: string;
  expiryDate: string;
  lastTime: string;
  night: boolean;
  overseas: boolean;
  /** days to expiry relative to the data snapshot time (calculateDTE semantics) */
  dte: number;
  /** "18天" etc. (calculateTimeRemaining semantics) */
  remaining: string;
  nearExpiry: boolean;
  /** 分时 preview (real from intraday.json, or synthetic fallback) – attached by buildModel */
  preview?: PreviewSeries;
};

const num = (s: string | undefined) => {
  const v = Number(String(s ?? "").trim());
  return Number.isFinite(v) ? v : NaN;
};

/** shared-core roundNumber + formatNumber */
export const roundNumber = (value: number, precision = 4) => {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) > 1e10 || Math.abs(value) < 1e-10) return 0;
  const f = 10 ** precision;
  return Math.round(value * f) / f;
};
export const formatNumber = (value: number, precision = 4, fixed?: number) => {
  const r = roundNumber(value, precision);
  return fixed !== undefined && fixed >= 0 ? r.toFixed(fixed) : String(r);
};
export const withSign = (text: string) => `${Number(text) > 0 ? "+" : ""}${text}`;
/** shared-core formatPercentageValue: 0.0443 → "+4.43%" */
export const formatPct = (v: number) => `${withSign(formatNumber(100 * v, 2))}%`;
/** Typographic minus for big display numbers. */
export const prettyMinus = (s: string) => s.replace(/^-/, "−");

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRY_HOUR = 15; // remaining.ts:5 DEFAULT_EXPIRATION_HOUR

const parseLocal = (s: string) => {
  // "2026-10-19 15:00:05" or "2026-11-11" – interpreted as wall-clock (no TZ maths needed, both sides same zone)
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return NaN;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : EXPIRY_HOUR, m[5] ? +m[5] : 0, m[6] ? +m[6] : 0);
};

export const calcDTE = (expiry: string, asOf: string) => (parseLocal(expiry) - parseLocal(asOf)) / DAY_MS;

export const timeRemaining = (dte: number) => {
  if (!(dte > 0)) return "已过期";
  const days = Math.round(dte);
  if (days >= 1) return `${days}天`;
  const hours = Math.floor(dte * 24);
  if (hours >= 1) return `${hours}小时`;
  const minutes = Math.ceil(dte * 24 * 60);
  return minutes > 0 ? `${minutes}分钟` : "已过期";
};

export const NEAR_EXPIRY_MAX_DAYS = 7; // panorama/model.ts:6

export const parseRows = (raw: RawRow[]): MarketRow[] => {
  const asOf = raw.map((r) => r.last_time ?? "").sort().slice(-1)[0] ?? "";
  return raw.map((r) => {
    const dte = calcDTE(r.expiry_date ?? "", asOf);
    return {
      product: r.product,
      alias: r.product_alias || r.prodUnd,
      prodUnd: r.prodUnd,
      sector: r.sector,
      sectorAlias: r.sector_alias,
      exchange: r.exchange,
      price: num(r.price),
      atmv: num(r.atmv_current),
      atmvChg: num(r.atmv_1dchg),
      atmvPct: num(r.atmv_percentile),
      skew: num(r.skew_current),
      skewChg: num(r.skew_1dchg),
      skewPct: num(r.skew_percentile),
      valphaT: num(r.valphaT),
      rv22: num(r.rv22),
      carry: num(r.carry),
      ctn: num(r.ctn),
      exp: r.exp,
      expiryDate: (r.expiry_date ?? "").trim(),
      lastTime: r.last_time,
      night: Number(r.has_night_trading) === 1,
      overseas: Number(r.is_overseas) === 1,
      dte,
      remaining: timeRemaining(dte),
      nearExpiry: Number.isFinite(dte) && Math.round(Math.max(dte, 0)) <= NEAR_EXPIRY_MAX_DAYS,
    };
  });
};

/* ---------------- rankings (ctamap.ts buildMarketRankingData) ---------------- */
type RankKey = "atmvChg" | "carry";
/** Rows whose value is missing are dropped (source drops null/undefined; the JSON's "nan" strings are treated as missing). */
export const rank = (rows: MarketRow[], key: RankKey, desc: boolean, size = 5) =>
  rows
    .filter((r) => Number.isFinite(r[key]))
    .slice()
    .sort((a, b) => (desc ? b[key] - a[key] : a[key] - b[key]))
    .slice(0, size);

export type Rankings = { topAtmvs: MarketRow[]; bottomAtmvs: MarketRow[]; topCarries: MarketRow[]; bottomCarries: MarketRow[] };
export const buildRankings = (rows: MarketRow[], size = 5): Rankings => ({
  topAtmvs: rank(rows, "atmvChg", true, size),
  bottomAtmvs: rank(rows, "atmvChg", false, size),
  topCarries: rank(rows, "carry", true, size),
  bottomCarries: rank(rows, "carry", false, size),
});

/* ---------------- sectors ---------------- */
/** Tab order of the real sector filter bar (全部 股指 金属 能化 农副 油脂 黑色). */
export const SECTOR_ORDER = ["EQ", "MT", "EN", "AG", "OS", "BK"] as const;
/** shared-core/src/domain/market/sector-icon.ts */
export const SECTOR_ICON: Record<string, string> = {
  AG: "agricultural",
  BK: "ferrous",
  EN: "chemical",
  EQ: "stock-index",
  MT: "noble-metal",
  OS: "oil",
};
export type SectorCount = { code: string; label: string; count: number };
export const sectorCounts = (rows: MarketRow[]): SectorCount[] => {
  const m = new Map<string, SectorCount>();
  for (const r of rows) {
    const cur = m.get(r.sector) ?? { code: r.sector, label: r.sectorAlias, count: 0 };
    cur.count += 1;
    m.set(r.sector, cur);
  }
  const ordered = SECTOR_ORDER.map((c) => m.get(c)).filter((x): x is SectorCount => !!x);
  const rest = [...m.values()].filter((s) => !SECTOR_ORDER.includes(s.code as (typeof SECTOR_ORDER)[number]));
  return [...ordered, ...rest];
};

/* ---------------- quadrant (panorama/model.ts) ---------------- */
export type QuadPoint = { row: MarketRow; x: number; y: number; sx: number; sy: number; quad: "lt" | "rt" | "lb" | "rb"; dist: number };
export type AxisDomain = { xMin: number; xMax: number; yMin: number; yMax: number; xL: number; yL: number };

const oom = (v: number) => (v <= 0 ? 1 : 10 ** Math.floor(Math.log10(v)));
const median = (values: number[], emptyDefault = 0) => {
  if (!values.length) return emptyDefault;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};
export const symlog = (value: number, lt: number) => Math.sign(value) * Math.log10(1 + Math.abs(value) / lt);
export const invSymlog = (value: number, lt: number) => Math.sign(value) * lt * (10 ** Math.abs(value) - 1);

export const collectDomain = (pts: { x: number; y: number }[]): AxisDomain => {
  const MIN_PAD = 0.5;
  let mx = 0;
  let my = 0;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of pts) {
    const ax = Math.abs(p.x);
    const ay = Math.abs(p.y);
    mx = Math.max(mx, ax);
    my = Math.max(my, ay);
    if (ax > 0) xs.push(ax);
    if (ay > 0) ys.push(ay);
  }
  const padX = Math.max((mx || MIN_PAD) * 2, MIN_PAD);
  const padY = Math.max((my || MIN_PAD) * 2, MIN_PAD);
  return { xMin: -padX, xMax: padX, yMin: -padY, yMax: padY, xL: oom(median(xs, 1)), yL: oom(median(ys, 1)) };
};

export const toQuadPoints = (rows: MarketRow[]) => {
  const base = rows.filter((r) => Number.isFinite(r.ctn) && Number.isFinite(r.atmvChg)).map((r) => ({ row: r, x: r.ctn * 100, y: r.atmvChg }));
  const domain = collectDomain(base);
  const points: QuadPoint[] = base.map((p) => ({
    ...p,
    sx: symlog(p.x, domain.xL),
    sy: symlog(p.y, domain.yL),
    quad: `${p.x >= 0 ? "r" : "l"}${p.y >= 0 ? "t" : "b"}` as QuadPoint["quad"],
    dist: Math.hypot(p.x, p.y),
  }));
  return { points, domain };
};

/** MarketPanoramaChart.tsx markTopLabelsPerQuad: farthest N per quadrant get a name label. */
export const topLabelsPerQuad = (points: QuadPoint[], n = 3) => {
  const show = new Set<string>();
  for (const q of ["lt", "rt", "lb", "rb"] as const) {
    points
      .filter((p) => p.quad === q)
      .sort((a, b) => b.dist - a.dist)
      .slice(0, n)
      .forEach((p) => show.add(p.row.product));
  }
  return show;
};

/** panorama/model.ts selectSummary – 0 counts as positive. */
export const selectSummary = (rows: MarketRow[]) => {
  const valid = rows.filter((r) => Number.isFinite(r.ctn) && Number.isFinite(r.atmvChg));
  return {
    count: valid.length,
    upCount: valid.filter((r) => r.ctn >= 0).length,
    downCount: valid.filter((r) => r.ctn < 0).length,
    ivUpCount: valid.filter((r) => r.atmvChg >= 0).length,
    ivDownCount: valid.filter((r) => r.atmvChg < 0).length,
  };
};

export const QUADRANTS = [
  { id: "lt", title: "价跌 · 波升", meaning: "下跌趋势加强", direction: "避险需求升温" },
  { id: "rt", title: "价涨 · 波升", meaning: "上涨趋势加强", direction: "波动预期抬升" },
  { id: "lb", title: "价跌 · 波降", meaning: "下跌趋势减弱", direction: "跌势中波动回落" },
  { id: "rb", title: "价涨 · 波降", meaning: "上涨趋势减弱", direction: "涨势中波动回落" },
] as const;

/* ---------------- table ---------------- */
/** MarketTable.tsx:23 DEFAULT_SORTING { field: 'ctn', order: 'descend' } */
export const sortForTable = (rows: MarketRow[]) => rows.slice().sort((a, b) => (Number.isFinite(b.ctn) ? b.ctn : -Infinity) - (Number.isFinite(a.ctn) ? a.ctn : -Infinity));

/* ---------------- everything the video needs ---------------- */
export type MarketModel = ReturnType<typeof buildModel>;

/* ---------------- 数值筛选 (shared-core metric-filters.ts getMarketMetricValue / matchesNumericRange) ---------------- */
export type MetricCondition = { field: string; label: string; unit: string; min: string; max: string };
const METRIC_VALUE: Record<string, (r: MarketRow) => number> = {
  atmv_current: (r) => r.atmv,
  atmv_1dchg: (r) => r.atmvChg,
  valphaT: (r) => r.valphaT,
  rv22: (r) => r.rv22,
  carry: (r) => r.carry,
  skew_current: (r) => r.skew,
  atmv_percentile: (r) => Math.round(r.atmvPct), // round: true
  skew_percentile: (r) => Math.round(r.skewPct), // round: true
  ctn: (r) => r.ctn * 100, // displayScale 100
  remainingDays: (r) => Math.round(r.dte),
};
/** missing value / non-finite → does not pass (same as the source) */
export const matchesMetric = (r: MarketRow, c: MetricCondition) => {
  const get = METRIC_VALUE[c.field];
  if (!get) return true;
  const v = get(r);
  if (!Number.isFinite(v)) return false;
  if (c.min.trim() !== "" && !(v >= Number(c.min))) return false;
  if (c.max.trim() !== "" && !(v <= Number(c.max))) return false;
  return true;
};
/** formatMarketMetricRangeLabel */
export const metricLabel = (c: MetricCondition) =>
  c.min !== "" && c.max !== "" ? `${c.min}${c.unit} ≤ ${c.label} ≤ ${c.max}${c.unit}` : c.min !== "" ? `${c.label} ≥ ${c.min}${c.unit}` : `${c.label} ≤ ${c.max}${c.unit}`;

export const buildModel = (raw: RawRow[], focusSector: string, intraday: readonly PreviewItem[] = [], metric?: MetricCondition) => {
  const parsed = parseRows(raw);
  const today = (parsed.map((r) => r.lastTime ?? "").sort().slice(-1)[0] ?? "").slice(0, 10);
  const previewMap = buildPreviewSeriesMaps(intraday, today);
  const missingPreview: string[] = [];
  const rows = parsed.map((r) => {
    const code = buildPreviewCode(r.prodUnd, r.exp);
    const hit = code ? previewMap.get(code) : undefined;
    if (!hit || hit.price.every((v) => v === null)) missingPreview.push(`${r.alias}(${code})`);
    return { ...r, preview: hit && hit.price.some((v) => v !== null) ? hit : syntheticPreview(r) };
  });
  const rankings = buildRankings(rows);
  const sectors = sectorCounts(rows);
  const summary = selectSummary(rows);
  const quad = toQuadPoints(rows);
  const tableRows = sortForTable(rows);
  const focus = sectors.find((s) => s.label === focusSector || s.code === focusSector) ?? sectors[0];
  const focusRows = rows.filter((r) => r.sector === focus?.code);
  const focusRankings = buildRankings(focusRows);
  const focusTable = tableRows.filter((r) => r.sector === focus?.code);
  const nearExpiryCount = rows.filter((r) => r.nearExpiry).length;
  const metricRows = metric ? tableRows.filter((r) => matchesMetric(r, metric)) : tableRows;
  const asOf = rows.map((r) => r.lastTime).sort().slice(-1)[0] ?? "";
  const topUp = rankings.topAtmvs[0];
  const topDown = rankings.bottomAtmvs[0];
  const premTop = rankings.topCarries[0];
  const premBot = rankings.bottomCarries[0];
  const two = (v: number) => formatNumber(v, 2, 2);
  const tokens: Record<string, string> = {
    count: String(rows.length),
    sectorCount: String(sectors.length),
    ivUp: String(summary.ivUpCount),
    ivDown: String(summary.ivDownCount),
    pxUp: String(summary.upCount),
    pxDown: String(summary.downCount),
    topUpName: topUp?.alias ?? "",
    topUpVal: prettyMinus(withSign(two(topUp?.atmvChg ?? 0))),
    topDownName: topDown?.alias ?? "",
    topDownVal: prettyMinus(withSign(two(topDown?.atmvChg ?? 0))),
    premTopName: premTop?.alias ?? "",
    premTopVal: prettyMinus(withSign(two(premTop?.carry ?? 0))),
    premBotName: premBot?.alias ?? "",
    premBotVal: prettyMinus(withSign(two(premBot?.carry ?? 0))),
    focusSector: focus?.label ?? "",
    focusCount: String(focus?.count ?? 0),
    metricLabel: metric ? metricLabel(metric) : "",
    metricCount: String(metricRows.length),
    metricHidden: String(tableRows.length - metricRows.length),
    nearExpiry: String(nearExpiryCount),
    asOf: asOf.slice(0, 16),
  };
  /** grid tiles: biggest IV movers first */
  const gridRows = rows.filter((r) => Number.isFinite(r.atmvChg)).sort((a, b) => Math.abs(b.atmvChg) - Math.abs(a.atmvChg));
  return { metricRows, missingPreview, rows, rankings, sectors, summary, quad, tableRows, focus, focusRows, focusRankings, focusTable, nearExpiryCount, tokens, asOf, gridRows };
};

/** "{count} 个品种" → "79 个品种" */
export const fill = (template: string, tokens: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, k: string) => tokens[k] ?? `{${k}}`);

/* ---------------- 分时 / 走势预览 series (shared-core/src/domain/market/preview-series.ts) ----------------
 * Real data: public/openvlab/intraday.json = priceVolatilityPreview response, PreviewSeriesItem[] keyed by
 * buildPreviewCode(prodUnd, exp) = "prodUnd:exp". buildPreviewSeriesMaps semantics are replicated:
 * - times normalised to minute keys "YYYY-MM-DD HH:mm:00" (toTimeKey);
 * - if the last price is dated `today`, the time axis is the full minute grid generated from `intervals`
 *   (generatePreviewTimeSeries) and values are looked up per minute (missing → null); otherwise the axis
 *   is the price timestamps. `today` = the snapshot date (market.json last_time), not the wall clock.
 * Fallback (only for products absent from intraday.json): a seeded synthetic walk ending at the real
 * ctn / atmv_1dchg, flagged `real: false`. */
export type PreviewItem = { symbol?: string | null; prices?: readonly (readonly [string, number])[] | null; volatilities?: readonly (readonly [string, number])[] | null; intervals?: readonly (readonly [string, string])[] | null };
export type PreviewSeries = { price: (number | null)[]; vol: (number | null)[]; start: string; end: string; real: boolean };

export const buildPreviewCode = (prodUnd?: string | null, exp?: string | null) => (!prodUnd || !exp ? null : `${String(prodUnd).trim()}:${String(exp).trim()}`);
const LOCAL_TIME = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const toTimeKey = (t: string) => (LOCAL_TIME.test(t) ? `${t.slice(0, 10)} ${t.slice(11, 16)}:00` : t);
const pad2 = (v: number) => (v < 10 ? `0${v}` : String(v));
const minuteGrid = (intervals: readonly (readonly [string, string])[]) => {
  const out: string[] = [];
  for (const [start, end] of intervals) {
    // wall-clock arithmetic in UTC so the box/Mac timezone never shifts the grid
    const s0 = parseLocal(start);
    const e0 = parseLocal(end);
    for (let ts = s0; ts <= e0; ts += 60_000) {
      const d = new Date(ts);
      out.push(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:00`);
    }
  }
  return out;
};
const normValues = (v: PreviewItem["prices"]) => (Array.isArray(v) ? v.filter((x) => x && typeof x[0] === "string" && typeof x[1] === "number").map((x) => [toTimeKey(x[0]), x[1]] as const) : []);

export const buildPreviewSeriesMaps = (items: readonly PreviewItem[], today: string) => {
  const map = new Map<string, PreviewSeries>();
  for (const it of items) {
    if (typeof it.symbol !== "string" || !it.symbol.trim()) continue;
    const prices = normValues(it.prices);
    const vols = normValues(it.volatilities);
    const intervals = Array.isArray(it.intervals) ? it.intervals.filter((x) => x && typeof x[0] === "string" && typeof x[1] === "string") : [];
    const lastDate = prices.length ? prices[prices.length - 1][0].slice(0, 10) : null;
    const axis = lastDate === today ? minuteGrid(intervals) : prices.map(([t]) => t);
    const pm = new Map(prices);
    const vm = new Map(vols);
    map.set(it.symbol.trim(), {
      price: axis.map((t) => pm.get(t) ?? null),
      vol: axis.map((t) => vm.get(t) ?? null),
      // LineSvg labels: dayjs(data[0].time / data[last].time).format("HH:mm")
      start: axis[0]?.slice(11, 16) ?? "",
      end: axis[axis.length - 1]?.slice(11, 16) ?? "",
      real: true,
    });
  }
  return map;
};

/* --- fallback only (products missing from intraday.json) --- */
const hashSeed = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const mulberry32 = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const bridge = (rand: () => number, n: number, start: number, end: number, vol: number) => {
  const w: number[] = [0];
  let m = 0;
  for (let i = 1; i < n; i++) {
    const g = (rand() + rand() + rand() - 1.5) * 1.15;
    m = 0.72 * m + 0.28 * g;
    w.push(w[i - 1] + m + g * 0.12);
  }
  const last = w[n - 1];
  return w.map((v, i) => start + (end - start) * (i / (n - 1)) + (v - last * (i / (n - 1))) * vol);
};
export const syntheticPreview = (r: MarketRow): PreviewSeries => {
  const rand = mulberry32(hashSeed(r.product || r.alias));
  const ctn = Number.isFinite(r.ctn) ? r.ctn : 0;
  const close = Number.isFinite(r.price) && r.price > 0 ? r.price : 100;
  const prev = close / (1 + ctn);
  const iv = Number.isFinite(r.atmv) ? r.atmv : 20;
  const chg = Number.isFinite(r.atmvChg) ? r.atmvChg : 0;
  return {
    price: bridge(rand, 64, prev, close, Math.max(Math.abs(close - prev) * 0.075, close * 0.0006)),
    vol: bridge(rand, 64, iv - chg, iv, Math.max(Math.abs(chg) * 0.075, 0.03)),
    start: r.night ? "21:00" : "09:00",
    end: "15:00",
    real: false,
  };
};
const EMPTY_PREVIEW: PreviewSeries = { price: [], vol: [], start: "", end: "", real: false };
/** Series attached to the row by buildModel (preview), else empty. */
export const previewOf = (r: MarketRow): PreviewSeries => r.preview ?? EMPTY_PREVIEW;
