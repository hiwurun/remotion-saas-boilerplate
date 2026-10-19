import React from "react";
import { random } from "remotion";

/** Faint grey radial streaks flowing outward from the centre. Pure function of `t` (frames). */
export const HyperspaceLines: React.FC<{ width: number; height: number; t: number; opacity: number; count?: number }> = ({ width, height, t, opacity, count = 90 }) => {
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
        return (
          <line
            key={i}
            x1={cx + Math.cos(ang) * r0}
            y1={cy + Math.sin(ang) * r0}
            x2={cx + Math.cos(ang) * r1}
            y2={cy + Math.sin(ang) * r1}
            stroke={`rgba(0,0,0,${a * 0.35})`}
            strokeWidth={1 + random(`hs-w-${i}`)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};
