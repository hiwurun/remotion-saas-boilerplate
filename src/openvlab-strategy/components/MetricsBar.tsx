import React from "react";
import { METRICS } from "../data";
import { C, MONO, SANS } from "../theme";

const fmtYen = (n: number) => `¥ ${n.toLocaleString("zh-CN")}`;
const fmtSigned = (n: number, digits = 1) =>
  `${n > 0 ? "+" : ""}${n.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;

type Item = { key: string; label: React.ReactNode; value: string; color?: string };

const ITEMS: Item[] = [
  { key: "net", label: "净支出", value: fmtYen(METRICS.netOutlay) },
  { key: "maxP", label: "最大收益", value: String(METRICS.maxProfit), color: C.ashareRed },
  { key: "be", label: "盈亏平衡", value: String(METRICS.breakeven) },
  { key: "maxL", label: "最大亏损", value: fmtYen(METRICS.maxLoss), color: C.ashareGreen },
  { key: "win", label: "胜率%", value: `${METRICS.winRate}%` },
  {
    key: "delta",
    label: (
      <>
        <span style={{ color: C.ashareRed, fontWeight: 700 }}>Δ</span>
        <span> DELTA</span>
      </>
    ),
    value: fmtSigned(METRICS.delta),
    color: C.ashareRed,
  },
  {
    key: "vega",
    label: (
      <>
        <span style={{ color: C.ashareGreen, fontWeight: 700 }}>ν</span>
        <span> VEGA</span>
      </>
    ),
    value: fmtSigned(METRICS.vega),
    color: C.ashareRed,
  },
  {
    key: "gamma",
    label: (
      <>
        <span style={{ color: "#F59E0B", fontWeight: 700 }}>Γ</span>
        <span> GAMMA</span>
      </>
    ),
    value: fmtSigned(METRICS.gamma),
    color: C.ashareRed,
  },
  {
    key: "theta",
    label: (
      <>
        <span style={{ color: "#3861FB", fontWeight: 700 }}>θ</span>
        <span> THETA</span>
      </>
    ),
    value: fmtSigned(METRICS.theta),
    color: C.ashareGreen,
  },
];

type Props = { pulse?: number };

export const MetricsBar: React.FC<Props> = ({ pulse = 0 }) => (
  <div
    style={{
      display: "flex",
      alignItems: "stretch",
      justifyContent: "space-around",
      gap: 2,
      padding: "4px 2px",
      background: C.uiBg,
      fontFamily: SANS,
      overflow: "hidden",
      boxShadow: pulse > 0.2 ? `inset 0 0 0 1px rgba(191,237,92,${0.35 * pulse})` : undefined,
      borderRadius: 6,
    }}
  >
    {ITEMS.map((it) => (
      <div
        key={it.key}
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3px 1px",
        }}
      >
        <div style={{ fontSize: 10, color: C.uiMuted, display: "flex", alignItems: "center", gap: 2, whiteSpace: "nowrap" }}>
          {it.label}
        </div>
        <div
          style={{
            marginTop: 2,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: MONO,
            color: it.color ?? C.ink,
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {it.value}
        </div>
      </div>
    ))}
  </div>
);
