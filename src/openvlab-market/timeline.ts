import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CLAMP, EASE, EASE_OUT, beatProgress, beatToFrame, metricShotStart, storyBeat } from "./theme";
import { fill, metricLabel } from "./data";
import { CARDS, PREMIUM_SPANS, TABLE, TABLE_BODY_H, TOOLBAR, TABLE_COLS, WIN, WIN_LEFT, WIN_TOP, cardColumnRect, centerOf, toWorld } from "./layout";
import { CameraKeyframe, getCameraState, worldToScreen } from "../shared/components/Camera";
import { CursorKey, getCursorPos, pressCurve } from "./components/Cursor";
import { SHELL_TARGETS, sectorOptionRects } from "./components/MarketShell";
import { getQuadGeometry } from "./components/QuadrantChart";
import { type SfxEvent } from "./components/Sfx";
import { METRIC_DIALOG, METRIC_DIALOG_H, QUICK_FILTERS, metricDialogTargets } from "./components/MetricFilterDialog";
import type { MarketModel } from "./data";
import type { OpenVLabProps } from "./schema";

/** Continuous slot-reel position (launch LaunchVideo.tsx reelPosition) – used by the stat reel. */
const reelPosition = (t: number, stepFrames: number, maxSteps = Infinity) => {
  if (t <= 0) return 0;
  const u = Math.min(t / stepFrames, maxSteps);
  const k = Math.floor(u);
  return Math.min(maxSteps, k + interpolate(u - k, [0, 0.75], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) }));
};

const fadeWindow = (f: number, a: number, b: number, fade = 8) => interpolate(f, [a - fade, a, b, b + fade], [0, 1, 1, 0], CLAMP);

/**
 * Shared scene timeline (scene-local frames): story-beat helpers, world geometry, camera keyframes,
 * cursor path, SFX events and every per-shot animation value. Scenes under ./scenes only render.
 */
export const useMarketTimeline = (props: OpenVLabProps & { model: MarketModel }) => {
  const { brandName, url, tagline, logoSrc, accentColor: accent, bpm, copy, model } = props;
  const T = model.tokens;
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  // story beats (window → outro) are remapped onto the timeline (theme.ts storyBeat); the opening uses raw beats
  const b = (beat: number) => beatToFrame(storyBeat(beat), bpm);
  const bp = (a: number, z: number, e = EASE) => beatProgress(f, bpm, storyBeat(a), storyBeat(z), e);
  const nb = (beat: number) => beatToFrame(beat, bpm);
  const nbp = (a: number, z: number, e = EASE) => beatProgress(f, bpm, a, z, e);
  const dur = (beats: number) => beatToFrame(beats, bpm);

  /* ---------- world geometry ---------- */
  const center = { x: W / 2, y: H / 2 };
  const winCap = { x: WIN.cx, y: WIN.cy + 45 };
  const barC = { x: W / 2, y: H / 2, w: 1100, h: 116, font: 38 };
  const sendOf = (bar: { x: number; y: number; w: number; h: number }) => ({ x: bar.x + bar.w / 2 - bar.h / 2, y: bar.y });
  const cards01 = { x: WIN_LEFT + CARDS.pad, y: WIN_TOP + CARDS.y, w: 2 * ((WIN.w - CARDS.pad * 2 - CARDS.gap * 3) / 4) + CARDS.gap, h: CARDS.h };
  const rankFocus = { x: cards01.x + cards01.w / 2, y: cards01.y + cards01.h / 2 + 70 };
  const premFocus = { x: rankFocus.x + cards01.w + CARDS.gap, y: rankFocus.y };
  const tableFocus = { x: WIN.cx, y: 700 };
  const quadC = { x: WIN.cx, y: WIN.cy + 50 };
  const viewBtn = centerOf(toWorld(SHELL_TARGETS.viewPanorama));
  const focusIdx = Math.max(0, model.sectors.findIndex((s) => s.code === model.focus?.code));
  // inline sector options right of the 板块/交易所/自选 tabs (CategoryFilterTabs) – no dropdown
  const optRects = sectorOptionRects(["全部", ...model.sectors.map((s) => s.label)]).map((r) => toWorld(r));
  const targetOpt = focusIdx + 1;
  const optAll = centerOf(optRects[0]);
  const optTarget = centerOf(optRects[targetOpt]);
  // frame the whole filter row: tabs (left edge of the window) → last sector option
  const optFocus = { x: (WIN_LEFT + optRects[optRects.length - 1].x + optRects[optRects.length - 1].w) / 2 + 20, y: optAll.y + 170 };
  const starRow = model.focusTable[0];
  const starWorld = { x: WIN_LEFT + TABLE.x + TABLE_COLS[0].w / 2, y: WIN_TOP + TABLE.y + TABLE.headerH + TABLE.rowH / 2 };
  const starFocus = { x: starWorld.x + 420, y: starWorld.y - 20 };
  const quadGeo = getQuadGeometry(WIN.w, WIN.h, model.quad.domain);
  const tipProduct = model.rankings.topAtmvs[0]?.product ?? "";
  const tipPt = model.quad.points.find((p) => p.row.product === tipProduct);
  const tipLocal = tipPt ? quadGeo.toPx(tipPt) : { x: WIN.w / 2, y: WIN.h / 2 };
  const tipWorld = { x: WIN_LEFT + tipLocal.x, y: WIN_TOP + tipLocal.y };

  /* ---------- camera ---------- */
  const zCap = 0.9;
  const zRank = 2.0;
  const zTable = 1.17;
  const zFlip = 0.86;
  const zDD = 1.6;
  const zStar = 1.6;

  /* ---------- inserted shot: 数值筛选 (raw timeline beats, local l = 0 … GAP_BEATS) ---------- */
  const M0 = metricShotStart();
  const ml = (l: number) => nb(M0 + l);
  const mlp = (a: number, z: number, e = EASE) => nbp(M0 + a, M0 + z, e);
  const mc = props.metricFilter;
  const mLabel = metricLabel(mc);
  const dlgLeft = (WIN.w - METRIC_DIALOG.w) / 2;
  const dlgTop = (WIN.h - METRIC_DIALOG_H) / 2;
  const dt = metricDialogTargets();
  const quickIdx = Math.max(0, QUICK_FILTERS.indexOf(mc.quick));
  const toW = (r: { x: number; y: number; w: number; h: number }) => ({ x: WIN_LEFT + dlgLeft + r.x + r.w / 2, y: WIN_TOP + dlgTop + r.y + r.h / 2 });
  const filterBtnW = centerOf(toWorld(SHELL_TARGETS.filterBtn));
  const quickW = toW(dt.chips[quickIdx]);
  const applyW = toW(dt.apply);
  const clearW = centerOf(toWorld(SHELL_TARGETS.clearAll(mLabel)));
  const dlgFocus = { x: WIN.cx, y: WIN_TOP + dlgTop + METRIC_DIALOG_H / 2 };
  const filterFocus = { x: filterBtnW.x - 360, y: filterBtnW.y + 120 };
  const metricTableFocus = { x: WIN.cx, y: WIN_TOP + TOOLBAR.y + 342 };
  const mOpen = mlp(1.6, 2.2) * (1 - mlp(5.1, 5.5));
  const mQuick = mlp(3.3, 3.6);
  const mDraft = mlp(3.4, 3.8);
  const mFocus = mlp(3.4, 3.8) * (1 - mlp(4.6, 5.0));
  const mApplied = mlp(5.3, 5.7) * (1 - mlp(8.7, 9.2));
  const mChips = mlp(5.4, 5.9) * (1 - mlp(8.7, 9.2));
  const mHideT = f - ml(5.5);
  const mShowT = f >= ml(8.6) ? f - ml(8.6) : -1;
  const zGrid = 0.14;
  const kf = (beat: number, p: { x: number; y: number }, scale: number, easing?: CameraKeyframe["easing"]): CameraKeyframe => ({ frame: b(beat), x: p.x, y: p.y, scale, easing });
  const cam = getCameraState(f, [
    { frame: 0, x: center.x, y: center.y, scale: 1 },
    { frame: nb(1.4), x: center.x, y: center.y, scale: 1 },
    { frame: nb(5.8), x: center.x, y: center.y, scale: 1.05, easing: Easing.inOut(Easing.sin) },
    { frame: nb(6.4), x: center.x, y: center.y, scale: 1 },
    kf(23.8, winCap, zCap),
    kf(30, winCap, zCap * 1.02, Easing.inOut(Easing.sin)),
    kf(31.6, rankFocus, zRank),
    kf(40, rankFocus, zRank * 1.02, Easing.inOut(Easing.sin)),
    kf(41.6, premFocus, zRank),
    kf(50, premFocus, zRank * 1.02, Easing.inOut(Easing.sin)),
    kf(51.8, tableFocus, zTable),
    kf(62.4, tableFocus, zTable * 1.02, Easing.inOut(Easing.sin)),
    kf(64.4, center, zFlip),
    kf(66, quadC, zCap),
    kf(77.8, quadC, zCap * 1.04, Easing.inOut(Easing.sin)),
    kf(80.4, center, zFlip),
    { frame: ml(1.2), x: filterFocus.x, y: filterFocus.y, scale: 1.5 },
    { frame: ml(1.7), x: filterFocus.x, y: filterFocus.y, scale: 1.5 },
    { frame: ml(2.7), x: dlgFocus.x, y: dlgFocus.y, scale: 1.3 },
    { frame: ml(5.1), x: dlgFocus.x, y: dlgFocus.y, scale: 1.3 },
    { frame: ml(6.2), x: metricTableFocus.x, y: metricTableFocus.y, scale: 1.15 },
    { frame: ml(8.0), x: metricTableFocus.x, y: metricTableFocus.y, scale: 1.17, easing: Easing.inOut(Easing.sin) },
    { frame: ml(9.4), x: metricTableFocus.x, y: metricTableFocus.y, scale: 1.15 },
    kf(81.8, optFocus, zDD),
    kf(85.4, optFocus, zDD),
    kf(88.6, starFocus, zStar),
    kf(92, starFocus, zStar * 1.02, Easing.inOut(Easing.sin)),
    kf(93.6, center, 1),
    kf(101, center, zGrid, Easing.in(Easing.cubic)),
  ]);

  /* ---------- shot 1: 「今天我们来讲」 + typewriter prompt → send (raw beats 0–6.6) ---------- */
  // EASE_OUT so the label/bar are already visible while the title card blurs out (~10-frame overlap)
  const labelIn = nbp(0.05, 0.85, EASE_OUT);
  const barIn = nbp(0.15, 1.05, EASE_OUT);
  const typeFrom = nb(1.6);
  const charFrames = dur(0.32);
  const promptChars = Array.from(copy.openPrompt);
  const typed = promptChars.slice(0, Math.max(0, Math.min(promptChars.length, Math.floor((f - typeFrom) / charFrames) + 1))).join("");
  const typingDone = f >= typeFrom + charFrames * promptChars.length;
  const typing = f >= typeFrom && !typingDone;
  // solid while typing, blinks (1 beat period) while idle
  const caretOpacity = typing ? 1 : Math.floor(f / dur(0.5)) % 2 === 0 ? 1 : 0.15;
  const sendFrame = nb(5.6);
  const sendPress = pressCurve(f, sendFrame);
  const openOut = nbp(5.9, 6.6);
  const barScale = 0.92 + 0.08 * barIn;

  /* ---------- shot 4: window ---------- */
  const winIn = bp(21.8, 23.8);
  const resolveT = f - b(22.6);
  const winScale = 0.55 + 0.45 * winIn;

  /* ---------- shot 5/6: ranking + premium ---------- */
  const rankRoll = f - b(31.2);
  const rankHL = bp(33, 34) * (1 - bp(40, 41));
  const premRoll = f - b(41.2);
  const selIn = bp(42, 42.6) * (1 - bp(48.6, 49.2));
  const selMove = bp(45.2, 46.2);
  const colTop = toWorld(cardColumnRect(2, PREMIUM_SPANS, 3));
  const colBot = toWorld(cardColumnRect(3, PREMIUM_SPANS, 3));
  const selRect = { x: colTop.x + (colBot.x - colTop.x) * selMove, y: colTop.y, w: colTop.w, h: colTop.h };
  const premHLTop = bp(42.8, 43.6) * (1 - bp(49.4, 50.2));
  const premHLBot = bp(46.2, 47) * (1 - bp(49.4, 50.2));
  const tagTopP = bp(42.8, 43.5) * (1 - bp(61, 62));
  const tagBotP = bp(46.2, 46.9) * (1 - bp(61, 62));

  /* ---------- shot 7: table columns ---------- */
  const noteBeats = [52, 54.4, 56.8, 59.2];
  const notesOut = bp(61.3, 61.9);
  const highlights = copy.tableNotes.map((n, i) => ({ column: n.column, p: bp(noteBeats[i] ?? 60, (noteBeats[i] ?? 60) + 0.7, EASE_OUT) * (1 - notesOut) * (i === copy.tableNotes.length - 1 ? 1 : 0.55 + 0.45 * (1 - bp((noteBeats[i + 1] ?? 61) - 0.1, (noteBeats[i + 1] ?? 61) + 0.5))) }));

  // scroll through every product (all rows are in the table), reset while the window is flipped
  const tableContentH = model.tableRows.length * TABLE.rowH;
  const maxScroll = Math.max(0, tableContentH - TABLE_BODY_H);
  // no scrolling (user feedback): the table stays at its top rows; all rows are still laid out
  const tableScroll = 0 * maxScroll;

  /* ---------- shot 8: flip to quadrant ---------- */
  const viewPress = pressCurve(f, b(62.4));
  const viewP = bp(62.4, 62.9) * (1 - bp(78.2, 78.7));
  const flip = interpolate(bp(62.8, 65), [0, 1], [0, 180], CLAMP) + interpolate(bp(78.2, 80.4), [0, 1], [0, 180], CLAMP);
  const popT = f - b(65);
  const labelsP = bp(69.2, 70);
  const groupUp = bp(70.2, 71) * (1 - bp(72.6, 73.2));
  const groupDown = bp(73, 73.8) * (1 - bp(75.4, 76));
  const tipP = bp(75.8, 76.6) * (1 - bp(77.6, 78.1));

  /* ---------- shot 9: inline sector option filter + star ---------- */
  const optPress = pressCurve(f, b(84.4));
  const sectorP = bp(84.4, 84.9);
  const filterT = f - b(85.2);
  const altMix = bp(85.4, 86.4);
  const starP = interpolate(f, [b(88.8), b(89.4)], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const rowFocusP = bp(88.8, 89.6);

  /* ---------- shot 10/11 ---------- */
  const gridT = f - b(93.4);
  const statIn = bp(94, 94.8) * (1 - bp(101.6, 102.2));
  const statItems = copy.stats.map((s) => fill(s, T));
  const statPos = reelPosition(f - b(95.2), dur(1.2), statItems.length - 1);
  const statVel = statPos - reelPosition(f - 1 - b(95.2), dur(1.2), statItems.length - 1);
  const gridShade = bp(93.6, 95);
  const darkOut = bp(102.4, 104);
  const urlP = bp(104.4, 106);
  // 0.5-beat eased crossfade (with blur) from the URL to the mark – no hard cut
  const urlOut = bp(108.5, 109);
  const logoIn = bp(108.75, 109.25, EASE_OUT);

  /* ---------- sound design (scene-local frames; all SFX Mixkit Free License) ---------- */
  // clicks: 发送, 全景图, 筛选, 隐波低位, 应用, 清除全部, 能化, star
  const clickFrames = [sendFrame, b(62.4), ml(1.5), ml(3.3), ml(5.0), ml(8.6), b(84.4), b(88.8)];
  const sfxEvents: SfxEvent[] = [
    // one key per typed character (same frame the character appears); deterministic pitch/level variation
    ...promptChars.map((_, i) => ({ at: typeFrom + i * charFrames, name: "key" as const, volume: 0.85 + 0.15 * Math.abs(Math.sin(i * 1.7 + 0.4)), rate: 1 + 0.05 * Math.sin(i * 2.3 + 1.1) })),
    ...clickFrames.map((at) => ({ at, name: "click" as const, volume: 0.42 })),
    { at: b(22.3), name: "whoosh", volume: 0.35 }, // window opens
    { at: b(63.9), name: "whoosh", volume: 0.3 }, // flip → 全景图
    { at: b(79.3), name: "whoosh", volume: 0.3 }, // flip back → table
    { at: ml(1.8), name: "sweep", volume: 0.22 }, // 数值筛选 dialog opens
    { at: b(108.85), name: "sweep", volume: 0.35 }, // logo outro
  ];
  const wordmark = bp(110, 112);
  const tagP = bp(112.6, 113.8);
  const finalDark = bp(118.4, 120);

  /* ---------- cursor ---------- */
  const k = (beat: number, p: { x: number; y: number }, dx = 0, dy = 0): CursorKey => ({ frame: b(beat), x: p.x + dx, y: p.y + dy });
  const sendC = sendOf(barC);
  const cursorWorld = getCursorPos(f, [
    { frame: nb(4.0), x: sendC.x + 380, y: sendC.y + 280 },
    { frame: nb(5.3), x: sendC.x + 4, y: sendC.y + 6 },
    { frame: nb(6.0), x: sendC.x + 4, y: sendC.y + 6 },
    k(60.8, viewBtn, -300, 240),
    k(62.1, viewBtn, 4, 6),
    k(63.2, viewBtn, 4, 6),
    k(74.4, tipWorld, 260, 200),
    k(75.6, tipWorld, 3, 5),
    k(78, tipWorld, 3, 5),
    { frame: ml(0.3), x: filterBtnW.x - 340, y: filterBtnW.y + 260 },
    { frame: ml(1.3), x: filterBtnW.x + 4, y: filterBtnW.y + 6 },
    { frame: ml(1.8), x: filterBtnW.x + 4, y: filterBtnW.y + 6 },
    { frame: ml(3.0), x: quickW.x + 4, y: quickW.y + 6 },
    { frame: ml(3.6), x: quickW.x + 4, y: quickW.y + 6 },
    { frame: ml(4.6), x: applyW.x + 4, y: applyW.y + 6 },
    { frame: ml(5.2), x: applyW.x + 4, y: applyW.y + 6 },
    { frame: ml(6.4), x: clearW.x + 60, y: clearW.y + 140 },
    { frame: ml(8.3), x: clearW.x + 2, y: clearW.y + 4 },
    { frame: ml(8.9), x: clearW.x + 2, y: clearW.y + 4 },
    k(82.2, optAll, 6, 8),
    { ...k(84.1, optTarget, 6, 8), straight: true },
    k(85.2, optTarget, 6, 8),
    k(87.4, starWorld, 300, 170),
    k(88.6, starWorld, 2, 4),
    k(90.6, starWorld, 2, 4),
  ]);
  const cursorScreen = worldToScreen(cursorWorld, cam, W, H);
  const cursorOpacity = Math.max(fadeWindow(f, nb(4.2), nb(6.1)), fadeWindow(f, b(61), b(63)), fadeWindow(f, b(74.6), b(77.6)), fadeWindow(f, ml(0.3), ml(5.4)), fadeWindow(f, ml(7.8), b(85.4)), fadeWindow(f, b(87.6), b(90.4)));
  const hoverOpt = f >= b(81.6) && f < b(85.6) && Math.abs(cursorWorld.y - optAll.y) < 30 ? interpolate(cursorWorld.x, optRects.map((r) => r.x + r.w / 2), optRects.map((_, i) => i), CLAMP) : -1;

  const showWorld = f < b(104.2);
  const capY = 985;

  /* ---------- column note chips (world space, above table header) ---------- */
  let cx0 = WIN_LEFT + TABLE.x;
  const colCenters: Record<string, number> = {};
  for (const c of TABLE_COLS) {
    colCenters[c.id] = cx0 + c.w / 2;
    cx0 += c.w;
  }

  return { brandName, url, tagline, logoSrc, accent, bpm, copy, model, T, f, W, H, b, bp, nb, nbp, dur, center, winCap, barC, sendOf, cards01, rankFocus, premFocus, tableFocus, quadC, viewBtn, focusIdx, optRects, targetOpt, optAll, optTarget, optFocus, starRow, starWorld, starFocus, quadGeo, tipProduct, tipPt, tipLocal, tipWorld, zCap, zRank, zTable, zFlip, zDD, zStar, M0, ml, mlp, mc, mLabel, dlgLeft, dlgTop, dt, quickIdx, toW, filterBtnW, quickW, applyW, clearW, dlgFocus, filterFocus, metricTableFocus, mOpen, mQuick, mDraft, mFocus, mApplied, mChips, mHideT, mShowT, zGrid, kf, cam, labelIn, barIn, typeFrom, charFrames, promptChars, typed, typingDone, typing, caretOpacity, sendFrame, sendPress, openOut, barScale, winIn, resolveT, winScale, rankRoll, rankHL, premRoll, selIn, selMove, colTop, colBot, selRect, premHLTop, premHLBot, tagTopP, tagBotP, noteBeats, notesOut, highlights, tableContentH, maxScroll, tableScroll, viewPress, viewP, flip, popT, labelsP, groupUp, groupDown, tipP, optPress, sectorP, filterT, altMix, starP, rowFocusP, gridT, statIn, statItems, statPos, statVel, gridShade, darkOut, urlP, urlOut, logoIn, clickFrames, sfxEvents, wordmark, tagP, finalDark, k, sendC, cursorWorld, cursorScreen, cursorOpacity, hoverOpt, showWorld, capY, colCenters };
};

export type MarketTimeline = ReturnType<typeof useMarketTimeline>;
