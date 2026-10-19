import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { C, CLAMP, EASE, EASE_OUT, withAlpha } from "../theme";
import { QUADRANTS, formatNumber, formatPct, invSymlog, topLabelsPerQuad, withSign, type AxisDomain, type QuadPoint } from "../data";

/** QuadrantBackground/index.tsx `market` style, dark branch of light-dark(). */
const QUAD_BG: React.CSSProperties = {
  backgroundColor: "#141414",
  backgroundImage: [
    "radial-gradient(ellipse 50% 95% at 0% 0%, #047857 0%, transparent 100%)",
    "radial-gradient(ellipse 50% 95% at 100% 0%, #b91c1c 0%, transparent 100%)",
    "linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, #303241 50%, rgba(244, 63, 94, 0.15) 100%)",
  ].join(", "),
  backgroundBlendMode: "normal, normal, multiply",
};
const AXIS_LINE = "rgba(170,174,182,0.65)"; // --market-panorama-axis-line (dark)
const COMPASS_AXIS = "#B3B3B3"; // --compass-axis (dark)
const QUAD_TEXT = "rgba(192,196,203,0.88)"; // --compass-quadrant (dark)
const DIM = C.muted; // MarketPanoramaChart DIM = var(--muted-foreground)

export const QUAD_GUTTER = { top: 84, right: 34, bottom: 52, left: 78 };

export type QuadGeometry = { plot: { x: number; y: number; w: number; h: number }; toPx: (p: { sx: number; sy: number }) => { x: number; y: number } };

export const getQuadGeometry = (width: number, height: number, domain: AxisDomain, headerH = 64): QuadGeometry => {
  const plot = { x: QUAD_GUTTER.left, y: headerH + QUAD_GUTTER.top - 64, w: width - QUAD_GUTTER.left - QUAD_GUTTER.right, h: height - (headerH + QUAD_GUTTER.top - 64) - QUAD_GUTTER.bottom };
  const sxMax = Math.log10(1 + Math.abs(domain.xMax) / domain.xL);
  const syMax = Math.log10(1 + Math.abs(domain.yMax) / domain.yL);
  return {
    plot,
    toPx: (p) => ({ x: plot.x + ((p.sx + sxMax) / (2 * sxMax)) * plot.w, y: plot.y + (1 - (p.sy + syMax) / (2 * syMax)) * plot.h }),
  };
};

/**
 * 价波四象限 (MarketPanorama): x = 标的涨幅% (ctn×100), y = 隐波变化 (atmv_1dchg), both symlog;
 * colour = sign of x (红涨绿跌), amber ring = 临期 (≤7 天).
 * popT: frames since dots start popping (centre-out, accelerating stagger).
 * groupUp / groupDown: 0..1 – light up the IV-up / IV-down group, dim the rest (applySelection style).
 */
export const QuadrantChart: React.FC<{
  width: number;
  height: number;
  points: QuadPoint[];
  domain: AxisDomain;
  summary: { upCount: number; downCount: number; ivUpCount: number; ivDownCount: number };
  font: string;
  accent: string;
  popT?: number;
  popDur?: number;
  labelsP?: number;
  groupUp?: number;
  groupDown?: number;
  upLabel?: string;
  downLabel?: string;
  tip?: { product: string; p: number };
  frame?: number;
  bgP?: number;
}> = ({ width, height, points, domain, summary, font, accent, popT = 1e4, popDur = 150, labelsP = 1, groupUp = 0, groupDown = 0, upLabel, downLabel, tip, frame = 0, bgP = 1 }) => {
  const headerH = 64;
  const g = getQuadGeometry(width, height, domain, headerH);
  const { plot } = g;
  const labelSet = topLabelsPerQuad(points, 3);
  if (tip) labelSet.add(tip.product);
  const order = points.slice().sort((a, b) => Math.hypot(a.sx, a.sy) - Math.hypot(b.sx, b.sy));
  const rankOf = new Map(order.map((p, i) => [p.row.product, i]));
  const N = points.length;
  const D = 20;
  const sxMax = Math.log10(1 + Math.abs(domain.xMax) / domain.xL);
  const syMax = Math.log10(1 + Math.abs(domain.yMax) / domain.yL);
  const xTicks: number[] = [];
  for (let v = -Math.floor(sxMax); v <= Math.floor(sxMax); v++) xTicks.push(v);
  const yTicks: number[] = [];
  for (let v = -Math.floor(syMax); v <= Math.floor(syMax); v++) yTicks.push(v);
  const center = g.toPx({ sx: 0, sy: 0 });
  const tipPoint = tip ? points.find((p) => p.row.product === tip.product) : undefined;

  return (
    <div style={{ position: "relative", width, height, background: C.page, borderRadius: 22, border: `1px solid ${C.border}`, overflow: "hidden", fontFamily: font, color: C.ink }}>
      {/* header (MarketPanorama title + summary) */}
      <div style={{ position: "absolute", left: 28, right: 28, top: 0, height: headerH, display: "flex", alignItems: "center", gap: 14, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span style={{ fontSize: 22, fontWeight: 700 }}>价波四象限</span>
        <span style={{ fontSize: 16, color: C.muted }}>标的涨幅% × 隐波变化</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: C.up }}>涨 {summary.upCount}</span>
          <span style={{ color: C.muted }}>·</span>
          <span style={{ color: C.down }}>跌 {summary.downCount}</span>
          <span style={{ width: 1, height: 18, background: C.border, margin: "0 6px" }} />
          <span style={{ color: C.muted, fontWeight: 500, fontSize: 16 }}>隐波升</span>
          <span style={{ color: C.up }}>{summary.ivUpCount}</span>
          <span style={{ width: 1, height: 18, background: C.border, margin: "0 6px" }} />
          <span style={{ color: C.muted, fontWeight: 500, fontSize: 16 }}>隐波降</span>
          <span style={{ color: C.down }}>{summary.ivDownCount}</span>
        </div>
      </div>

      {/* compass background + quadrant captions */}
      <div style={{ position: "absolute", left: plot.x, top: plot.y, width: plot.w, height: plot.h, borderRadius: 4, overflow: "hidden", opacity: bgP, ...QUAD_BG }}>
        {QUADRANTS.map((q) => (
          <div key={q.id} style={{ position: "absolute", ...(q.id[0] === "l" ? { left: 14 } : { right: 14, textAlign: "right" }), ...(q.id[1] === "t" ? { top: 12 } : { bottom: 12 }), color: QUAD_TEXT, display: "flex", flexDirection: "column", alignItems: q.id[0] === "l" ? "flex-start" : "flex-end", gap: 2 }}>
            <span style={{ fontSize: 20, letterSpacing: "0.04em" }}>{q.title}</span>
            <span style={{ fontSize: 16, opacity: 0.7 }}>（{q.meaning}）</span>
          </div>
        ))}
      </div>

      {/* split lines, axes, tick labels */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: bgP }}>
        {xTicks.map((v) => {
          const x = g.toPx({ sx: v, sy: 0 }).x;
          return <line key={`x${v}`} x1={x} x2={x} y1={plot.y} y2={plot.y + plot.h} stroke={AXIS_LINE} strokeOpacity={v === 0 ? 1 : 0.18} />;
        })}
        {yTicks.map((v) => {
          const y = g.toPx({ sx: 0, sy: v }).y;
          return <line key={`y${v}`} x1={plot.x} x2={plot.x + plot.w} y1={y} y2={y} stroke={AXIS_LINE} strokeOpacity={v === 0 ? 1 : 0.18} />;
        })}
        {xTicks.map((v) => (
          <text key={`xl${v}`} x={g.toPx({ sx: v, sy: 0 }).x} y={plot.y + plot.h + 30} fill={COMPASS_AXIS} fontSize={18} textAnchor="middle" fontFamily={font}>
            {withSign(invSymlog(v, domain.xL).toFixed(2))}
          </text>
        ))}
        {yTicks.map((v) => (
          <text key={`yl${v}`} x={plot.x - 10} y={g.toPx({ sx: 0, sy: v }).y + 5} fill={COMPASS_AXIS} fontSize={18} textAnchor="end" fontFamily={font}>
            {withSign(invSymlog(v, domain.yL).toFixed(2))}
          </text>
        ))}
        <text x={center.x + 10} y={plot.y + 22} fill={COMPASS_AXIS} fontSize={18} fontFamily={font}>隐波变化 ↑</text>
        <text x={plot.x + plot.w - 10} y={center.y + 24} fill={COMPASS_AXIS} fontSize={18} textAnchor="end" fontFamily={font}>标的涨幅% →</text>
      </svg>

      {/* group callouts */}
      {upLabel && groupUp > 0 ? (
        <div style={{ position: "absolute", left: center.x + 24, top: plot.y + 54, padding: "10px 18px", borderRadius: 14, background: "rgba(0,0,0,0.55)", border: `1px solid ${withAlpha(C.up, 0.6)}`, fontSize: 34, fontWeight: 700, color: C.up, opacity: groupUp, transform: `translateY(${(1 - groupUp) * 14}px)`, whiteSpace: "nowrap" }}>{upLabel}</div>
      ) : null}
      {downLabel && groupDown > 0 ? (
        <div style={{ position: "absolute", left: center.x + 24, top: plot.y + plot.h - 120, padding: "10px 18px", borderRadius: 14, background: "rgba(0,0,0,0.55)", border: `1px solid ${withAlpha(C.down, 0.6)}`, fontSize: 34, fontWeight: 700, color: C.down, opacity: groupDown, transform: `translateY(${(1 - groupDown) * 14}px)`, whiteSpace: "nowrap" }}>{downLabel}</div>
      ) : null}

      {/* dots */}
      {points.map((p) => {
        const k = rankOf.get(p.row.product) ?? 0;
        const u = k / Math.max(1, N - 1);
        const delay = popDur * (1 - (1 - u) * (1 - u)) * 0.85; // accelerating: gaps shrink over time
        const s = interpolate(popT, [delay, delay + 10, delay + 18], [0, 1.25, 1], CLAMP);
        if (s <= 0) return null;
        const pos = g.toPx(p);
        const base = p.x >= 0 ? C.up : C.down;
        const inUp = p.y >= 0;
        // selection emphasis: groupUp lights y≥0, groupDown lights y<0; others dim to DIM @ 0.2
        const lit = Math.max(groupUp, groupDown);
        const member = (groupUp > 0 && inUp) || (groupDown > 0 && !inUp);
        const dim = member ? 0 : lit;
        const color = interpolateColors(dim, [0, 1], [base, DIM]);
        const opacity = interpolate(dim, [0, 1], [0.92, 0.2]);
        const isTip = tip && tip.product === p.row.product;
        const tipPulse = isTip ? tip.p : 0;
        const showLabel = labelSet.has(p.row.product);
        return (
          <React.Fragment key={p.row.product}>
            {isTip && tipPulse > 0 ? (
              <div style={{ position: "absolute", left: pos.x - D, top: pos.y - D, width: D * 2, height: D * 2, borderRadius: D, border: `2px solid ${withAlpha(accent, 0.9 * tipPulse)}`, transform: `scale(${1 + 0.15 * Math.sin(frame / 6)})`, boxShadow: `0 0 24px ${withAlpha(accent, 0.4 * tipPulse)}` }} />
            ) : null}
            <div
              style={{
                position: "absolute",
                left: pos.x - D / 2,
                top: pos.y - D / 2,
                width: D,
                height: D,
                borderRadius: D / 2,
                background: color,
                opacity: member && lit > 0 ? 1 : opacity,
                border: p.row.nearExpiry ? `2.5px solid ${C.nearExpiry}` : "none",
                boxSizing: "border-box",
                transform: `scale(${s * (member ? 1 + 0.15 * lit : 1)})`,
                boxShadow: member && lit > 0 ? `0 0 ${14 * lit}px ${withAlpha(base, 0.7)}` : "none",
              }}
            />
            {showLabel && labelsP > 0 ? (
              <div style={{ position: "absolute", left: pos.x + D / 2 + 6, top: pos.y - 14, fontSize: 20, fontWeight: 600, lineHeight: "28px", color: C.ink, whiteSpace: "nowrap", opacity: labelsP * (dim > 0 ? 1 - 0.7 * dim : 1), textShadow: "0 0 3px #000, 0 0 3px #000, 0 0 6px #000" }}>{p.row.alias}</div>
            ) : null}
          </React.Fragment>
        );
      })}

      {/* MarketBubbleHoverTip */}
      {tipPoint && tip && tip.p > 0 ? (() => {
        const pos = g.toPx(tipPoint);
        const tp = interpolate(tip.p, [0, 1], [0, 1], { ...CLAMP, easing: EASE_OUT });
        const W = 360;
        const TH = 170;
        // never cover the hovered bubble: flip left / below when it sits near the right / top edge
        const left = pos.x + 30 + W > width - 16 ? pos.x - 30 - W : pos.x + 30;
        const top = pos.y - 24 - TH < plot.y ? pos.y + 24 : pos.y - 24 - TH;
        const q = QUADRANTS.find((qq) => qq.id === tipPoint.quad);
        const r = tipPoint.row;
        return (
          <div style={{ position: "absolute", left, top, width: W, padding: "14px 16px", borderRadius: 10, background: "rgba(18,18,20,0.92)", border: `1px solid ${C.border}`, boxShadow: C.shadow, opacity: tp, transform: `translateY(${(1 - tp) * 10}px) scale(${0.96 + 0.04 * tp})`, transformOrigin: "0 100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
              <span>{r.alias}({r.prodUnd}){r.nearExpiry ? <span style={{ marginLeft: 6, fontSize: 14, padding: "1px 6px", borderRadius: 4, background: "rgba(245,158,11,0.18)", color: "#fcd34d" }}>临期</span> : null}</span>
              <span style={{ color: tipPoint.x >= 0 ? C.up : C.down, fontVariantNumeric: "tabular-nums", fontSize: 19 }}>{formatNumber(r.price, 1)} ({formatPct(r.ctn)})</span>
            </div>
            {[
              ["隐波", `${formatNumber(r.atmv, 1, 1)} (${withSign(tipPoint.y.toFixed(2))})`, tipPoint.y >= 0 ? C.up : C.down],
              ["到期", r.remaining, C.ink],
              ["解读", q?.direction ?? "", C.ink],
            ].map(([k, v, col]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 18, lineHeight: "30px", color: C.muted }}>
                <span>{k}</span>
                <span style={{ color: col, fontVariantNumeric: "tabular-nums" }}>{v}</span>
              </div>
            ))}
          </div>
        );
      })() : null}
      {/* subtle entrance ease for the whole plot frame */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: `inset 0 0 0 1px ${withAlpha("#ffffff", 0.02 * interpolate(bgP, [0, 1], [0, 1], { ...CLAMP, easing: EASE }))}` }} />
    </div>
  );
};
