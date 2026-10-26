import React from "react";
import { C, MONO, SANS } from "../theme";
export type ViewMode = "table" | "curve";

type Props = {
  viewMode: ViewMode;
  rangePct: number;
  ivPct: number;
  ivMult: number;
  curvePress?: number;
  /** Highlight which slider is being dragged */
  dragTarget?: "range" | "iv" | null;
};

export const Toolbar: React.FC<Props> = ({
  viewMode,
  rangePct,
  ivPct,
  ivMult,
  curvePress = 0,
  dragTarget = null,
}) => {
  const rangeThumb = Math.min(100, (rangePct / 20) * 100);
  const ivThumb = ((ivMult - 0.1) / (2 - 0.1)) * 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "6px 8px 10px",
        background: C.uiBg,
        fontFamily: SANS,
        fontSize: 12,
        color: C.uiMuted,
        borderTop: `1px solid ${C.uiBorder}`,
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "0 4px" }}>
        <SliderBlock
          label="标的范围"
          value={`±${rangePct.toFixed(1)}%`}
          thumbPct={rangeThumb}
          active={dragTarget === "range"}
          valueColor={C.ink}
        />
        <SliderBlock
          label="隐波"
          value={`${ivPct.toFixed(2)}%`}
          thumbPct={Math.max(4, Math.min(100, ivThumb))}
          active={dragTarget === "iv"}
          valueColor={C.iv}
          marks
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) auto minmax(0, 4fr)",
          gap: 8,
          alignItems: "center",
          padding: "0 4px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          <ToggleBtn label="表格" icon="▦" active={viewMode === "table"} />
          <ToggleBtn
            label="曲线"
            icon="▥"
            active={viewMode === "curve"}
            press={curvePress}
          />
        </div>
        <div style={{ width: 1, height: 22, background: C.uiBorder }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4 }}>
          <ToggleBtn label="希腊字母" icon="⚖" active={false} pro />
          <ToggleBtn label="盈亏金额" icon="¥" active />
          <ToggleBtn label="盈亏百分比" icon="%" active={false} />
          <ToggleBtn label="合约价值" icon="▤" active={false} />
        </div>
      </div>
    </div>
  );
};

const SliderBlock: React.FC<{
  label: string;
  value: string;
  thumbPct: number;
  active?: boolean;
  valueColor?: string;
  marks?: boolean;
}> = ({ label, value, thumbPct, active, valueColor = C.ink, marks }) => (
  <div
    style={{
      padding: active ? "4px 8px" : "4px 0",
      borderRadius: 8,
      background: active ? "rgba(191,237,92,0.18)" : "transparent",
      boxShadow: active ? `0 0 0 1.5px ${C.primary}` : undefined,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
      <span>{label}</span>
      <span style={{ opacity: 0.45, fontSize: 10 }}>?</span>
      <span style={{ color: valueColor, fontWeight: 700, fontFamily: MONO }}>{value}</span>
    </div>
    <div style={{ position: "relative" }}>
      <SliderTrack thumbPct={thumbPct} />
      {marks ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 2,
            fontSize: 10,
            fontFamily: MONO,
            color: C.uiMuted,
          }}
        >
          <span>0.1x</span>
          <span>1x</span>
          <span>2x</span>
        </div>
      ) : null}
    </div>
  </div>
);

const SliderTrack: React.FC<{ thumbPct: number }> = ({ thumbPct }) => (
  <div style={{ position: "relative", width: "100%", height: 6, borderRadius: 999, background: "#E5E7EB" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: `${thumbPct}%`,
        borderRadius: 999,
        background: C.primary,
      }}
    />
    <div
      style={{
        position: "absolute",
        left: `${thumbPct}%`,
        top: "50%",
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: C.uiBg,
        border: `2px solid ${C.primary}`,
        transform: "translate(-50%, -50%)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
      }}
    />
  </div>
);

const ToggleBtn: React.FC<{
  label: string;
  icon: string;
  active: boolean;
  pro?: boolean;
  press?: number;
}> = ({ label, icon, active, pro, press = 0 }) => {
  let bg = C.uiBg;
  let color = C.ink;
  let border = `1px solid ${C.chipBorder}`;
  if (active) {
    bg = C.primary;
    color = C.primaryFg;
    border = "none";
  } else if (pro) {
    bg = C.proBg;
    color = C.proFg;
    border = `1px solid ${C.proBorder}`;
  }
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "6px 8px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color,
        border,
        whiteSpace: "nowrap",
        transform: `scale(${1 - press * 0.08})`,
      }}
    >
      <span style={{ fontSize: 12, opacity: 0.85 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};
