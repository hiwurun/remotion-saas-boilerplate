import React from "react";
import { SANS } from "../../shared/fonts";
import { HEADER_TITLE, PANEL, TOGGLE } from "../layout";
import { C } from "../tokens";
import { STRADDLE } from "./StrategyCard";

/** The app window: native 1000x620 CSS px scaled by PANEL.scale on the canvas. Children are positioned in native panel coords. */
export const Panel: React.FC<{
  op?: number;
  titleOp?: number;
  /** 0 = 表格 active, 1 = 曲线 active. */
  view?: number;
  togglePress?: number;
  toggleOp?: number;
  children?: React.ReactNode;
}> = ({ op = 1, titleOp = 1, view = 0, togglePress = 0, toggleOp = 1, children }) => {
  const segW = TOGGLE.w;
  const gx = TOGGLE.tableX - segW / 2 - 3;
  const gw = segW * 2 + 6 + 4;
  const indX = TOGGLE.tableX - segW / 2 + (TOGGLE.chartX - TOGGLE.tableX) * view;
  return (
    <div
      style={{
        position: "absolute",
        left: PANEL.x,
        top: PANEL.y,
        width: PANEL.w,
        height: PANEL.h,
        transform: `scale(${PANEL.scale})`,
        transformOrigin: "0 0",
        opacity: op,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: "#070708",
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: SANS,
        color: C.fg,
        boxShadow: "0 30px 80px rgba(0,0,0,.6)",
      }}
    >
      <div style={{ position: "absolute", left: HEADER_TITLE.x - 1, top: HEADER_TITLE.y - 1, opacity: titleOp }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.25, whiteSpace: "nowrap" }}>{STRADDLE.name}</div>
        <div style={{ fontSize: 12, color: C.mutedFg, lineHeight: 1.25 }}>{STRADDLE.en}</div>
      </div>
      <div style={{ position: "absolute", left: gx - 1, top: TOGGLE.y - TOGGLE.h / 2 - 3 - 1, width: gw, height: TOGGLE.h + 6, borderRadius: 7, background: "#111214", border: `1px solid ${C.border}`, opacity: toggleOp, boxSizing: "border-box" }}>
        <div style={{ position: "absolute", left: indX - gx + 1 - 1, top: 2, width: segW, height: TOGGLE.h + 6 - 6, borderRadius: 5, background: C.muted, transform: `scale(${1 - togglePress * 0.06})` }} />
        <div style={{ position: "absolute", left: 1, top: 2, width: segW + 2, height: TOGGLE.h, lineHeight: `${TOGGLE.h}px`, textAlign: "center", fontSize: 12, fontWeight: 500, color: view < 0.5 ? C.fg : C.mutedFg }}>表格</div>
        <div style={{ position: "absolute", left: 1 + segW + 4, top: 2, width: segW + 2, height: TOGGLE.h, lineHeight: `${TOGGLE.h}px`, textAlign: "center", fontSize: 12, fontWeight: 500, color: view >= 0.5 ? C.fg : C.mutedFg }}>曲线</div>
      </div>
      {children}
    </div>
  );
};
