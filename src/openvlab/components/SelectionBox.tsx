import React from "react";
import { withAlpha } from "../theme";

export type Rect = { x: number; y: number; w: number; h: number };

/** Dashed bounding box with a type badge (launch SelectionBox, lime on dark). */
export const SelectionBox: React.FC<{ rect: Rect; accent: string; label: string; progress: number; font: string; labelSize?: number; labelBelow?: boolean }> = ({ rect, accent, label, progress, font, labelSize = 15, labelBelow = false }) => {
  const pad = 8;
  const W = rect.w + pad * 2;
  const H = rect.h + pad * 2;
  return (
    <div style={{ position: "absolute", left: rect.x - pad, top: rect.y - pad, width: W, height: H, border: `2px dashed ${accent}`, borderRadius: 10, background: withAlpha(accent, 0.06), opacity: progress, transform: `scale(${1.06 - 0.06 * progress})`, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: -2, ...(labelBelow ? { bottom: -(labelSize * 1.9 + 8) } : { top: -(labelSize * 1.9 + 6) }), background: accent, color: "#000", fontFamily: font, fontSize: labelSize, fontWeight: 700, padding: `${labelSize * 0.3}px ${labelSize * 0.6}px`, borderRadius: 6, whiteSpace: "nowrap", lineHeight: 1.3 }}>{label}</div>
      {[[-5, -5], [W - 5, -5], [-5, H - 5], [W - 5, H - 5]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 2, top: y - 2, width: 9, height: 9, background: "#000", border: `2px solid ${accent}`, borderRadius: 2 }} />
      ))}
    </div>
  );
};
