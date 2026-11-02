import React from "react";
import { SANS } from "../../shared/fonts";
import { CONTENT, SLIDER } from "../layout";
import { C } from "../tokens";

const TRACK = { x: 118, w: CONTENT.w - 118 - 24 };
const MIN = 0.1;
const MAX = 3;
const TICKS = [0.1, 1, 2, 3] as const;

const frac = (m: number) => (Math.min(MAX, Math.max(MIN, m)) - MIN) / (MAX - MIN);

const pillText = (m: number) => {
  const t = Math.round(m * 100) / 100;
  return Number.isInteger(t) ? `${t}x` : `${t.toFixed(1)}x`;
};

/** Product-style IV multiplier slider (0.1x–3x) for the IV act. */
export const IvSlider: React.FC<{ baseVol: number; multiplier: number; op?: number }> = ({ baseVol, multiplier, op = 1 }) => {
  const thumbX = TRACK.x + frac(multiplier) * TRACK.w;
  const cy = SLIDER.y + 36;
  const ivPct = (baseVol * multiplier * 100).toFixed(1);
  if (op < 0.001) return null;
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: SLIDER.y + SLIDER.h, opacity: op, fontFamily: SANS, fontSize: 12, fontVariantNumeric: "tabular-nums", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: cy - 9, color: C.mutedFg, lineHeight: "18px" }}>隐波</div>
      <div style={{ position: "absolute", left: 34, top: cy - 9, color: C.vega, lineHeight: "18px", fontWeight: 600, whiteSpace: "nowrap" }}>{ivPct}%</div>
      <div style={{ position: "absolute", left: TRACK.x, top: cy - 2, width: TRACK.w, height: 4, borderRadius: 2, background: C.muted }} />
      <div style={{ position: "absolute", left: TRACK.x, top: cy - 2, width: thumbX - TRACK.x, height: 4, borderRadius: 2, background: C.primary }} />
      {TICKS.map((t) => {
        const x = TRACK.x + frac(t) * TRACK.w;
        return (
          <React.Fragment key={t}>
            <div style={{ position: "absolute", left: x - 1, top: cy + 7, width: 2, height: 4, borderRadius: 1, background: C.border }} />
            <div style={{ position: "absolute", left: x, top: cy + 14, transform: "translateX(-50%)", color: C.mutedFg, fontSize: 10, lineHeight: "12px", whiteSpace: "nowrap" }}>{t}x</div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: thumbX - 7, top: cy - 7, width: 14, height: 14, borderRadius: 7, background: C.fg, border: `2px solid ${C.primary}`, boxSizing: "border-box", boxShadow: "0 0 0 4px rgba(175,243,62,.18)" }} />
      <div style={{ position: "absolute", left: thumbX, top: cy - 34, transform: "translateX(-50%)", padding: "2px 7px", borderRadius: 4, background: C.primary, color: "#0b1a00", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{pillText(multiplier)}</div>
    </div>
  );
};
