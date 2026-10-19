import React from "react";
import { random } from "remotion";

/** Radial streaks flowing outward from the centre (copied from launch, colour parameterised for the dark stage). */
export const HyperspaceLines: React.FC<{ width: number; height: number; t: number; opacity: number; count?: number; rgb?: string; accentRgb?: string }> = ({ width, height, t, opacity, count = 110, rgb = "255,255,255", accentRgb = "175,243,62" }) => {
  const cx = width / 2;
  const cy = height / 2;
  const R = Math.hypot(width, height) / 2;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity }}>
      {new Array(count).fill(0).map((_, i) => {
        const ang = random(`hs-a-${i}`) * Math.PI * 2;
        const speed = 6 + random(`hs-s-${i}`) * 16;
        const len = 40 + random(`hs-l-${i}`) * 180;
        const r0 = (random(`hs-o-${i}`) * R + t * speed * (1 + t / 90)) % (R + len);
        const r1 = Math.min(R + len, r0 + len);
        const a = 0.15 + random(`hs-op-${i}`) * 0.45;
        const tinted = random(`hs-c-${i}`) < 0.12;
        return (
          <line
            key={i}
            x1={cx + Math.cos(ang) * r0}
            y1={cy + Math.sin(ang) * r0}
            x2={cx + Math.cos(ang) * r1}
            y2={cy + Math.sin(ang) * r1}
            stroke={`rgba(${tinted ? accentRgb : rgb},${a * (tinted ? 0.55 : 0.32)})`}
            strokeWidth={1 + random(`hs-w-${i}`)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};
