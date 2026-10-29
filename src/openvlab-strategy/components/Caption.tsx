import React from "react";
import { C, THIN } from "../tokens";

/**
 * Bottom caption, the one style used across the whole video: thin weight, wide tracking, upward mask reveal.
 * `p` = 0..1 visibility. The text slides up out of a clipping mask (and back down when leaving), with a soft shadow for legibility.
 */
export const Caption: React.FC<{ text: string; p: number; y?: number; size?: number; color?: string }> = ({ text, p, y = 990, size = 42, color = C.fg }) => {
  if (p <= 0.001) return null;
  const e = 1 - Math.pow(1 - Math.min(1, p), 3);
  return (
    <div style={{ position: "absolute", left: 0, width: 1920, top: y, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ overflow: "hidden", padding: `${size * 0.22}px ${size * 0.4}px` }}>
        <div
          style={{
            transform: `translateY(${(1 - e) * 118}%)`,
            opacity: Math.min(1, p * 2.2),
            textAlign: "center",
            fontFamily: THIN,
            fontWeight: 300,
            fontSize: size,
            letterSpacing: "0.22em",
            paddingLeft: "0.22em",
            lineHeight: 1.3,
            color,
            whiteSpace: "nowrap",
            textShadow: "0 2px 18px rgba(0,0,0,.55)",
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
};
