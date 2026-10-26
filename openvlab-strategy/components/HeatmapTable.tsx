import React, { useMemo } from "react";
import {
  HEATMAP_DATES,
  HEATMAP_MAX,
  HEATMAP_MIN,
  HEATMAP_ROWS,
  heatmapCell,
} from "../data";
import {
  formatPercentLabel,
  formatProfitLoss,
  getBackgroundColor,
} from "../profitLossTableColor";
import { C, SANS } from "../theme";

type Props = {
  width: number;
  height: number;
  /** IV multiplier morphs cell values away from frozen snapshot */
  ivMorph?: number;
  /** Kept for API parity with chart; IM2611 snapshot is fixed ±8.3% implied */
  rangePct?: number;
  opacity?: number;
};

/**
 * 1:1 ProfitTable remake (IM2611 engine heatmap (vendor-strategy)).
 * Cell backgrounds: exact product getBackgroundColor.
 * Layout mirrors packages/components/src/strategy/ProfitTable.tsx
 * (weekday row → 标的/涨幅 header → 18px body rows + showLine dashed).
 */
export const HeatmapTable: React.FC<Props> = ({
  width,
  height,
  ivMorph = 1,
  opacity = 1,
}) => {
  const cols = HEATMAP_DATES;
  const rows = HEATMAP_ROWS;

  const { maxRange, minRange } = useMemo(() => {
    if (ivMorph === 1) return { maxRange: HEATMAP_MAX, minRange: HEATMAP_MIN };
    let maxV = -Infinity;
    let minV = Infinity;
    for (const r of rows) {
      for (let ci = 0; ci < cols.length; ci++) {
        const v = heatmapCell(r.price, ci, cols.length, ivMorph);
        if (v > maxV) maxV = v;
        if (v < minV) minV = v;
      }
    }
    return { maxRange: maxV, minRange: minV };
  }, [cols.length, ivMorph, rows]);

  const headH = 40; // weekday 18 + date header 22
  const bodyH = Math.max(1, height - headH);
  const rowH = bodyH / rows.length;
  const labelW = 78;
  const colW = (width - labelW) / cols.length;

  return (
    <div
      style={{
        width,
        height,
        opacity,
        fontFamily: SANS,
        fontSize: 10,
        overflow: "hidden",
        background: C.uiBg,
        position: "relative",
        color: C.inkSoft,
      }}
    >
      <table
        style={{
          width: "100%",
          height: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 11,
        }}
      >
        <thead>
          {/* Weekday row — ProfitTable renderWeekdayRow */}
          <tr style={{ color: C.uiMuted, height: 20 }}>
            <th
              colSpan={2}
              style={{
                width: labelW,
                textAlign: "left",
                fontWeight: 400,
                padding: "2px 0",
                fontSize: 11,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                标的范围
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `1px solid ${C.uiMuted}`,
                    fontSize: 9,
                    lineHeight: "10px",
                    textAlign: "center",
                    color: C.uiMuted,
                    display: "inline-block",
                  }}
                >
                  ?
                </span>
              </span>
            </th>
            {cols.map((c) => (
              <th
                key={`w-${c.d}`}
                style={{
                  fontWeight: 400,
                  textAlign: "center",
                  padding: "2px 1px",
                  fontSize: 11,
                  width: colW,
                }}
              >
                {c.w}
              </th>
            ))}
          </tr>
          {/* Date / 标的 / 涨幅 header — ProfitTable renderHeaderRow */}
          <tr style={{ color: C.uiMuted, height: 24 }}>
            <th
              style={{
                fontWeight: 400,
                textAlign: "left",
                padding: "2px 2px",
                width: 40,
                fontSize: 11,
              }}
            >
              标的
            </th>
            <th
              style={{
                fontWeight: 400,
                textAlign: "right",
                padding: "2px 10px 2px 2px",
                width: 40,
                fontSize: 11,
              }}
            >
              涨幅
            </th>
            {cols.map((c) => (
              <th
                key={c.d}
                style={{
                  fontWeight: 400,
                  textAlign: "center",
                  padding: "2px 1px",
                  fontSize: 11,
                  width: colW,
                }}
              >
                {c.d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const showLine = Boolean(row.showLine);
            // Product: after:border-dashed after:border-accent-foreground
            // light --accent-foreground: oklch(0.4479 0.1083 151.3277) ≈ rgb(22,101,52)
            const lineBorder = showLine
              ? `1px dashed ${C.accentForeground}`
              : "none";
            return (
              <tr key={row.price} style={{ height: rowH }}>
                <td
                  style={{
                    padding: "0 2px",
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    color: C.uiMuted,
                    fontSize: 11,
                    lineHeight: `${Math.min(18, rowH)}px`,
                    height: rowH,
                    border: "none",
                    borderTop: lineBorder,
                    width: 40,
                  }}
                >
                  {row.price}
                </td>
                <td
                  style={{
                    padding: "0 10px 0 2px",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                    color: C.uiMuted,
                    fontSize: 11,
                    lineHeight: `${Math.min(18, rowH)}px`,
                    height: rowH,
                    border: "none",
                    borderTop: lineBorder,
                    width: 40,
                  }}
                >
                  {formatPercentLabel(row.pct, true)}
                </td>
                {cols.map((_, ci) => {
                  const v = heatmapCell(row.price, ci, cols.length, ivMorph);
                  const bg = getBackgroundColor(v, maxRange, minRange);
                  return (
                    <td
                      key={ci}
                      style={{
                        backgroundColor: bg,
                        textAlign: "center",
                        padding: 0,
                        border: "none",
                        borderTop: lineBorder,
                        height: rowH,
                        lineHeight: `${Math.min(18, rowH)}px`,
                        fontSize: 10,
                        color: C.inkSoft,
                        width: colW,
                      }}
                    >
                      {formatProfitLoss(v)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
