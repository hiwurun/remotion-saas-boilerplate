import React from "react";
import { MAIN_MONTH, PRODUCT } from "../data";
import { C, MONO, SANS } from "../theme";
import type { DemoState } from "../timeline";
import { HeatmapTable } from "./HeatmapTable";
import { MetricsBar } from "./MetricsBar";
import { PnLChart } from "./PnLChart";
import { StrategyMenu } from "./StrategyMenu";
import { StrikeRuler } from "./StrikeRuler";
import { Toolbar } from "./Toolbar";

type Props = {
  state: DemoState;
  /** Which slider is mid-drag for highlight */
  dragTarget?: "range" | "iv" | null;
  contentW?: number;
  contentH?: number;
};

/**
 * Drawn Strategy Builder UI (沪金 AU) — simplified header per Patricia brief.
 * No product screenshots; tokens/layout match AU table screenshot.
 */
export const StrategyBuilderUI: React.FC<Props> = ({
  state,
  dragTarget = null,
  contentW = 1700,
  contentH = 934,
}) => {
  const changeColor = PRODUCT.changePct < 0 ? C.ashareGreen : C.ashareRed;
  const priceWhole = Math.floor(PRODUCT.price);
  const priceFrac = (PRODUCT.price - priceWhole).toFixed(2).slice(1);
  const chartH = contentH - 36 - 78 - 72 - 64 - 110;
  const chartW = contentW - 28;

  return (
    <div
      style={{
        width: contentW,
        height: contentH,
        background: C.uiBg,
        color: C.ink,
        fontFamily: SANS,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* ── Simplified header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 16px 8px",
          borderBottom: `1px solid ${C.uiBorder}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", fontFamily: MONO }}>
                <span style={{ color: C.ashareRed }}>{priceWhole}</span>
                <span style={{ color: C.ashareRed, fontSize: 22 }}>{priceFrac}</span>
              </span>
              <span style={{ color: changeColor, fontSize: 12, marginLeft: 2 }}>▼</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: changeColor, fontFamily: MONO }}>
              {PRODUCT.changePct.toFixed(2)}%
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>
                {PRODUCT.name} {PRODUCT.code}
              </span>
              <span style={{ color: "#F59E0B", fontSize: 14 }}>★</span>
            </div>
            {/* ONLY current main month chip */}
            <div style={{ display: "flex", gap: 6 }}>
              <div
                style={{
                  position: "relative",
                  minWidth: 56,
                  padding: "4px 12px 5px",
                  borderRadius: 8,
                  background: C.primary,
                  color: C.primaryFg,
                  textAlign: "center",
                  lineHeight: 1.15,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: MONO }}>{MAIN_MONTH.code}</div>
                <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.85 }}>{MAIN_MONTH.days}天</div>
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 4,
                    fontSize: 8,
                    fontWeight: 700,
                    opacity: 0.75,
                  }}
                >
                  主
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <ActionBtn
            variant="ghost"
            icon="+"
            label="添加合约"
            press={state.addPress}
          />
          {state.showBacktest > 0.05 ? (
            <ActionBtn
              variant="pro"
              icon="↺"
              label="回测模拟"
              press={state.backtestPress}
              opacity={state.showBacktest}
            />
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 14px 0", flex: 1, minHeight: 0 }}>
        <StrikeRuler legVisible={state.legVisible} strike={state.strike} legOpen={state.legOpen} />
        <MetricsBar pulse={state.metricsPulse} />

        <div style={{ position: "relative", flex: 1, minHeight: 280, borderRadius: 6, overflow: "hidden" }}>
          {state.viewMode === "table" ? (
            <HeatmapTable
              width={chartW}
              height={Math.max(280, chartH)}
              ivMorph={state.ivMult}
              rangePct={state.rangePct}
            />
          ) : (
            <PnLChart
              width={chartW}
              height={Math.max(280, chartH)}
              ivMorph={state.ivMult}
              rangePct={state.rangePct}
            />
          )}
        </div>

        <Toolbar
          viewMode={state.viewMode}
          rangePct={state.rangePct}
          ivPct={state.ivPct}
          ivMult={state.ivMult}
          curvePress={state.curvePress}
          dragTarget={dragTarget}
        />
      </div>

      <StrategyMenu open={state.menuOpen} selectedIdx={state.templateIdx} />
    </div>
  );
};

const ActionBtn: React.FC<{
  label: string;
  icon: string;
  variant: "ghost" | "pro";
  press?: number;
  opacity?: number;
}> = ({ label, icon, variant, press = 0, opacity = 1 }) => {
  const style: React.CSSProperties =
    variant === "pro"
      ? { background: C.proBg, color: C.proFg, border: `1px solid ${C.proBorder}` }
      : { background: C.uiBg, color: C.ink, border: `1px solid ${C.chipBorder}` };
  return (
    <div
      style={{
        ...style,
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "7px 14px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        fontFamily: SANS,
        opacity,
        transform: `scale(${1 - press * 0.1})`,
        boxShadow: press > 0.4 ? `0 0 0 2px ${C.primary}` : undefined,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{icon}</span>
      {label}
    </div>
  );
};
