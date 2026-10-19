import React from "react";
import { Img, staticFile } from "remotion";
import { isUrl } from "../theme";

const GLYPH = "M50 10 L90 88 L68 88 L50 52 L32 88 L10 88 Z";

/**
 * Built-in vector mark (or logoSrc image).
 * fill: 0 = wireframe outline, 1 = solid. tile: 0 = bare glyph, 1 = app-icon tile with inverted glyph.
 */
export const BrandMark: React.FC<{
  size: number;
  color?: string;
  fill?: number;
  tile?: number;
  logoSrc?: string;
  strokeWidth?: number;
}> = ({ size, color = "#000", fill = 1, tile = 0, logoSrc, strokeWidth = 2 }) => {
  if (logoSrc) {
    return <Img src={isUrl(logoSrc) ? logoSrc : staticFile(logoSrc)} style={{ width: size, height: size, objectFit: "contain", opacity: 0.25 + 0.75 * fill }} />;
  }
  const glyphScale = 1 - 0.42 * tile;
  const glyphColor = tile > 0.5 ? "#fff" : color;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", display: "block" }}>
      <rect
        x={50 - 50 * tile}
        y={50 - 50 * tile}
        width={100 * tile}
        height={100 * tile}
        rx={24 * tile}
        fill={color}
      />
      <g transform={`translate(50 50) scale(${glyphScale}) translate(-50 -50)`}>
        <path d={GLYPH} fill={glyphColor} fillOpacity={fill} stroke={glyphColor} strokeWidth={strokeWidth * (1 - fill * 0.999)} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <circle cx={50} cy={80} r={7} fill={glyphColor} fillOpacity={fill} stroke={glyphColor} strokeWidth={strokeWidth * (1 - fill * 0.999)} vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
};
