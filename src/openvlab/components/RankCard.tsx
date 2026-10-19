import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, withAlpha } from "../theme";
import { CARD_IN } from "../layout";
import type { MarketRow } from "../data";
import { SectorIcon } from "./ui";

export type RankColumn = { label: string; span: number; render: (row: MarketRow, rollT: number, isTop: boolean) => React.ReactNode };

/**
 * One ranking card (RankingCard.tsx + BaseTable): title "隐波最大<span color>上升</span>", column header, 5 row pills.
 * Pure props: rollT = frames since the number roll started; highlight = 0..1 emphasis of row #1;
 * altRows/altMix crossfade the body to a re-ranked list (e.g. after a sector filter).
 */
export const RankCard: React.FC<{
  width: number;
  height: number;
  title: string;
  coloredText: string;
  titleColor: string;
  columns: RankColumn[];
  rows: MarketRow[];
  altRows?: MarketRow[];
  altMix?: number;
  rollT?: number;
  highlight?: number;
  accent: string;
  tag?: { text: string; p: number; color: string };
  font: string;
}> = ({ width, height, title, coloredText, titleColor, columns, rows, altRows, altMix = 0, rollT = 1e4, highlight = 0, accent, tag, font }) => {
  const total = columns.reduce((a, c) => a + c.span, 0);
  const body = (list: MarketRow[], opacity: number, offset: number, hl: number) => (
    <div style={{ position: "absolute", left: CARD_IN.pad, right: CARD_IN.pad, top: CARD_IN.titleH + CARD_IN.headH, opacity, transform: `translateY(${offset}px)` }}>
      {list.slice(0, 5).map((r, i) => {
        const isTop = i === 0;
        const h = isTop ? hl : 0;
        return (
          <div
            key={r.product}
            style={{
              height: CARD_IN.rowH,
              marginBottom: i < 4 ? CARD_IN.rowGap : 0,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              background: h > 0 ? `linear-gradient(90deg, ${withAlpha(accent, 0.16 * h)}, ${withAlpha(accent, 0.05 * h)}), ${C.cardRow}` : C.cardRow,
              boxShadow: h > 0 ? `0 0 0 ${1.5 * h}px ${withAlpha(accent, 0.85 * h)}, 0 0 ${28 * h}px ${withAlpha(accent, 0.22 * h)}` : "none",
              transform: `scale(${1 + 0.025 * h})`,
              position: "relative",
              zIndex: isTop ? 2 : 1,
            }}
          >
            {columns.map((c, ci) => (
              <div key={ci} style={{ width: `${(c.span / total) * 100}%`, display: "flex", alignItems: "center", justifyContent: ci === 0 ? "flex-start" : "center", paddingLeft: ci === 0 ? 10 : 0, gap: 6, fontSize: 16, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", boxSizing: "border-box" }}>
                {ci === 0 ? (
                  <>
                    <SectorIcon sector={r.sector} size={20} />
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{r.alias}</span>
                  </>
                ) : (
                  c.render(r, rollT - i * 4, isTop)
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
  const tagP = tag ? interpolate(tag.p, [0, 1], [0, 1], CLAMP) : 0;
  return (
    <div style={{ position: "relative", width, height, borderRadius: 16, background: C.card, border: `1px solid ${C.borderSoft}`, overflow: "hidden", fontFamily: font }}>
      <div style={{ position: "absolute", left: CARD_IN.pad + 4, right: CARD_IN.pad, top: 0, height: CARD_IN.titleH, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#4ade80", boxShadow: "0 0 8px #4ade80aa" }} />
        <span style={{ fontSize: 18, fontWeight: 600, color: C.ink, letterSpacing: "0.01em" }}>
          {title}
          <span style={{ color: titleColor }}>{coloredText}</span>
        </span>
        <div style={{ flex: 1 }} />
        {tag && tagP > 0 ? (
          <div style={{ fontSize: 14, fontWeight: 600, color: tag.color, background: withAlpha(tag.color, 0.14), border: `1px solid ${withAlpha(tag.color, 0.5)}`, borderRadius: 999, padding: "4px 10px", opacity: tagP, transform: `translateX(${(1 - tagP) * 12}px)`, whiteSpace: "nowrap" }}>{tag.text}</div>
        ) : null}
      </div>
      <div style={{ position: "absolute", left: CARD_IN.pad, right: CARD_IN.pad, top: CARD_IN.titleH, height: CARD_IN.headH, display: "flex", alignItems: "center", fontSize: 14, color: C.muted, fontWeight: 600 }}>
        {columns.map((c, ci) => (
          <div key={ci} style={{ width: `${(c.span / total) * 100}%`, textAlign: ci === 0 ? "left" : "center", paddingLeft: ci === 0 ? 10 : 0, boxSizing: "border-box" }}>{c.label}</div>
        ))}
      </div>
      {altRows && altMix > 0 ? (
        <>
          {altMix < 1 ? body(rows, 1 - altMix, -10 * altMix, highlight) : null}
          {body(altRows, altMix, 10 * (1 - altMix), 0)}
        </>
      ) : (
        body(rows, 1, 0, highlight)
      )}
    </div>
  );
};
