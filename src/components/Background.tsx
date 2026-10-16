import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const Background: React.FC<{ themeColor: string }> = ({ themeColor }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;

  const breathe = interpolate(Math.sin(t * 0.9), [-1, 1], [0.35, 0.6], CLAMP);
  const scale = interpolate(Math.sin(t * 0.6), [-1, 1], [0.9, 1.15], CLAMP);
  const gx = 50 + Math.sin(t * 0.4) * 18;
  const gy = 40 + Math.cos(t * 0.35) * 14;
  const grid = Math.round(Math.min(width, height) / 18);
  const gridShift = interpolate(frame % (fps * 4), [0, fps * 4], [0, grid], CLAMP);

  return (
    <AbsoluteFill className="bg-slate-950 overflow-hidden">
      <svg width={width} height={height} className="absolute inset-0" style={{ opacity: 0.08 }}>
        <defs>
          <pattern id="grid" width={grid} height={grid} patternUnits="userSpaceOnUse"
            patternTransform={`translate(0 ${gridShift})`}>
            <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="white" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <AbsoluteFill
        style={{
          opacity: breathe,
          transform: `scale(${scale})`,
          background: `radial-gradient(circle at ${gx}% ${gy}%, ${themeColor} 0%, transparent 55%)`,
          filter: "blur(40px)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(2,6,23,0.85) 100%)" }}
      />
    </AbsoluteFill>
  );
};
