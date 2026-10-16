import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Pointer that travels from bottom-right of its container along a cubic bezier
 * to `target` (pixels, relative to the container), then clicks.
 */
export const SimulatedCursor: React.FC<{
  target: [number, number];
  containerWidth: number;
  containerHeight: number;
  startFrame?: number;
  travelFrames?: number;
  size?: number;
}> = ({ target, containerWidth, containerHeight, startFrame = 20, travelFrames = 50, size = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p0: [number, number] = [containerWidth * 1.05, containerHeight * 1.05];
  const p3 = target;
  const p1: [number, number] = [p0[0] - containerWidth * 0.1, p0[1] - containerHeight * 0.55];
  const p2: [number, number] = [p3[0] + containerWidth * 0.25, p3[1] + containerHeight * 0.1];

  const t = interpolate(frame, [startFrame, startFrame + travelFrames], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const u = 1 - t;
  const x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0];
  const y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1];

  const clickFrame = startFrame + travelFrames + 4;
  const press = interpolate(frame, [clickFrame, clickFrame + 4, clickFrame + 10], [1, 0.8, 1], CLAMP);
  const ripple = spring({ frame: frame - clickFrame, fps, config: { damping: 30, stiffness: 80 } });
  const rippleScale = interpolate(ripple, [0, 1], [0, 3.2], CLAMP);
  const rippleOpacity = interpolate(frame, [clickFrame, clickFrame + 2, clickFrame + 30], [0, 0.7, 0], CLAMP);
  const appear = interpolate(frame, [startFrame - 5, startFrame + 5], [0, 1], CLAMP);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ opacity: appear }}>
      <div
        className="absolute rounded-full border-4 border-white"
        style={{
          left: target[0] - size / 2,
          top: target[1] - size / 2,
          width: size,
          height: size,
          opacity: rippleOpacity,
          transform: `scale(${rippleScale})`,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="absolute"
        style={{
          left: x,
          top: y,
          transform: `scale(${press})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55))",
        }}
      >
        <path d="M2 1 L2 20 L7.5 15 L11 23 L14.5 21.5 L11 13.5 L18.5 13.5 Z" fill="white" stroke="black" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
