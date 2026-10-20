import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { OpenVLabProps } from "../schema";
import { C, EASE, EASE_OUT, INTRO_END, blurOf, INTRO_START, beatProgress, beatToFrame } from "../theme";
import { SANS } from "../../shared/fonts";
import { BrandMark } from "../components/BrandMark";

/** Brand title card: logo + 「OpenVLab · 市场总览」, blur+translate in (EASE_OUT), out up into the prompt opening (EASE). */
export const TitleScene: React.FC<OpenVLabProps> = ({ brandName, logoSrc, bpm, copy }) => {
  const f = useCurrentFrame();
  if (f > beatToFrame(INTRO_END + 0.2, bpm)) return null;
  const inP = (a: number) => beatProgress(f, bpm, a, a + 1.1, EASE_OUT);
  const out = beatProgress(f, bpm, INTRO_START - 0.6, INTRO_END, EASE);
  const piece = (p: number, dy = 26) => ({ opacity: p * (1 - out), transform: `translateY(${(1 - p) * dy - out * 46}px) scale(${0.96 + 0.04 * p})`, filter: blurOf((1 - p) * 14 + out * 10) });
  const logoP = inP(0.15);
  const textP = inP(0.4);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div style={piece(logoP, 18)}>
          <BrandMark size={112} src={logoSrc} glow={logoP * (1 - out)} />
        </div>
        <div style={{ ...piece(textP), display: "flex", alignItems: "baseline", gap: 26, fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, whiteSpace: "nowrap" }}>
          <span>{brandName}</span>
          <span style={{ color: C.dim, fontWeight: 500 }}>·</span>
          <span style={{ fontWeight: 600 }}>{copy.titleCard}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
