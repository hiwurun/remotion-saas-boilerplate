import { SECTOR_SVG } from "../sectorSvgs";
import React from "react";
import { Easing, Img, interpolate, staticFile } from "remotion";
import { C, CLAMP, withAlpha } from "../theme";
import { SECTOR_ICON } from "../data";

/** Sector icon from vlab-frontend shared-static/icons/sector (copied to public/openvlab/sector). */
export const SectorIcon: React.FC<{ sector: string; size?: number; style?: React.CSSProperties }> = ({ sector, size = 22, style }) => {
  const name = SECTOR_ICON[sector];
  if (!name) return null;
  const svg = SECTOR_SVG[name];
  if (svg) return <span style={{ display: "inline-block", width: size, height: size, flexShrink: 0, lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
  return <Img src={staticFile(`openvlab/sector/${name}.svg`)} style={{ width: size, height: size, flexShrink: 0, ...style }} />;
};

const DIGITS = "0123456789";

/**
 * Odometer roll (skill assets/lib/DigitRoll.tsx) driven by an explicit local frame so it stays a pure
 * function of props. Non-digits (sign, dot, %) are static. Settled → plain text.
 */
export const NumberRoll: React.FC<{ text: string; t: number; fontSize: number; color?: string; weight?: number; stagger?: number; dur?: number }> = ({ text, t, fontSize, color = C.ink, weight = 500, stagger = 3, dur = 24 }) => {
  const chars = Array.from(text);
  const lineH = fontSize * 1.2;
  const settled = t <= 0 || t >= stagger * chars.length + dur;
  const base: React.CSSProperties = { fontSize, lineHeight: `${lineH}px`, color, fontWeight: weight, fontVariantNumeric: "tabular-nums" };
  if (settled) return <span style={{ ...base, display: "inline-block", height: lineH }}>{text}</span>;
  return (
    <span style={{ display: "inline-flex", overflow: "hidden", height: lineH, verticalAlign: "bottom" }}>
      {chars.map((ch, i) => {
        const target = DIGITS.indexOf(ch);
        if (target < 0) return <span key={i} style={base}>{ch}</span>;
        const p = interpolate(t, [i * stagger, i * stagger + dur], [0, 1], { ...CLAMP, easing: Easing.bezier(0.25, 0.8, 0.25, 1) });
        // one full revolution: starts AND lands on the target digit (seamless before/after the roll)
        const offset = (target + 10 * p) * lineH;
        return (
          <span key={i} style={{ display: "inline-block", height: lineH }}>
            <span style={{ display: "block", transform: `translateY(${-offset}px)` }}>
              {(DIGITS + DIGITS).split("").map((d, j) => (
                <span key={j} style={{ ...base, display: "block" }}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

/** ProgressBar.tsx: muted track + linear-gradient(#c1e96c → #e7d98d) fill + "61%" */
export const ProgressBar: React.FC<{ value: number; fill?: number; fontSize?: number }> = ({ value, fill = 1, fontSize = 15 }) => {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "0 14px", boxSizing: "border-box" }}>
      <div style={{ flex: 1, height: 8, borderRadius: 6, background: C.mutedBg, overflow: "hidden" }}>
        <div style={{ width: `${v * fill}%`, height: "100%", borderRadius: 6, background: "linear-gradient(to right, #c1e96c, #e7d98d)" }} />
      </div>
      <span style={{ minWidth: 44, textAlign: "right", fontSize, color: C.ink, fontVariantNumeric: "tabular-nums" }}>{v}%</span>
    </div>
  );
};

/** Compact semicircle gauge like the GaugeChart in the 偏度百分位 column (green→amber→red arc + value). */
export const Gauge: React.FC<{ value: number; size?: number }> = ({ value, size = 64 }) => {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const r = size * 0.4;
  const cx = size / 2;
  const cy = size * 0.52;
  const arc = (a0: number, a1: number) => {
    const p0 = { x: cx - r * Math.cos(a0), y: cy - r * Math.sin(a0) };
    const p1 = { x: cx - r * Math.cos(a1), y: cy - r * Math.sin(a1) };
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`;
  };
  const a = (v / 100) * Math.PI;
  return (
    <svg width={size} height={size * 0.62} viewBox={`0 0 ${size} ${size * 0.62}`}>
      <path d={arc(0, Math.PI * 0.33)} stroke="#4ade80" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={arc(Math.PI * 0.36, Math.PI * 0.64)} stroke="#facc15" strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={arc(Math.PI * 0.67, Math.PI)} stroke="#f87171" strokeWidth={3} fill="none" strokeLinecap="round" />
      <circle cx={cx - (r - 0) * Math.cos(a)} cy={cy - r * Math.sin(a)} r={3.2} fill="#fff" />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.24} fill={C.ink} fontWeight={600}>{v}</text>
    </svg>
  );
};

/** lucide Star (fill-amber-400 when watched) */
export const StarIcon: React.FC<{ size?: number; on?: number }> = ({ size = 16, on = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={on > 0.5 ? "#fbbf24" : "none"} stroke={interpolateHex(on)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
  </svg>
);
const interpolateHex = (on: number) => (on > 0.5 ? "#fbbf24" : C.muted);

/** valphaBackground.ts */
export const valphaBackground = (val: number) => {
  if (val === 0) return "transparent";
  const o = Math.min(Math.abs(val) / 0.5, 1) * 0.4;
  return val > 0 ? `rgba(239, 68, 68, ${o})` : `rgba(34, 197, 94, ${o})`;
};

/** One block that resolves from a lime dashed wireframe skeleton into real UI (launch AppWindow Block). */
export const Block: React.FC<{ p: number; accent: string; style?: React.CSSProperties; radius?: number; children: React.ReactNode; bare?: boolean; bg?: string }> = ({ p, accent, style, radius = 14, children, bare, bg = C.card }) => {
  const skel = 1 - p;
  return (
    <div style={{ position: "relative", borderRadius: radius, ...style }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, opacity: p, background: bare ? "transparent" : bg, border: bare ? "none" : `1px solid ${C.borderSoft}`, overflow: "hidden", transform: `scale(${0.985 + 0.015 * p})` }}>{children}</div>
      {skel > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: radius, opacity: skel, border: `1.5px dashed ${withAlpha(accent, 0.5)}`, background: withAlpha(accent, 0.035), padding: 14, display: "flex", flexDirection: "column", gap: 10, overflow: "hidden", boxSizing: "border-box" }}>
          <div style={{ width: "38%", height: 12, borderRadius: 6, background: withAlpha(accent, 0.18) }} />
          <div style={{ width: "62%", height: 12, borderRadius: 6, background: withAlpha(accent, 0.12) }} />
          <div style={{ flex: 1, borderRadius: 8, background: withAlpha(accent, 0.06), minHeight: 0 }} />
        </div>
      ) : null}
    </div>
  );
};

/**
 * LineSvg.tsx (charts/LineSvg): price area (gradient lineColor 0.3 → 0.05) + price line (strokeWidth 1.2),
 * indicator (IV) line strokeWidth 1 in --vlab-purple #a21caf, each series min–max scaled to the full height;
 * optional HH:mm start/end labels (10px muted) under the plot. `reveal` 0..1 draws the series left → right.
 */
const PATH_CACHE = new WeakMap<(number | null)[], Map<string, { line: string; area: string; iline: string }>>();

export const LineSvg: React.FC<{ data: (number | null)[]; indicator?: (number | null)[]; width: number; height: number; lineColor: string; indicatorColor?: string; strokeWidth?: number; showTime?: { start: string; end: string } | null; timeSize?: number; reveal?: number; id: string }> = ({ data, indicator, width, height, lineColor, indicatorColor = "#a21caf", strokeWidth = 1.2, showTime = null, timeSize = 10, reveal = 1, id }) => {
  if (data.length < 2) return null;
  const textH = showTime ? timeSize + 4 : 0;
  const n = Math.max(2, Math.round(2 + (data.length - 2) * Math.max(0, Math.min(1, reveal))));
  // like LineSvg.processDataPoints: null points are skipped but keep their index on the x axis
  const coords = (arr: (number | null)[]) => {
    const valid = arr.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null && Number.isFinite(p.v));
    if (!valid.length) return [];
    const vals = valid.map((p) => p.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;
    return valid.filter((p) => p.i < n).map((p) => ({ x: (p.i / (arr.length - 1)) * width, y: height - ((p.v - min) / range) * height }));
  };
  // paths are pure in (data, indicator, size, n) → cached per series (perf: rebuilt every frame otherwise)
  const key = `${width}|${height}|${n}`;
  let perData = PATH_CACHE.get(data);
  if (!perData) PATH_CACHE.set(data, (perData = new Map()));
  let cached = perData.get(key + (indicator ? "|i" : ""));
  if (!cached) {
    const pc = coords(data);
    if (pc.length < 1) return null;
    const line = pc.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
    const area = `M ${pc[0].x},${height} L ${pc[0].x},${pc[0].y} ${line.substring(line.indexOf("L"))} L ${pc[pc.length - 1].x},${height} Z`;
    const ic = indicator && indicator.length > 1 ? coords(indicator) : null;
    const iline = ic ? ic.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ") : "";
    cached = { line, area, iline };
    perData.set(key + (indicator ? "|i" : ""), cached);
  }
  const { line, area, iline } = cached;
  const gid = `ov-area-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={width} height={height + textH} viewBox={`0 0 ${width} ${height + textH}`} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={lineColor} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      {iline ? <path d={iline} fill="none" stroke={indicatorColor} strokeWidth={1} strokeLinejoin="round" strokeLinecap="round" /> : null}
      {showTime ? (
        <>
          <text x={0} y={height + timeSize + 1} fill={C.muted} fontSize={timeSize} textAnchor="start">{showTime.start}</text>
          <text x={width} y={height + timeSize + 1} fill={C.muted} fontSize={timeSize} textAnchor="end">{showTime.end}</text>
        </>
      ) : null}
    </svg>
  );
};
