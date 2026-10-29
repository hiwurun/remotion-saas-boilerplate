import React from "react";
import { SANS } from "../../shared/fonts";
import { CONTENT, TABLE, TABLE_HEAD_H, colW, colX, rowY } from "../layout";
import { C } from "../tokens";
import { Model, fmtCell, fmtPct, heatColor } from "../model/model";

/** Per-cell visual state. All fields 0..1 except offsets (native px). */
export type CellFx = { op: number; dx?: number; dy?: number; s?: number; focus?: number; light?: number; trail?: number; text?: number };
const REST: CellFx = { op: 1 };

/** Replica of vlab-frontend ProfitTable: 2 weekday/label rows + 25 price rows x (标的, 涨幅, 18 dates). Focus = bg-primary, light = bg-primary/20. */
export const ProfitTable: React.FC<{
  model: Model;
  fx?: (r: number, c: number) => CellFx;
  headerOp?: (c: number) => number;
  /** 0..1: how much of the dashed current-price line is drawn. */
  lineP?: number;
  hideRow?: number;
}> = ({ model, fx, headerOp, lineP = 1 }) => {
  const cols = model.timeline.length + 2;
  const hOp = (c: number) => (headerOp ? headerOp(c) : 1);
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: TABLE_HEAD_H + model.rows.length * TABLE.rowH, fontFamily: SANS, fontSize: 12, color: C.fg, fontVariantNumeric: "tabular-nums" }}>
      {/* weekday row */}
      <div style={{ position: "absolute", left: 0, top: 0, width: TABLE.labelW * 2, height: TABLE.weekdayH, lineHeight: `${TABLE.weekdayH}px`, color: C.mutedFg, opacity: hOp(0) }}>标的范围</div>
      {Array.from({ length: cols }).map((_, c) => {
        if (c < 2) {
          return (
            <div key={`h${c}`} style={{ position: "absolute", left: colX(c), top: TABLE.weekdayH, width: colW(c), height: TABLE.headH, lineHeight: `${TABLE.headH}px`, textAlign: "center", color: C.mutedFg, opacity: hOp(c) }}>
              {c === 0 ? "标的" : "涨幅"}
            </div>
          );
        }
        const pt = model.timeline[c - 2];
        return (
          <React.Fragment key={`h${c}`}>
            <div style={{ position: "absolute", left: colX(c), top: 0, width: colW(c), height: TABLE.weekdayH, lineHeight: `${TABLE.weekdayH}px`, textAlign: "center", color: C.mutedFg, opacity: hOp(c) }}>{pt.weekday}</div>
            <div style={{ position: "absolute", left: colX(c), top: TABLE.weekdayH, width: colW(c), height: TABLE.headH, lineHeight: `${TABLE.headH}px`, textAlign: "center", color: C.mutedFg, opacity: hOp(c) }}>{pt.mmdd}</div>
          </React.Fragment>
        );
      })}
      {/* body */}
      {model.rows.map((row, r) =>
        Array.from({ length: cols }).map((_, c) => {
          const f = fx ? fx(r, c) : REST;
          if (f.op <= 0.001) return null;
          const v = c >= 2 ? model.table[r][c - 2] : 0;
          const focus = f.focus ?? 0;
          const light = f.light ?? 0;
          const bg = c < 2 ? "transparent" : heatColor(v, model.tableMax, model.tableMin);
          const text = c === 0 ? String(row.price) : c === 1 ? fmtPct(row.pct) : fmtCell(v);
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: colX(c),
                top: rowY(r),
                width: colW(c),
                height: TABLE.rowH,
                lineHeight: `${TABLE.rowH}px`,
                textAlign: c < 2 ? "right" : "center",
                paddingRight: c < 2 ? 2 : 0,
                boxSizing: "border-box",
                color: c < 2 ? C.mutedFg : C.fg,
                background: bg,
                opacity: f.op,
                transform: `translate(${f.dx ?? 0}px, ${f.dy ?? 0}px) scale(${f.s ?? 1})`,
                whiteSpace: "nowrap",
              }}
            >
              {light > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(175,243,62,${0.2 * light})` }} /> : null}
              {focus > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(175,243,62,${focus})` }} /> : null}
              {(f.trail ?? 0) > 0 ? <div style={{ position: "absolute", inset: 0, boxShadow: `inset 0 0 0 1px rgba(22,199,132,${0.9 * (f.trail ?? 0)})` }} /> : null}
              <span style={{ position: "relative", color: focus > 0.5 ? "#0b1a00" : undefined, fontWeight: focus > 0.5 ? 600 : 400, opacity: f.text ?? 1 }}>{text}</span>
            </div>
          );
        }),
      )}
      {/* current price dashed line (top edge of the row where price <= last) */}
      {model.rows.map((row, r) =>
        row.showLine ? (
          <div key={`line${r}`} style={{ position: "absolute", left: 0, top: rowY(r), width: CONTENT.w * lineP, height: 0, borderTop: `1px dashed ${C.fg}`, opacity: 0.55 }} />
        ) : null,
      )}
    </div>
  );
};
