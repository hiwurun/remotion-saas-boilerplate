import React from "react";
import { C, withAlpha } from "../theme";
import type { Rect } from "./AppWindow";

/** Blue dashed bounding box with a type badge. */
export const SelectionBox: React.FC<{ rect: Rect; accent: string; label: string; progress: number; font: string }> = ({ rect, accent, label, progress, font }) => {
  const pad = 8;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x - pad,
        top: rect.y - pad,
        width: rect.w + pad * 2,
        height: rect.h + pad * 2,
        border: `2px dashed ${accent}`,
        borderRadius: 10,
        background: withAlpha(accent, 0.05),
        opacity: progress,
        transform: `scale(${1.06 - 0.06 * progress})`,
      }}
    >
      <div style={{ position: "absolute", left: -2, top: -30, background: accent, color: "#fff", fontFamily: font, fontSize: 13, fontWeight: 600, padding: "4px 9px", borderRadius: 6, letterSpacing: "0.02em" }}>{label}</div>
      {[[-5, -5], [rect.w + pad * 2 - 5, -5], [-5, rect.h + pad * 2 - 5], [rect.w + pad * 2 - 5, rect.h + pad * 2 - 5]].map(([x, y], i) => (
        <div key={i} style={{ position: "absolute", left: x - 2, top: y - 2, width: 9, height: 9, background: "#fff", border: `2px solid ${accent}`, borderRadius: 2 }} />
      ))}
    </div>
  );
};

export const getPopoverRect = (anchor: Rect, isPortrait: boolean): Rect => ({ x: anchor.x - 8, y: anchor.y + anchor.h + 22, w: isPortrait ? 400 : 420, h: 150 });
export const getUpdateButtonCenter = (pop: Rect) => ({ x: pop.x + pop.w - 16 - 46, y: pop.y + pop.h - 16 - 18 });

/** Contextual prompt popover anchored under a selection. */
export const EditPopover: React.FC<{ rect: Rect; text: string; caret: boolean; progress: number; updatePressed: number; accent: string; font: string; targetLabel: string }> = ({ rect, text, caret, progress, updatePressed, accent, font, targetLabel }) => (
  <div
    style={{
      position: "absolute",
      left: rect.x,
      top: rect.y,
      width: rect.w,
      height: rect.h,
      background: "#fff",
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: C.shadow,
      opacity: progress,
      transform: `translateY(${(1 - progress) * -8}px) scale(${0.96 + 0.04 * progress})`,
      transformOrigin: "20px 0",
      fontFamily: font,
      padding: 16,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: accent }} />
      正在编辑 <span style={{ color: C.ink, fontWeight: 500 }}>{targetLabel}</span>
    </div>
    <div style={{ fontSize: 17, color: text ? C.ink : C.muted, lineHeight: 1.35, minHeight: 24 }}>
      {text || "描述你想要的修改…"}
      <span style={{ display: "inline-block", width: 2, height: 19, background: accent, marginLeft: 2, verticalAlign: "-3px", opacity: caret ? 1 : 0 }} />
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
      <div style={{ height: 36, padding: "0 14px", borderRadius: 8, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", fontSize: 14, color: C.text2 }}>取消</div>
      <div style={{ height: 36, width: 92, borderRadius: 8, background: "#000", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500, transform: `scale(${1 - updatePressed * 0.08})` }}>更新</div>
    </div>
  </div>
);
