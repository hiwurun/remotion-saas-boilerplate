import React from "react";
import { SANS } from "../../shared/fonts";
import { HEADER_TITLE, PANEL } from "../layout";
import { C } from "../tokens";
import { STRADDLE } from "./StrategyCard";

/** The app window: native 1000x620 CSS px scaled by PANEL.scale on the canvas. Children are positioned in native panel coords. */
export const Panel: React.FC<{
  op?: number;
  titleOp?: number;
  children?: React.ReactNode;
}> = ({ op = 1, titleOp = 1, children }) => {
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
      {children}
    </div>
  );
};
