import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const FloatingCallout: React.FC<{
  text: string;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ text, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isPortrait = height > width;
  const local = frame - delay;

  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 180, mass: 0.7 } });
  const scale = interpolate(pop, [0, 1], [0.6, 1], CLAMP);
  const opacity = interpolate(pop, [0, 0.4], [0, 1], CLAMP);
  const float = Math.sin(Math.max(0, local) / fps * 2) * 6;

  const pulse = (Math.sin((Math.max(0, local) / fps) * Math.PI * 2) + 1) / 2;
  const ringScale = interpolate(pulse, [0, 1], [1, 2.4], CLAMP);
  const ringOpacity = interpolate(pulse, [0, 1], [0.6, 0], CLAMP);

  const fontSize = isPortrait ? 38 : 30;
  return (
    <div
      className="flex items-center rounded-2xl border border-white/20 bg-white/10 text-white font-semibold shadow-2xl"
      style={{
        gap: fontSize * 0.6,
        padding: `${fontSize * 0.6}px ${fontSize}px`,
        fontSize,
        backdropFilter: "blur(16px)",
        opacity,
        transform: `translateY(${float}px) scale(${scale})`,
        ...style,
      }}
    >
      <div className="relative" style={{ width: fontSize * 0.5, height: fontSize * 0.5 }}>
        <div
          className="absolute inset-0 rounded-full bg-green-400"
          style={{ transform: `scale(${ringScale})`, opacity: ringOpacity }}
        />
        <div className="absolute inset-0 rounded-full bg-green-400" />
      </div>
      <span>{text}</span>
    </div>
  );
};
