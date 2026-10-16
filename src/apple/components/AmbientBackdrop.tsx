import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP } from "../motion";

export const AmbientBackdrop: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const b1 = interpolate(Math.sin(t * 0.7), [-1, 1], [0.35, 0.65], CLAMP);
  const b2 = interpolate(Math.cos(t * 0.55), [-1, 1], [0.2, 0.45], CLAMP);
  const glow = interpolate(Math.sin(t * 0.5), [-1, 1], [0.45, 0.8], CLAMP);
  const s = Math.max(width, height);
  const grid = Math.round(Math.min(width, height) / 14);

  return (
    <AbsoluteFill className="overflow-hidden bg-[#050507]">
      {/* top volumetric glow */}
      <div
        className="absolute left-1/2 rounded-full blur-[130px] bg-gradient-to-r from-indigo-600 to-purple-600"
        style={{ width: s * 0.7, height: s * 0.28, top: -s * 0.14, transform: "translateX(-50%)", opacity: glow * 0.55 }}
      />
      {/* spotlights */}
      <div
        className="absolute rounded-full blur-[130px]"
        style={{
          width: s * 0.45, height: s * 0.45, background: accentColor, opacity: b1 * 0.35,
          left: width * (0.15 + Math.sin(t * 0.25) * 0.08) - s * 0.225,
          top: height * (0.35 + Math.cos(t * 0.3) * 0.06) - s * 0.225,
        }}
      />
      <div
        className="absolute rounded-full blur-[130px] bg-purple-700"
        style={{
          width: s * 0.4, height: s * 0.4, opacity: b2 * 0.35,
          left: width * (0.85 + Math.cos(t * 0.22) * 0.08) - s * 0.2,
          top: height * (0.7 + Math.sin(t * 0.27) * 0.06) - s * 0.2,
        }}
      />
      <svg width={width} height={height} className="absolute inset-0" style={{ opacity: 0.035 }}>
        <defs>
          <pattern id="apple-grid" width={grid} height={grid} patternUnits="userSpaceOnUse">
            <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke="white" strokeWidth={1} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#apple-grid)" />
      </svg>
      <AbsoluteFill className="bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.88)_100%)]" />
    </AbsoluteFill>
  );
};
