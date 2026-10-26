import React from "react";
import { AbsoluteFill } from "remotion";
import { LEG } from "./data";
import { StrikeRuler } from "./components/StrikeRuler";
import { C } from "./theme";

/**
 * Still id: openvlab-strategy-candles
 * Only the strategy-builder top candle / strike ruler strip (行权价尺 + OI bars).
 * No header metrics, table, chart, or bottom toolbar.
 * 1920×1080 · light bg · strip vertically centered · 2× scale for readable OI candles.
 */
export const CandlesStill: React.FC = () => {
  /** Pre-scale product-like content width (CSS px). */
  const logicalW = 920;
  const scale = 2;
  /** Approximate pre-scale strip height incl. title + OI/label overhang. */
  const logicalH = 140;

  return (
    <AbsoluteFill style={{ background: C.uiBg }}>
      <div
        style={{
          width: 1920,
          height: 1080,
          background: C.uiBg,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: logicalW,
            height: logicalH,
            transform: `translate(-50%, calc(-50% + 24px)) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <StrikeRuler
            legVisible={1}
            strike={LEG.strike}
            legOpen={0}
            rulerWidth={logicalW - 20}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
