import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/** Shared, overshoot-free spring config for the whole Apple template. */
export const APPLE_SPRING = { mass: 1.3, damping: 30, stiffness: 75 } as const;
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useAppleSpring = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: APPLE_SPRING });
};

/** Text reveal: opacity 0→1, translateY 24→0, blur 14→0 together. */
export const revealStyle = (p: number): React.CSSProperties => ({
  opacity: interpolate(p, [0, 1], [0, 1], CLAMP),
  transform: `translateY(${interpolate(p, [0, 1], [24, 0], CLAMP)}px)`,
  filter: `blur(${interpolate(p, [0, 1], [14, 0], CLAMP)}px)`,
});

export const Reveal: React.FC<{ delay?: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  delay = 0,
  className,
  style,
  children,
}) => {
  const p = useAppleSpring(delay);
  return (
    <div className={className} style={{ ...style, ...revealStyle(p) }}>
      {children}
    </div>
  );
};

export const TITLE_CLASS =
  "font-bold tracking-tight bg-gradient-to-b from-white via-white/95 to-white/45 bg-clip-text text-transparent";

/** 1px top-center highlight line for every glass container. */
export const TopHighlight: React.FC = () => (
  <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
);

export const GLASS_CLASS = "relative overflow-hidden bg-[#0B0B0E] border border-white/[0.08]";

/** Dark skeleton shown when an asset is missing. */
export const SkeletonPlaceholder: React.FC<{ label?: string }> = ({ label = "素材缺失" }) => (
  <div className="absolute inset-0 flex flex-col gap-[4%] bg-[#0B0B0E] p-[5%]">
    <div className="h-[8%] w-[40%] rounded-lg bg-white/[0.05]" />
    <div className="flex h-[22%] gap-[3%]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex-1 rounded-xl bg-white/[0.04]" />
      ))}
    </div>
    <div className="flex-1 rounded-xl bg-white/[0.03]" />
    <div className="absolute inset-0 flex items-center justify-center text-white/25 text-[22px] tracking-widest">{label}</div>
  </div>
);
