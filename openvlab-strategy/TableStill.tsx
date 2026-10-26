import React from "react";
import { AbsoluteFill } from "remotion";
import { StrategyBuilderStatic } from "./components/StrategyBuilderStatic";

/** Still id: openvlab-strategy-table — 表格 mode, 1920×1080 */
export const TableStill: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF" }}>
    <StrategyBuilderStatic mode="table" width={1920} height={1080} />
  </AbsoluteFill>
);
