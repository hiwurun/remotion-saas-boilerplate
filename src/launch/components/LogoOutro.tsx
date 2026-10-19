import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, EASE } from "../theme";
import { BrandMark } from "./BrandMark";

/**
 * Outro: URL fade → cut to mark → mark morphs into app-icon tile → wordmark slides out of its right side.
 * All progresses are 0..1 and computed by the caller from beats.
 */
export const LogoOutro: React.FC<{
  width: number;
  height: number;
  url: string;
  brandName: string;
  urlP: number;
  urlOut: number;
  logoIn: number;
  morph: number;
  wordmark: number;
  font: string;
  mono: string;
  isPortrait: boolean;
  logoSrc?: string;
}> = ({ width, height, url, brandName, urlP, urlOut, logoIn, morph, wordmark, font, mono, isPortrait, logoSrc }) => {
  const markSize = isPortrait ? 150 : 140;
  const wordSize = isPortrait ? 104 : 112;
  const gap = 34;
  // approximate wordmark width (Geist, tight tracking)
  const wordW = Array.from(brandName).reduce((a, ch) => a + (/[\u3000-\u9fff]/.test(ch) ? 1 : ch === " " ? 0.28 : 0.56), 0) * wordSize;
  const total = markSize + gap + wordW;
  const shift = interpolate(wordmark, [0, 1], [0, -(total / 2 - markSize / 2)], CLAMP);
  const urlScale = interpolate(urlP, [0, 1], [0.96, 1], CLAMP);
  return (
    <div style={{ position: "absolute", inset: 0, width, height, fontFamily: font }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: mono,
          fontSize: isPortrait ? 72 : 84,
          letterSpacing: "-0.03em",
          color: C.ink,
          opacity: urlP * (1 - urlOut),
          transform: `scale(${urlScale})`,
          filter: `blur(${(1 - urlP) * 8}px)`,
        }}
      >
        {url}
      </div>
      {logoIn > 0 ? (
        <div style={{ position: "absolute", left: width / 2 - markSize / 2 + shift, top: height / 2 - markSize / 2, width: markSize, height: markSize, opacity: logoIn, transform: `scale(${0.92 + 0.08 * logoIn}) rotate(${interpolate(morph, [0, 1], [0, 0], CLAMP)}deg)` }}>
          <BrandMark size={markSize} fill={1} tile={morph} logoSrc={logoSrc} />
        </div>
      ) : null}
      {wordmark > 0 ? (
        <div
          style={{
            position: "absolute",
            left: width / 2 + markSize / 2 + gap + shift,
            top: height / 2 - wordSize * 0.62,
            height: wordSize * 1.24,
            width: wordW + 40,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: wordSize,
              fontWeight: 600,
              letterSpacing: "-0.045em",
              lineHeight: 1.24,
              color: C.ink,
              whiteSpace: "nowrap",
              transform: `translateX(${interpolate(wordmark, [0, 1], [-(wordW + 40), 0], { ...CLAMP, easing: EASE })}px)`,
            }}
          >
            {brandName}
          </div>
        </div>
      ) : null}
    </div>
  );
};
