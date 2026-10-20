import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { C, CLAMP, EASE_OUT, withAlpha } from "../theme";

/**
 * Desktop 「数值筛选」 dialog – MarketMetricFilter.tsx (MarketMetricFilterButton → DialogContent
 * `bg-card rounded-2xl sm:max-w-2xl p-0` + MarketMetricFilterPanel), rendered at S = 1.15.
 * - header px-6 pt-6 pb-4: 「数值筛选」 text-lg semibold + 「设置各指标的取值范围，留空表示不限制」 + ghost X
 * - 快速筛选 chips (MARKET_METRIC_QUICK_FILTERS): h-8 rounded-full px-3.5 text-[13px]; idle bg-muted,
 *   active border-ring bg-primary text-primary-foreground + Check
 * - DesktopRangeField grid (DESKTOP_FIELD_ORDER, 2 cols, gap-x-4 gap-y-3.5): dot + label text-[13px],
 *   h-10 rounded-lg border-input box: 最小值 – 最大值 (font-mono text-sm) + unit cell bg-muted
 * - footer border-t px-6 py-4: 「尚未设置条件 / 已设置 N 项条件」 · outline 重置 · primary 应用 (rounded-full)
 */
const S = 1.15;
export const METRIC_DIALOG = { w: 672 * S, pad: 24 * S };

export const QUICK_FILTERS = ["隐波≥20", "隐波高位", "隐波低位", "高溢价", "近月"];
export const DESKTOP_FIELDS: { field: string; label: string; unit?: string }[] = [
  { field: "atmv_current", label: "平值隐波" },
  { field: "atmv_1dchg", label: "隐波变化" },
  { field: "valphaT", label: "隐波涨速" },
  { field: "rv22", label: "实波" },
  { field: "atmv_percentile", label: "隐波百分位", unit: "%" },
  { field: "skew_current", label: "偏度" },
  { field: "skew_percentile", label: "偏度百分位", unit: "%" },
  { field: "carry", label: "溢价" },
  { field: "ctn", label: "标的涨幅", unit: "%" },
  { field: "remainingDays", label: "剩余时间", unit: "天" },
];

// geometry (dialog-local) – exported so the cursor / camera can aim at controls
const HEADER_H = (24 + 28 + 6 + 20 + 16) * S;
const CHIP_H = 32 * S;
const CHIP_GAP = 8 * S;
const FS13 = 13 * S;
const chipW = (label: string) => 14 * S * 2 + Array.from(label).reduce((a, ch) => a + (/[\u0000-\u00ff]/.test(ch) ? FS13 * 0.6 : FS13), 0) + 18 * S;
const GRID_TOP = HEADER_H + CHIP_H + 24 * S;
const FIELD_H = (20 + 6 + 40) * S;
const ROW_GAP = 14 * S;
const COL_GAP = 16 * S;
const COL_W = (METRIC_DIALOG.w - METRIC_DIALOG.pad * 2 - COL_GAP) / 2;
const FOOTER_TOP = GRID_TOP + 5 * FIELD_H + 4 * ROW_GAP + 24 * S;
const FOOTER_H = (16 * 2 + 36) * S;
export const METRIC_DIALOG_H = FOOTER_TOP + FOOTER_H;

export const metricDialogTargets = () => {
  let x = METRIC_DIALOG.pad;
  const chips = QUICK_FILTERS.map((l) => {
    const r = { x, y: HEADER_H, w: chipW(l), h: CHIP_H };
    x += r.w + CHIP_GAP;
    return r;
  });
  const fieldRect = (i: number) => ({ x: METRIC_DIALOG.pad + (i % 2) * (COL_W + COL_GAP), y: GRID_TOP + Math.floor(i / 2) * (FIELD_H + ROW_GAP), w: COL_W, h: FIELD_H });
  const applyW = (24 * 2 + 28) * S;
  const apply = { x: METRIC_DIALOG.w - METRIC_DIALOG.pad - applyW, y: FOOTER_TOP + 16 * S, w: applyW, h: 36 * S };
  return { chips, fieldRect, apply };
};

const Ico: React.FC<{ d: React.ReactNode; size: number; color: string; sw?: number }> = ({ d, size, color, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{d}</svg>
);
const CARD_BG = "#121212"; // --card (dark) oklch(0.16 0 0)
const INPUT_BORDER = "#2B2B2B"; // --input (dark) oklch(0.29 0 0)

export const MetricFilterDialog: React.FC<{
  /** 0..1 open progress (overlay fade + zoom-in-95) */
  open: number;
  font: string;
  mono: string;
  accent: string;
  /** quick filter label that gets toggled, and 0..1 its active state */
  quickLabel: string;
  quickActive: number;
  /** field → {min,max} draft values shown in the inputs, with 0..1 reveal */
  draft: Record<string, { min: string; max: string }>;
  draftP: number;
  /** field whose box shows focus ring (0..1) */
  focusField?: string;
  focusP?: number;
  hoverChip?: number;
  applyPress?: number;
  applyHover?: number;
  width: number;
  height: number;
  /** dialog top-left in window coords */
  left: number;
  top: number;
}> = ({ open, font, mono, accent, quickLabel, quickActive, draft, draftP, focusField, focusP = 0, hoverChip = -1, applyPress = 0, applyHover = 0, width, height, left, top }) => {
  if (open <= 0) return null;
  const o = interpolate(open, [0, 1], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const t = metricDialogTargets();
  const activeCount = draftP > 0.5 ? Object.values(draft).filter((r) => r.min !== "" || r.max !== "").length : 0;
  return (
    <div style={{ position: "absolute", inset: 0, width, height, fontFamily: font }}>
      {/* DialogOverlay bg-black/50 */}
      <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${0.5 * o})` }} />
      <div style={{ position: "absolute", left, top, width: METRIC_DIALOG.w, height: METRIC_DIALOG_H, borderRadius: 16 * S, background: CARD_BG, border: `1px solid ${C.border}`, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", opacity: o, transform: `scale(${0.95 + 0.05 * o})`, transformOrigin: "50% 50%", overflow: "hidden", color: C.ink }}>
        {/* header */}
        <div style={{ position: "absolute", left: METRIC_DIALOG.pad, top: 24 * S, right: METRIC_DIALOG.pad }}>
          <div style={{ fontSize: 18 * S, fontWeight: 600, lineHeight: `${28 * S}px` }}>数值筛选</div>
          <div style={{ fontSize: 14 * S, color: C.muted, marginTop: 6 * S, lineHeight: `${20 * S}px` }}>设置各指标的取值范围，留空表示不限制</div>
          <div style={{ position: "absolute", right: -8 * S, top: -4 * S, width: 32 * S, height: 32 * S, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Ico d={<path d="M18 6 6 18M6 6l12 12" />} size={16 * S} color={C.muted} />
          </div>
        </div>
        {/* 快速筛选 */}
        {QUICK_FILTERS.map((l, i) => {
          const r = t.chips[i];
          const a = l === quickLabel ? quickActive : 0;
          const hov = Math.max(0, 1 - Math.abs(hoverChip - i) * 1.5) * (1 - a);
          const color = interpolateColors(a, [0, 1], [withAlpha(C.ink, 0.8), "#000000"]);
          return (
            <div key={l} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 999, boxSizing: "border-box", border: `1px solid ${a > 0.02 ? withAlpha(accent, a) : hov > 0 ? withAlpha(C.border, hov) : "transparent"}`, background: a > 0.02 ? interpolateColors(a, [0, 1], [C.mutedBg, accent]) : hov > 0 ? interpolateColors(hov, [0, 1], [C.mutedBg, "#3a3a3a"]) : C.mutedBg, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 * S, fontSize: FS13, fontWeight: 500, color, whiteSpace: "nowrap" }}>
              {a > 0.5 ? <Ico d={<path d="M20 6 9 17l-5-5" />} size={14 * S} color="#000" sw={2.4} /> : null}
              {l}
            </div>
          );
        })}
        {/* range fields */}
        {DESKTOP_FIELDS.map((fd, i) => {
          const r = t.fieldRect(i);
          const d = draft[fd.field];
          const filled = d && draftP > 0 ? draftP : 0;
          const active = filled > 0.5;
          const focus = focusField === fd.field ? focusP : 0;
          return (
            <div key={fd.field} style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h }}>
              <div style={{ height: 20 * S, display: "flex", alignItems: "center", gap: 6 * S, fontSize: FS13, fontWeight: 500 }}>
                <span style={{ width: 6 * S, height: 6 * S, borderRadius: 999, background: active ? accent : C.border }} />
                {fd.label}
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 26 * S, height: 40 * S, borderRadius: 8 * S, boxSizing: "border-box", border: `1px solid ${focus > 0 ? interpolateColors(focus, [0, 1], [INPUT_BORDER, accent]) : INPUT_BORDER}`, boxShadow: focus > 0 ? `0 0 0 ${3 * focus}px ${withAlpha(accent, 0.25 * focus)}` : "none", display: "flex", alignItems: "center", overflow: "hidden" }}>
                {(["min", "max"] as const).map((k, ki) => {
                  const v = d && filled > 0 ? d[k] : "";
                  return (
                    <React.Fragment key={k}>
                      {ki === 1 ? <span style={{ width: 10 * S, height: 1, background: withAlpha(C.muted, 0.5), flexShrink: 0 }} /> : null}
                      <span style={{ flex: 1, minWidth: 0, padding: `0 ${12 * S}px`, fontFamily: mono, fontSize: 14 * S, fontVariantNumeric: "tabular-nums", color: v ? C.ink : withAlpha(C.muted, 0.7), opacity: v ? Math.min(1, filled * 1.4) : 1 }}>{v || (k === "min" ? "最小值" : "最大值")}</span>
                    </React.Fragment>
                  );
                })}
                {fd.unit ? <span style={{ height: "100%", display: "flex", alignItems: "center", padding: `0 ${12 * S}px`, background: C.mutedBg, color: C.muted, fontSize: 12 * S, borderLeft: `1px solid ${C.border}` }}>{fd.unit}</span> : null}
              </div>
            </div>
          );
        })}
        {/* footer */}
        <div style={{ position: "absolute", left: 0, right: 0, top: FOOTER_TOP, height: FOOTER_H, borderTop: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${METRIC_DIALOG.pad}px`, boxSizing: "border-box" }}>
          <span style={{ fontSize: 14 * S, color: C.muted }}>
            {activeCount > 0 ? (
              <>已设置 <span style={{ color: C.ink, fontWeight: 600 }}>{activeCount}</span> 项条件</>
            ) : (
              "尚未设置条件"
            )}
          </span>
          <div style={{ display: "flex", gap: 8 * S }}>
            <div style={{ height: 36 * S, padding: `0 ${16 * S}px`, borderRadius: 999, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8 * S, fontSize: 14 * S, fontWeight: 500, opacity: activeCount > 0 ? 1 : 0.5, boxSizing: "border-box" }}>
              <Ico d={<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></>} size={16 * S} color={C.ink} />
              重置
            </div>
            <div style={{ height: 36 * S, width: t.apply.w, borderRadius: 999, background: accent, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 * S, fontWeight: 600, transform: `scale(${1 - applyPress * 0.07})`, filter: applyHover > 0 ? `brightness(${1 - 0.08 * applyHover})` : undefined }}>
              应用
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
