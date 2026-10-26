import React from "react";
import { AbsoluteFill } from "remotion";
import { StrategyBuilderStatic } from "./components/StrategyBuilderStatic";

/** Still id: openvlab-strategy-curve — 曲线 mode, 1920×1080 */
export const CurveStill: React.FC = () => (
  <AbsoluteFill style={{ background: "#FFFFFF" }}>
    <StrategyBuilderStatic mode="curve" width={1920} height={1080} />
  </AbsoluteFill>
);
