import React from "react";
import { TOOLBAR } from "../data";
import { C } from "../theme";
import { HeatmapTable } from "./HeatmapTable";
import { PnLChart } from "./PnLChart";

export type StrategyMode = "table" | "curve";

type Props = {
  mode: StrategyMode;
  /** Full-frame still size (default 1920×1080). */
  width?: number;
  height?: number;
};

/**
 * Clean still frame — HeatmapTable or PnLChart alone, light padding.
 * No header, strike ruler / candles, metrics bar, bottom sliders, or toolbar tabs.
 */
export const StrategyBuilderStatic: React.FC<Props> = ({
  mode,
  width = 1920,
  height = 1080,
}) => {
  const pad = 24;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  return (
    <div
      style={{
        width,
        height,
        background: C.uiBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: pad,
      }}
    >
      {mode === "table" ? (
        <HeatmapTable
          width={innerW}
          height={innerH}
          ivMorph={1}
          rangePct={TOOLBAR.rangePct}
        />
      ) : (
        <PnLChart
          width={innerW}
          height={innerH}
          ivMorph={1}
          rangePct={TOOLBAR.rangePct}
        />
      )}
    </div>
  );
};
