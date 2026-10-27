import React from "react";
import { SANS } from "../../shared/fonts";
import type { ChartColors } from "../../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { CONTAINER_HEIGHT, CONTAINER_WIDTH } from "../../openvlab-logo-curve/strategy-chart/model";
import { type ProfitTable, TABLE_COLUMNS, formatPercentLabel, formatProfitLoss, getBackgroundColor } from "../data";

/**
 * ProfitTable (表格 mode) in the same 1400×380 container as the chart: weekday row → 标的/涨幅/date header →
 * body rows with product getBackgroundColor cells and the dashed accent rule under the current-price row
 * (layout from the earlier 1:1 HeatmapTable remake of packages/components/src/strategy/ProfitTable.tsx).
 */
const HEAD_H = 44;
const LABEL_W = 80;
/** Dark --accent-foreground (green-400) for the current-price rule. */
const ACCENT_FOREGROUND = "rgb(74, 222, 128)";

export const TABLE_ROW_H = (rowCount: number) => (CONTAINER_HEIGHT - HEAD_H) / rowCount;
export const TABLE_COL_W = (CONTAINER_WIDTH - LABEL_W) / TABLE_COLUMNS.length;
/** Container-space centre of a body cell. */
export const tableCellCenter = (table: ProfitTable, row: number, col: number) => ({
  x: LABEL_W + TABLE_COL_W * (col + 0.5),
  y: HEAD_H + TABLE_ROW_H(table.rows.length) * (row + 0.5),
});

export const ProfitTablePanel: React.FC<{ table: ProfitTable; colors: ChartColors }> = ({ table, colors }) => {
  const rowH = TABLE_ROW_H(table.rows.length);
  const colW = TABLE_COL_W;
  return (
    <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, fontFamily: SANS, background: colors.surface, color: colors.foreground, overflow: "hidden" }}>
      <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 }}>
        <thead>
          <tr style={{ color: colors.muted, height: 20 }}>
            <th colSpan={2} style={{ width: LABEL_W, textAlign: "left", fontWeight: 400, padding: "2px 0", fontSize: 11 }}>
              标的范围
            </th>
            {TABLE_COLUMNS.map((c) => (
              <th key={`w-${c.d}`} style={{ fontWeight: 400, textAlign: "center", padding: "2px 1px", fontSize: 11, width: colW }}>
                {c.w}
              </th>
            ))}
          </tr>
          <tr style={{ color: colors.muted, height: 24 }}>
            <th style={{ fontWeight: 400, textAlign: "left", padding: "2px 2px", width: 40, fontSize: 11 }}>标的</th>
            <th style={{ fontWeight: 400, textAlign: "right", padding: "2px 10px 2px 2px", width: 40, fontSize: 11 }}>涨幅</th>
            {TABLE_COLUMNS.map((c) => (
              <th key={c.d} style={{ fontWeight: 400, textAlign: "center", padding: "2px 1px", fontSize: 11, width: colW }}>
                {c.d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            const lineBorder = row.showLine ? `1px dashed ${ACCENT_FOREGROUND}` : "none";
            const labelCell: React.CSSProperties = {
              whiteSpace: "nowrap",
              color: colors.muted,
              fontSize: 11,
              lineHeight: `${Math.min(18, rowH)}px`,
              height: rowH,
              border: "none",
              borderTop: lineBorder,
              width: 40,
            };
            return (
              <tr key={row.price} style={{ height: rowH }}>
                <td style={{ ...labelCell, padding: "0 2px", textAlign: "left" }}>{Math.round(row.price)}</td>
                <td style={{ ...labelCell, padding: "0 10px 0 2px", textAlign: "right" }}>{formatPercentLabel(row.pct, true)}</td>
                {row.values.map((v, ci) => (
                  <td key={ci} style={{ padding: 0, border: "none", borderTop: lineBorder, height: rowH, width: colW, position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        backgroundColor: getBackgroundColor(v, table.max, table.min),
                        textAlign: "center",
                        lineHeight: `${rowH}px`,
                        fontSize: 10,
                        color: colors.foreground,
                      }}
                    >
                      {formatProfitLoss(v)}
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
