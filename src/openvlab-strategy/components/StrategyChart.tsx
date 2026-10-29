import React from "react";
import { SANS } from "../../shared/fonts";
import { CHART, CONTENT, PLOT, nativeToWorld } from "../layout";
import { C } from "../tokens";
import { CHAIN } from "../data";
import { DTE0, EXPIRY_MS, Model, cstParts } from "../model/model";

export type Pt = { x: number; y: number };
const DAY = 86400e3;
const SAMPLES = 181;

/** y-domain is fixed for the whole chart scene so the curves visibly steepen instead of the axis rescaling. */
export const Y_DOMAIN = (() => {
  return { min: -45000, max: 45000 }; // v6: symmetric, so the seller's mirror image (V tip +42,260) fits too
})();
export const X_DOMAIN_START: [number, number] = [6040, 6760];
export const X_DOMAIN_END: [number, number] = [6000, 7100];

export const makeScales = (x0: number, x1: number) => ({
  x: (price: number) => PLOT.x + ((price - x0) / (x1 - x0)) * PLOT.w,
  y: (v: number) => PLOT.y + ((Y_DOMAIN.max - v) / (Y_DOMAIN.max - Y_DOMAIN.min)) * PLOT.h,
});

/** Curve points in chart-native coords (relative to CONTENT). */
export const curvePts = (model: Model, dte: number, x0: number, x1: number, n = SAMPLES): Pt[] => {
  const sc = makeScales(x0, x1);
  return Array.from({ length: n }, (_, i) => {
    const s = x0 + ((x1 - x0) * i) / (n - 1);
    return { x: sc.x(s), y: sc.y(model.profit(s, dte)) };
  });
};

export const toPath = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
/** CONTENT-native point -> 1920x1080 world. */
export const contentToWorld = (p: Pt) => nativeToWorld(CONTENT.x + p.x, CONTENT.y + p.y);

export const lineDtesFor = (dte: number) => [dte, 0.25 * DTE0, 0].filter((d, i) => i === 0 || d <= dte);

const WEEKDAY = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const legendLabel = (lineDte: number, curDte: number, isCurrent: boolean) => {
  if (lineDte === 0 && !isCurrent) return `到期日 (${Math.max(0, Math.floor(curDte - lineDte))}天)`;
  const d = new Date(EXPIRY_MS - lineDte * DAY + 8 * 3600e3);
  const base = `${WEEKDAY[d.getUTCDay()]} ${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
  return isCurrent ? `${base} (当前)` : `${base} (${Math.max(0, Math.floor(curDte - lineDte))}天)`;
};

const f2 = (n: number) => n.toFixed(2);

export type ChartProps = {
  model: Model;
  dte: number;
  x0: number;
  x1: number;
  axesOp?: number;
  legendOp?: number;
  markerOp?: number;
  /** 0..1 left-to-right reveal of curves + fill. */
  draw?: number;
  /** Table->curve shared-element morph: `from` has SAMPLES points (same count). */
  morph?: { p: (i: number) => number; from: Pt[]; lime: number };
  /** Chart-wide opacity (e.g. fading out in S6). */
  op?: number;
  /** Fade factor for the secondary (non-current) lines. */
  secondaryOp?: number;
  fillOp?: number;
  /** Opacity of the current-DTE curve (0 once S7 lifts the expiry V out as the single flying V). */
  lineOp?: number;
  tickScale?: number;
  /** opacity of the break-even markers (inside markerOp) */
  beOp?: number;
  /** opacity of the 当前价 marker (inside markerOp) */
  priceOp?: number;
};

export const StrategyChart: React.FC<ChartProps> = ({ model, dte, x0, x1, axesOp = 1, legendOp = 1, markerOp = 1, draw = 1, morph, op = 1, secondaryOp = 1, fillOp = 1, lineOp = 1, beOp = 1, priceOp = 1 }) => {
  const sc = makeScales(x0, x1);
  const zeroY = sc.y(0);
  const lineDtes = lineDtesFor(dte);
  const clipW = PLOT.x + (PLOT.w + CHART.right) * draw;

  const lines = lineDtes.map((d, i) => {
    let pts = curvePts(model, d, x0, x1);
    if (i === 0 && morph) pts = pts.map((p, k) => ({ x: morph.from[k].x + (p.x - morph.from[k].x) * morph.p(k), y: morph.from[k].y + (p.y - morph.from[k].y) * morph.p(k) }));
    return { d, pts, path: toPath(pts) };
  });
  const area = `${lines[0].path} L${f2(lines[0].pts[lines[0].pts.length - 1].x)},${f2(zeroY)} L${f2(lines[0].pts[0].x)},${f2(zeroY)} Z`;

  const be = model.breakevens(dte);
  const price = CHAIN.underlyingLast;
  const priceX = sc.x(price);

  const xTicks: number[] = [];
  for (let v = Math.ceil((x0 - 50) / 100) * 100 + 50; v <= x1; v += 100) if (v >= x0 - 1e-6) xTicks.push(v);
  const yTicks: number[] = [];
  for (let v = Math.ceil(Y_DOMAIN.min / 10000) * 10000; v <= Y_DOMAIN.max; v += 10000) yTicks.push(v);

  const text: React.CSSProperties = { fontFamily: SANS, fontSize: 12 };
  const delta = 14;
  const hStops = (hard: boolean) => {
    const z = (zeroY - PLOT.y) / PLOT.h;
    return hard ? (
      <>
        <stop offset={z} stopColor={C.chartUp} />
        <stop offset={z} stopColor={C.chartDown} />
      </>
    ) : (
      <>
        <stop offset={Math.max(0, z - delta / PLOT.h)} stopColor={C.chartUp} />
        <stop offset={z} stopColor="#f2c200" stopOpacity={0.5} />
        <stop offset={Math.min(1, z + delta / PLOT.h)} stopColor={C.chartDown} />
      </>
    );
  };
  const morphLime = morph ? morph.lime : 0;

  return (
    <svg width={CHART.w} height={CHART.h} style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, overflow: "visible", opacity: op }}>
      <defs>
        <clipPath id="scBounds"><rect x={PLOT.x} y={PLOT.y - 2} width={PLOT.w + 2} height={PLOT.h + 4} /></clipPath>
        <clipPath id="scDraw"><rect x={0} y={0} width={clipW} height={CHART.h} /></clipPath>
        <linearGradient id="scStroke" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={PLOT.y} y2={PLOT.y + PLOT.h}>{hStops(false)}</linearGradient>
        <linearGradient id="scFill" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={PLOT.y} y2={PLOT.y + PLOT.h}>{hStops(true)}</linearGradient>
        <linearGradient id="scAlphaUp" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="1" /></linearGradient>
        <linearGradient id="scAlphaDown" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="scFillMask">
          <rect x={0} y={PLOT.y} width={CHART.w} height={Math.max(0, zeroY - PLOT.y)} fill="url(#scAlphaUp)" />
          <rect x={0} y={zeroY} width={CHART.w} height={Math.max(0, PLOT.y + PLOT.h - zeroY)} fill="url(#scAlphaDown)" />
        </mask>
      </defs>

      {/* axes */}
      <g opacity={axesOp}>
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w} y1={PLOT.y + PLOT.h} y2={PLOT.y + PLOT.h} stroke={C.mutedFg} strokeOpacity={0.3} />
        <line x1={PLOT.x} x2={PLOT.x} y1={PLOT.y} y2={PLOT.y + PLOT.h} stroke={C.mutedFg} strokeOpacity={0.3} />
        {xTicks.map((v) => (
          <g key={v} transform={`translate(${sc.x(v)},${PLOT.y + PLOT.h})`}>
            <line y2={6} stroke={C.mutedFg} strokeOpacity={0.3} />
            <text y={19} textAnchor="middle" fill={C.mutedFg} style={text}>{v}</text>
          </g>
        ))}
        {yTicks.map((v) => (
          <g key={v} transform={`translate(${PLOT.x - 6},${sc.y(v)})`}>
            <line x2={6} stroke={C.mutedFg} strokeOpacity={0.3} />
            <text x={-4} y={4} textAnchor="end" fill={C.mutedFg} style={text}>{v}</text>
          </g>
        ))}
        <line x1={PLOT.x} x2={PLOT.x + PLOT.w + 6} y1={zeroY + 0.5} y2={zeroY + 0.5} stroke={C.primary} strokeWidth={0.5} />
      </g>

      {/* curves + fill */}
      <g clipPath="url(#scDraw)">
        <g clipPath="url(#scBounds)">
          {lines.slice(1).map((l) => {
            // v6: style + fade keyed on the line's own dte (the 0.25·DTE0 line fades as the slider passes it; the expiry line merges into the current curve at dte -> 0)
            const mid = l.d > 0;
            const k = mid ? Math.min(1, Math.max(0, (dte - 0.25 * DTE0) / 0.8)) : Math.min(1, Math.max(0, dte / 0.3));
            return <path key={l.d} d={l.path} fill="none" stroke="url(#scStroke)" strokeWidth={2} strokeLinecap="round" strokeDasharray={mid ? "7,4" : "2,3"} opacity={(mid ? 0.8 : 0.65) * secondaryOp * k} />;
          })}
          <path d={area} fill="url(#scFill)" mask="url(#scFillMask)" opacity={0.8 * fillOp * (1 - morphLime)} />
          {lineOp > 0 && <path d={lines[0].path} fill="none" stroke="url(#scStroke)" strokeWidth={2} strokeLinecap="round" opacity={(1 - morphLime) * lineOp} />}
          {morph ? <path d={lines[0].path} fill="none" stroke={C.primary} strokeWidth={2.5} strokeLinecap="round" opacity={morphLime} /> : null}
        </g>
      </g>

      {/* markers */}
      <g opacity={markerOp}>
        <g opacity={priceOp}>
        <line x1={priceX - 1} x2={priceX - 1} y1={PLOT.y + 8} y2={PLOT.y + PLOT.h} stroke={C.fg} strokeWidth={0.5} />
        <text x={priceX} y={PLOT.y - 17} textAnchor="middle" fill={C.fg} style={{ ...text, fontWeight: 700 }}>{price.toFixed(1)}</text>
        <text x={priceX} y={PLOT.y - 5} textAnchor="middle" fill={C.fg} style={text}>当前价</text>
        </g>
        {beOp > 0 && be.map((v, i) => {
          const x = sc.x(v);
          return (
            <g key={i} opacity={beOp}>
              <line x1={x} x2={x} y1={PLOT.y + 20} y2={PLOT.y + PLOT.h} stroke={C.brand} strokeWidth={0.5} strokeDasharray="4,4" />
              <text x={x} y={PLOT.y + 3} textAnchor="middle" fill={C.brand} style={{ ...text, fontWeight: 700 }}>{v.toFixed(1)}</text>
              <text x={x} y={PLOT.y + 16} textAnchor="middle" fill={C.brand} style={{ ...text, fontWeight: 700 }}>盈亏平衡</text>
            </g>
          );
        })}
      </g>

      {/* legend */}
      {lineDtes.length > 1 ? (
        <g transform={`translate(${PLOT.x + 8},${PLOT.y + 8 + 10})`} opacity={legendOp}>
          {lineDtes.map((d, i) => (
            <g key={d} transform={`translate(0,${18 * i})`} opacity={i > 0 && d > 0 ? Math.min(1, Math.max(0, (dte - 0.25 * DTE0) / 0.8)) : 1}>
              <line x1={0} x2={25} y1={0} y2={0} stroke="url(#scStroke)" strokeWidth={2} strokeDasharray={i === 0 ? undefined : d > 0 ? "7,4" : "2,3"} opacity={i === 0 ? 1 : 0.8} />
              <text x={33} y={4} fill={C.fg} style={text}>{legendLabel(d, dte, i === 0)}</text>
            </g>
          ))}
        </g>
      ) : null}
    </svg>
  );
};

/** dte <-> slider index helpers (timeline is index-based, like the frontend slider). */
export const dteToIndex = (model: Model, dte: number) => {
  const t = model.timeline;
  if (dte >= t[0].dte) return 0;
  for (let i = 0; i < t.length - 1; i++) {
    if (dte <= t[i].dte && dte >= t[i + 1].dte) return i + (t[i].dte - dte) / (t[i].dte - t[i + 1].dte);
  }
  return t.length - 1;
};
export const indexToDte = (model: Model, idx: number) => {
  const t = model.timeline;
  const i = Math.min(t.length - 2, Math.max(0, Math.floor(idx)));
  const f = Math.min(1, Math.max(0, idx - i));
  return t[i].dte + (t[i + 1].dte - t[i].dte) * f;
};
export { cstParts };
