import React from "react";
import { STRATEGY_TEMPLATES } from "../data";
import { C, SANS } from "../theme";

type Props = {
  open: number;
  selectedIdx: number;
};

/** Sidebar / floating menu of existing strategy templates. */
export const StrategyMenu: React.FC<Props> = ({ open, selectedIdx }) => {
  if (open <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        top: 120,
        width: 240,
        opacity: open,
        transform: `translateX(${(1 - open) * -24}px)`,
        background: C.uiBg,
        border: `1px solid ${C.uiBorder}`,
        borderRadius: 12,
        boxShadow: "0 16px 40px rgba(0,0,0,0.14)",
        padding: "10px 8px",
        zIndex: 30,
        fontFamily: SANS,
      }}
    >
      <div style={{ fontSize: 11, color: C.uiMuted, padding: "4px 8px 8px", letterSpacing: "0.04em" }}>
        已有策略模板
      </div>
      {STRATEGY_TEMPLATES.map((t, i) => {
        const on = i === selectedIdx;
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "10px 12px",
              borderRadius: 8,
              marginBottom: 2,
              background: on ? C.primary : "transparent",
              color: on ? C.primaryFg : C.ink,
              boxShadow: on ? `0 0 0 1px ${C.primary}` : undefined,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</div>
            <div style={{ fontSize: 11, opacity: on ? 0.75 : 0.55 }}>{t.desc}</div>
          </div>
        );
      })}
    </div>
  );
};
