import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, EASE, signColor, withAlpha } from "../theme";
import { TABLE, TABLE_BODY_H, TABLE_COLS } from "../layout";
import { formatNumber, formatPct, previewOf, withSign, type MarketRow } from "../data";
import { Gauge, LineSvg, ProgressBar, SectorIcon, StarIcon, valphaBackground } from "./ui";

const Chevrons: React.FC = () => (
  <svg width={9} height={13} viewBox="0 0 10 14" style={{ marginLeft: 4, opacity: 0.55 }}>
    <path d="M2 5l3-3 3 3M2 9l3 3 3-3" fill="none" stroke={C.muted} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Help: React.FC = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" style={{ marginLeft: 4, opacity: 0.7 }} fill="none" stroke={C.muted} strokeWidth={2}>
    <circle cx={12} cy={12} r={9} />
    <path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.6M12 16.8v.2" strokeLinecap="round" />
  </svg>
);
const HELP_COLS = new Set(["chart", "product_alias", "ctn", "atmv_current", "valphaT", "rv22", "carry", "skew_current", "atmv_percentile", "skew_percentile"]);

const cell = (id: string, r: MarketRow, starOn: number) => {
  switch (id) {
    case "watch":
      return <StarIcon size={17} on={starOn} />;
    case "product_alias":
      return (
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <SectorIcon sector={r.sector} size={22} style={{ marginRight: 8 }} />
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, lineHeight: 1.2 }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.alias}</span>
            <span style={{ fontSize: 12, color: C.muted }}>{r.prodUnd}{String(r.exp).substring(2)}</span>
          </div>
        </div>
      );
    case "price":
      return <span style={{ fontWeight: 500 }}>{Number.isFinite(r.price) ? formatNumber(r.price, 4) : "--"}</span>;
    case "ctn":
      return <span style={{ fontWeight: 500, color: signColor(r.ctn) }}>{formatPct(r.ctn)}</span>;
    case "expiry_date":
      return <span style={{ fontSize: 14, color: r.nearExpiry ? C.nearExpiry : C.ink }}>{r.remaining}</span>;
    case "atmv_current":
      return <span style={{ fontWeight: 500 }}>{formatNumber(r.atmv, 2, 2)}</span>;
    case "atmv_1dchg":
      return <span style={{ fontWeight: 500, color: signColor(r.atmvChg) }}>{withSign(formatNumber(r.atmvChg, 2, 2))}</span>;
    case "valphaT":
      return <span style={{ fontWeight: 500, color: signColor(r.valphaT), background: valphaBackground(r.valphaT), borderRadius: 4, padding: "4px 8px" }}>{withSign(formatNumber(r.valphaT, 3, 3))}</span>;
    case "rv22":
      return <span style={{ fontWeight: 500 }}>{Number.isFinite(r.rv22) ? formatNumber(r.rv22, 2, 2) : "--"}</span>;
    case "carry":
      return Number.isFinite(r.carry) ? <span style={{ fontWeight: 500, color: signColor(r.carry) }}>{formatNumber(r.carry, 2, 2)}</span> : <span style={{ color: C.flat }}>--</span>;
    case "skew_current": {
      const colored = r.skew >= 1 || r.skew <= -1;
      return <span style={{ fontWeight: 500, color: colored ? signColor(r.skew) : C.ink }}>{formatNumber(r.skew, 2, 2)}</span>;
    }
    case "atmv_percentile":
      return <ProgressBar value={r.atmvPct} />;
    case "skew_percentile":
      return <Gauge value={r.skewPct} size={56} />;
    case "chart": {
      // ChartPreviewCell → TrendPreviewCell → LineSvg(width 120, height 40, strokeWidth 1.2, lineColor by ctn sign,
      // indicator --vlab-purple, HH:mm labels). Scaled to fit the 52-px row. Real 分时 data (intraday.json).
      const s = previewOf(r);
      return <LineSvg id={`tb-${r.product}`} data={s.price} indicator={s.vol} width={138} height={30} lineColor={signColor(r.ctn)} strokeWidth={1.3} showTime={{ start: s.start, end: s.end }} timeSize={11} />;
    }
    default:
      return null;
  }
};

export type ColumnHighlight = { column: string; p: number };

/**
 * Desktop market table drawn from real rows.
 * - focusSector + filterT: non-matching rows fade out then collapse (height → 0), rows below slide up.
 * - star: { product, p } toggles the watch star with a pop.
 * - rowsIn: frames since rows started dealing in (row-by-row entrance).
 */
export const MarketTable: React.FC<{
  rows: MarketRow[];
  width: number;
  font: string;
  accent: string;
  focusSector?: string;
  filterT?: number;
  star?: { product: string; p: number };
  rowsIn?: number;
  highlights?: ColumnHighlight[];
  rowFocus?: { product: string; p: number };
  /** body scroll offset in px (sticky header stays) */
  scrollY?: number;
  /** 数值筛选: rows failing pred fade + collapse from hideT ≥ 0 (frames), and come back from showT ≥ 0 (清除全部) */
  metric?: { pred: (r: MarketRow) => boolean; hideT: number; showT: number };
}> = ({ rows, width, font, accent, focusSector, filterT = -1, star, rowsIn = 1e4, highlights = [], rowFocus, scrollY = 0, metric }) => {
  const rowH = TABLE.rowH;
  // collapse amount per row (stagger by position among non-matching rows near the top)
  let nonIdx = 0;
  let mIdx = 0;
  const items = rows.map((r) => {
    let mFade = 0;
    let mCollapse = 0;
    if (metric && !metric.pred(r)) {
      const k = Math.min(mIdx++, 14);
      const back = metric.showT >= 0 ? interpolate(metric.showT, [k, k + 22], [0, 1], { ...CLAMP, easing: EASE }) : 0;
      if (metric.hideT >= 0) {
        mFade = interpolate(metric.hideT, [k * 2, k * 2 + 14], [0, 1], { ...CLAMP, easing: EASE }) * (1 - back);
        mCollapse = interpolate(metric.hideT, [k * 2 + 8, k * 2 + 34], [0, 1], { ...CLAMP, easing: EASE }) * (1 - back);
      }
    }
    const match = !focusSector || r.sector === focusSector;
    let fade = 0;
    let collapse = 0;
    if (!match && filterT >= 0) {
      const k = Math.min(nonIdx, 14);
      nonIdx++;
      fade = interpolate(filterT, [k * 2, k * 2 + 14], [0, 1], { ...CLAMP, easing: EASE });
      collapse = interpolate(filterT, [k * 2 + 8, k * 2 + 34], [0, 1], { ...CLAMP, easing: EASE });
    } else if (!match) nonIdx++;
    return { r, fade: Math.max(fade, mFade), collapse: Math.max(collapse, mCollapse) };
  });
  let y = 0;
  let visIdx = 0;
  const rendered: React.ReactNode[] = [];
  for (const it of items) {
    const h = rowH * (1 - it.collapse);
    // every row is laid out (all products); only rows intersecting the viewport are painted
    const inView = y + rowH > scrollY - 4 && y < scrollY + TABLE_BODY_H + 4;
    if (h > 0.5 && inView) {
      const enter = interpolate(rowsIn, [visIdx * 3, visIdx * 3 + 22], [0, 1], { ...CLAMP, easing: EASE });
      const starOn = star && star.product === it.r.product ? star.p : 0;
      const pop = star && star.product === it.r.product ? interpolate(star.p, [0, 0.5, 1], [1, 1.45, 1], CLAMP) : 1;
      const focusP = rowFocus && rowFocus.product === it.r.product ? rowFocus.p : 0;
      rendered.push(
        <div
          key={it.r.product}
          style={{
            position: "absolute",
            left: 0,
            top: y - scrollY,
            width,
            height: rowH,
            display: "flex",
            alignItems: "center",
            borderBottom: `1px solid ${C.borderSoft}`,
            opacity: (1 - it.fade) * enter,
            transform: `translateY(${(1 - enter) * 18}px) scaleY(${1 - it.collapse * 0.4})`,
            transformOrigin: "50% 0",
            background: focusP > 0 ? withAlpha(accent, 0.08 * focusP) : "transparent",
            boxShadow: focusP > 0 ? `inset 3px 0 0 ${withAlpha(accent, focusP)}` : "none",
            fontSize: 15,
            color: C.ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {TABLE_COLS.map((c) => (
            <div key={c.id} style={{ width: c.w, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: c.align === "left" ? "flex-start" : c.align === "right" ? "flex-end" : "center", paddingRight: c.align === "right" ? 14 : 0, paddingLeft: c.align === "left" ? 4 : 0, boxSizing: "border-box", overflow: "hidden" }}>
              {c.id === "watch" ? <div style={{ transform: `scale(${pop})` }}>{cell(c.id, it.r, starOn)}</div> : cell(c.id, it.r, starOn)}
            </div>
          ))}
        </div>,
      );
      visIdx++;
    }
    if (h > 0.5) visIdx += inView ? 0 : 1;
    y += h;
  }
  const contentH = y;
  const thumbH = contentH > TABLE_BODY_H ? Math.max(40, (TABLE_BODY_H * TABLE_BODY_H) / contentH) : 0;
  const thumbY = contentH > TABLE_BODY_H ? (scrollY / (contentH - TABLE_BODY_H)) * (TABLE_BODY_H - thumbH) : 0;
  let hx = 0;
  const bands = TABLE_COLS.map((c) => {
    const x = hx;
    hx += c.w;
    return { ...c, x };
  });
  return (
    <div style={{ position: "relative", width, height: TABLE.headerH + TABLE_BODY_H, fontFamily: font }}>
      {/* header */}
      <div style={{ position: "absolute", left: 0, top: 0, width, height: TABLE.headerH, display: "flex", alignItems: "center", borderBottom: `1px solid ${C.border}`, fontSize: 14, fontWeight: 600, color: C.ink }}>
        {TABLE_COLS.map((c) => (
          <div key={c.id} style={{ width: c.w, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: c.align === "left" ? "flex-start" : c.align === "right" ? "flex-end" : "center", paddingRight: c.align === "right" ? 14 : 0, paddingLeft: c.align === "left" ? 34 : 0, boxSizing: "border-box", whiteSpace: "nowrap" }}>
            {c.label}
            {HELP_COLS.has(c.id) ? <Help /> : null}
            {c.id !== "watch" ? <Chevrons /> : null}
          </div>
        ))}
      </div>
      {/* body */}
      <div style={{ position: "absolute", left: 0, top: TABLE.headerH, width, height: TABLE_BODY_H, overflow: "hidden" }}>{rendered}</div>
      {thumbH > 0 ? <div style={{ position: "absolute", right: 2, top: TABLE.headerH + thumbY, width: 6, height: thumbH, borderRadius: 3, background: withAlpha(C.muted, 0.35) }} /> : null}
      {/* column highlight bands */}
      {highlights.map((h) => {
        const b = bands.find((x) => x.id === h.column);
        if (!b || h.p <= 0) return null;
        return (
          <div
            key={h.column}
            style={{
              position: "absolute",
              left: b.x - 4,
              top: -4,
              width: b.w + 8,
              height: TABLE.headerH + TABLE_BODY_H + 4,
              borderRadius: 12,
              border: `2px solid ${withAlpha(accent, 0.9 * h.p)}`,
              background: withAlpha(accent, 0.07 * h.p),
              boxShadow: `0 0 40px ${withAlpha(accent, 0.18 * h.p)}`,
              transform: `scale(${1.03 - 0.03 * h.p})`,
              opacity: Math.min(1, h.p * 1.5),
              pointerEvents: "none",
            }}
          />
        );
      })}
    </div>
  );
};
