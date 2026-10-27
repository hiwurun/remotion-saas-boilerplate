import React from "react";
import { SANS } from "../../shared/fonts";
import { CHART_COLORS } from "../../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { CONTAINER_HEIGHT, CONTAINER_WIDTH } from "../../openvlab-logo-curve/strategy-chart/model";
import {
  KEY_CELLS,
  TABLE_COLUMNS,
  TABLE_MAX,
  TABLE_MIN,
  TABLE_ROWS,
  formatPercentLabel,
  formatProfitLoss,
  getBackgroundColor,
} from "../data";

/**
 * ProfitTable (表格 mode) in the same 1400×380 container as the chart: weekday row → 标的/涨幅/date header →
 * body rows with product getBackgroundColor cells and the dashed accent rule under the current-price row
 * (layout from the earlier 1:1 HeatmapTable remake of packages/components/src/strategy/ProfitTable.tsx).
 * `focus` dims every cell except max gain, max loss and the per-date break-even cell.
 */
const UI = {
  ink: CHART_COLORS.foreground,
  inkSoft: "#333333",
  muted: CHART_COLORS.muted,
  accentForeground: "rgb(22, 101, 52)", // light --accent-foreground
};

const HEAD_H = 44;
const LABEL_W = 80;

export const ProfitTablePanel: React.FC<{ focus: number }> = ({ focus }) => {
  const rowH = (CONTAINER_HEIGHT - HEAD_H) / TABLE_ROWS.length;
  const colW = (CONTAINER_WIDTH - LABEL_W) / TABLE_COLUMNS.length;
  const dim = 1 - 0.78 * focus;
  return (
    <div style={{ width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, fontFamily: SANS, background: CHART_COLORS.surface, color: UI.inkSoft, overflow: "hidden" }}>
      <table style={{ width: "100%", height: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 11 }}>
        <thead>
          <tr style={{ color: UI.muted, height: 20 }}>
            <th colSpan={2} style={{ width: LABEL_W, textAlign: "left", fontWeight: 400, padding: "2px 0", fontSize: 11 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                标的范围
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    border: `1px solid ${UI.muted}`,
                    fontSize: 9,
                    lineHeight: "10px",
                    textAlign: "center",
                    display: "inline-block",
                  }}
                >
                  ?
                </span>
              </span>
            </th>
            {TABLE_COLUMNS.map((c) => (
              <th key={`w-${c.d}`} style={{ fontWeight: 400, textAlign: "center", padding: "2px 1px", fontSize: 11, width: colW }}>
                {c.w}
              </th>
            ))}
          </tr>
          <tr style={{ color: UI.muted, height: 24 }}>
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
          {TABLE_ROWS.map((row, ri) => {
            const lineBorder = row.showLine ? `1px dashed ${UI.accentForeground}` : "none";
            const labelCell: React.CSSProperties = {
              whiteSpace: "nowrap",
              color: UI.muted,
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
                {row.values.map((v, ci) => {
                  const key = KEY_CELLS.get(`${ri}:${ci}`);
                  const ring = key === "be" ? CHART_COLORS.brand : UI.ink;
                  return (
                    <td
                      key={ci}
                      style={{
                        padding: 0,
                        border: "none",
                        borderTop: lineBorder,
                        height: rowH,
                        width: colW,
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: getBackgroundColor(v, TABLE_MAX, TABLE_MIN),
                          textAlign: "center",
                          lineHeight: `${rowH}px`,
                          fontSize: 10,
                          color: UI.inkSoft,
                          fontWeight: key && focus > 0 ? 600 : 400,
                          opacity: key ? 1 : dim,
                          boxShadow: key && focus > 0 ? `inset 0 0 0 ${1.5 * focus}px ${ring}` : undefined,
                        }}
                      >
                        {formatProfitLoss(v)}
                      </div>
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
