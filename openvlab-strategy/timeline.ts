import { Easing, interpolate } from "remotion";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const sec = (s: number) => Math.round(s * FPS);

/**
 * Shot windows (storyboard · ≈70s).
 * S0 hook → S1 enter → S2 add → S3 drag strike → S4 click leg →
 * S5 template → S6 table → S7 curve → S8 sliders → S9 backtest/CTA
 */
export const SHOTS = [
  { id: "S0", from: 0, to: 4, label: "hook" },
  { id: "S1", from: 4, to: 10, label: "enter" },
  { id: "S2", from: 10, to: 18, label: "add-leg" },
  { id: "S3", from: 18, to: 26, label: "drag-strike" },
  { id: "S4", from: 26, to: 32, label: "click-leg" },
  { id: "S5", from: 32, to: 40, label: "template" },
  { id: "S6", from: 40, to: 48, label: "table" },
  { id: "S7", from: 48, to: 56, label: "curve" },
  { id: "S8", from: 56, to: 66, label: "sliders" },
  { id: "S9", from: 66, to: 70, label: "backtest-cta" },
] as const;

export const TOTAL = sec(70);

export const prog = (frame: number, a: number, b: number, easing = EASE) =>
  interpolate(frame, [sec(a), sec(b)], [0, 1], { ...CLAMP, easing });

export const fadeWin = (frame: number, a: number, b: number, d = 0.45) =>
  prog(frame, a, a + d, EASE_OUT) * (1 - prog(frame, b - d, b, EASE));

export { CLAMP, EASE, EASE_OUT };

/** Floating product window geometry (world == video at cam scale 1). */
export const WIN = {
  left: 110,
  top: 55,
  w: 1700,
  h: 970,
  cx: 110 + 1700 / 2,
  cy: 55 + 970 / 2,
} as const;

/** Absolute hit targets inside the drawn UI (world px). Tuned to StrategyBuilderUI layout. */
export const HIT = {
  addBtn: { x: WIN.left + WIN.w - 118, y: WIN.top + 48 },
  /** Strike ruler midline Y; X follows animated strike. */
  rulerY: WIN.top + 168,
  strikeX: (strike: number, min = 648, max = 1320) =>
    WIN.left + 48 + ((strike - min) / (max - min)) * (WIN.w - 96),
  legPopover: { x: WIN.left + WIN.w * 0.42, y: WIN.top + 210 },
  menuItem: { x: WIN.left + 210, y: WIN.top + 320 },
  tableToggle: { x: WIN.left + 90, y: WIN.top + WIN.h - 48 },
  curveToggle: { x: WIN.left + 178, y: WIN.top + WIN.h - 48 },
  rangeThumb: (pct: number) => ({
    x: WIN.left + 80 + (pct / 20) * 320,
    y: WIN.top + WIN.h - 118,
  }),
  ivThumb: (mult: number) => ({
    x: WIN.left + WIN.w / 2 + 40 + ((mult - 0.1) / 1.9) * 360,
    y: WIN.top + WIN.h - 118,
  }),
  backtestBtn: { x: WIN.left + WIN.w - 90, y: WIN.top + 48 },
  center: { x: WIN.cx, y: WIN.cy },
} as const;

/* ---------- UI state driven by frame ---------- */

export type ViewMode = "table" | "curve";

export type DemoState = {
  /** Window enter 0–1 */
  winIn: number;
  /** Leg tag visible 0–1 */
  legVisible: number;
  /** Current strike on ruler (drag animates) */
  strike: number;
  /** Leg popover / selection highlight */
  legOpen: number;
  /** Strategy template menu open */
  menuOpen: number;
  /** Selected template index (−1 none) */
  templateIdx: number;
  viewMode: ViewMode;
  /** 标的范围 ±% */
  rangePct: number;
  /** IV multiplier 0.1–2 */
  ivMult: number;
  /** Absolute IV % display */
  ivPct: number;
  /** Show 回测模拟 button */
  showBacktest: number;
  /** Button press */
  addPress: number;
  backtestPress: number;
  tablePress: number;
  curvePress: number;
  /** Metrics / heatmap respond slightly with strike & IV */
  metricsPulse: number;
};

const pressAt = (frame: number, clickSec: number) =>
  interpolate(frame, [sec(clickSec) - 4, sec(clickSec), sec(clickSec) + 10], [0, 1, 0], CLAMP);

export const demoStateAt = (frame: number): DemoState => {
  const winIn = prog(frame, 4.2, 5.6, EASE_OUT);
  const legVisible = prog(frame, 12.2, 13.0, EASE_OUT);

  // S3 drag: start ~900 → settle 864
  const dragP = prog(frame, 19.2, 24.5, Easing.inOut(Easing.cubic));
  const strike =
    frame < sec(12.2)
      ? 864
      : interpolate(dragP, [0, 1], [912, 864], CLAMP);

  const legOpen = fadeWin(frame, 27.2, 31.4, 0.35);
  const menuOpen = fadeWin(frame, 33.0, 39.2, 0.35);
  const templateIdx = frame >= sec(36.4) ? 0 : -1;

  const viewMode: ViewMode = frame >= sec(50.2) ? "curve" : "table";

  // S8: range 4.0 → 6.1 → 8.5 → 6.1; IV mult 1 → 1.45 → 0.85 → 1
  const rangePct = (() => {
    if (frame < sec(57)) return 6.1;
    if (frame < sec(60.5)) return interpolate(frame, [sec(57.2), sec(60.2)], [4.2, 8.4], CLAMP);
    if (frame < sec(62)) return interpolate(frame, [sec(60.5), sec(61.8)], [8.4, 6.1], CLAMP);
    return 6.1;
  })();

  const ivMult = (() => {
    if (frame < sec(61.5)) return 1;
    if (frame < sec(64.2)) return interpolate(frame, [sec(61.8), sec(64.0)], [1, 1.55], CLAMP);
    if (frame < sec(65.5)) return interpolate(frame, [sec(64.2), sec(65.3)], [1.55, 1], CLAMP);
    return 1;
  })();

  const showBacktest = prog(frame, 64.8, 65.6, EASE_OUT);
  const metricsPulse = Math.max(dragP * 0.5, Math.abs(ivMult - 1) * 0.8, Math.abs(rangePct - 6.1) * 0.15);

  return {
    winIn,
    legVisible,
    strike: Math.round(strike),
    legOpen,
    menuOpen,
    templateIdx,
    viewMode,
    rangePct: Math.round(rangePct * 10) / 10,
    ivMult,
    ivPct: Math.round(21.23 * ivMult * 100) / 100,
    showBacktest,
    addPress: pressAt(frame, 12.0),
    backtestPress: pressAt(frame, 66.8),
    tablePress: 0,
    curvePress: pressAt(frame, 50.0),
    metricsPulse,
  };
};

/** Camera keyframes (Launch pattern) — focus hotspots per shot. */
export type CamKey = { frame: number; x: number; y: number; scale: number; easing?: (t: number) => number };

export const cameraKeys = (): CamKey[] => {
  const c = HIT.center;
  return [
    { frame: sec(0), x: c.x, y: c.y, scale: 1 },
    { frame: sec(4), x: c.x, y: c.y, scale: 1 },
    { frame: sec(5.5), x: c.x, y: c.y - 20, scale: 1.05, easing: Easing.inOut(Easing.sin) },
    { frame: sec(9.5), x: c.x, y: c.y - 10, scale: 1.08 },
    /* S2 add button */
    { frame: sec(10.5), x: HIT.addBtn.x - 40, y: HIT.addBtn.y + 20, scale: 1.55, easing: EASE },
    { frame: sec(13.5), x: HIT.addBtn.x - 80, y: HIT.rulerY + 40, scale: 1.65 },
    { frame: sec(17), x: HIT.strikeX(888), y: HIT.rulerY, scale: 1.7 },
    /* S3 drag along ruler */
    { frame: sec(19), x: HIT.strikeX(900), y: HIT.rulerY, scale: 1.85, easing: EASE },
    { frame: sec(24), x: HIT.strikeX(864), y: HIT.rulerY, scale: 1.9 },
    { frame: sec(25.5), x: HIT.strikeX(864), y: HIT.rulerY + 30, scale: 1.7 },
    /* S4 leg click */
    { frame: sec(27), x: HIT.strikeX(864), y: HIT.rulerY + 10, scale: 1.95, easing: EASE },
    { frame: sec(31), x: HIT.strikeX(864), y: HIT.rulerY + 40, scale: 1.6 },
    /* S5 menu */
    { frame: sec(33), x: HIT.menuItem.x + 40, y: HIT.menuItem.y, scale: 1.55, easing: EASE },
    { frame: sec(38.5), x: HIT.menuItem.x + 60, y: HIT.menuItem.y + 20, scale: 1.45 },
    /* S6 table overview */
    { frame: sec(40.5), x: WIN.cx, y: WIN.cy + 40, scale: 1.2, easing: EASE },
    { frame: sec(46.5), x: WIN.cx, y: WIN.cy + 60, scale: 1.28 },
    /* S7 curve */
    { frame: sec(49), x: HIT.curveToggle.x + 40, y: HIT.curveToggle.y - 80, scale: 1.45, easing: EASE },
    { frame: sec(52), x: WIN.cx, y: WIN.cy + 20, scale: 1.35 },
    { frame: sec(55), x: WIN.cx, y: WIN.cy + 40, scale: 1.3 },
    /* S8 sliders */
    { frame: sec(56.5), x: HIT.rangeThumb(6).x + 40, y: HIT.rangeThumb(6).y - 20, scale: 1.75, easing: EASE },
    { frame: sec(60.5), x: HIT.rangeThumb(8).x + 20, y: HIT.rangeThumb(8).y - 10, scale: 1.85 },
    { frame: sec(62), x: HIT.ivThumb(1).x, y: HIT.ivThumb(1).y - 10, scale: 1.8, easing: EASE },
    { frame: sec(64.5), x: HIT.ivThumb(1.4).x, y: HIT.ivThumb(1.4).y - 10, scale: 1.9 },
    /* S9 backtest */
    { frame: sec(66), x: HIT.backtestBtn.x - 30, y: HIT.backtestBtn.y + 30, scale: 1.55, easing: EASE },
    { frame: sec(67.5), x: WIN.cx, y: WIN.cy, scale: 1.1 },
    { frame: sec(70), x: WIN.cx, y: WIN.cy, scale: 1 },
  ];
};
