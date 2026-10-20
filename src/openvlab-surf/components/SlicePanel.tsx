import React from "react";

/**
 * 1:1 port of vlab-frontend packages/components/src/volatility/surface/VolatilitySurfaceView.tsx → SlicePanel
 * (232×132 svg, same margins / gradients / dashed crosshair / marker) and its hover tooltip, in the dark theme.
 * Rendered at the product's native size and scaled up with CSS so every proportion stays identical.
 */
const POPOVER = "#262626"; // --popover dark oklch(0.25 0 0)
const POPOVER_FG = "#EFF2F6";
const BORDER = "#3A3D42"; // --border dark oklch(0.3 0.008 260)
const MUTED_FG = "#A3A7AE"; // --muted-foreground dark
const fmt1 = (v: number) => v.toFixed(1);

type Pt = { x: number; y: number };
export const SlicePanel: React.FC<{
  o: number; left: number; top: number; scale: number; color: string; title: string;
  points: Pt[]; xMin: number; xMax: number; yMin: number; yMax: number; hx: number; hy: number; xf: (v: number) => string;
}> = ({ o, left, top, scale, color, title, points, xMin, xMax, yMin, yMax, hx, hy, xf }) => {
  if (o <= 0) return null;
  const width = 232;
  const height = 132;
  const mL = 40;
  const mR = 10;
  const mT = 10;
  const mB = 22;
  const cw = width - mL - mR;
  const ch = height - mT - mB;
  const sx = (v: number) => mL + ((v - xMin) / Math.max(xMax - xMin, 1e-6)) * cw;
  const sy = (v: number) => mT + (1 - (v - yMin) / Math.max(yMax - yMin, 1e-6)) * ch;
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const area = first && last ? `M ${sx(first.x).toFixed(2)} ${mT + ch} ${points.map((p) => `L ${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`).join(" ")} L ${sx(last.x).toFixed(2)} ${mT + ch} Z` : "";
  const mx = Math.min(mL + cw, Math.max(mL, sx(hx)));
  const my = Math.min(mT + ch, Math.max(mT, sy(hy)));
  const mxl = Math.min(mL + cw - 4, Math.max(mL + 4, mx));
  const myl = Math.min(mT + ch - 4, Math.max(mT + 10, my));
  const id = title.length.toString(36) + Math.round(left);
  return (
    <div style={{ position: "absolute", left, top, width: 240, transform: `scale(${scale}) translateY(${(1 - o) * -6}px)`, transformOrigin: "0 0", opacity: o, boxSizing: "border-box", borderRadius: 8, border: `1px solid ${BORDER}`, padding: 8, background: "rgba(16,16,18,0.72)", backdropFilter: "blur(4px)", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3)", fontFamily: '-apple-system, "PingFang SC", sans-serif' }}>
      <div style={{ marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ color: POPOVER_FG, fontSize: 11, fontWeight: 500, letterSpacing: "0.025em", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 10, fontWeight: 500, color, whiteSpace: "nowrap" }}>IV {fmt1(hy)}%</div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={POPOVER} stopOpacity="0.18" />
            <stop offset="100%" stopColor={POPOVER} stopOpacity="0.04" />
          </linearGradient>
          <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0.72" />
          </linearGradient>
          <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.02" />
            <stop offset="100%" stopColor={color} stopOpacity="0.14" />
          </linearGradient>
        </defs>
        <rect x={mL} y={mT} width={cw} height={ch} fill={`url(#${id}-bg)`} rx="4" />
        <line x1={mL} y1={mT} x2={mL} y2={mT + ch} stroke={BORDER} strokeOpacity="0.6" strokeWidth="0.8" />
        <line x1={mL} y1={mT + ch} x2={mL + cw} y2={mT + ch} stroke={BORDER} strokeOpacity="0.6" strokeWidth="0.8" />
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1={mL} y1={mT + ch * r} x2={mL + cw} y2={mT + ch * r} stroke={BORDER} strokeOpacity="0.22" strokeWidth="0.8" />
        ))}
        {area ? <path d={area} fill={`url(#${id}-area)`} /> : null}
        <path d={path} fill="none" stroke={`url(#${id}-line)`} strokeWidth="2" strokeLinejoin="round" />
        <line x1={mx} y1={my} x2={mx} y2={mT + ch} stroke={color} strokeOpacity="0.42" strokeWidth="1" strokeDasharray="2 3" />
        <line x1={mL} y1={my} x2={mx} y2={my} stroke={color} strokeOpacity="0.42" strokeWidth="1" strokeDasharray="2 3" />
        <text x={mxl} y={mT + ch + 10} textAnchor="middle" fill={POPOVER_FG} fontSize="10" fontWeight="600">{xf(hx)}</text>
        <text x={mL - 4} y={myl} textAnchor="end" fill={color} fontSize="10" fontWeight="600">{`${fmt1(hy)}%`}</text>
        <circle cx={mx} cy={my} r="3.2" fill={color} />
        <circle cx={mx} cy={my} r="4.8" fill="none" stroke={color} strokeOpacity="0.2" />
        <text x={mL} y={height - 6} fill={MUTED_FG} fontSize="10">{xf(xMin)}</text>
        <text x={mL + cw} y={height - 6} textAnchor="end" fill={MUTED_FG} fontSize="10">{xf(xMax)}</text>
        <text x={mL - 4} y={mT + 10} textAnchor="end" fill={MUTED_FG} fontSize="10">{`${fmt1(yMax)}%`}</text>
        <text x={mL - 4} y={mT + ch} textAnchor="end" fill={MUTED_FG} fontSize="10">{`${fmt1(yMin)}%`}</text>
      </svg>
    </div>
  );
};

/** the product's hover tooltip (隐波 / 行权价 / 期限) */
export const HoverTooltip: React.FC<{ x: number; y: number; o: number; vol: number; strike: number; days: number; color: string; scale: number }> = ({ x, y, o, vol, strike, days, color, scale }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "0 0", opacity: o, borderRadius: 4, border: `1px solid ${BORDER}`, background: "rgba(38,38,38,0.95)", color: POPOVER_FG, padding: "4px 8px", fontSize: 12, lineHeight: "16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.4)", whiteSpace: "nowrap", fontFamily: '-apple-system, "PingFang SC", sans-serif' }}>
      <div style={{ color }}>隐波: {vol.toFixed(2)}%</div>
      <div>行权价: {Math.round(strike)}</div>
      <div>期限: {Math.round(days)}天</div>
    </div>
  );
