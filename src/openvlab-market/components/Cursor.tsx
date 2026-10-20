import React from "react";
import { interpolate } from "remotion";
import { CLAMP, EASE } from "../theme";

export type CursorKey = { frame: number; x: number; y: number; straight?: boolean };

/** Position along bezier arcs between keyed targets (copied from launch). */
export const getCursorPos = (frame: number, keys: CursorKey[]) => {
  if (frame <= keys[0].frame) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.frame) {
      const t = interpolate(frame, [a.frame, b.frame], [0, 1], { ...CLAMP, easing: EASE });
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      // b.straight → glide along a line (e.g. sweeping across a row of options); otherwise a natural arc
      const bow = b.straight ? 0 : 1;
      const c1 = { x: a.x + dx * 0.25 - dy * 0.25 * bow, y: a.y + dy * 0.25 + dx * 0.25 * bow };
      const c2 = { x: a.x + dx * 0.8 - dy * 0.08 * bow, y: a.y + dy * 0.8 + dx * 0.08 * bow };
      const u = 1 - t;
      return {
        x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
        y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
      };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x, y: l.y };
};

export const pressCurve = (frame: number, clickFrame: number) => interpolate(frame, [clickFrame - 4, clickFrame, clickFrame + 10], [0, 1, 0], CLAMP);

/** Dark-stage cursor: white arrow, dark outline, lime click ripple. */
export const Cursor: React.FC<{ x: number; y: number; size: number; opacity: number; clickFrames: number[]; frame: number; ripple?: string }> = ({ x, y, size, opacity, clickFrames, frame, ripple = "rgba(175,243,62,0.7)" }) => {
  const press = Math.max(0, ...clickFrames.map((c) => pressCurve(frame, c)));
  const ripples = clickFrames.filter((c) => frame >= c && frame < c + 30);
  if (opacity <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity }}>
      {ripples.map((c) => {
        const r = interpolate(frame, [c, c + 30], [0, 1], { ...CLAMP, easing: EASE });
        return <div key={c} style={{ position: "absolute", left: x - size, top: y - size, width: size * 2, height: size * 2, borderRadius: size, border: `2px solid ${ripple}`, transform: `scale(${0.3 + r * 1.2})`, opacity: 1 - r }} />;
      })}
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: "absolute", left: x - size * 0.12, top: y - size * 0.06, transform: `scale(${1 - press * 0.18})`, transformOrigin: "12% 6%", filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.6))", overflow: "visible" }}>
        <path d="M3 1.5 L3 19.5 L8 15 L11.2 22.2 L14.4 20.8 L11.3 13.8 L18 13.8 Z" fill="#fff" stroke="#000" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
