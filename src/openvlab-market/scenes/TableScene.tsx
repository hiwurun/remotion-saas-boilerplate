import React from "react";
import { EASE_OUT } from "../theme";
import { SANS } from "../../shared/fonts";
import { matchesMetric } from "../data";
import { TABLE, TOOLBAR, WIN, WIN_LEFT, WIN_TOP } from "../layout";
import { MarketTable } from "../components/MarketTable";
import type { MarketTimeline } from "../timeline";

/** Shot 7 + 数值筛选 + 能化: the market table (row deal-in, column highlights, metric/sector filtering, star). */
export const TableScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, model, f, b, starRow, ml, mc, mHideT, mShowT, highlights, tableScroll, filterT, starP, rowFocusP } = tl;
  return (
    <MarketTable
      rows={model.tableRows}
      width={TABLE.w}
      font={SANS}
      accent={accent}
      focusSector={f >= b(85.2) ? model.focus?.code : undefined}
      filterT={filterT}
      star={starRow ? { product: starRow.product, p: starP } : undefined}
      rowFocus={starRow ? { product: starRow.product, p: rowFocusP } : undefined}
      rowsIn={f - b(23.6)}
      highlights={highlights}
      scrollY={tableScroll}
      metric={f >= ml(5.5) && f < ml(11) ? { pred: (r) => matchesMetric(r, mc), hideT: mHideT, showT: mShowT } : undefined}
    />
  );
};

/** Shot 7: column-note pills, one at a time, in the toolbar row. */
export const ColumnNotes: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, bp, noteBeats, notesOut, colCenters } = tl;
  return (
    <>
    {copy.tableNotes.map((n, i) => {
      const nb0 = noteBeats[i] ?? 60;
      const nb1 = noteBeats[i + 1];
      const p = bp(nb0, nb0 + 0.6, EASE_OUT) * (nb1 !== undefined ? 1 - bp(nb1 - 0.4, nb1) : 1 - notesOut);
      if (p <= 0 || colCenters[n.column] === undefined) return null;
      const PW = 420;
      const cxp = Math.min(Math.max(colCenters[n.column], WIN_LEFT + 30 + PW / 2), WIN_LEFT + WIN.w - 30 - PW / 2);
      return (
        <div key={n.column} style={{ position: "absolute", left: cxp - PW / 2, width: PW, top: WIN_TOP + TOOLBAR.y, height: TOOLBAR.h, display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - Math.min(1, p)) * 8}px)` }}>
          <div style={{ fontSize: 24, fontWeight: 600, lineHeight: "30px", color: "#000", background: accent, borderRadius: 999, padding: "6px 18px", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>{n.note}</div>
        </div>
      );
    })}
    </>
  );
};
