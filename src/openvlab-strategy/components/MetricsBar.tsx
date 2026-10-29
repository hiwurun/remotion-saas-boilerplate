import React from "react";
import { SANS } from "../../shared/fonts";
import { METRICS } from "../layout";
import { C } from "../tokens";
import type { Model } from "../model/model";

type Item = { key: string; w: number; render: (p: number) => React.ReactNode; label: React.ReactNode };

const num = (v: number, p: number, digits: number) => (v * p).toFixed(digits);
const sgn = (v: number, p: number, digits: number) => `${v >= 0 ? "+" : "-"}${Math.abs(v * p).toFixed(digits)}`;

const NormalLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => <div style={{ fontSize: 12, color: C.mutedFg, whiteSpace: "nowrap" }}>{children}</div>;

const GreekLabel: React.FC<{ symbol: string; color: string; name: string }> = ({ symbol, color, name }) => (
  <div style={{ fontSize: 12, color: C.mutedFg, whiteSpace: "nowrap", display: "flex", gap: 4, justifyContent: "center" }}>
    <span style={{ color, fontWeight: 700 }}>{symbol}</span>
    <span>${name}</span>
  </div>
);

/** Replica of StrategyMetricsCarousel (expanded layout). `reveal(i)` is each item's entrance 0..1, `count` the count-up 0..1, `hot` the highlighted item key. */
export const MetricsBar: React.FC<{ model: Model; reveal: (i: number) => number; count: number; hot?: { key: string; p: number }; beSep?: string; staticKeys?: string[] }> = ({ model, reveal, count, hot, beSep = " / ", staticKeys = [] }) => {
  const m = model.metrics;
  const g = m.greeks;
  const items: Item[] = [
    { key: "net", w: 92, label: <NormalLabel>净支出</NormalLabel>, render: (p) => <span>{num(m.netDebit, p, 0)}</span> },
    { key: "maxProfit", w: 92, label: <NormalLabel>最大收益</NormalLabel>, render: () => <span style={{ color: C.red }}>无限大</span> },
    {
      key: "be",
      w: 164,
      label: <NormalLabel>盈亏平衡</NormalLabel>,
      render: (p) => (
        <span style={{ color: C.brand }}>
          {num(m.breakevens[0], p, 1)}
          {beSep}
          {num(m.breakevens[1], p, 1)}
        </span>
      ),
    },
    { key: "maxLoss", w: 92, label: <NormalLabel>最大亏损</NormalLabel>, render: (p) => <span style={{ color: C.green }}>{num(m.maxLoss, p, 0)}</span> },
    { key: "win", w: 76, label: <NormalLabel>胜率</NormalLabel>, render: (p) => <span>{num(m.winRate * 100, p, 0)}%</span> },
    { key: "delta", w: 100, label: <GreekLabel symbol="Δ" color={C.delta} name="DELTA" />, render: (p) => <span style={{ color: g.delta >= 0 ? C.red : C.green }}>{sgn(g.delta, p, 1)}</span> },
    { key: "vega", w: 100, label: <GreekLabel symbol="ν" color={C.vega} name="VEGA" />, render: (p) => <span style={{ color: g.vega >= 0 ? C.red : C.green }}>{sgn(g.vega, p, 1)}</span> },
    { key: "gamma", w: 100, label: <GreekLabel symbol="Γ" color={C.gamma} name="GAMMA" />, render: (p) => <span style={{ color: g.gamma >= 0 ? C.red : C.green }}>{sgn(g.gamma, p, 1)}</span> },
    { key: "theta", w: 100, label: <GreekLabel symbol="Θ" color={C.theta} name="THETA" />, render: (p) => <span style={{ color: g.theta >= 0 ? C.red : C.green }}>{sgn(g.theta, p, 1)}</span> },
  ];
  return (
    <div style={{ position: "absolute", left: METRICS.x, top: METRICS.y, width: METRICS.w, height: METRICS.h, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: SANS, color: C.fg }}>
      {items.map((it, i) => {
        const p = reveal(i);
        const hl = hot && hot.key === it.key ? hot.p : 0;
        return (
          <div
            key={it.key}
            style={{
              width: it.w,
              height: 42,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              opacity: p,
              transform: `translateY(${(1 - p) * 10}px)`,
              borderRadius: 8,
              background: hl > 0 ? `rgba(59,130,246,${0.12 * hl})` : "transparent",
              boxShadow: hl > 0 ? `0 0 0 1px rgba(56,97,251,${0.9 * hl}), 0 0 ${24 * hl}px rgba(56,97,251,${0.5 * hl})` : undefined,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {it.label}
            <div style={{ fontSize: i >= 5 ? 14 : 12, fontWeight: 600, whiteSpace: "nowrap" }}>{it.render(staticKeys.includes(it.key) ? 1 : count)}</div>
          </div>
        );
      })}
    </div>
  );
};
