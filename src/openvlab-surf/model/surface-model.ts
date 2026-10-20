// Ported from vlab-frontend packages/shared-core/src/domain/volatility/surface-model.ts (logic unchanged).
const isValidVol = (vol: number | undefined): vol is number => vol !== undefined && vol !== 100 && vol > 0;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const isFiniteNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
import type {
  ChartSeriesEntry,
  SurfaceChartInput,
  SurfaceColorDomain,
  SurfaceDataset,
  SurfaceHoverInfo,
  SurfaceLayout,
  SurfaceModel,
  SurfaceOiSnapshot,
  SurfaceRow,
  SurfaceSliceData,
} from './types';

interface SurfaceChartPoint {
  strike: number;
  value: number;
}

interface NormalizedSurfaceChart {
  daysToExpiry: number;
  volPoints: SurfaceChartPoint[];
  putOiPoints: SurfaceChartPoint[];
  callOiPoints: SurfaceChartPoint[];
}

const SURFACE_LAYOUT: SurfaceLayout = {
  oiAxisMaxHeight: 0.15,
  volAxisBaseHeight: 0.18,
  volAxisHeight: 0.76,
  hoverBaseHeight: 0,
  xScale: 0.95,
  zScale: 0.9,
};

const VOL_SERIES_PRIORITY = ['今日波动率'] as const;
const PUT_OI_SERIES_PRIORITY = ['strike_poi_p', 'strike_oid_p', 'strike_oi_p'] as const;
const CALL_OI_SERIES_PRIORITY = ['strike_poi_c', 'strike_oid_c', 'strike_oi_c'] as const;
const EMPTY_OI_SNAPSHOT: SurfaceOiSnapshot = { putOi: 0, callOi: 0, totalOi: 0 };

export function buildSurfaceModel(charts: SurfaceChartInput[]): SurfaceModel {
  const dataset = buildSurfaceDataset(normalizeSurfaceCharts(charts));
  return {
    dataset,
    legendRange:
      dataset.surfacePoints.length === 0
        ? null
        : {
            min: dataset.colorDomain.colorMinVol,
            max: dataset.colorDomain.colorMaxVol,
            isClipped: dataset.colorDomain.isClipped,
          },
  };
}

export function buildSurfaceSliceData(
  dataset: SurfaceDataset,
  hoverInfo: SurfaceHoverInfo | null
): SurfaceSliceData | null {
  if (!hoverInfo || dataset.rows.length === 0 || dataset.strikes.length === 0) {
    return null;
  }

  const smileSlice = collectSlicePoints(dataset.strikes, (strike) => ({
    x: strike,
    y: interpolateVolByTerm(dataset.rows, strike, hoverInfo.daysToExpiry),
  }));

  const termSlice = collectSlicePoints(dataset.rows, (row) => ({
    x: row.days,
    y: interpolateVolByStrike(row, hoverInfo.strike),
  }));

  if (smileSlice.length < 2 || termSlice.length < 2) return null;

  const volSpan = Math.max(dataset.domain.maxVol - dataset.domain.minVol, 1e-6);
  const volPadding = volSpan * 0.06;

  return {
    smileSlice,
    termSlice,
    strikeMin: dataset.domain.minStrike,
    strikeMax: dataset.domain.maxStrike,
    daysMin: dataset.domain.minDays,
    daysMax: dataset.domain.maxDays,
    volMin: dataset.domain.minVol - volPadding,
    volMax: dataset.domain.maxVol + volPadding,
  };
}

function collectSlicePoints<T>(
  values: T[],
  resolvePoint: (value: T) => { x: number; y: number | null }
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (const value of values) {
    const point = resolvePoint(value);
    if (point.y == null) continue;
    points.push({ x: point.x, y: point.y });
  }
  return points;
}

function normalizeSurfaceCharts(charts: SurfaceChartInput[]): NormalizedSurfaceChart[] {
  const normalizedCharts: NormalizedSurfaceChart[] = [];

  for (const chart of charts) {
    if (!Number.isFinite(chart.daysToExpiry)) continue;

    const series = chart.options.series;
    const volSeries = findPreferredSeries(
      series,
      VOL_SERIES_PRIORITY,
      (seriesEntry) => seriesEntry.type === 'line'
    );
    const putOiSeries = findPreferredSeries(series, PUT_OI_SERIES_PRIORITY, (seriesEntry) =>
      /_p$/.test(getBaseSeriesName(seriesEntry))
    );
    const callOiSeries = findPreferredSeries(series, CALL_OI_SERIES_PRIORITY, (seriesEntry) =>
      /_c$/.test(getBaseSeriesName(seriesEntry))
    );

    normalizedCharts.push({
      daysToExpiry: chart.daysToExpiry,
      volPoints: toVolPoints(volSeries),
      putOiPoints: toOiPoints(putOiSeries),
      callOiPoints: toOiPoints(callOiSeries),
    });
  }

  return normalizedCharts;
}

function getBaseSeriesName(series: ChartSeriesEntry): string {
  return series.name.split('@')[0]?.trim() ?? '';
}

function extractStrikeValuePair(entry: unknown): [number, number] | null {
  if (Array.isArray(entry) && entry.length >= 2) {
    const strike = Number(entry[0]);
    const value = Number(entry[1]);
    return Number.isFinite(strike) && Number.isFinite(value) ? [strike, value] : null;
  }

  if (
    typeof entry === 'object' &&
    entry !== null &&
    'value' in entry &&
    Array.isArray((entry as { value?: unknown }).value)
  ) {
    const valueArray = (entry as { value: unknown[] }).value;
    if (valueArray.length >= 2) {
      const strike = Number(valueArray[0]);
      const value = Number(valueArray[1]);
      return Number.isFinite(strike) && Number.isFinite(value) ? [strike, value] : null;
    }
  }

  return null;
}

function findPreferredSeries(
  series: ChartSeriesEntry[],
  priorities: readonly string[],
  fallback: (seriesEntry: ChartSeriesEntry) => boolean
): ChartSeriesEntry | undefined {
  for (const name of priorities) {
    const preferredSeries = series.find((seriesEntry) => getBaseSeriesName(seriesEntry) === name);
    if (preferredSeries) return preferredSeries;
  }

  return series.find(fallback);
}

function toVolPoints(seriesEntry?: ChartSeriesEntry): SurfaceChartPoint[] {
  const volPoints: SurfaceChartPoint[] = [];
  if (!seriesEntry) return volPoints;
  for (const entry of seriesEntry.data) {
    const pair = extractStrikeValuePair(entry);
    if (!pair) continue;

    const [strike, value] = pair;
    if (!isValidVol(value)) continue;
    volPoints.push({ strike, value });
  }
  return volPoints;
}

function toOiPoints(seriesEntry?: ChartSeriesEntry): SurfaceChartPoint[] {
  const oiPoints: SurfaceChartPoint[] = [];
  if (!seriesEntry) return oiPoints;
  for (const entry of seriesEntry.data) {
    const pair = extractStrikeValuePair(entry);
    if (!pair) continue;

    const [strike, value] = pair;
    if (value <= 0) continue;
    oiPoints.push({ strike, value });
  }
  return oiPoints;
}

function buildSurfaceDataset(charts: NormalizedSurfaceChart[]): SurfaceDataset {
  const surfacePoints: SurfaceDataset['surfacePoints'] = [];
  const oiPoints: SurfaceDataset['oiPoints'] = [];
  const rowMap = new Map<number, Map<number, number>>();
  const oiLookup = new Map<string, SurfaceOiSnapshot>();
  const strikeSet = new Set<number>();
  const volValues: number[] = [];
  let minVol = Number.POSITIVE_INFINITY;
  let maxVol = Number.NEGATIVE_INFINITY;
  let maxOi = 0;

  for (const chart of charts) {
    if (!isFiniteNumber(chart.daysToExpiry)) continue;
    const day = chart.daysToExpiry;
    const strikeVolMap = rowMap.get(day) ?? new Map<number, number>();

    for (const point of chart.volPoints) {
      const { strike, value: vol } = point;
      strikeVolMap.set(strike, vol);
      strikeSet.add(strike);
      volValues.push(vol);
      minVol = Math.min(minVol, vol);
      maxVol = Math.max(maxVol, vol);
      surfacePoints.push({ strike, daysToExpiry: day, vol });
    }

    if (strikeVolMap.size > 0) rowMap.set(day, strikeVolMap);

    maxOi = appendOpenInterestPoints(chart.putOiPoints, 'put', day, oiPoints, oiLookup, maxOi);
    maxOi = appendOpenInterestPoints(chart.callOiPoints, 'call', day, oiPoints, oiLookup, maxOi);
  }

  const rows = Array.from(rowMap.entries())
    .sort(([leftDays], [rightDays]) => leftDays - rightDays)
    .map<SurfaceRow>(([days, strikeVolMap]) => {
      const strikes = Array.from(strikeVolMap.keys()).sort((left, right) => left - right);
      return {
        days,
        strikes,
        vols: strikes.map((strike) => strikeVolMap.get(strike) ?? 0),
      };
    });

  const strikes = Array.from(strikeSet).sort((left, right) => left - right);
  const days = rows.map((row) => row.days);
  const domain = {
    minStrike: strikes[0] ?? 0,
    maxStrike: strikes[strikes.length - 1] ?? 0,
    minDays: days[0] ?? 0,
    maxDays: days[days.length - 1] ?? 0,
    minVol: Number.isFinite(minVol) ? minVol : 0,
    maxVol: Number.isFinite(maxVol) ? maxVol : 0,
    maxOi,
  };

  return {
    surfacePoints,
    oiPoints,
    rows,
    strikes,
    days,
    domain,
    colorDomain: getColorVolDomain(volValues, domain.minVol, domain.maxVol),
    layout: SURFACE_LAYOUT,
    mappings: createSurfaceMappings(domain, SURFACE_LAYOUT),
    oiLookup,
  };
}

function getOiPointKey(strike: number, daysToExpiry: number) {
  return `${strike}|${daysToExpiry}`;
}

function appendOpenInterestPoints(
  points: SurfaceChartPoint[],
  side: 'put' | 'call',
  daysToExpiry: number,
  target: SurfaceDataset['oiPoints'],
  oiLookup: Map<string, SurfaceOiSnapshot>,
  currentMaxOi: number
) {
  let nextMaxOi = currentMaxOi;

  for (const point of points) {
    const { strike, value } = point;
    nextMaxOi = Math.max(nextMaxOi, value);
    target.push({ strike, daysToExpiry, value, side });

    const key = getOiPointKey(strike, daysToExpiry);
    const snapshot = oiLookup.get(key) ?? { ...EMPTY_OI_SNAPSHOT };
    snapshot[side === 'put' ? 'putOi' : 'callOi'] += value;
    snapshot.totalOi += value;
    oiLookup.set(key, snapshot);
  }

  return nextMaxOi;
}

function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;

  const clampedQ = clamp(q, 0, 1);
  const position = (sorted.length - 1) * clampedQ;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(lowerIndex + 1, sorted.length - 1);
  const weight = position - lowerIndex;
  const lowerValue = sorted[lowerIndex]!;
  const upperValue = sorted[upperIndex]!;
  return lowerValue + (upperValue - lowerValue) * weight;
}

export function getOpenInterestSnapshot(
  dataset: SurfaceDataset,
  strike: number,
  daysToExpiry: number
): SurfaceOiSnapshot {
  return getOiSnapshot(dataset.oiLookup, strike, daysToExpiry);
}

export function findOpenInterestSnapshot(
  dataset: SurfaceDataset,
  strike: number,
  daysToExpiry: number
): SurfaceOiSnapshot | null {
  return dataset.oiLookup.get(getOiPointKey(strike, daysToExpiry)) ?? null;
}

export function getSurfaceVolAt(
  strike: number,
  daysToExpiry: number,
  dataset: SurfaceDataset
): number {
  return interpolateVolByTerm(dataset.rows, strike, daysToExpiry) ?? dataset.domain.minVol;
}

function getColorVolDomain(vols: number[], minVol: number, maxVol: number): SurfaceColorDomain {
  if (
    !Number.isFinite(minVol) ||
    !Number.isFinite(maxVol) ||
    vols.length === 0 ||
    minVol === maxVol ||
    vols.length < 20
  ) {
    return { colorMinVol: minVol, colorMaxVol: maxVol, isClipped: false };
  }

  const sorted = [...vols].sort((left, right) => left - right);
  const p2 = quantileSorted(sorted, 0.02);
  const p98 = quantileSorted(sorted, 0.98);
  const minSpan = Math.max((maxVol - minVol) * 0.05, 1e-6);

  if (!Number.isFinite(p2) || !Number.isFinite(p98) || p98 - p2 < minSpan) {
    return { colorMinVol: minVol, colorMaxVol: maxVol, isClipped: false };
  }

  const colorMinVol = Math.max(minVol, p2);
  const colorMaxVol = Math.min(maxVol, p98);
  return {
    colorMinVol,
    colorMaxVol,
    isClipped: colorMinVol > minVol || colorMaxVol < maxVol,
  };
}

function createSurfaceMappings(domain: SurfaceDataset['domain'], layout: SurfaceLayout) {
  const strikeMapping = createLinearMapping(
    domain.minStrike,
    domain.maxStrike,
    -layout.xScale,
    layout.xScale
  );
  const daysMapping = createLinearMapping(
    domain.minDays,
    domain.maxDays,
    -layout.zScale,
    layout.zScale
  );
  const volMapping = createLinearMapping(
    domain.minVol,
    domain.maxVol,
    layout.volAxisBaseHeight,
    layout.volAxisBaseHeight + layout.volAxisHeight
  );

  return {
    strikeToX: strikeMapping.toOutput,
    xToStrike: strikeMapping.toInput,
    daysToZ: daysMapping.toOutput,
    zToDays: daysMapping.toInput,
    volToY: volMapping.toOutput,
    yToVol: volMapping.toInput,
  };
}

function getOiSnapshot(
  oiLookup: Map<string, SurfaceOiSnapshot>,
  strike: number,
  daysToExpiry: number
): SurfaceOiSnapshot {
  return oiLookup.get(getOiPointKey(strike, daysToExpiry)) ?? EMPTY_OI_SNAPSHOT;
}

function createLinearMapping(
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number
) {
  const inputRange = inputMax - inputMin || 1;
  const outputRange = outputMax - outputMin;

  return {
    toOutput: (value: number) => outputMin + ((value - inputMin) / inputRange) * outputRange,
    toInput: (value: number) => inputMin + ((value - outputMin) / outputRange) * inputRange,
  };
}

export function interpolateVolByStrike(
  row: SurfaceRow,
  strike: number,
  options: { extrapolate?: boolean } = {}
): number | null {
  const { strikes, vols } = row;
  const extrapolate = options.extrapolate ?? false;

  if (strikes.length === 0) return null;
  if (strikes.length === 1) return vols[0] ?? null;

  if (extrapolate) {
    const firstStrike = strikes[0]!;
    const lastStrike = strikes[strikes.length - 1]!;
    if (strike <= firstStrike) return vols[0] ?? null;
    if (strike >= lastStrike) return vols[vols.length - 1] ?? null;
  } else if (strike < strikes[0]! || strike > strikes[strikes.length - 1]!) {
    return null;
  }

  for (let index = 0; index < strikes.length - 1; index += 1) {
    const leftStrike = strikes[index]!;
    const rightStrike = strikes[index + 1]!;
    if (strike < leftStrike || strike > rightStrike) continue;

    const leftVol = vols[index]!;
    const rightVol = vols[index + 1]!;
    if (rightStrike === leftStrike) return leftVol;
    const ratio = (strike - leftStrike) / (rightStrike - leftStrike);
    return leftVol + (rightVol - leftVol) * ratio;
  }

  return extrapolate ? (vols[vols.length - 1] ?? null) : null;
}

function interpolateVolByTerm(rows: SurfaceRow[], strike: number, days: number): number | null {
  if (rows.length === 0) return null;
  if (rows.length === 1) return interpolateVolByStrike(rows[0]!, strike);

  if (days <= rows[0]!.days) return interpolateVolByStrike(rows[0]!, strike);
  if (days >= rows[rows.length - 1]!.days) {
    return interpolateVolByStrike(rows[rows.length - 1]!, strike);
  }

  for (let index = 0; index < rows.length - 1; index += 1) {
    const lowerRow = rows[index]!;
    const upperRow = rows[index + 1]!;
    if (days < lowerRow.days || days > upperRow.days) continue;

    const lowerVol = interpolateVolByStrike(lowerRow, strike);
    const upperVol = interpolateVolByStrike(upperRow, strike);
    if (lowerVol == null && upperVol == null) return null;
    if (lowerVol == null) return upperVol;
    if (upperVol == null) return lowerVol;
    if (upperRow.days === lowerRow.days) return lowerVol;

    const ratio = (days - lowerRow.days) / (upperRow.days - lowerRow.days);
    return lowerVol + (upperVol - lowerVol) * ratio;
  }

  return null;
}
