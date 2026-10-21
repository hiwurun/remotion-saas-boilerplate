import React from "react";
import * as echarts from "echarts";
import type { VolChartRender } from "../openvlab-surf/components/VolChart2D";
import { DARK } from "../openvlab-surf/model/vol-chart";
import surface from "./data/volatility-surface-IM.json";

/**
 * 「波动率曲面」popup (VolatilityPopoverPanel) in the real UI:
 *  - TermStructurePanel (PillTabs 期货/平值隐波/偏度 + TermStructureTable 指标/现值/日差 + echarts term chart),
 *    option ported from shared-core term-structure-bundle.ts / chart-options.ts (createTermStructureOptions, createLineData,
 *    createHighlightPointSeries, ATM 加总持仓 bars with TERM_OI_COLORS);
 *  - per-expiry smile card = the openvlab-surf VolChart2D echarts renderer (imported unchanged) + the product header row.
 * Data: /api/volatility-surface/IM (data/volatility-surface-IM.json).
 */
type E = Record<string, string | number>;
const RES = (surface as unknown as { result: Record<string, E> }).result;
export const EXPS = Object.keys(RES).sort();
/* ---------- term structure (atmv tab) ---------- */
const r2 = (v: number) => Number(v.toFixed(2));
export const TERM = EXPS.map((exp) => {
  const e = RES[exp];
  const n = (k: string) => Number(e[k]);
  return { exp, dte: n("days_to_expiry"), tday: r2(n("atmvol_tday")), yday: r2(n("atmvol_yday")), oiC: n("sum_oi_call"), oiP: n("sum_oi_put"), poiC: n("sum_poi_call"), poiP: n("sum_poi_put") };
});
export const TERM_HI = TERM.reduce((b, r, i, a) => (r.tday > a[b].tday ? i : b), 0);
const TERM_OI_COLORS = { call: { current: "rgba(205, 14, 44, 1)", previous: "rgba(205, 14, 44, 0.3)" }, put: { current: "rgba(21, 127, 55, 1)", previous: "rgba(21, 127, 55, 0.3)" } };
const axisConfig = { axisTick: { show: false }, axisLine: { show: false }, splitLine: { show: false }, nameTextStyle: { fontSize: 11, color: DARK.axis } };

const termOption = (draw: number, oi: number, active: number) => {
  const xs = TERM.map((r) => r.dte);
  const minX = Math.min(...xs), maxX = Math.max(...xs), pad = (maxX - minX) * 0.15;
  const cut = minX + (maxX + 1 - minX) * draw;
  const line = (name: string, color: string, pts: [number, number][], size: number, type: "solid" | [number, number]) => ({
    name, type: "line", smooth: 0.25, lineStyle: { color, ...(type === "solid" ? null : { dashOffset: 0 }), type, width: 2 }, itemStyle: { color }, symbolSize: size, data: pts.filter(([x]) => x <= cut),
  });
  const bar = (name: string, stack: string, color: string, f: (r: (typeof TERM)[number]) => number) => ({ name, type: "bar", yAxisIndex: 1, barWidth: 6, stack, itemStyle: { color }, data: TERM.map((r) => [r.dte, f(r) * oi]) });
  const a = TERM[TERM_HI];
  return {
    animation: false,
    grid: { left: "34px", right: "40px", top: "24px", bottom: "22px" },
    xAxis: [{ type: "value", ...axisConfig, axisLine: { show: true, onZero: false, lineStyle: { color: DARK.axis } }, name: "(到期天数)", nameLocation: "end", nameTextStyle: { ...axisConfig.nameTextStyle, padding: [8, 0, 0, 0], verticalAlign: "top" }, axisLabel: { color: DARK.axis, margin: 8, formatter: (v: number) => `${Math.round(v)}` }, min: Math.max(0, minX - pad), max: maxX + pad }],
    yAxis: [
      { type: "value", name: "平值隐波", nameGap: 8, ...axisConfig, scale: true, axisLabel: { color: DARK.axis }, splitLine: { show: false } },
      { type: "value", name: "持仓量", position: "right", ...axisConfig, axisLabel: { color: DARK.axis }, splitLine: { show: false } },
    ],
    series: [
      line("ts_tday", DARK.ivText, TERM.map((r) => [r.dte, r.tday]), 6, "solid"),
      line("ts_yday", "gray", TERM.map((r) => [r.dte + 1, r.yday]), 4, [2, 2]),
      ...(active > 0 ? [{ name: "active_expiration", type: "scatter", symbol: "circle", symbolSize: 10, itemStyle: { color: DARK.ivText, shadowBlur: 10, shadowColor: DARK.ivText, opacity: active }, data: [[a.dte, a.tday]], zlevel: 10 }] : []),
      bar("atmv_oi_diff_put", "ATMV_OI_P", TERM_OI_COLORS.put.current, (r) => r.oiP - r.poiP),
      bar("atmv_oi_yday_put", "ATMV_OI_P", TERM_OI_COLORS.put.previous, (r) => r.poiP),
      bar("atmv_oi_diff_call", "ATMV_OI_C", TERM_OI_COLORS.call.current, (r) => r.oiC - r.poiC),
      bar("atmv_oi_yday_call", "ATMV_OI_C", TERM_OI_COLORS.call.previous, (r) => r.poiC),
    ],
  };
};
// fix the axis ranges at the fully-revealed state so partial draws don't rescale
const FULL_AXES = (() => {
  const c = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: 800, height: 200 });
  c.setOption(termOption(1, 1, 0));
  const m = (c as any).getModel();
  const y0 = m.getComponent("yAxis", 0).axis.scale.getExtent() as [number, number];
  const y1 = m.getComponent("yAxis", 1).axis.scale.getExtent() as [number, number];
  c.dispose();
  return { y0, y1 };
})();
const TCACHE = new Map<string, VolChartRender>();
export const renderTerm = (draw: number, oi: number, active: number, width: number, height: number): VolChartRender => {
  const key = `${draw.toFixed(3)}|${oi.toFixed(3)}|${active.toFixed(2)}|${width}x${height}`;
  const hit = TCACHE.get(key);
  if (hit) return hit;
  const opt: any = termOption(draw, oi, active);
  opt.yAxis[0].min = FULL_AXES.y0[0]; opt.yAxis[0].max = FULL_AXES.y0[1];
  opt.yAxis[1].min = FULL_AXES.y1[0]; opt.yAxis[1].max = FULL_AXES.y1[1];
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width, height });
  chart.setOption(opt);
  const svg = chart.renderToSVGString();
  const pts = TERM.map((r) => chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [r.dte, r.tday]) as unknown as [number, number]);
  chart.dispose();
  const out: VolChartRender = { svg, px: (x) => pts[Math.max(0, TERM.findIndex((r) => r.dte === x))] };
  if (TCACHE.size > 600) TCACHE.clear();
  TCACHE.set(key, out);
  return out;
};

/* ---------- chrome ---------- */
export const FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
const PRIMARY = "#AFF33E"; // --primary (dark), lime
const MUTED_BG = "#2b2b2b";
const BORDER = "rgba(255,255,255,0.1)";
export const PillTabs: React.FC<{ items: string[]; active: number }> = ({ items, active }) => (
  <div style={{ display: "inline-flex", gap: 8, background: MUTED_BG, borderRadius: 8, padding: 2 }}>
    {items.map((l, i) => (
      <div key={l} style={{ height: 24, padding: "0 12px", display: "flex", alignItems: "center", borderRadius: 6, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", color: i === active ? "#0a0a0a" : DARK.muted, background: i === active ? PRIMARY : "transparent", boxShadow: i === active ? "0 1px 2px rgba(0,0,0,0.3)" : "none" }}>{l}</div>
    ))}
  </div>
);
const signColor = (v: number) => (v > 0 ? DARK.red : v < 0 ? DARK.green : DARK.text);
const fmt4 = (v: number) => String(Number(v.toFixed(4)));
export const TermTable: React.FC<{ hl: number; hk: number }> = ({ hl, hk }) => {
  const cell: React.CSSProperties = { padding: "4px 4px", textAlign: "center", fontSize: 12, minWidth: 60, fontVariantNumeric: "tabular-nums" };
  const op = (i: number) => (i === hl ? 1 : 1 - 0.65 * hk);
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", color: DARK.text }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
          <th style={{ ...cell, minWidth: 50, fontWeight: 500, color: DARK.muted }}>指标</th>
          {TERM.map((r, i) => <th key={r.exp} style={{ ...cell, fontWeight: 500, color: DARK.muted, opacity: op(i) }}>{r.exp.slice(2)}</th>)}
        </tr>
      </thead>
      <tbody>
        <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
          <td style={cell}>现值</td>
          {TERM.map((r, i) => <td key={r.exp} style={{ ...cell, opacity: op(i), fontWeight: i === hl && hk > 0.5 ? 700 : 400 }}>{fmt4(r.tday)}</td>)}
        </tr>
        <tr>
          <td style={cell}>日差</td>
          {TERM.map((r, i) => { const d = r.tday - r.yday; return <td key={r.exp} style={{ ...cell, color: signColor(d), opacity: op(i) }}>{fmt4(d)}</td>; })}
        </tr>
      </tbody>
    </table>
  );
};

export { DARK };
