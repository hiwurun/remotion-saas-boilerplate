import React from "react";
import * as echarts from "echarts";
import { buildVolChartOption, DARK } from "../model/vol-chart";
import type { RawExpiry, Reveal } from "../model/vol-chart";

/**
 * 1:1 replica of the product's「波动率曲线」dialog (VolatilityChartExpanded → VolatilityChartHeader + VolatilityChartCanvas).
 * The chart itself is the real echarts option (ported) rendered with the echarts SVG SSR renderer every frame,
 * so it is deterministic under `remotion render`.
 */
export type VolChartRender = { svg: string; px: (x: number, y: number, yAxis?: 0 | 1) => [number, number] };

const oiExtent = (d: RawExpiry): [number, number, number] => {
  const vals = (rec: Record<string, number>) => Object.values(rec).map(Number).filter(Number.isFinite);
  const poi = [...vals(d.strike_poi_c), ...vals(d.strike_poi_p)];
  const oid = [...vals(d.strike_oid_c), ...vals(d.strike_oid_p)];
  const maxStack = Math.max(0, ...poi) + Math.max(0, ...oid);
  const minOid = Math.min(0, ...oid);
  const nice = (raw: number) => {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1))));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  };
  const step = nice(maxStack / 6);
  return [Math.floor(minOid / step) * step, Math.ceil(maxStack / step) * step, step];
};

export const renderVolChart = (d: RawExpiry, reveal: Reveal, width: number, height: number, keep = false): VolChartRender => {
  const [mn, mx, iv] = oiExtent(d);
  const option = buildVolChartOption(d, reveal);
  option.yAxis[1].min = mn;
  option.yAxis[1].max = mx;
  option.yAxis[1].interval = iv;
  const chart = echarts.init(null, undefined, { renderer: "svg", ssr: true, width, height });
  chart.setOption(option);
  const svg = chart.renderToSVGString();
  const g = (chart as any).getModel().getComponent("grid", 0).coordinateSystem.getRect() as { x: number; y: number; width: number; height: number };
  const [x0, x1] = (chart as any).getModel().getComponent("xAxis", 0).axis.scale.getExtent() as [number, number];
  // actual (nice) extent echarts resolved for the IV axis (scale: true → min/max not in the option)
  const [y0, y1] = (chart as any).getModel().getComponent("yAxis", 0).axis.scale.getExtent() as [number, number];
  if (keep) {
    // long-lived instance: ask echarts itself where a data point is drawn (exact, incl. smoothing-free anchors)
    return { svg, px: (x, y, yAxis = 0) => chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: yAxis }, [x, y]) as unknown as [number, number] };
  }
  chart.dispose();
  return {
    svg,
    px: (x, y, yAxis = 0) => {
      const [a, b] = yAxis === 0 ? [y0, y1] : [mn, mx];
      return [g.x + ((x - x0) / (x1 - x0)) * g.width, g.y + (1 - (y - a) / (b - a)) * g.height];
    },
  };
};

const fmtSign = (v: number, d = 2) => `${v > 0 ? "+" : ""}${v.toFixed(d)}`;
const signColor = (v: number) => (v > 0 ? DARK.red : v < 0 ? DARK.green : "#9e9e9e");

/** Dialog chrome + header row, exactly like the product (text-lg title, text-xs 3-column header). */
export const VolChartCard: React.FC<{ d: RawExpiry; title: string; chart: VolChartRender; width: number; chartHeight: number; headerOpacity?: number; children?: React.ReactNode }> = ({ d, title, chart, width, chartHeight, headerOpacity = 1, children }) => {
  const ratio = Number((((d.forward_td - d.forward_yd) / d.forward_yd) * 100).toFixed(2));
  const ivDiff = d.atmvol_tday - d.atmvol_yday;
  const font = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif';
  return (
    <div style={{ width, padding: 16, borderRadius: 12, background: DARK.popover, border: "1px solid rgba(255,255,255,0.08)", fontFamily: font, color: DARK.text, boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: "28px" }}>{title}</div>
        <div style={{ width: 18, height: 18, borderRadius: 4, border: "1.5px solid #AFF33E", color: "#AFF33E", fontSize: 12, lineHeight: "15px", textAlign: "center" }}>✕</div>
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", fontSize: 12, padding: 4, opacity: headerOpacity }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>{d.expiry.substring(2)}</span>
          <span style={{ color: DARK.muted }}>{d.days}天</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontWeight: 500, color: DARK.future }}>{d.forward_td}</span>
          <span style={{ color: signColor(ratio) }}>({`${fmtSign(ratio)}%`})</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span style={{ color: DARK.ivText }}>{d.atmvol_tday.toFixed(2)}</span>
          <span style={{ color: signColor(ivDiff) }}>({fmtSign(ivDiff)})</span>
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 16, height: chartHeight }}>
        <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: chart.svg }} />
        {children}
      </div>
    </div>
  );
};
