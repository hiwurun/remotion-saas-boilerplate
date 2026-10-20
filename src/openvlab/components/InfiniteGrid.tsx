import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, EASE, signColor, withAlpha } from "../theme";
import { formatNumber, formatPct, withSign, type MarketRow } from "../data";
import { SectorIcon } from "./ui";

/** One product tile (window-sized, type sized for the far zoom-out). All values from the row. */
export const ProductTile: React.FC<{ row: MarketRow; w: number; h: number; accent: string; font: string }> = ({ row, w, h, accent, font }) => {
  const chg = row.atmvChg;
  const col = signColor(chg);
  const pct = Math.max(0, Math.min(100, Math.round(row.atmvPct)));
  return (
    <div style={{ width: w, height: h, borderRadius: 44, background: C.card, border: `3px solid ${C.borderSoft}`, boxShadow: C.shadowSm, overflow: "hidden", padding: 84, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", fontFamily: font, color: C.ink }}>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <SectorIcon sector={row.sector} size={110} />
        <span style={{ fontSize: 124, fontWeight: 700, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{row.alias}</span>
        <span style={{ fontSize: 64, color: C.muted, marginLeft: 6 }}>{row.prodUnd}{String(row.exp).substring(2)}</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 64, fontWeight: 600, color: signColor(row.ctn) }}>{formatPct(row.ctn)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 50 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 58, color: C.muted }}>平值隐波</span>
          <span style={{ fontSize: 250, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{formatNumber(row.atmv, 2, 2)}</span>
        </div>
        <span style={{ fontSize: 110, fontWeight: 700, color: col, background: withAlpha(col, 0.14), borderRadius: 30, padding: "14px 40px", marginBottom: 24, fontVariantNumeric: "tabular-nums" }}>{withSign(formatNumber(chg, 2, 2))}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        <span style={{ fontSize: 56, color: C.muted }}>隐波百分位</span>
        <div style={{ flex: 1, height: 34, borderRadius: 17, background: C.mutedBg, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", borderRadius: 17, background: "linear-gradient(to right, #c1e96c, #e7d98d)" }} />
        </div>
        <span style={{ fontSize: 64, fontWeight: 600, color: pct > 70 ? accent : C.ink }}>{pct}%</span>
      </div>
    </div>
  );
};

/** Dense grid of product tiles around a centre cell (the centre is left empty for the live window). */
export const InfiniteGrid: React.FC<{ cx: number; cy: number; tileW: number; tileH: number; gap: number; cols: number; rows: number; t: number; accent: string; font: string; products: MarketRow[]; view?: { x0: number; y0: number; x1: number; y1: number } }> = ({ cx, cy, tileW, tileH, gap, cols, rows, t, accent, font, products, view }) => {
  const tiles: React.ReactNode[] = [];
  const hc = Math.floor(cols / 2);
  const hr = Math.floor(rows / 2);
  let k = 0;
  for (let r = -hr; r <= hr; r++) {
    for (let c = -hc; c <= hc; c++) {
      if (r === 0 && c === 0) continue;
      const d = Math.hypot(c, r * 1.2);
      const p = interpolate(t, [d * 7, d * 7 + 40], [0, 1], { ...CLAMP, easing: EASE });
      const row = products[k % products.length];
      k++;
      if (p <= 0 || !row) continue;
      const x = cx + c * (tileW + gap) - tileW / 2;
      const y = cy + r * (tileH + gap) - tileH / 2;
      // cull tiles fully outside the camera view (world coords; +60 px for the rise-in offset)
      if (view && (x > view.x1 || x + tileW < view.x0 || y > view.y1 + 60 || y + tileH < view.y0)) continue;
      tiles.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left: x, top: y, width: tileW, height: tileH, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
          <ProductTile row={row} w={tileW} h={tileH} accent={accent} font={font} />
        </div>,
      );
    }
  }
  return <>{tiles}</>;
};
