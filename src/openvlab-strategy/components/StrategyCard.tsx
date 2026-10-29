import React from "react";
import { SANS } from "../../shared/fonts";
import { C } from "../tokens";
import { StraddleMiniChart } from "./StraddleMiniChart";

/** Strategy copy, verbatim from vlab-frontend StrategyCatalog (买入跨式期权 / Long Straddle). */
export const STRADDLE = {
  name: "买入跨式期权",
  en: "Long Straddle",
  tag: "趋势",
  construction: "同时买入相同行权价、相同到期日的看涨和看跌期权。",
  scenario: "预期标的将大幅波动，但方向不确定。",
  risk: "双向获利机会。成本高，需要足够大的价格变动才能盈利，时间衰减不利。",
};

export const CARD_W = 420;
const LINE_H = 19.5;
/** Detail block height when expanded (construct 1 line + scenario 1 + risk 2). */
const DETAIL_H = LINE_H * 4;

const DirectionIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.magenta} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 17L17 7M9 7h8v8" />
    <path d="M3 13l4 4M3 17v-4h4" opacity="0" />
  </svg>
);

/** Native-size (CSS px) replica of strategy-menu-item.tsx in its active state. `expand` 0..1, `draw` 0..1 for the mini chart, `press` highlights the button. */
export const StrategyCard: React.FC<{ expand: number; draw: number; press?: number; chrome?: number }> = ({ expand, draw, press = 0, chrome = 1 }) => (
  <div
    style={{
      width: CARD_W,
      boxSizing: "border-box",
      borderRadius: 8,
      border: `1px solid rgba(175,243,62,${chrome})`,
      background: `rgba(13,13,13,${chrome})`,
      padding: "10px 12px",
      boxShadow: `0 1px 2px rgba(0,0,0,${0.5 * chrome})`,
      fontFamily: SANS,
      color: C.fg,
    }}
  >
    <div style={{ display: "flex", gap: 8 }}>
      <div style={{ display: "flex", minWidth: 0, flex: 1, flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", width: 96, flexDirection: "column" }}>
          <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, lineHeight: 1.25, whiteSpace: "nowrap" }}>{STRADDLE.name}</span>
          <span style={{ fontSize: 12, color: C.mutedFg, lineHeight: 1.25 }}>{STRADDLE.en}</span>
        </div>
        <div style={{ display: "flex", opacity: chrome }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 2, borderRadius: 4, border: `1px solid ${C.border}`, padding: "2px 6px", fontSize: 11, fontWeight: 500 }}>
            <DirectionIcon />
            {STRADDLE.tag}
          </span>
        </div>
      </div>
      <div style={{ width: 160, height: 72, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: chrome }}>
        <StraddleMiniChart draw={draw} width={160} height={58} />
      </div>
    </div>
    <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 8, opacity: chrome }}>
      <div style={{ position: "relative", flex: 1, height: LINE_H + (DETAIL_H - LINE_H) * expand, overflow: "hidden", fontSize: 12, lineHeight: 1.625, color: C.mutedFg }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: 1 - expand * 1.6 < 0 ? 0 : 1 - expand * 1.6, whiteSpace: "nowrap" }}>{STRADDLE.scenario}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: Math.max(0, expand * 1.4 - 0.4) }}>
          <div>构建：{STRADDLE.construction}</div>
          <div>场景：{STRADDLE.scenario}</div>
          <div>风险：{STRADDLE.risk}</div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          fontSize: 12,
          lineHeight: 1.625,
          color: press > 0 ? C.fg : C.mutedFg,
          flexShrink: 0,
          borderRadius: 4,
          padding: "0 3px",
          background: press > 0 ? `rgba(175,243,62,${0.18 * press})` : "transparent",
          transform: `scale(${1 - press * 0.06})`,
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>{expand > 0.5 ? "收起" : "展开"}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${expand * 180}deg)` }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  </div>
);
