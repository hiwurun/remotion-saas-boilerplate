import React from "react";
import { EasingFunction, interpolate } from "remotion";
import { CLAMP, EASE } from "../theme";

export type CameraKeyframe = { frame: number; x: number; y: number; scale: number; easing?: EasingFunction };
export type CameraState = { x: number; y: number; scale: number };

/** Camera state at `frame`. Segment easing is taken from the destination keyframe; scale interpolates in log space. */
export const getCameraState = (frame: number, kfs: CameraKeyframe[]): CameraState => {
  if (frame <= kfs[0].frame) return kfs[0];
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i];
    const b = kfs[i + 1];
    if (frame <= b.frame) {
      const t = interpolate(frame, [a.frame, Math.max(a.frame + 1, b.frame)], [0, 1], { ...CLAMP, easing: b.easing ?? EASE });
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        scale: Math.exp(Math.log(a.scale) + (Math.log(b.scale) - Math.log(a.scale)) * t),
      };
    }
  }
  return kfs[kfs.length - 1];
};

export const worldToScreen = (p: { x: number; y: number }, cam: CameraState, width: number, height: number) => ({
  x: (p.x - cam.x) * cam.scale + width / 2,
  y: (p.y - cam.y) * cam.scale + height / 2,
});

/** 2.5D pan/zoom wrapper. Children are laid out in world coordinates (same size as the video). */
export const Camera: React.FC<{ state: CameraState; width: number; height: number; children: React.ReactNode }> = ({ state, width, height, children }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height,
      transformOrigin: "0 0",
      transform: `translate(${width / 2}px, ${height / 2}px) scale(${state.scale}) translate(${-state.x}px, ${-state.y}px)`,
    }}
  >
    {children}
  </div>
);
