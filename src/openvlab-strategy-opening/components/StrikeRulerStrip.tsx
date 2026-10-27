import React from "react";
import { MONO, SANS } from "../../shared/fonts";
import type { ChartColors } from "../../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { SNAPSHOT, type StrategyModel } from "../../openvlab-logo-curve/strategy-chart/model";
import { MAX_OI, rulerStrikes } from "../data";

/**
 * Product StrikeSelector ruler strip (strike-selector.tsx + RulerTick + OpenInterestBar + OptionLabel), as remade
 * 1:1 in the earlier openvlab-strategy StrikeRuler. Adaptation: ticks sit on the chart's own x scale (same
 * 1400px container) instead of the ruler's percentage layout, so every strike lines up with the price axis below.
 */
export const RULER_HEIGHT = 124;
const BAND_TOP = 58;
const BAND_H = 40;

/** --vlab-red / --vlab-green: buy legs red, sell legs green (A-share convention). */
const LEG_RED = "#EA3943";
const LEG_GREEN = "#16C784";

const oiHeight = (oi: number) => `${(oi / MAX_OI) * 75}%`;

const OptionLabel: React.FC<{ x: number; strike: number; type: "C" | "P"; qty: number; opacity: number }> = ({
  x,
  strike,
  type,
  qty,
  opacity,
}) => {
  const fill = qty > 0 ? LEG_RED : LEG_GREEN;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: -30,
        zIndex: 5,
        display: "flex",
        minWidth: 70,
        transform: "translateX(-50%)",
        opacity,
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", display: "inline-flex" }}>
        <div
          style={{
            position: "absolute",
            left: -12,
            top: -8,
            zIndex: 10,
            borderRadius: 4,
            background: "rgba(107,114,128,0.9)",
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 600,
            padding: "2px 6px",
            lineHeight: 1.2,
          }}
        >
          x{Math.abs(qty)}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderRadius: 4,
            padding: 4,
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: "nowrap",
            color: "#FFFFFF",
            background: fill,
            marginBottom: 2,
          }}
        >
          <span>{strike}</span>
          <span style={{ marginLeft: 4 }}>{type}</span>
        </div>
      </div>
      <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `4px solid ${fill}` }} />
    </div>
  );
};

export const StrikeRulerStrip: React.FC<{ m: StrategyModel; colors: ChartColors; legOpacity: number }> = ({ m, colors, legOpacity }) => {
  const strikes = rulerStrikes(m);
  const latestX = m.priceX(SNAPSHOT.underlying);
  return (
    <div style={{ position: "relative", width: 1400, height: RULER_HEIGHT, fontFamily: SANS, color: colors.foreground }}>
      {/* 行权价 + info */}
      <div style={{ position: "absolute", left: 52, top: 6, display: "flex", alignItems: "center", gap: 4, color: colors.muted, fontSize: 14, lineHeight: 1.25 }}>
        <span>行权价</span>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: `1.5px solid ${colors.muted}`,
            fontSize: 9,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.85,
            boxSizing: "border-box",
          }}
        >
          i
        </span>
      </div>

      {/* Ruler band — product h-10 */}
      <div style={{ position: "absolute", left: 0, right: 0, top: BAND_TOP, height: BAND_H }}>
        {strikes.map((s) => (
          <div key={`tick-${s.strike}`} style={{ position: "absolute", left: s.x, top: 0, bottom: 0, width: 1, transform: "translateX(-50%)", zIndex: 2 }}>
            <div style={{ position: "absolute", top: 4, left: 0, width: 1, height: 6, background: colors.primary }} />
            <div style={{ position: "absolute", bottom: 4, left: 0, width: 1, height: 6, background: colors.primary }} />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 12,
                lineHeight: 1,
                fontFamily: MONO,
                color: colors.foreground,
                whiteSpace: "nowrap",
              }}
            >
              {s.strike}
            </div>
          </div>
        ))}

        {/* 最新价 marker */}
        <div style={{ position: "absolute", left: latestX, top: 0, bottom: 0, zIndex: 3 }}>
          <div style={{ position: "absolute", top: -14, left: 0, transform: "translateX(-50%)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: colors.foreground, lineHeight: 1 }}>
            最新价
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 0, borderLeft: "1px dashed rgba(59,130,246,0.7)" }} />
        </div>

        {/* OpenInterestBar layer */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {strikes.map((s) => (
            <div key={`oi-${s.strike}`} style={{ position: "absolute", left: s.x, top: 4, width: 5, height: "calc(100% - 8px)", transform: "translateX(-50%)" }}>
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  width: "100%",
                  height: oiHeight(s.put),
                  borderRadius: 2,
                  background: "linear-gradient(to top, rgba(34,197,94,0.3), rgb(34,197,94))",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  width: "100%",
                  height: oiHeight(s.call),
                  borderRadius: 2,
                  background: "linear-gradient(to bottom, rgb(239,68,68), rgba(239,68,68,0.3))",
                }}
              />
            </div>
          ))}
        </div>

        {legOpacity > 0
          ? m.legs.map((leg) => (
              <OptionLabel key={`${leg.strike}${leg.type}`} x={m.priceX(leg.strike)} strike={leg.strike} type={leg.type} qty={leg.qty} opacity={legOpacity} />
            ))
          : null}
      </div>
    </div>
  );
};
