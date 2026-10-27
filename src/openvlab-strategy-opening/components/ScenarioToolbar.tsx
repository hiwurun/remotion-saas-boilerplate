import React from "react";
import { MONO, SANS } from "../../shared/fonts";
import { CHART_COLORS } from "../../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { BASE_IV, SNAPSHOT, lineLabel } from "../../openvlab-logo-curve/strategy-chart/model";

/**
 * Bottom scenario sliders. The 隐波 block follows the earlier 1:1 Toolbar SliderBlock remake (label, ?, value,
 * 6px track, 16px thumb, 0.1x / 1x / 2x marks). The 日期 block reuses the same slider anatomy; its label and
 * marks are reconstructed (no date-slider source was available). Range / PnL% / Greeks are deliberately absent.
 */
export const TOOLBAR_HEIGHT = 72;

const UI = {
  ink: CHART_COLORS.foreground,
  muted: CHART_COLORS.muted,
  primary: CHART_COLORS.primary,
  track: "#E5E7EB",
  iv: "#b071e8",
};

const SliderTrack: React.FC<{ thumbPct: number; active: number }> = ({ thumbPct, active }) => (
  <div style={{ position: "relative", width: "100%", height: 6, borderRadius: 999, background: UI.track }}>
    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${thumbPct}%`, borderRadius: 999, background: UI.primary }} />
    <div
      style={{
        position: "absolute",
        left: `${thumbPct}%`,
        top: "50%",
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "#FFFFFF",
        border: `2px solid ${UI.primary}`,
        transform: "translate(-50%, -50%)",
        boxSizing: "border-box",
        // shadcn Slider thumb: hover/focus ring-4 ring-ring/50 while dragged
        boxShadow: `0 1px 4px rgba(0,0,0,0.18), 0 0 0 ${4 * active}px rgba(175,243,62,0.5)`,
      }}
    />
  </div>
);

const SliderBlock: React.FC<{
  label: string;
  value: string;
  valueColor: string;
  thumbPct: number;
  active: number;
  marks: string[];
  opacity: number;
  dy: number;
}> = ({ label, value, valueColor, thumbPct, active, marks, opacity, dy }) => (
  <div style={{ padding: "4px 0", opacity, transform: `translateY(${dy}px)` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
      <span>{label}</span>
      <span style={{ opacity: 0.45, fontSize: 10 }}>?</span>
      <span style={{ color: valueColor, fontWeight: 700, fontFamily: MONO }}>{value}</span>
    </div>
    <SliderTrack thumbPct={thumbPct} active={active} />
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, fontFamily: MONO, color: UI.muted }}>
      {marks.map((m) => (
        <span key={m}>{m}</span>
      ))}
    </div>
  </div>
);

export const ScenarioToolbar: React.FC<{
  dateDte: number;
  dateOpacity: number;
  dateDy: number;
  dateActive: number;
  ivMult: number;
  ivOpacity: number;
  ivDy: number;
  ivActive: number;
}> = (p) => {
  const dateThumb = ((SNAPSHOT.seriesDte - p.dateDte) / SNAPSHOT.seriesDte) * 100;
  const ivThumb = Math.max(4, Math.min(100, ((p.ivMult - 0.1) / (2 - 0.1)) * 100));
  return (
    <div style={{ width: 1400, height: TOOLBAR_HEIGHT, fontFamily: SANS, fontSize: 12, color: UI.muted, boxSizing: "border-box", padding: "6px 24px 0 52px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        {p.dateOpacity > 0 ? (
          <SliderBlock
            label="日期"
            value={lineLabel(Math.round(p.dateDte * 10) / 10)}
            valueColor={UI.ink}
            thumbPct={dateThumb}
            active={p.dateActive}
            marks={["10/27", "11/20 到期"]}
            opacity={p.dateOpacity}
            dy={p.dateDy}
          />
        ) : (
          <div />
        )}
        {p.ivOpacity > 0 ? (
          <SliderBlock
            label="隐波"
            value={`${(BASE_IV * p.ivMult * 100).toFixed(2)}%`}
            valueColor={UI.iv}
            thumbPct={ivThumb}
            active={p.ivActive}
            marks={["0.1x", "1x", "2x"]}
            opacity={p.ivOpacity}
            dy={p.ivDy}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
};
