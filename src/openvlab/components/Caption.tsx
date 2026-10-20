import React from "react";
import { C, blurOf } from "../theme";

/** Highlights numbers (incl. sign / decimals) in the accent colour. */
const Numbered: React.FC<{ text: string; accent: string }> = ({ text, accent }) => {
  const parts = text.split(/((?<![A-Za-z\d.])[+−-]?\d+(?:\.\d+)?%?(?![A-Za-z\d]))/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <span key={i} style={{ color: accent, fontVariantNumeric: "tabular-nums" }}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}
    </>
  );
};

/** Screen-space narration caption (≥56px main, ≥32px sub – aesthetic-rules Q11). Blur-rise in, rise-out. */
export const Caption: React.FC<{ text: string; sub?: string; p: number; out: number; y: number; width: number; font: string; accent: string; size?: number; subSize?: number; scrim?: boolean }> = ({ text, sub, p, out, y, width, font, accent, size = 62, subSize = 34, scrim = true }) => {
  const o = p * (1 - out);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width, height: "100%", pointerEvents: "none" }}>
      {scrim ? <div style={{ position: "absolute", left: 0, right: 0, top: y - size * 1.6, height: size * 3.6 + (sub ? subSize * 1.6 : 0), background: "linear-gradient(to bottom, rgba(5,6,8,0) 0%, rgba(5,6,8,0.82) 38%, rgba(5,6,8,0.9) 100%)", opacity: o }} /> : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          width,
          top: y - size * 0.7,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: subSize * 0.5,
          fontFamily: font,
          opacity: o,
          transform: `translateY(${(1 - p) * 18 - out * 22}px)`,
          filter: blurOf((1 - p) * 10 + out * 6),
        }}
      >
        <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, whiteSpace: "nowrap" }}>{text}</div>
        {sub ? (
          <div style={{ fontSize: subSize, fontWeight: 500, color: C.muted, lineHeight: 1.2, whiteSpace: "nowrap" }}>
            <Numbered text={sub} accent={accent} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
