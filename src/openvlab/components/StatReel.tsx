import React from "react";
import { C, withAlpha } from "../theme";
import { SlotReel } from "./SlotReel";

/** Slot-reel of data-derived stat lines inside a dark pill (launch grid prompt-bar mechanic). */
export const StatReel: React.FC<{ cx: number; cy: number; width: number; items: string[]; position: number; velocity: number; opacity: number; font: string; accent: string; fontSize?: number }> = ({ cx, cy, width, items, position, velocity, opacity, font, accent, fontSize = 40 }) => {
  const h = fontSize * 2.2;
  return (
    <div style={{ position: "absolute", left: cx - width / 2, top: cy - h / 2, width, height: h, borderRadius: h / 2, background: "rgba(12,13,16,0.92)", border: `1px solid ${C.border}`, boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 60px ${withAlpha(accent, 0.08)}`, display: "flex", alignItems: "center", gap: 22, padding: `0 ${h * 0.4}px`, opacity, boxSizing: "border-box", overflow: "hidden" }}>
      <div style={{ width: h * 0.56, height: h * 0.56, borderRadius: "50%", background: accent, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px ${withAlpha(accent, 0.45)}` }}>
        <svg width={h * 0.3} height={h * 0.3} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <SlotReel items={items} position={position} velocity={velocity} lineHeight={fontSize * 1.5} visibleLines={3} fontSize={fontSize} fontFamily={font} color="#3E4248" activeColor={C.ink} />
      </div>
    </div>
  );
};
