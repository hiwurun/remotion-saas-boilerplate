import React from "react";
import { C } from "../theme";

export const DROPDOWN_W = 220;
export const DROPDOWN_ITEM_H = 46;
export const DROPDOWN_PAD = 6;

/** Option centre in the same coordinate space as the dropdown's (right, top) anchor. */
export const getOptionCenter = (right: number, top: number, i: number) => ({ x: right - DROPDOWN_W / 2, y: top + DROPDOWN_PAD + i * DROPDOWN_ITEM_H + DROPDOWN_ITEM_H / 2 });

export const Dropdown: React.FC<{ right: number; top: number; options: string[]; hover: number; selected: number; progress: number; font: string }> = ({ right, top, options, hover, selected, progress, font }) => (
  <div
    style={{
      position: "absolute",
      left: right - DROPDOWN_W,
      top,
      width: DROPDOWN_W,
      padding: DROPDOWN_PAD,
      background: "#fff",
      borderRadius: 12,
      border: `1px solid ${C.border}`,
      boxShadow: C.shadow,
      transformOrigin: "100% 0",
      transform: `scale(${0.9 + 0.1 * progress})`,
      opacity: progress,
      fontFamily: font,
    }}
  >
    {options.map((o, i) => (
      <div key={o} style={{ height: DROPDOWN_ITEM_H, borderRadius: 8, display: "flex", alignItems: "center", gap: 10, padding: "0 12px", fontSize: 16, color: C.ink, background: Math.round(hover) === i ? "#F2F2F2" : "transparent" }}>
        <div style={{ width: 16, display: "flex", justifyContent: "center" }}>
          {i === selected ? (
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
          ) : null}
        </div>
        {o}
      </div>
    ))}
  </div>
);
