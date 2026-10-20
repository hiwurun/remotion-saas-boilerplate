import React from "react";

/**
 * Vertical slot-machine reel. `position` is a continuous float index (0 = first item centred);
 * items wrap around. Rows are placed with sub-pixel translate3d (no layout `top`, no rounding).
 * `velocity` (items/frame) adds a subtle vertical motion blur while the reel is moving.
 */
export const SlotReel: React.FC<{
  items: string[];
  position: number;
  velocity?: number;
  lineHeight: number;
  visibleLines?: number;
  color?: string;
  fontSize: number;
  activeColor?: string;
  fontFamily: string;
}> = ({ items, position, velocity = 0, lineHeight, visibleLines = 3, color = "#8F8F8F", fontSize, activeColor, fontFamily }) => {
  const h = lineHeight * visibleLines;
  const n = items.length;
  const base = Math.floor(position);
  const frac = position - base;
  const blur = Math.min(1.2, Math.abs(velocity) * lineHeight * 0.05);
  const half = Math.ceil(visibleLines / 2) + 1;
  const rows: React.ReactNode[] = [];
  for (let k = -half; k <= half; k++) {
    const idx = (((base + k) % n) + n) % n;
    const y = (k - frac) * lineHeight + h / 2 - lineHeight / 2;
    // smooth highlight: brightness falls off continuously with distance from centre
    const dist = Math.min(1, Math.abs(k - frac));
    rows.push(
      <div
        key={base + k}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: lineHeight,
          lineHeight: `${lineHeight}px`,
          fontSize,
          fontFamily,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color,
          transform: `translate3d(0, ${y}px, 0)`,
          willChange: "transform",
        }}
      >
        <span style={{ position: "relative" }}>
          {items[idx]}
          {activeColor ? (
            <span style={{ position: "absolute", left: 0, top: 0, whiteSpace: "nowrap", color: activeColor, opacity: 1 - dist }}>{items[idx]}</span>
          ) : null}
        </span>
      </div>,
    );
  }
  return (
    <div
      style={{
        position: "relative",
        height: h,
        overflow: "hidden",
        WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, transparent 0%, black 32%, black 68%, transparent 100%)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>{rows}</div>
    </div>
  );
};
