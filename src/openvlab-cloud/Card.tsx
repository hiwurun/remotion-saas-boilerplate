import React from "react";
import { Img, staticFile } from "remotion";
import { SANS } from "../shared/fonts";
import { CARD_H, L, Placed, SECTORS } from "./data";
import { cellOutline, D, diffBg, pillColor, pillOutline, skewColor, tdayBg, withA } from "./styles";

const ROWS = ["偏度*", "20P", "30P", "40P", "50", "40C", "30C", "20C"];
const yymm = (s: string) => (s.length >= 6 ? s.slice(2, 6) : s);
const fmt = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "-");

export type Mode = "diff" | "tday";
/** Per-frame overrides (only for the one card the camera is on); static props below keep React.memo effective. */
export type Reveal = {
  chrome?: number; // header/labels/border opacity
  cell?: (mi: number, row: number) => number; // 0..1
  outline?: (mi: number, row: number) => number; // 0..1
  modeAt?: (mi: number, row: number) => Mode;
};
type CardProps = { pl: Placed; reveal?: Reveal; mode?: Mode; borders?: number; desc?: boolean; ring?: number };

export const Card: React.FC<CardProps> = ({ pl, reveal = {}, mode = "diff", borders = 1, desc = false, ring = 0 }) => {
  const chrome = reveal.chrome ?? 1;
  const cellOp = reveal.cell ?? (() => 1);
  const outF = reveal.outline ?? (() => borders);
  const modeAt = reveal.modeAt ?? (() => mode);
  const rows = desc ? [ROWS[0], ...ROWS.slice(1).reverse()] : ROWS; // 行权价排序
  const src = (k: number) => (desc ? 6 - k : k);
  const { p } = pl;
  const icon = SECTORS.find((s) => s.key === p.sector)!.icon;
  const po = pillOutline(p.ffmom);
  const allT = p.months.flatMap((m) => m.tday).filter(Number.isFinite);
  const tAvg = allT.reduce((a, b) => a + b, 0) / Math.max(1, allT.length); // product.tdayAverage
  const txt: React.CSSProperties = { fontFamily: SANS, fontSize: 10, fontWeight: 600, fontVariantNumeric: "tabular-nums" };
  return (
    <div style={{ position: "absolute", left: pl.x, top: pl.y, width: pl.w, height: CARD_H, boxSizing: "border-box", background: D.card, borderRadius: 6 }}>
      <div style={{ position: "absolute", inset: 0, border: `1px solid ${D.border}`, borderRadius: 6, opacity: chrome }} />
      {ring > 0 ? <div style={{ position: "absolute", inset: -3, border: "2px solid rgba(255,255,255,0.9)", borderRadius: 8, opacity: ring, boxShadow: `0 0 18px rgba(255,255,255,${0.35 * ring})` }} /> : null}
      {/* header */}
      <div style={{ position: "absolute", left: L.pad, top: L.pad, right: L.pad, height: 28, background: withA(D.muted, 0.2), borderRadius: 4, display: "flex", alignItems: "center", gap: 6, padding: "0 6px", boxSizing: "border-box", opacity: chrome, whiteSpace: "nowrap" }}>
        <Img src={staticFile(icon)} style={{ width: 16, height: 16, opacity: 0.85 }} />
        <span style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: D.fg }}>{p.name}</span>
        <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: D.mutedFg, background: withA(D.muted, 0.5), borderRadius: 3, padding: "2px 4px" }}>主 {yymm(p.exp)}</span>
        {p.overseas ? <span style={{ fontFamily: SANS, fontSize: 11, color: D.mutedFg, background: withA(D.muted, 0.5), borderRadius: 3, padding: "2px 4px" }}>外</span> : null}
        <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: pillColor(p.ctn), background: withA(D.muted, 0.4), borderRadius: 12, padding: "1px 6px", outline: po.w > 0 ? `${po.w}px solid ${po.color}` : "none", outlineOffset: -1 }}>
          {Number.isFinite(p.ctn) ? `${(p.ctn * 100).toFixed(2)}%` : "-"}
        </span>
      </div>
      {/* heatmap */}
      <div style={{ position: "absolute", left: L.pad, right: L.pad, top: L.pad + L.head, height: 1, background: D.border, opacity: chrome }} />
      <div style={{ position: "absolute", left: L.pad, top: L.pad + L.head + 5 }}>
        {rows.map((r, ri) => (
          <div key={r} style={{ ...txt, position: "absolute", left: 0, top: L.header + ri * L.row, width: L.label, height: L.row, lineHeight: `${L.row}px`, color: withA(D.mutedFg, 0.7), opacity: chrome }}>{r}</div>
        ))}
        {p.months.map((m, mi) => {
          const x = L.label + mi * L.col;
          return (
            <React.Fragment key={m.exp}>
              <div style={{ position: "absolute", left: x, top: 0, width: L.col, height: L.header, lineHeight: `${L.header}px`, textAlign: "center", fontFamily: SANS, fontSize: 11, color: D.mutedFg, opacity: chrome }}>{yymm(m.exp)}</div>
              <div style={{ ...txt, position: "absolute", left: x, top: L.header, width: L.col, height: L.row, lineHeight: `${L.row}px`, textAlign: "center", color: m.ready ? skewColor(m.skew) : D.notReadyFg, opacity: cellOp(mi, 0) }}>{m.skew === null ? "-" : m.skew.toFixed(2)}</div>
              {Array.from({ length: 7 }).map((_, k) => {
                const md = modeAt(mi, k + 1);
                const j = src(k);
                const v = md === "diff" ? m.diff[j] : m.tday[j];
                const o = cellOutline(m.alpha[j]);
                const oo = outF(mi, k + 1);
                const bg = !m.ready ? D.notReadyBg : md === "diff" ? diffBg(v) : tdayBg(v, tAvg);
                return (
                  <div key={k} style={{ ...txt, position: "absolute", left: x + 1, top: L.header + (k + 1) * L.row + 1, width: L.col - 2, height: L.row - 2, lineHeight: `${L.row - 2}px`, textAlign: "center", borderRadius: 2, background: bg, color: m.ready ? withA(D.fg, 0.8) : D.notReadyFg, opacity: cellOp(mi, k + 1), outline: o && oo > 0 ? `${o.w}px solid ${o.color.replace(/[\d.]+\)$/, (a) => `${(parseFloat(a) * oo).toFixed(3)})`)}` : "none", outlineOffset: -2 }}>
                    {fmt(v)}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
export const StaticCard = React.memo(Card);
