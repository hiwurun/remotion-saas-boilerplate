import React from "react";
import { SANS } from "../../shared/fonts";
import { CONTENT, SLIDER } from "../layout";
import { C } from "../tokens";
import { EXPIRY_MS, Model, cstParts } from "../model/model";
import { dteToIndex } from "./StrategyChart";

export const pillText = (dte: number) => {
  if (dte < 1e-4) return "到期";
  const days = Math.floor(dte + 1e-9);
  const hours = Math.floor((dte - days) * 24 + 1e-6);
  if (days > 0) return hours > 0 ? `还有${days}天${hours}小时到期` : `还有${days}天到期`;
  return `还有${Math.max(hours, 1)}小时到期`;
};

export const dateText = (model: Model, dte: number) => {
  const idx = dteToIndex(model, dte);
  if (idx < 15) {
    const t = model.timeline[Math.round(idx)];
    return `${t.mmdd} ${t.hhmm}`;
  }
  const p = cstParts(EXPIRY_MS - dte * 86400e3);
  return `${p.mmdd} ${p.hhmm}`;
};

const TRACK = { x: 118, w: CONTENT.w - 118 - 24 };

/** Index-based date slider with a "还有N天到期" pill above the thumb. */
export const DateSlider: React.FC<{ model: Model; dte: number; op?: number }> = ({ model, dte, op = 1 }) => {
  const idx = dteToIndex(model, dte);
  const n = model.timeline.length - 1;
  const thumbX = TRACK.x + (idx / n) * TRACK.w;
  const cy = SLIDER.y + 36;
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: SLIDER.y + SLIDER.h, opacity: op, fontFamily: SANS, fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
      <div style={{ position: "absolute", left: 0, top: cy - 9, color: C.mutedFg, lineHeight: "18px" }}>日期</div>
      <div style={{ position: "absolute", left: 34, top: cy - 9, color: C.fg, lineHeight: "18px", fontWeight: 500, whiteSpace: "nowrap" }}>{dateText(model, dte)}</div>
      <div style={{ position: "absolute", left: TRACK.x, top: cy - 2, width: TRACK.w, height: 4, borderRadius: 2, background: C.muted }} />
      <div style={{ position: "absolute", left: TRACK.x, top: cy - 2, width: thumbX - TRACK.x, height: 4, borderRadius: 2, background: C.primary }} />
      {model.timeline.map((_, i) => (
        <div key={i} style={{ position: "absolute", left: TRACK.x + (i / n) * TRACK.w - 1, top: cy + 7, width: 2, height: 4, borderRadius: 1, background: C.border }} />
      ))}
      <div style={{ position: "absolute", left: thumbX - 7, top: cy - 7, width: 14, height: 14, borderRadius: 7, background: C.fg, border: `2px solid ${C.primary}`, boxSizing: "border-box", boxShadow: "0 0 0 4px rgba(175,243,62,.18)" }} />
      <div style={{ position: "absolute", left: thumbX, top: cy - 34, transform: "translateX(-50%)", padding: "2px 7px", borderRadius: 4, background: C.primary, color: "#0b1a00", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{pillText(dte)}</div>
    </div>
  );
};
