import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, GLASS_CLASS, TopHighlight, useAppleSpring, revealStyle } from "../motion";
import type { Loupe } from "../schema";

export type CameraMode = "macro-angle" | "center-float";

/** 3D camera stage: perspective(1600px) entry + continuous 1→1.04 drift. */
export const AppleStage3D: React.FC<{
  width: number;
  height: number;
  cameraMode?: CameraMode;
  durationInFrames: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ width, height, cameraMode = "center-float", durationInFrames, children, overlay }) => {
  const frame = useCurrentFrame();
  const p = useAppleSpring(0);
  const drift = interpolate(frame, [0, durationInFrames], [1, 1.04], CLAMP);

  const macro = cameraMode === "macro-angle";
  const rx = interpolate(p, [0, 1], macro ? [28, 4] : [14, 0], CLAMP);
  const ry = interpolate(p, [0, 1], macro ? [-26, -3] : [0, 0], CLAMP);
  const ty = interpolate(p, [0, 1], macro ? [60, 0] : [180, 0], CLAMP);
  const sc = interpolate(p, [0, 1], macro ? [1.25, 1] : [0.86, 1], CLAMP);
  const op = interpolate(p, [0, 0.35], [0, 1], CLAMP);

  return (
    <div className="relative" style={{ width, height, opacity: op, transform: `perspective(1600px) translateY(${ty}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${sc * drift})` }}>
      <div
        className={`${GLASS_CLASS} rounded-[28px] w-full h-full`}
        style={{ boxShadow: "0 80px 160px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.02)" }}
      >
        <div className="absolute inset-[10px] overflow-hidden rounded-[20px] bg-black/40">{children}</div>
        <TopHighlight />
      </div>
      {overlay}
    </div>
  );
};

/** Circular magnifier showing the same image scaled by `zoom`, centered on normalized (x, y). */
export const OpticalLoupe: React.FC<{
  loupe: Loupe;
  src: string;
  available: boolean;
  /** size of the displayed image area the loupe sits on (px) */
  imageWidth: number;
  imageHeight: number;
  /** offset of the image area inside the overlay parent (px) */
  offsetX?: number;
  offsetY?: number;
  diameter: number;
  accentColor: string;
  delay?: number;
}> = ({ loupe, src, available, imageWidth, imageHeight, offsetX = 0, offsetY = 0, diameter, accentColor, delay = 40 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = useAppleSpring(delay);
  const labelP = useAppleSpring(delay + 14);
  const glow = interpolate(Math.sin(((frame - delay) / fps) * 2), [-1, 1], [0.5, 1], CLAMP);

  const cx = offsetX + loupe.x * imageWidth;
  const cy = offsetY + loupe.y * imageHeight;
  const zw = imageWidth * loupe.zoom;
  const zh = imageHeight * loupe.zoom;
  const r = diameter / 2;

  return (
    <div
      className="absolute"
      style={{
        left: cx - r,
        top: cy - r,
        width: diameter,
        height: diameter,
        opacity: interpolate(p, [0, 0.4], [0, 1], CLAMP),
        transform: `scale(${interpolate(p, [0, 1], [0.6, 1], CLAMP)})`,
      }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-full bg-[#0B0B0E]"
        style={{
          border: "2px solid rgba(255,255,255,0.55)",
          boxShadow: `0 0 0 6px rgba(255,255,255,0.06), 0 0 ${50 * glow}px ${accentColor}, 0 40px 80px rgba(0,0,0,0.8), inset 0 0 30px rgba(255,255,255,0.15)`,
        }}
      >
        {available ? (
          <Img
            src={staticFile(src)}
            style={{ position: "absolute", width: zw, height: zh, maxWidth: "none", left: r - loupe.x * zw, top: r - loupe.y * zh, objectFit: "fill" }}
          />
        ) : null}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),transparent_45%)]" />
      </div>
      <div
        className="absolute left-1/2 whitespace-nowrap rounded-full border border-white/[0.12] bg-white/[0.06] px-5 py-2 text-white/90 font-medium backdrop-blur-2xl"
        style={{ top: diameter + 18, fontSize: Math.max(18, diameter * 0.075), ...revealStyle(labelP), transform: `translateX(-50%) ${revealStyle(labelP).transform}` }}
      >
        {loupe.label}
      </div>
    </div>
  );
};
