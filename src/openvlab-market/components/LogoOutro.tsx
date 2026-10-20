import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, EASE, blurOf } from "../theme";
import { BrandMark } from "./BrandMark";

/**
 * Outro (launch LogoOutro, dark): URL fade → cut to mark → wordmark slides out of the mark's right side → tagline.
 */
export const LogoOutro: React.FC<{ width: number; height: number; url: string; brandName: string; tagline: string; urlP: number; urlOut: number; logoIn: number; wordmark: number; tagP: number; font: string; mono: string; logoSrc: string; accent: string }> = ({ width, height, url, brandName, tagline, urlP, urlOut, logoIn, wordmark, tagP, font, mono, logoSrc, accent }) => {
  const markSize = 140;
  const wordSize = 112;
  const gap = 34;
  const wordW = Array.from(brandName).reduce((a, ch) => a + (/[\u3000-\u9fff]/.test(ch) ? 1 : ch === " " ? 0.28 : /[A-Z]/.test(ch) ? 0.66 : 0.56), 0) * wordSize;
  const total = markSize + gap + wordW;
  const shift = interpolate(wordmark, [0, 1], [0, -(total / 2 - markSize / 2)], CLAMP);
  const urlScale = interpolate(urlP, [0, 1], [0.96, 1], CLAMP);
  const lift = interpolate(tagP, [0, 1], [0, -40], { ...CLAMP, easing: EASE });
  return (
    <div style={{ position: "absolute", inset: 0, width, height, fontFamily: font }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 92, letterSpacing: "-0.03em", color: C.ink, opacity: urlP * (1 - urlOut), transform: `scale(${urlScale * (1 + 0.04 * urlOut)})`, filter: blurOf((1 - urlP) * 8 + urlOut * 12) }}>
        <span style={{ color: C.muted }}>www.</span>
        {url}
      </div>
      {logoIn > 0 ? (
        <div style={{ position: "absolute", left: width / 2 - markSize / 2 + shift, top: height / 2 - markSize / 2 + lift, width: markSize, height: markSize, opacity: logoIn, transform: `scale(${0.92 + 0.08 * logoIn})`, filter: blurOf((1 - logoIn) * 10) }}>
          <BrandMark size={markSize} src={logoSrc} glow={logoIn} />
        </div>
      ) : null}
      {wordmark > 0 ? (
        <div style={{ position: "absolute", left: width / 2 + markSize / 2 + gap + shift, top: height / 2 - wordSize * 0.62 + lift, height: wordSize * 1.24, width: wordW + 40, overflow: "hidden" }}>
          <div style={{ fontSize: wordSize, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.24, color: C.ink, whiteSpace: "nowrap", transform: `translateX(${interpolate(wordmark, [0, 1], [-(wordW + 40), 0], { ...CLAMP, easing: EASE })}px)` }}>{brandName}</div>
        </div>
      ) : null}
      {tagP > 0 ? (
        <div style={{ position: "absolute", left: 0, width, top: height / 2 + 70, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: tagP, transform: `translateY(${(1 - tagP) * 16}px)`, filter: blurOf((1 - tagP) * 6) }}>
          <div style={{ fontSize: 44, fontWeight: 500, color: C.ink, letterSpacing: "0.02em" }}>{tagline}</div>
          <div style={{ fontSize: 36, fontFamily: mono, color: accent }}>{url}</div>
        </div>
      ) : null}
    </div>
  );
};
