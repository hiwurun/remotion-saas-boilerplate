// Ported verbatim from vlab-frontend packages/shared-core/src/domain/volatility/types.ts (surface section).
// echarts SeriesOption replaced by a minimal structural type.
type SeriesOption = { type?: string };

export interface VolatilityLegendRange {
  min: number;
  max: number;
  isClipped: boolean;
}

export interface SurfaceHoverInfo {
  x: number;
  y: number;
  strike: number;
  daysToExpiry: number;
  vol: number;
  putOi: number | null;
  callOi: number | null;
}

export interface SurfaceSlicePoint {
  x: number;
  y: number;
}

export interface SurfaceSliceData {
  smileSlice: SurfaceSlicePoint[];
  termSlice: SurfaceSlicePoint[];
  strikeMin: number;
  strikeMax: number;
  daysMin: number;
  daysMax: number;
  volMin: number;
  volMax: number;
}

export interface SurfacePoint {
  strike: number;
  daysToExpiry: number;
  vol: number;
}

export interface OiBarPoint {
  strike: number;
  daysToExpiry: number;
  value: number;
  side: 'put' | 'call';
}

export interface SurfaceRow {
  days: number;
  strikes: number[];
  vols: number[];
}

export interface SurfaceDomain {
  minStrike: number;
  maxStrike: number;
  minDays: number;
  maxDays: number;
  minVol: number;
  maxVol: number;
  maxOi: number;
}

export interface SurfaceColorDomain {
  colorMinVol: number;
  colorMaxVol: number;
  isClipped: boolean;
}

export interface SurfaceLayout {
  oiAxisMaxHeight: number;
  volAxisBaseHeight: number;
  volAxisHeight: number;
  hoverBaseHeight: number;
  xScale: number;
  zScale: number;
}

export interface SurfaceMappings {
  strikeToX: (strike: number) => number;
  xToStrike: (x: number) => number;
  daysToZ: (days: number) => number;
  zToDays: (z: number) => number;
  volToY: (vol: number) => number;
  yToVol: (y: number) => number;
}

export interface SurfaceOiSnapshot {
  putOi: number;
  callOi: number;
  totalOi: number;
}

export interface SurfaceDataset {
  surfacePoints: SurfacePoint[];
  oiPoints: OiBarPoint[];
  rows: SurfaceRow[];
  strikes: number[];
  days: number[];
  domain: SurfaceDomain;
  colorDomain: SurfaceColorDomain;
  layout: SurfaceLayout;
  mappings: SurfaceMappings;
  oiLookup: Map<string, SurfaceOiSnapshot>;
}

export interface SurfaceModel {
  dataset: SurfaceDataset;
  legendRange: VolatilityLegendRange | null;
}

export type ChartSeriesEntry = SeriesOption & {
  data: unknown[];
  name: string;
};

export interface SurfaceChartInput {
  daysToExpiry: number;
  options: {
    series: ChartSeriesEntry[];
  };
}
