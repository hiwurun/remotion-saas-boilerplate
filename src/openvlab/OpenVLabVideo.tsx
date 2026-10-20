import React, { useMemo } from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { OpenVLabProps } from "./schema";
import { C, CLAMP, EASE, EASE_OUT, INTRO_END, blurOf, INTRO_START, OV_FPS, TOTAL_BEATS, beatProgress, beatToFrame, isUrl, metricShotStart, storyBeat } from "./theme";
import { MONO, SANS } from "./fonts";
import { buildModel, fill, matchesMetric, metricLabel, type MarketModel } from "./data";
import { CARDS, PREMIUM_SPANS, TABLE, TABLE_BODY_H, TOOLBAR, TABLE_COLS, WIN, WIN_LEFT, WIN_TOP, cardColumnRect, centerOf, toWorld } from "./layout";
import { Camera, CameraKeyframe, getCameraState, worldToScreen } from "./components/Camera";
import { PromptBar } from "./components/PromptBar";
import { Cursor, CursorKey, getCursorPos, pressCurve } from "./components/Cursor";
import { FlipCard } from "./components/FlipCard";
import { InfiniteGrid } from "./components/InfiniteGrid";
import { LogoOutro } from "./components/LogoOutro";
import { MarketShell, SHELL_TARGETS, sectorOptionRects } from "./components/MarketShell";
import { RankCards } from "./components/RankCards";
import { PremiumCards } from "./components/PremiumCards";
import { MarketTable } from "./components/MarketTable";
import { QuadrantChart, getQuadGeometry } from "./components/QuadrantChart";
import { StatReel } from "./components/StatReel";
import { Caption } from "./components/Caption";
import { SelectionBox } from "./components/SelectionBox";
import { BrandMark } from "./components/BrandMark";
import { SfxTrack, type SfxEvent } from "./components/Sfx";
import { METRIC_DIALOG, METRIC_DIALOG_H, MetricFilterDialog, QUICK_FILTERS, metricDialogTargets } from "./components/MetricFilterDialog";

/** Continuous slot-reel position (launch LaunchVideo.tsx reelPosition) – used by the stat reel. */
const reelPosition = (t: number, stepFrames: number, maxSteps = Infinity) => {
  if (t <= 0) return 0;
  const u = Math.min(t / stepFrames, maxSteps);
  const k = Math.floor(u);
  return Math.min(maxSteps, k + interpolate(u - k, [0, 0.75], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) }));
};

const fadeWindow = (f: number, a: number, b: number, fade = 8) => interpolate(f, [a - fade, a, b, b + fade], [0, 1, 1, 0], CLAMP);

export const useMarketModel = (props: OpenVLabProps) => useMemo(() => buildModel(props.marketRows, props.focusSector, props.intraday, props.metricFilter), [props.marketRows, props.focusSector, props.intraday, props.metricFilter]);

export const OpenVLabVideo: React.FC<OpenVLabProps> = (props) => {
  const model = useMarketModel(props);
  if (!model.rows.length) return <AbsoluteFill style={{ background: C.bg }} />;
  const introFrames = beatToFrame(INTRO_START, props.bpm);
  const total = introFrames + beatToFrame(storyBeat(TOTAL_BEATS), props.bpm);
  // duck the BGM to ~0.35 while the prompt is being typed (same timing as the scene typewriter)
  const typeA = introFrames + beatToFrame(1.6, props.bpm);
  const typeZ = typeA + beatToFrame(0.32, props.bpm) * Array.from(props.copy.openPrompt).length;
  const { bgmSrc } = props;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={introFrames} layout="none">
        <AbsoluteFill>
          <OpenVLabScene {...props} model={model} />
        </AbsoluteFill>
      </Sequence>
      <TitleCard {...props} />
      {/* BGM (120 BPM; trimBefore aligns its beat phase to the grid) – fade in 0.5s, fade out over the logo outro tail */}
      {bgmSrc ? <Audio loop src={isUrl(bgmSrc) ? bgmSrc : staticFile(bgmSrc)} trimBefore={props.bgmOffsetFrames} volume={(fr) => interpolate(fr, [0, 30, total - 150, total - 6], [0, 0.6, 0.6, 0], CLAMP) * interpolate(fr, [typeA - 10, typeA, typeZ, typeZ + 15], [1, 0.58, 0.58, 1], CLAMP)} /> : null}
      <SfxTrack events={[{ at: beatToFrame(0.35, props.bpm), name: "sweep", volume: 0.3 }]} />
    </AbsoluteFill>
  );
};

/** Brand title card: logo + 「OpenVLab · 市场总览」, blur+translate in (EASE_OUT), out up into the prompt opening (EASE). */
const TitleCard: React.FC<OpenVLabProps> = ({ brandName, logoSrc, bpm, copy }) => {
  const f = useCurrentFrame();
  if (f > beatToFrame(INTRO_END + 0.2, bpm)) return null;
  const inP = (a: number) => beatProgress(f, bpm, a, a + 1.1, EASE_OUT);
  const out = beatProgress(f, bpm, INTRO_START - 0.6, INTRO_END, EASE);
  const piece = (p: number, dy = 26) => ({ opacity: p * (1 - out), transform: `translateY(${(1 - p) * dy - out * 46}px) scale(${0.96 + 0.04 * p})`, filter: blurOf((1 - p) * 14 + out * 10) });
  const logoP = inP(0.15);
  const textP = inP(0.4);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, pointerEvents: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div style={piece(logoP, 18)}>
          <BrandMark size={112} src={logoSrc} glow={logoP * (1 - out)} />
        </div>
        <div style={{ ...piece(textP), display: "flex", alignItems: "baseline", gap: 26, fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em", color: C.ink, whiteSpace: "nowrap" }}>
          <span>{brandName}</span>
          <span style={{ color: C.dim, fontWeight: 500 }}>·</span>
          <span style={{ fontWeight: 600 }}>{copy.titleCard}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const OpenVLabScene: React.FC<OpenVLabProps & { model: MarketModel }> = (props) => {
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

  /* ---------- window faces ---------- */
  const cards = (
    <div style={{ display: "flex", gap: CARDS.gap }}>
      <RankCards rankings={model.rankings} alt={model.focusRankings} altMix={altMix} rollT={rankRoll} highlight={rankHL} accent={accent} font={SANS} />
      <PremiumCards
        rankings={model.rankings}
        alt={model.focusRankings}
        altMix={altMix}
        rollT={premRoll}
        highlightTop={premHLTop}
        highlightBottom={premHLBot}
        tagTop={{ text: copy.premiumHighTag, p: tagTopP }}
        tagBottom={{ text: copy.premiumLowTag, p: tagBotP }}
        accent={accent}
        font={SANS}
      />
    </div>
  );
  const table = (
    <MarketTable
      rows={model.tableRows}
      width={TABLE.w}
      font={SANS}
      accent={accent}
      focusSector={f >= b(85.2) ? model.focus?.code : undefined}
      filterT={filterT}
      star={starRow ? { product: starRow.product, p: starP } : undefined}
      rowFocus={starRow ? { product: starRow.product, p: rowFocusP } : undefined}
      rowsIn={f - b(23.6)}
      highlights={highlights}
      scrollY={tableScroll}
      metric={f >= ml(5.5) && f < ml(11) ? { pred: (r) => matchesMetric(r, mc), hideT: mHideT, showT: mShowT } : undefined}
    />
  );
  const front = (
    <MarketShell
      resolveT={resolveT}
      brandName={brandName}
      logoSrc={logoSrc}
      accent={accent}
      font={SANS}
      sectors={model.sectors}
      total={model.rows.length}
      activeSector={focusIdx}
      sectorP={sectorP}
      hoverOpt={hoverOpt}
      optPress={optPress}
      viewP={viewP}
      toolbarDim={bp(51.6, 52.2) * (1 - notesOut)}
      metricUi={{ badge: mApplied, count: 1, quickField: mc.label, activeLabel: mLabel, active: mApplied, chipsP: mChips, hidden: model.tableRows.length - model.metricRows.length, press: pressCurve(f, ml(1.5)), clearHover: mlp(8.3, 8.4) }}
      viewPress={viewPress}
      asOf={T.asOf}
      cards={cards}
      table={table}
    />
  );
  const back = (
    <QuadrantChart
      width={WIN.w}
      height={WIN.h}
      points={model.quad.points}
      domain={model.quad.domain}
      summary={model.summary}
      font={SANS}
      accent={accent}
      popT={popT}
      popDur={dur(4)}
      labelsP={labelsP}
      groupUp={groupUp}
      groupDown={groupDown}
      upLabel={fill(copy.quadrantUpLabel, T)}
      downLabel={fill(copy.quadrantDownLabel, T)}
      tip={{ product: tipProduct, p: tipP }}
      frame={f}
      bgP={bp(64.4, 65.4)}
    />
  );

  /* ---------- column note chips (world space, above table header) ---------- */
  let cx0 = WIN_LEFT + TABLE.x;
  const colCenters: Record<string, number> = {};
  for (const c of TABLE_COLS) {
    colCenters[c.id] = cx0 + c.w / 2;
    cx0 += c.w;
  }

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, overflow: "hidden" }}>
      {showWorld ? (
        <Camera state={cam} width={W} height={H}>
          {f >= b(93.2) ? <InfiniteGrid cx={WIN.cx} cy={WIN.cy} tileW={WIN.w} tileH={WIN.h} gap={90} cols={11} rows={11} t={gridT} accent={accent} font={SANS} products={model.gridRows} view={{ x0: cam.x - W / 2 / cam.scale, x1: cam.x + W / 2 / cam.scale, y0: cam.y - H / 2 / cam.scale, y1: cam.y + H / 2 / cam.scale }} /> : null}

          {winIn > 0 ? (
            <div style={{ position: "absolute", left: WIN_LEFT, top: WIN_TOP, width: WIN.w, height: WIN.h, opacity: interpolate(winIn, [0, 0.4], [0, 1], CLAMP), transform: `scale(${winScale})` }}>
              <FlipCard width={WIN.w} height={WIN.h} angle={flip} perspective={3600} front={front} back={back} />
            </div>
          ) : null}

          {/* 数值筛选 dialog (DialogOverlay covers the page = the app window) */}
          {mOpen > 0 ? (
            <div style={{ position: "absolute", left: WIN_LEFT, top: WIN_TOP, width: WIN.w, height: WIN.h, borderRadius: 22, overflow: "hidden" }}>
              <MetricFilterDialog
                open={mOpen}
                font={SANS}
                mono={MONO}
                accent={accent}
                quickLabel={mc.quick}
                quickActive={mQuick}
                draft={{ [mc.field]: { min: mc.min, max: mc.max } }}
                draftP={mDraft}
                focusField={mc.field}
                focusP={mFocus}
                hoverChip={f >= ml(2.8) && f < ml(3.4) ? quickIdx : -1}
                applyPress={pressCurve(f, ml(5.0))}
                applyHover={mlp(4.5, 4.7)}
                width={WIN.w}
                height={WIN.h}
                left={dlgLeft}
                top={dlgTop}
              />
            </div>
          ) : null}

          {/* SHOT 6 selection on the 溢价 column */}
          {selIn > 0 ? <SelectionBox rect={selRect} accent={accent} label={copy.premiumFormula} progress={selIn} font={SANS} labelSize={17} labelBelow /> : null}

          {/* SHOT 7 column notes */}
          {/* one pill at a time, in the toolbar row (between cards and table header; toolbar dimmed meanwhile) */}
          {copy.tableNotes.map((n, i) => {
            const nb0 = noteBeats[i] ?? 60;
            const nb1 = noteBeats[i + 1];
            const p = bp(nb0, nb0 + 0.6, EASE_OUT) * (nb1 !== undefined ? 1 - bp(nb1 - 0.4, nb1) : 1 - notesOut);
            if (p <= 0 || colCenters[n.column] === undefined) return null;
            const PW = 420;
            const cxp = Math.min(Math.max(colCenters[n.column], WIN_LEFT + 30 + PW / 2), WIN_LEFT + WIN.w - 30 - PW / 2);
            return (
              <div key={n.column} style={{ position: "absolute", left: cxp - PW / 2, width: PW, top: WIN_TOP + TOOLBAR.y, height: TOOLBAR.h, display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - Math.min(1, p)) * 8}px)` }}>
                <div style={{ fontSize: 24, fontWeight: 600, lineHeight: "30px", color: "#000", background: accent, borderRadius: 999, padding: "6px 18px", whiteSpace: "nowrap", boxShadow: "0 6px 18px rgba(0,0,0,0.5)" }}>{n.note}</div>
              </div>
            );
          })}

          {/* SHOT 1: label + input box with typewriter prompt */}
          {f < nb(6.8) ? (
            <div style={{ position: "absolute", inset: 0, opacity: 1 - openOut, transform: `translateY(${-openOut * 40}px)`, filter: blurOf(openOut * 8) }}>
              <div style={{ position: "absolute", left: 0, width: W, top: barC.y - barC.h / 2 - 118, display: "flex", justifyContent: "center", fontSize: 56, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink, opacity: labelIn, transform: `translateY(${(1 - labelIn) * 18}px)` }}>
                {copy.openLabel}
              </div>
              <div style={{ position: "absolute", inset: 0, transformOrigin: `${barC.x}px ${barC.y}px`, transform: `scale(${barScale})`, opacity: barIn }}>
                <PromptBar
                  cx={barC.x}
                  cy={barC.y}
                  width={barC.w}
                  height={barC.h}
                  expand={1}
                  text={typed}
                  caret
                  caretOpacity={caretOpacity}
                  sendScale={1 - sendPress * 0.16}
                  sendActive={typingDone}
                  fontSize={barC.font}
                  fontFamily={SANS}
                  contentOpacity={1}
                  logoSrc={logoSrc}
                  accentColor={accent}
                />
              </div>
            </div>
          ) : null}
        </Camera>
      ) : null}

      {/* captions (screen space) */}
      <Caption text={copy.window} sub={fill(copy.windowSub, T)} p={bp(24.4, 25.2)} out={bp(29.2, 29.9)} y={capY - 20} width={W} font={SANS} accent={accent} />
      <Caption text={copy.rank} sub={fill(copy.rankSub, T)} p={bp(33.2, 34)} out={bp(39.2, 39.9)} y={capY - 90} width={W} font={SANS} accent={accent} />
      <Caption text={copy.premium} sub={fill(copy.premiumSub, T)} p={bp(43.2, 44)} out={bp(49.2, 49.9)} y={capY - 90} width={W} font={SANS} accent={accent} />
      <Caption text={copy.table} p={bp(51.8, 52.6)} out={bp(61.2, 61.9)} y={capY + 10} width={W} font={SANS} accent={accent} />
      <Caption text={fill(copy.quadrant, T)} sub={fill(copy.quadrantSub, T)} p={bp(66.4, 67.2)} out={bp(77, 77.8)} y={capY - 20} width={W} font={SANS} accent={accent} />
      <Caption text={copy.metric} sub={fill(copy.metricSub, T)} p={mlp(5.8, 6.6)} out={mlp(8.2, 8.8)} y={capY - 20} width={W} font={SANS} accent={accent} />
      <Caption text={copy.filter} sub={fill(copy.filterSub, T)} p={bp(86.4, 87.2)} out={bp(91.4, 92)} y={capY - 40} width={W} font={SANS} accent={accent} />

      <Cursor x={cursorScreen.x} y={cursorScreen.y} size={40} opacity={cursorOpacity} clickFrames={clickFrames} frame={f} ripple={`${accent}b3`} />
      <SfxTrack events={sfxEvents} />

      {/* SHOT 10 grid shading, caption, stat reel */}
      {gridShade > 0 && f < b(104.2) ? (
        <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(5,6,8,0.92) 0%, rgba(5,6,8,0) 30%, rgba(5,6,8,0) 66%, rgba(5,6,8,0.92) 100%)", opacity: gridShade * (1 - darkOut) }} />
      ) : null}
      <Caption text={copy.grid} p={bp(94.4, 95.2)} out={bp(101.6, 102.2)} y={150} width={W} font={SANS} accent={accent} size={76} scrim={false} />
      {statIn > 0 ? <StatReel cx={W / 2} cy={H - 140} width={980} items={statItems} position={statPos} velocity={statVel} opacity={statIn} font={SANS} accent={accent} fontSize={40} /> : null}
      {darkOut > 0 ? <AbsoluteFill style={{ background: C.bg, opacity: darkOut }} /> : null}

      {/* SHOT 11 */}
      {f >= b(104) ? <LogoOutro width={W} height={H} url={url} brandName={brandName} tagline={tagline} urlP={urlP} urlOut={urlOut} logoIn={logoIn} wordmark={wordmark} tagP={tagP} font={SANS} mono={MONO} logoSrc={logoSrc} accent={accent} /> : null}
      {finalDark > 0 ? <AbsoluteFill style={{ background: "#000", opacity: finalDark }} /> : null}

    </AbsoluteFill>
  );
};

/** Loads public/<dataSrc> → props.marketRows and public/<intradaySrc> → props.intraday when not supplied inline. */
export const loadMarketRows = async (props: OpenVLabProps): Promise<OpenVLabProps> => {
  const load = async <T,>(p: string): Promise<T[]> => {
    const res = await fetch(isUrl(p) ? p : staticFile(p));
    const json = (await res.json()) as { result?: T[] } | T[];
    return Array.isArray(json) ? json : json.result ?? [];
  };
  const marketRows = props.marketRows && props.marketRows.length > 0 ? props.marketRows : await load<OpenVLabProps["marketRows"][number]>(props.dataSrc);
  const intraday = props.intraday && props.intraday.length > 0 ? props.intraday : props.intradaySrc ? await load<OpenVLabProps["intraday"][number]>(props.intradaySrc) : [];
  return { ...props, marketRows, intraday };
};

export const calculateOpenVLabMetadata: CalculateMetadataFunction<OpenVLabProps> = async ({ props }) => ({
  durationInFrames: beatToFrame(INTRO_START, props.bpm, OV_FPS) + beatToFrame(storyBeat(TOTAL_BEATS), props.bpm, OV_FPS),
  fps: OV_FPS,
  props: await loadMarketRows(props),
});
