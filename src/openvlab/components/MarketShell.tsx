import React from "react";
import { interpolate, interpolateColors } from "remotion";
import { C, CLAMP, EASE, withAlpha } from "../theme";
import { CARDS, FILTER, NAV_H, TABLE, TOOLBAR, WIN } from "../layout";
import type { SectorCount } from "../data";
import { BrandMark } from "./BrandMark";
import { Block, SectorIcon } from "./ui";

const NAV = ["市场", "行情", "波动率", "期货", "异动", "策略", "GEX", "API", "交易", "自选"];

/**
 * Real UI metrics × S (the 1600-px window renders the desktop page at 1.15× for legibility).
 * - CategoryFilterTabs.tsx: PillTabs (板块/交易所/自选, h-6 px-3 text-sm gap-1.5, icon 16, container
 *   `border-border/60 bg-muted/40 rounded-lg border p-0.5`) + inline option row `gap-3`, each option
 *   `h-7 px-2.5 rounded-md text-sm font-medium`, icon 14 + gap-1; selected `bg-primary text-primary-foreground`,
 *   idle `text-muted-foreground hover:bg-accent/35`. No dropdown – sector filtering is these inline options.
 * - MarketDataToggles / NightTradingFilter.tsx: rightSlot = Switch + 「仅夜盘」.
 * - MarketContentToolbar.tsx: grid [1fr auto 1fr] – 选择品种 | PillTabs 表格/全景图 (centre) |
 *   quick filters 平值隐波 · 隐波百分位 (MARKET_METRIC_TOOLBAR_QUICK_FIELDS) + outline 筛选 + outline 列配置.
 */
const S = 1.15;
const FB_PAD = 16 * S;
const TAB_H = 24 * S;
const TAB_PX = 12 * S;
const TAB_GAP = 2 * S;
const TAB_PAD = 2 * S;
const OPT_H = 28 * S;
const OPT_PX = 10 * S;
const OPT_GAP = 12 * S;
const FS = 14 * S;
const ICON = 16 * S;
const OPT_ICON = 14 * S;
const glyphW = (label: string) => Array.from(label).reduce((a, ch) => a + (/[\u0000-\u00ff]/.test(ch) ? FS * 0.56 : FS), 0);
const tabW = (label: string) => TAB_PX * 2 + ICON + 6 * S + glyphW(label);
const optW = (label: string) => OPT_PX * 2 + OPT_ICON + 4 * S + glyphW(label);
const MAIN_TABS = ["板块", "交易所", "自选"];
const TABS_BOX_W = TAB_PAD * 2 + 2 + MAIN_TABS.reduce((a, l) => a + tabW(l), 0) + TAB_GAP * (MAIN_TABS.length - 1);
const OPT_X0 = FB_PAD + TABS_BOX_W + 12 * S;
const VIEW_TABS = ["表格", "全景图"];
const VIEW_BOX_W = TAB_PAD * 2 + 2 + VIEW_TABS.reduce((a, l) => a + tabW(l), 0) + TAB_GAP;
const VIEW_BOX_H = TAB_H + TAB_PAD * 2 + 2;

/** Rects (window coords) of the inline sector options: labels[0] = 全部. */
export const sectorOptionRects = (labels: string[]) => {
  let x = OPT_X0;
  return labels.map((l) => {
    const r = { x, y: FILTER.y + (FILTER.h - OPT_H) / 2, w: optW(l), h: OPT_H };
    x += r.w + OPT_GAP;
    return r;
  });
};

// toolbar right group (absolute, right-aligned like justify-self-end): quick filters · 筛选 · 列配置
const BTN_W = (label: string) => 12 * S * 2 + ICON + 7 * S + glyphW(label);
const BADGE_W = 2 * S + 16 * S;
const COLCFG_X = TABLE.w - BTN_W("列配置");
const filterBtnX = (badge: number) => COLCFG_X - 8 * S - BTN_W("筛选") - BADGE_W * badge;
export const CHIPS_ROW = { h: 28 * S, gap: 8 * S };

/** Positions (window coords) of interactive targets, used by the camera / cursor. */
export const SHELL_TARGETS = {
  filterBtn: { x: TABLE.x + filterBtnX(0), y: TOOLBAR.y + (TOOLBAR.h - 36 * S * 0.92) / 2, w: BTN_W("筛选"), h: 36 * S * 0.92 },
  /** 「清除全部」 in the active-filter chip row (x is approximate: chip width + gap) */
  clearAll: (chipLabel: string) => ({ x: TABLE.x + 10 * S + glyphW(chipLabel) * (12 / 14) + 34 * S + 6 * S, y: TOOLBAR.y + TOOLBAR.h + 2, w: 56 * S, h: CHIPS_ROW.h }),
  viewTabs: { x: TABLE.x + (TABLE.w - VIEW_BOX_W) / 2, y: TOOLBAR.y + (TOOLBAR.h - VIEW_BOX_H) / 2, w: VIEW_BOX_W, h: VIEW_BOX_H },
  get viewPanorama() {
    const t = this.viewTabs;
    return { x: t.x + 1 + TAB_PAD + tabW("表格") + TAB_GAP, y: t.y + 1 + TAB_PAD, w: tabW("全景图"), h: TAB_H };
  },
};

const Icon: React.FC<{ d: React.ReactNode; size: number; color: string; sw?: number }> = ({ d, size, color, sw = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{d}</svg>
);
/* lucide paths */
const SHAPES = <><path d="M8.3 10a.7.7 0 0 1-.626-1.079L11.4 3a.7.7 0 0 1 1.198-.043L16.3 8.9a.7.7 0 0 1-.572 1.1Z" /><rect x="3" y="14" width="7" height="7" rx="1" /><circle cx="17.5" cy="17.5" r="3.5" /></>;
const LANDMARK = <><path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18M12 2l8 5H4z" /></>;
const BOOKMARK = <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />;
const GRID2 = <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" /></>;
const TABLE2 = <><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" /></>;
const SCATTER = <><circle cx="7.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="18.5" cy="5.5" r=".5" fill="currentColor" /><circle cx="11.5" cy="11.5" r=".5" fill="currentColor" /><circle cx="7.5" cy="16.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="14.5" r=".5" fill="currentColor" /><path d="M3 3v16a2 2 0 0 0 2 2h16" /></>;
const FILTER_I = <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const LIST_FILTER = <path d="M3 6h18M7 12h10M10 18h4" />;
const COLUMNS3 = <><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 3v18M15 3v18" /></>;

/** PillTabs.tsx (variant primary): container bg-muted p-0.5 rounded-lg; active pill bg-primary rounded-md. */
const PillTabs: React.FC<{ items: { label: string; icon: React.ReactNode }[]; active: number[]; accent: string; boxStyle?: React.CSSProperties; pressIdx?: number; press?: number }> = ({ items, active, accent, boxStyle, pressIdx = -1, press = 0 }) => (
  <div style={{ display: "inline-flex", gap: TAB_GAP, padding: TAB_PAD, borderRadius: 8 * S, background: withAlpha(C.mutedBg, 0.4), border: `1px solid ${withAlpha(C.border, 0.6)}`, ...boxStyle }}>
    {items.map((it, i) => {
      const a = active[i] ?? 0;
      const color = interpolateColors(a, [0, 1], [C.muted, "#000000"]);
      return (
        <div key={it.label} style={{ position: "relative", height: TAB_H, width: tabW(it.label), borderRadius: 6 * S, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 * S, fontSize: FS, fontWeight: 500, color, whiteSpace: "nowrap", transform: i === pressIdx ? `scale(${1 - press * 0.07})` : undefined }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: 6 * S, background: accent, opacity: a }} />
          <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6 * S }}>
            <Icon d={it.icon} size={ICON} color={color} />
            {it.label}
          </span>
        </div>
      );
    })}
  </div>
);

const OutlineBtn: React.FC<{ icon: React.ReactNode; label: string; badge?: number; badgeText?: string; press?: number; style?: React.CSSProperties }> = ({ icon, label, badge = 0, badgeText = "", press = 0, style }) => (
  <div style={{ ...style, transform: `scale(${1 - press * 0.07})`, height: 36 * S * 0.92, padding: `0 ${12 * S}px`, borderRadius: 7 * S, border: `1px solid ${C.border}`, background: withAlpha(C.mutedBg, 0.25), display: "flex", alignItems: "center", gap: 7 * S, fontSize: FS, fontWeight: 500, color: C.ink, boxSizing: "border-box", whiteSpace: "nowrap" }}>
    <Icon d={icon} size={ICON} color={C.ink} />
    {label}
    {badge > 0 ? (
      <span style={{ marginLeft: 2 * S - 7 * S, width: 16 * S * badge, height: 16 * S, borderRadius: 999, background: "#AFF33E", color: "#000", fontSize: 10 * S, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transform: `scale(${badge})` }}>{badgeText}</span>
    ) : null}
  </div>
);
const ACCENT_DARK = "#1F5A3C"; // --accent (dark) oklch(0.3925 0.0896 152.5353)

/**
 * Market page shell: top nav, sector/filter bar, ranking-card slot, toolbar (表格 / 全景图), table slot.
 * Blocks resolve from skeleton → UI with resolveT (frames, launch AppWindow mechanic).
 */
export const MarketShell: React.FC<{
  resolveT: number;
  brandName: string;
  logoSrc: string;
  accent: string;
  font: string;
  sectors: SectorCount[];
  total: number;
  /** index into sectors of the active tab (−1 = 全部) and 0..1 switch progress */
  activeSector?: number;
  sectorP?: number;
  /** continuous index into [全部, ...sectors] of the option under the cursor (−1 = none) */
  hoverOpt?: number;
  optPress?: number;
  viewP?: number;
  /** 0..1 – dims the toolbar while column-note pills sit on top of it */
  toolbarDim?: number;
  /** 数值筛选 state: badge on 筛选, active quick-filter label, chip row (pushes the table down), button press */
  metricUi?: { badge: number; count: number; quickField: string; activeLabel: string; active: number; chipsP: number; hidden: number; press: number; clearHover?: number };
  viewPress?: number;
  asOf: string;
  cards: React.ReactNode;
  table: React.ReactNode;
}> = ({ resolveT, brandName, logoSrc, accent, font, sectors, total, activeSector = -1, sectorP = 0, hoverOpt = -1, optPress = 0, viewP = 0, toolbarDim = 0, metricUi, viewPress = 0, asOf, cards, table }) => {
  const P = (i: number) => interpolate(resolveT, [i * 7, i * 7 + 26], [0, 1], { ...CLAMP, easing: EASE });
  const tabs = [{ code: "ALL", label: "全部", count: total }, ...sectors];
  const optRects = sectorOptionRects(tabs.map((t) => t.label));
  const activeOf = (i: number) => (i === 0 ? 1 - (activeSector >= 0 ? sectorP : 0) : activeSector === i - 1 ? sectorP : 0);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: WIN.h, borderRadius: 22, background: C.page, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: "hidden", fontFamily: font, color: C.ink }}>
      {/* nav */}
      <Block p={P(0)} accent={accent} bare radius={0} style={{ position: "absolute", left: 0, top: 0, width: WIN.w, height: NAV_H }}>
        <div style={{ height: NAV_H, display: "flex", alignItems: "center", padding: "0 22px", gap: 26, borderBottom: `1px solid ${C.borderSoft}`, background: "#07080A" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BrandMark size={28} src={logoSrc} />
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>{brandName}</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {NAV.map((n, i) => (
              <div key={n} style={{ fontSize: 15, padding: "6px 12px", borderRadius: 8, color: i === 0 ? C.ink : C.muted, fontWeight: i === 0 ? 600 : 500, background: i === 0 ? "#1A1C20" : "transparent" }}>{n}</div>
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ width: 300, height: 34, borderRadius: 9, border: `1px solid ${C.border}`, background: "#0E0F12", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: 14, color: C.dim, boxSizing: "border-box" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth={2.2}><circle cx={11} cy={11} r={7} /><path d="M20 20l-3.5-3.5" strokeLinecap="round" /></svg>
            <span style={{ flex: 1 }}>搜索品种、菜单、文档</span>
            <span style={{ border: `1px solid ${C.border}`, borderRadius: 5, padding: "0 6px", fontSize: 12 }}>/</span>
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: "linear-gradient(135deg,#3a3f47,#1d2025)", border: `1px solid ${C.border}` }} />
        </div>
      </Block>

      {/* filter bar – CategoryFilterTabs: PillTabs + inline sector options, rightSlot 仅夜盘 */}
      <Block p={P(1)} accent={accent} bare radius={0} style={{ position: "absolute", left: 0, top: FILTER.y, width: WIN.w, height: FILTER.h }}>
        <div style={{ position: "relative", height: FILTER.h, borderBottom: `1px solid ${C.border}` }}>
          <PillTabs
            items={[{ label: "板块", icon: SHAPES }, { label: "交易所", icon: LANDMARK }, { label: "自选", icon: BOOKMARK }]}
            active={[1, 0, 0]}
            accent={accent}
            boxStyle={{ position: "absolute", left: FB_PAD, top: (FILTER.h - VIEW_BOX_H) / 2 }}
          />
          {tabs.map((t, i) => {
            const r = optRects[i];
            const a = activeOf(i);
            const hov = Math.max(0, 1 - Math.abs(hoverOpt - i) * 1.6) * (1 - a);
            const color = interpolateColors(a, [0, 1], [interpolateColors(hov, [0, 1], [C.muted, C.ink]), "#000000"]);
            const pressed = a > 0 && optPress > 0 && i > 0 ? 1 - optPress * 0.08 : 1;
            return (
              <div key={t.code} style={{ position: "absolute", left: r.x, top: r.y - FILTER.y, width: r.w, height: r.h, borderRadius: 6 * S, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 * S, fontSize: FS, fontWeight: 500, color, whiteSpace: "nowrap", boxSizing: "border-box", border: `1px solid ${a > 0.01 ? withAlpha(accent, a) : "transparent"}`, background: a > 0.01 ? withAlpha(accent, a) : hov > 0 ? withAlpha(ACCENT_DARK, 0.35 * hov) : "transparent", transform: `scale(${pressed})` }}>
                {i > 0 ? <SectorIcon sector={t.code} size={OPT_ICON} /> : <Icon d={GRID2} size={OPT_ICON} color={color} />}
                {t.label}
              </div>
            );
          })}
          <div style={{ position: "absolute", right: FB_PAD, top: 0, height: FILTER.h, display: "flex", alignItems: "center", gap: 8 * S, fontSize: FS, fontWeight: 500, color: C.muted }}>
            <div style={{ width: 32 * S * 0.9, height: 18.4 * S * 0.9, borderRadius: 10 * S, background: C.mutedBg, position: "relative", border: `1px solid ${C.border}`, boxSizing: "border-box" }}>
              <div style={{ position: "absolute", left: 2, top: 1.5, width: 14 * S, height: 14 * S, borderRadius: 7 * S, background: "#EFF2F6" }} />
            </div>
            仅夜盘
          </div>
        </div>
      </Block>

      {/* ranking cards */}
      <Block p={P(2)} accent={accent} bare radius={16} style={{ position: "absolute", left: CARDS.pad, top: CARDS.y, width: WIN.w - CARDS.pad * 2, height: CARDS.h }}>
        {cards}
      </Block>

      {/* toolbar – MarketContentToolbar grid [1fr auto 1fr] */}
      <Block p={P(3.5)} accent={accent} bare radius={10} style={{ position: "absolute", left: TABLE.x, top: TOOLBAR.y, width: TABLE.w, height: TOOLBAR.h }}>
        <div style={{ position: "relative", height: TOOLBAR.h, opacity: 1 - 0.88 * toolbarDim }}>
          <div style={{ position: "absolute", left: 0, top: (TOOLBAR.h - 36) / 2, width: 230, height: 36, borderRadius: 7 * S, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", fontSize: FS, color: C.muted, boxSizing: "border-box" }}>
            <Icon d={LIST_FILTER} size={OPT_ICON} color={C.muted} sw={2.2} />
            <span style={{ flex: 1 }}>选择品种</span>
            <Icon d={<path d="M6 9l6 6 6-6" />} size={13} color={C.muted} sw={2.4} />
          </div>
          <PillTabs
            items={[{ label: "表格", icon: TABLE2 }, { label: "全景图", icon: SCATTER }]}
            active={[1 - viewP, viewP]}
            accent={accent}
            pressIdx={1}
            press={viewPress}
            boxStyle={{ position: "absolute", left: SHELL_TARGETS.viewTabs.x - TABLE.x, top: SHELL_TARGETS.viewTabs.y - TOOLBAR.y, background: C.mutedBg, border: `1px solid ${C.mutedBg}` }}
          />
          <div style={{ position: "absolute", right: 0, top: 0, height: TOOLBAR.h, display: "flex", alignItems: "center", gap: 8 * S }}>
            {["平值隐波", "隐波百分位"].map((l) => {
              // MarketMetricQuickFilter: active → formatMarketMetricRangeLabel + text-primary-ink font-medium
              const on = metricUi && metricUi.quickField === l ? metricUi.active : 0;
              const col = on > 0 ? interpolateColors(on, [0, 1], [C.muted, accent]) : C.muted;
              return (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 * S, padding: `0 ${4 * S}px`, fontSize: FS, color: col, fontWeight: on > 0.5 ? 500 : 400, whiteSpace: "nowrap" }}>
                  <Icon d={FILTER_I} size={14 * S} color={col} />
                  {on > 0.5 ? metricUi!.activeLabel : l}
                </div>
              );
            })}
            <OutlineBtn icon={LIST_FILTER} label="筛选" badge={metricUi?.badge ?? 0} badgeText={String(metricUi?.count ?? "")} press={metricUi?.press ?? 0} />
            <OutlineBtn icon={COLUMNS3} label="列配置" />
          </div>
        </div>
      </Block>

      {/* MarketMetricFilterChips – below the toolbar row (flex-col gap-2); pushes the table down */}
      {metricUi && metricUi.chipsP > 0 ? (
        <div style={{ position: "absolute", left: TABLE.x, top: TOOLBAR.y + TOOLBAR.h + 2, height: CHIPS_ROW.h, display: "flex", alignItems: "center", gap: 6 * S, opacity: metricUi.chipsP, fontSize: 12 * S, whiteSpace: "nowrap" }}>
          <span style={{ height: CHIPS_ROW.h, display: "inline-flex", alignItems: "center", gap: 4 * S, padding: `0 ${6 * S}px 0 ${10 * S}px`, borderRadius: 999, background: withAlpha(accent, 0.1), color: accent, fontWeight: 500 }}>
            {metricUi.activeLabel}
            <Icon d={<path d="M18 6 6 18M6 6l12 12" />} size={12 * S} color={accent} sw={2.2} />
          </span>
          <span style={{ color: (metricUi.clearHover ?? 0) > 0.5 ? C.ink : C.muted, padding: `0 ${4 * S}px` }}>清除全部</span>
          <span style={{ color: C.muted }}>已隐藏 {metricUi.hidden} 个品种</span>
        </div>
      ) : null}

      {/* table */}
      <Block p={P(5)} accent={accent} bare radius={12} style={{ position: "absolute", left: TABLE.x, top: TABLE.y + (metricUi ? (CHIPS_ROW.h + CHIPS_ROW.gap) * metricUi.chipsP : 0), width: TABLE.w, height: WIN.h - TABLE.y - TABLE.bottomPad }}>
        {table}
      </Block>
    </div>
  );
};
