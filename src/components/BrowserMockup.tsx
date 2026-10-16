import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export { FloatingCallout } from "./FloatingCallout";
export { SimulatedCursor } from "./SimulatedCursor";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const BrowserMockup: React.FC<{
  width: number;
  height: number;
  url?: string;
  zoomScale?: number;
  focusX?: number;
  focusY?: number;
  zoomStartFrame?: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ width, height, url = "app.acme.io/dashboard", zoomScale = 1, focusX = 0.5, focusY = 0.5, zoomStartFrame = 25, children, overlay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barH = Math.round(Math.max(36, width * 0.03));

  const entry = spring({ frame, fps, config: { damping: 18, stiffness: 90 } });
  const rise = interpolate(entry, [0, 1], [120, 0], CLAMP);
  const rotateX = interpolate(entry, [0, 1], [12, 0], CLAMP);
  const opacity = interpolate(entry, [0, 0.3], [0, 1], CLAMP);

  const zoomProgress = spring({ frame: frame - zoomStartFrame, fps, config: { damping: 200 }, durationInFrames: Math.round(fps * 1.6) });
  const scale = interpolate(zoomProgress, [0, 1], [1, zoomScale], CLAMP);
  const contentH = height - barH;
  // translate so the focus point drifts toward center, clamped to keep edges filled
  const maxTx = (width * (scale - 1)) / 2;
  const maxTy = (contentH * (scale - 1)) / 2;
  const tx = Math.max(-maxTx, Math.min(maxTx, (0.5 - focusX) * width * (scale - 1)));
  const ty = Math.max(-maxTy, Math.min(maxTy, (0.5 - focusY) * contentH * (scale - 1)));

  const dot = barH * 0.32;
  return (
    <div style={{ perspective: 1200 }}>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/15 bg-slate-900"
        style={{
          width,
          height,
          opacity,
          transform: `translateY(${rise}px) perspective(1200px) rotateX(${rotateX}deg)`,
          boxShadow: "0 50px 120px -20px rgba(0,0,0,0.8), 0 30px 60px -30px rgba(0,0,0,0.9)",
        }}
      >
        <div
          className="relative flex items-center border-b border-white/10 bg-slate-800/70"
          style={{ height: barH, paddingLeft: barH * 0.45, gap: dot * 0.6, backdropFilter: "blur(12px)" }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} className="rounded-full" style={{ width: dot, height: dot, background: c }} />
          ))}
          <div
            className="absolute left-1/2 top-1/2 flex items-center justify-center rounded-lg bg-white/10 text-slate-300"
            style={{ width: width * 0.4, height: barH * 0.6, fontSize: barH * 0.32, transform: "translate(-50%, -50%)" }}
          >
            🔒 {url}
          </div>
        </div>
        <div className="relative overflow-hidden" style={{ width, height: contentH }}>
          <div
            className="absolute inset-0"
            style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "50% 50%" }}
          >
            {children}
            {overlay}
          </div>
        </div>
      </div>
    </div>
  );
};
