import React from "react";
import { EASE_OUT } from "../../shared/motion";
import { C, SANS, SERIF } from "../theme";
import { fadeWin, prog } from "../timeline";

type Props = { frame: number; from: number; to: number };

export const EndCard: React.FC<Props> = ({ frame, from, to }) => {
  const opacity = fadeWin(frame, from, to, 0.45);
  const rise = prog(frame, from, from + 0.7, EASE_OUT);
  const cta = prog(frame, from + 0.5, from + 1.2, EASE_OUT);
  if (opacity <= 0.01) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 28,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(ellipse at 50% 40%, rgba(120,160,220,0.12), ${C.stage} 65%)`,
        opacity,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          fontFamily: SERIF,
          fontSize: 72,
          fontWeight: 600,
          color: C.white,
          letterSpacing: "0.04em",
          transform: `translateY(${(1 - rise) * 28}px)`,
          opacity: rise,
          marginBottom: 28,
        }}
      >
        OpenVLab
      </div>
      <div
        style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 40,
          opacity: rise,
          transform: `translateY(${(1 - rise) * 16}px)`,
        }}
      >
        策略构建 · 结构看清再回测
      </div>
      <div
        style={{
          background: C.lime,
          color: C.ink,
          fontSize: 20,
          fontWeight: 700,
          padding: "16px 36px",
          borderRadius: 999,
          boxShadow: `0 12px 40px ${C.limeDim}, 0 0 0 1px rgba(0,0,0,0.08)`,
          transform: `translateY(${(1 - cta) * 36}px)`,
          opacity: cta,
          letterSpacing: "0.04em",
        }}
      >
        打开策略构建
      </div>
    </div>
  );
};
