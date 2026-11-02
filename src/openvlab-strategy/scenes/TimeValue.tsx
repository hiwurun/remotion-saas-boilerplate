import React from "react";
import { worldToScreen } from "../../shared/components/Camera";
import { MONO } from "../../shared/fonts";
import { CHAIN, MODEL } from "../data";
import { CONTENT, PLOT } from "../layout";
import { C, THIN } from "../tokens";
import { DTE0 } from "../model/model";
import { easeIO, lerp, ramp } from "../timeline";
import { B, mo } from "../beats";
import { dteAt } from "../curve";
import { X_DOMAIN_END, contentToWorld, makeScales } from "../components/StrategyChart";

/**
 * v8: the time-value gap rides the single sweep.
 * Before the slider moves, a bracket at 6550 (today's curve vs the expiry payoff) and a ledger
 * name that distance: 现在值 = 内在价值 + 时间价值. The sweep then presses the curve to the V
 * and a sky number counts the same gap down to zero. There is no second walk.
 * The answer card (last-day TV vs a 2% shock) still comes later in the seller view.
 * Model: at 1 DTE, last-day collect 4,542 < drop-2% loss 8,960 -> 不够赔.
 */

const S = 6550;
const P_DROP = S * 0.98; // 6419 (-2 %)
const INTRINSIC = Math.abs(S - CHAIN.strike) * CHAIN.multiplier; // 50 pt × 100
const W = 1920;

const fmt = (v: number) => Math.abs(Math.round(v)).toLocaleString("en-US");

const SELL_1D = -MODEL.profit(S, 1);
const SELL_0 = -MODEL.profit(S, 0);
const SELL_DROP = -MODEL.profit(P_DROP, 1);
/** seller collects this from 1 day left to expiry */
export const LAST_DAY = SELL_0 - SELL_1D;
/** what that same seller pays if the underlying drops 2% with 1 day left */
export const DROP_2PCT = SELL_1D - SELL_DROP;

const tvNow = MODEL.value(S, DTE0) - INTRINSIC;
export const TV_NOW = Math.round(tvNow);
export const INTRINSIC_Y = Math.round(INTRINSIC);
export const VALUE_NOW = INTRINSIC_Y + TV_NOW;

const SC = makeScales(X_DOMAIN_END[0], X_DOMAIN_END[1]);
const ONE = { x: 960, y: 540, scale: 1 };
const screen = (nx: number, ny: number) => worldToScreen(contentToWorld({ x: nx, y: ny }), ONE, W, 1080);
const FROM_LAST = screen(SC.x(S) + 16, (SC.y(SELL_0) + SC.y(SELL_1D)) / 2);
const FROM_DROP = screen(SC.x(P_DROP) - 16, (SC.y(SELL_1D) + SC.y(SELL_DROP)) / 2);

/** 0..1 while the ledger (and the Θ cell) should read as the subject */
export const thetaHotP = (f: number) => mo(f, B.formula) * (1 - mo(f, B.formulaOut));

const liveTv = (dte: number) => Math.round(MODEL.value(S, dte) - INTRINSIC);

/* ---------------------------------------------------------------- answer card (screen space, above the dimmed chart) */
export const TimeOverlay: React.FC<{ f: number }> = ({ f }) => {
  const p = mo(f, B.ans);
  const lineIn = mo(f, B.ansLine);
  const out = mo(f, B.ansOut);
  const lineP = lineIn * (1 - out);
  const op = ramp(p, 0, 0.22) * (1 - out);
  const card = op > 0.001 || lineP > 0.001;
  const pair = [
    { from: FROM_LAST, x: 660, label: "最后一天收", v: LAST_DAY, color: C.red },
    { from: FROM_DROP, x: 1260, label: "跌 2% 要赔", v: DROP_2PCT, color: C.green },
  ] as const;
  return (
    <>
      {card && pair.map((b) => {
        const x = lerp(b.from.x, b.x, p);
        const y = lerp(b.from.y, 458, p);
        const size = lerp(34, 108, p);
        return (
          <div key={b.label} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${-out * 28}px)`, textAlign: "center", opacity: op, whiteSpace: "nowrap" }}>
            <div style={{ fontFamily: THIN, fontSize: lerp(16, 32, p), color: "rgba(230,232,236,0.86)", letterSpacing: "0.14em", opacity: ramp(p, 0.35, 1), marginBottom: 8 }}>{b.label}</div>
            <div style={{ fontFamily: MONO, fontSize: size, fontWeight: 600, color: b.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(b.v)}</div>
          </div>
        );
      })}
      {lineP > 0.001 && (
        <div style={{ position: "absolute", left: 0, width: W, top: 600, height: 86, overflow: "hidden" }}>
          <div style={{ textAlign: "center", fontFamily: THIN, fontWeight: 400, fontSize: 52, lineHeight: "86px", letterSpacing: "0.06em", color: C.fg, transform: `translateY(${(1 - lineIn) * 80}px)`, opacity: Math.min(1, lineIn * 1.6) * (1 - out) }}>
            一天收的，盖不住一次 2% 的波动。
          </div>
        </div>
      )}
      <SettleReadout f={f} />
    </>
  );
};

/** Countdown stays in the empty sky above the curve while the one sweep drains the gap. */
const SettleReadout: React.FC<{ f: number }> = ({ f }) => {
  const inn = ramp(f, B.sweep[0] - 2, B.sweep[0] + 20, easeIO);
  const out = ramp(f, B.sweep[1] - 28, B.sweep[1] + 8, easeIO);
  const op = inn * (1 - out);
  if (op < 0.001) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: 236, textAlign: "center", opacity: op, pointerEvents: "none" }}>
      <div style={{ fontFamily: THIN, fontSize: 22, letterSpacing: "0.22em", color: C.theta, marginBottom: 6 }}>时间价值</div>
      <div style={{ fontFamily: MONO, fontSize: 76, fontWeight: 600, color: C.theta, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(liveTv(dteAt(f)))}</div>
    </div>
  );
};

/* ---------------------------------------------------------------- gap + ledger (content-native, inside the scaled panel) */
export const TimeGap: React.FC<{ f: number; dte: number }> = ({ f, dte }) => {
  const gapP = mo(f, B.tv) * (1 - ramp(f, B.sweep[1] - 24, B.sweep[1] + 12, easeIO));
  if (gapP < 0.001 || f < B.tv[0] - 2) return null;
  const yNow = SC.y(MODEL.profit(S, dte));
  const yExp = SC.y(MODEL.profit(S, 0));
  const top = Math.min(yNow, yExp);
  const bot = Math.max(yNow, yExp);
  const mid = (top + bot) / 2;
  const x = SC.x(S);
  const len = bot - top;
  const ledgerP = thetaHotP(f);
  const onLine = 1 - ledgerP;
  const tv = liveTv(dte);
  // once the sweep starts, the sky number takes the countdown so the type doesn't ride the shrinking gap
  const hand = ramp(f, B.sweep[0] - 10, B.sweep[0] + 16, easeIO);
  const numOp = gapP * onLine * (1 - hand) * (len > 12 ? 1 : 0);
  const pillH = 148;
  const pillTop = Math.max(PLOT.y + 4, Math.min(PLOT.y + PLOT.h - pillH - 4, mid - pillH / 2));
  const row = (name: string, value: string, color: string, emph: number) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18, opacity: 0.55 + 0.45 * emph }}>
      <span style={{ fontFamily: THIN, fontSize: 15, letterSpacing: "0.12em", color: emph > 0.5 ? color : C.mutedFg }}>{name}</span>
      <span style={{ fontFamily: MONO, fontSize: emph > 0.5 ? 26 : 20, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
  const barW = 208;
  const inW = barW * (INTRINSIC_Y / VALUE_NOW);
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: 520, pointerEvents: "none" }}>
      <svg width={CONTENT.w} height={520} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: gapP }}>
        <line x1={x} x2={x} y1={top} y2={bot} stroke={C.theta} strokeWidth={6} strokeLinecap="round" opacity={0.22} />
        <line x1={x} x2={x} y1={top} y2={bot} stroke={C.theta} strokeWidth={2.25} strokeLinecap="round" />
        <line x1={x - 8} x2={x + 8} y1={top} y2={top} stroke={C.theta} strokeWidth={2.25} strokeLinecap="round" />
        <line x1={x - 8} x2={x + 8} y1={bot} y2={bot} stroke={C.theta} strokeWidth={2.25} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", left: x, top: top - 22, transform: "translateX(-50%)", opacity: gapP * (1 - hand), fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.fg, letterSpacing: 0.4 }}>6550</div>
      {numOp > 0.001 && (
        <div style={{ position: "absolute", left: x + 16, top: mid, transform: "translateY(-50%)", opacity: numOp }}>
          <div style={{ fontFamily: THIN, fontSize: 14, letterSpacing: "0.16em", color: C.theta, marginBottom: 2 }}>时间价值</div>
          <div style={{ fontFamily: MONO, fontSize: 36, fontWeight: 600, color: C.theta, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(tv)}</div>
        </div>
      )}
      {ledgerP > 0.001 && (
        <div style={{ position: "absolute", left: x + 64, top: pillTop, width: 248, opacity: ledgerP, padding: "12px 14px 12px", borderRadius: 8, background: "rgba(9,10,12,0.94)", border: `1px solid ${C.border}`, transform: `translateY(${(1 - mo(f, B.formula)) * 10}px)` }}>
          {row("现在值", fmt(VALUE_NOW), C.fg, 0)}
          <div style={{ height: 8 }} />
          {row("内在价值", fmt(INTRINSIC_Y), C.fg, 0)}
          <div style={{ height: 6 }} />
          {row("时间价值", fmt(TV_NOW), C.theta, 1)}
          <div style={{ marginTop: 10, width: barW, height: 8, borderRadius: 4, overflow: "hidden", display: "flex", background: "rgba(255,255,255,0.06)" }}>
            <div style={{ width: inW, height: "100%", background: "rgba(239,242,246,0.85)" }} />
            <div style={{ width: barW - inW, height: "100%", background: C.theta }} />
          </div>
        </div>
      )}
    </div>
  );
};
