import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { FPS, H, W } from "../timeline";

/** Dark stage with soft top-left cool radial glow + vignette + breathe. */
export const Stage: React.FC<{ children?: React.ReactNode; breathe?: number }> = ({
  children,
  breathe = 1,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const pulse = 0.92 + 0.08 * Math.sin(t * Math.PI * 0.55) * breathe;
  const glowOpacity = interpolate(breathe, [0, 1], [0.35, 0.7]);

  return (
    <AbsoluteFill style={{ background: C.stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: -W * 0.15,
          top: -H * 0.25,
          width: W * 0.85,
          height: H * 0.9,
          background: `radial-gradient(ellipse at center, ${C.stageGlow} 0%, transparent 68%)`,
          opacity: glowOpacity * pulse,
          transform: `scale(${0.95 + 0.06 * pulse})`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)",
          pointerEvents: "none",
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
