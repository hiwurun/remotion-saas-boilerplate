import React from "react";
import { C } from "../tokens";

const D_LINE = "M-1342.958115183246,48.55764370750042L0,14.292639012764376L78.41236839081839,48.624413730545285L183,94.41666666666667L287.58763160918164,48.624413730545285L366,14.292639012764376";
const D_FILL = D_LINE + "L366,48.62441373054533L287.58763160918164,48.62441373054533L183,48.62441373054533L78.41236839081839,48.62441373054533L0,48.62441373054533L-1342.958115183246,48.62441373054533Z";
const ZERO = 48.62441373054533;

/** Straddle payoff thumbnail, ported from shared-static/strategy/icons/straddle.svg. `draw` 0..1 draws the line, then the fill. */
export const StraddleMiniChart: React.FC<{ draw: number; width?: number; height?: number }> = ({ draw, width = 160, height = 72 }) => {
  const line = Math.min(1, draw / 0.7);
  const fill = Math.max(0, (draw - 0.55) / 0.45);
  const label = Math.max(0, (draw - 0.2) / 0.6);
  const txt: React.CSSProperties = { paintOrder: "stroke", stroke: "#000", strokeWidth: 2, fill: C.fg, fontSize: 12, opacity: label };
  return (
    <svg viewBox="0 0 366 103" width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        <mask id="smBounds"><rect x="0" y="0" width="366" height="103" fill="#fff" /></mask>
        <linearGradient id="smGradA" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity="1" /></linearGradient>
        <linearGradient id="smGradB" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="smGraph">
          <rect x="0" y="0" width="366" height={ZERO} fill="url(#smGradA)" />
          <rect x="0" y={ZERO} width="366" height={103 - ZERO} fill="url(#smGradB)" />
        </mask>
        <linearGradient id="smFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0.4284828873815218" stopColor="#f00032" /><stop offset="0.4284828873815218" stopColor="#00f046" /></linearGradient>
        <linearGradient id="smStroke" x1="0" x2="0" y1="0" y2="1"><stop offset="0.3285" stopColor="#cc002b" /><stop offset="0.4285" stopColor="#c49005" /><stop offset="0.5285" stopColor="#00c038" /></linearGradient>
      </defs>
      <line y1="50.12" y2="50.12" x1="16" x2="388" stroke={C.fg} strokeWidth="1" opacity={label} />
      <path fill="url(#smFill)" mask="url(#smGraph)" opacity={0.8 * fill} transform="translate(16,1)" d={D_FILL} />
      <path d={D_LINE} fill="none" stroke="url(#smStroke)" strokeWidth="3" strokeLinecap="round" mask="url(#smBounds)" transform="translate(16,1)" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - line} />
      <g opacity={label}>
        <line y1="1" y2="104" x1="199" x2="199" stroke={C.fg} strokeWidth="1" strokeDasharray="2" />
        <line y1="42.12" y2="58.12" x1="199" x2="199" stroke={C.fg} strokeWidth="1" />
      </g>
      <text y="72.12" x="199" style={txt}>A</text>
      <text textAnchor="end" transform="rotate(-90)" x="-4" y="12" style={txt}>盈利</text>
      <text textAnchor="start" transform="rotate(-90)" x="-99" y="12" style={txt}>损失</text>
      <text textAnchor="middle" x="199" y="117" style={txt}>股价</text>
    </svg>
  );
};
