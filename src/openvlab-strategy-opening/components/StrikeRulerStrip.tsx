import React from "react";
import { MONO, SANS } from "../../shared/fonts";
import { CHART_COLORS } from "../../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { SNAPSHOT } from "../../openvlab-logo-curve/strategy-chart/model";
import { MAX_OI, RULER_STRIKES, strikeX } from "../data";

/**
 * Product StrikeSelector ruler strip (strike-selector.tsx + RulerTick + OpenInterestBar + OptionLabel), as remade
 * 1:1 in the earlier openvlab-strategy StrikeRuler. Adaptation: ticks sit on the chart's own x scale (same
 * 1400px container) instead of the ruler's percentage layout, so every strike lines up with the price axis below.
 */
export const RULER_HEIGHT = 124;
const BAND_TOP = 58;
const BAND_H = 40;

const UI = {
  ink: CHART_COLORS.foreground,
  muted: CHART_COLORS.muted,
  primary: CHART_COLORS.primary,
  legRed: "#ea3943", // --vlab-red
};

const oiHeight = (oi: number) => `${(oi / MAX_OI) * 75}%`;

export const StrikeRulerStrip: React.FC<{ legOpacity: number }> = ({ legOpacity }) => {
  const latestX = strikeX(SNAPSHOT.underlying);
  const legX = strikeX(SNAPSHOT.strike);
  return (
    <div style={{ position: "relative", width: 1400, height: RULER_HEIGHT, fontFamily: SANS, color: UI.ink }}>
      {/* 行权价 + info */}
      <div style={{ position: "absolute", left: 52, top: 6, display: "flex", alignItems: "center", gap: 4, color: UI.muted, fontSize: 14, lineHeight: 1.25 }}>
        <span>行权价</span>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: `1.5px solid ${UI.muted}`,
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
        {RULER_STRIKES.map((s) => (
          <div key={`tick-${s.strike}`} style={{ position: "absolute", left: s.x, top: 0, bottom: 0, width: 1, transform: "translateX(-50%)", zIndex: 2 }}>
            <div style={{ position: "absolute", top: 4, left: 0, width: 1, height: 6, background: UI.primary }} />
            <div style={{ position: "absolute", bottom: 4, left: 0, width: 1, height: 6, background: UI.primary }} />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: 12,
                lineHeight: 1,
                fontFamily: MONO,
                color: UI.ink,
                whiteSpace: "nowrap",
              }}
            >
              {s.strike}
            </div>
          </div>
        ))}

        {/* 最新价 marker */}
        <div style={{ position: "absolute", left: latestX, top: 0, bottom: 0, zIndex: 3 }}>
          <div style={{ position: "absolute", top: -14, left: 0, transform: "translateX(-50%)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: UI.ink, lineHeight: 1 }}>
            最新价
          </div>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 0, borderLeft: "1px dashed rgba(59,130,246,0.7)" }} />
        </div>

        {/* OpenInterestBar layer */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          {RULER_STRIKES.map((s) => (
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

        {/* OptionLabel — long 6600 C ×1, caret centred on the strike */}
        {legOpacity > 0 ? (
          <div
            style={{
              position: "absolute",
              left: legX,
              top: -30,
              zIndex: 5,
              display: "flex",
              minWidth: 70,
              transform: "translateX(-50%)",
              opacity: legOpacity,
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
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                }}
              >
                x1
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
                  background: UI.legRed,
                  marginBottom: 2,
                }}
              >
                <span>{SNAPSHOT.strike}</span>
                <span style={{ marginLeft: 4 }}>C</span>
              </div>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid rgb(239,68,68)" }} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
