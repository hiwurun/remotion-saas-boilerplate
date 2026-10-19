import React from "react";

/** 3D flip on the X axis. angle in degrees (0 = front, 180 = back). */
export const FlipCard: React.FC<{ width: number; height: number; angle: number; front: React.ReactNode; back: React.ReactNode; perspective?: number }> = ({ width, height, angle, front, back, perspective = 2600 }) => {
  const showBack = Math.cos((angle * Math.PI) / 180) < 0;
  return (
    <div style={{ width, height, perspective, position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${angle}deg)` }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", visibility: showBack ? "hidden" : "visible" }}>{front}</div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateX(180deg)", visibility: showBack ? "visible" : "hidden" }}>{back}</div>
      </div>
    </div>
  );
};
