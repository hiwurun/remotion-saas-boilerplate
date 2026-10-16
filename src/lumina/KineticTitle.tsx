import React from "react";
import { Easing, interpolate, random } from "remotion";
import { CLAMP } from "./timing";

const power3Out = Easing.out(Easing.poly(4));
const backOut = Easing.out(Easing.back(1.4));
const power2Out = Easing.out(Easing.cubic);

/**
 * Frame-driven port of the six per-slide title entrances.
 * `t` = frames since the title entrance started, `outT` = frames since exit started (or <0).
 */
export const KineticTitle: React.FC<{
  text: string;
  variant: number;
  t: number;
  outT: number;
  fps: number;
  fontFamily: string;
  fontSize: number;
  color?: string;
  seed: string;
}> = ({ text, variant, t, outT, fps, fontFamily, fontSize, color = "#f5f2ea", seed }) => {
  const chars = Array.from(text);
  const stagger = Math.round(0.03 * fps);
  const dur = Math.round(0.9 * fps);
  const order = chars.map((_, i) => i);
  if (variant % 6 === 2) {
    order.sort((a, b) => random(`${seed}-${a}`) - random(`${seed}-${b}`));
  }
  // group characters into words so line breaks only happen between words
  const words: { ch: string; i: number }[][] = [[]];
  chars.forEach((ch, i) => {
    words[words.length - 1].push({ ch, i });
    if (ch === " ") words.push([]);
  });
  const rank: number[] = [];
  order.forEach((ci, r) => (rank[ci] = r));

  const exitOpacity = outT < 0 ? 1 : interpolate(outT, [0, 0.5 * fps], [1, 0], CLAMP);
  const exitY = outT < 0 ? 0 : interpolate(outT, [0, 0.5 * fps], [0, -40], { ...CLAMP, easing: Easing.in(Easing.cubic) });

  return (
    <div style={{ fontFamily, fontSize, color, lineHeight: 0.95, fontWeight: 300, letterSpacing: "-0.02em", perspective: 800, opacity: exitOpacity, transform: `translateY(${exitY}px)` }}>
      {words.map((w, wi) => (
        <span key={wi} style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {w.map(({ ch, i }) => {
        const v = variant % 6;
        const delay = (v === 2 ? rank[i] * Math.round(0.04 * fps) : v === 4 ? i * Math.round(0.04 * fps) : i * stagger);
        const local = t - delay;
        const ease = v === 1 ? backOut : v === 2 ? power2Out : power3Out;
        const d = v === 2 ? Math.round(1 * fps) : v === 3 ? Math.round(0.8 * fps) : dur;
        const p = interpolate(local, [0, d], [0, 1], { ...CLAMP, easing: ease });
        const pc = Math.min(1, Math.max(0, p));
        const opacity = interpolate(local, [0, d * 0.6], [0, 1], CLAMP);
        let transform = "";
        let filter = "none";
        if (v === 0) transform = `translateY(${(1 - p) * fontSize * 0.6}px)`;
        if (v === 1) transform = `translateY(${(1 - p) * -fontSize * 0.6}px)`;
        if (v === 2) {
          transform = `scale(${1.5 - 0.5 * pc})`;
          filter = `blur(${(1 - pc) * 12}px)`;
        }
        if (v === 3) transform = `scale(${pc})`;
        if (v === 4) transform = `rotateX(${(1 - pc) * 90}deg)`;
        if (v === 5) transform = `translateX(${(1 - p) * fontSize * 0.9}px)`;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity,
              transform,
              filter,
              transformOrigin: v === 4 ? "50% 50% -20px" : "50% 70%",
            }}
          >
            {ch}
          </span>
        );
          })}
        </span>
      ))}
    </div>
  );
};
