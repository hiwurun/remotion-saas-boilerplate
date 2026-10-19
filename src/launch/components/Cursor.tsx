import React from "react";
import { interpolate } from "remotion";
import { CLAMP, EASE } from "../theme";

export type CursorKey = { frame: number; x: number; y: number; click?: boolean };

/** Position along bezier arcs between keyed targets (screen space). */
export const getCursorPos = (frame: number, keys: CursorKey[]) => {
  if (frame <= keys[0].frame) return { x: keys[0].x, y: keys[0].y };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.frame) {
      const t = interpolate(frame, [a.frame, b.frame], [0, 1], { ...CLAMP, easing: EASE });
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      // control points bowed perpendicular to the travel direction for an organic arc
      const c1 = { x: a.x + dx * 0.25 - dy * 0.25, y: a.y + dy * 0.25 + dx * 0.25 };
      const c2 = { x: a.x + dx * 0.8 - dy * 0.08, y: a.y + dy * 0.8 + dx * 0.08 };
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

/** 0→1→0 press curve around a click frame. */
export const pressCurve = (frame: number, clickFrame: number) =>
  interpolate(frame, [clickFrame - 4, clickFrame, clickFrame + 10], [0, 1, 0], CLAMP);

export const Cursor: React.FC<{ x: number; y: number; size: number; opacity: number; clickFrames: number[]; frame: number }> = ({ x, y, size, opacity, clickFrames, frame }) => {
  const press = Math.max(0, ...clickFrames.map((c) => pressCurve(frame, c)));
  const ripples = clickFrames.filter((c) => frame >= c && frame < c + 30);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", opacity }}>
      {ripples.map((c) => {
        const r = interpolate(frame, [c, c + 30], [0, 1], { ...CLAMP, easing: EASE });
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: x - size,
              top: y - size,
              width: size * 2,
              height: size * 2,
              borderRadius: size,
              border: "2px solid rgba(0,0,0,0.35)",
              transform: `scale(${0.3 + r * 1.2})`,
              opacity: 1 - r,
            }}
          />
        );
      })}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        style={{ position: "absolute", left: x - size * 0.12, top: y - size * 0.06, transform: `scale(${1 - press * 0.18})`, transformOrigin: "12% 6%", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.25))", overflow: "visible" }}
      >
        <path d="M3 1.5 L3 19.5 L8 15 L11.2 22.2 L14.4 20.8 L11.3 13.8 L18 13.8 Z" fill="#000" stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </div>
  );
};
