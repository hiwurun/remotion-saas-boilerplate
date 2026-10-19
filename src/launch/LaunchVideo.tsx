import React from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Easing, interpolate, interpolateColors, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { LaunchVideoProps } from "./schema";
import { C, CLAMP, EASE, LAUNCH_FPS, TOTAL_BEATS, beatProgress, beatToFrame, isUrl, runScript } from "./theme";
import { MONO, SANS } from "./fonts";
import { Camera, CameraKeyframe, getCameraState, worldToScreen } from "./components/Camera";
import { HyperspaceLines } from "./components/HyperspaceLines";
import { BrandMark } from "./components/BrandMark";
import { PromptBar, getFieldWidth } from "./components/PromptBar";
import { measureText } from "./measureText";
import { Cursor, CursorKey, getCursorPos, pressCurve } from "./components/Cursor";
import { AppWindow, getWindowGeometry } from "./components/AppWindow";
import { EditPopover, SelectionBox, getPopoverRect, getUpdateButtonCenter } from "./components/SelectionBox";
import { FlipCard } from "./components/FlipCard";
import { CodeEditor } from "./components/CodeEditor";
import { Dropdown, getOptionCenter } from "./components/Dropdown";
import { InfiniteGrid } from "./components/InfiniteGrid";
import { LogoOutro } from "./components/LogoOutro";

/**
 * Continuous slot-reel position (float index). Each step glides with an in-out cubic over
 * 75% of the step and rests for the remainder – no floor/round on the rendered value.
 */
const reelPosition = (t: number, stepFrames: number) => {
  if (t <= 0) return 0;
  const u = t / stepFrames;
  const k = Math.floor(u);
  return k + interpolate(u - k, [0, 0.75], [0, 1], { ...CLAMP, easing: Easing.inOut(Easing.cubic) });
};

/** Critically damped follow of a target signal, simulated deterministically over the last `window` frames. */
const smoothFollow = (frame: number, target: (fr: number) => number, omega = 0.32, window = 30) => {
  let x = target(frame - window);
  let v = 0;
  for (let fr = frame - window + 1; fr <= frame; fr++) {
    const tgt = target(fr);
    const acc = omega * omega * (tgt - x) - 2 * omega * v;
    v += acc;
    x += v;
  }
  return x;
};

const fadeWindow = (f: number, a: number, b: number, fade = 8) =>
  interpolate(f, [a - fade, a, b, b + fade], [0, 1, 1, 0], CLAMP);

export const LaunchVideo: React.FC<LaunchVideoProps> = (props) => {
  const { brandName, url, logo, accentColor, bgmSrc, bpm, heroQuestion, suggestions, typedPrompts, followUpPrompt, editPrompt, editTargetLabel, appName, codeSnippet, dropdownOptions, gridPrompts, screenshots } = props;
  const f = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const isPortrait = H > W;
  const b = (beat: number) => beatToFrame(beat, bpm);
  const bp = (a: number, z: number, e = EASE) => beatProgress(f, bpm, a, z, e);
  const logoSrc = logo.kind === "image" && logo.logoSrc ? logo.logoSrc : undefined;

  /* ---------- layout (world space == video space at camera scale 1) ---------- */
  const geo = getWindowGeometry(W, H, isPortrait);
  const center = { x: W / 2, y: H / 2 };
  const barC = { x: W / 2, y: H / 2, w: isPortrait ? 960 : 1000, h: isPortrait ? 112 : 100, font: isPortrait ? 34 : 30 };
  const barD = { x: W / 2, y: isPortrait ? 1712 : 988, w: isPortrait ? 900 : 720, h: isPortrait ? 92 : 78, font: isPortrait ? 27 : 24 };
  const sendOf = (bar: { x: number; y: number; w: number; h: number }) => ({ x: bar.x + bar.w / 2 - bar.h / 2, y: bar.y });
  const logoCenter = { x: geo.logo.x + geo.logo.w / 2, y: geo.logo.y + geo.logo.h / 2 };
  const badge = geo.privateBadge;
  const badgeCenter = { x: badge.x + badge.w / 2, y: badge.y + badge.h / 2 };
  const codeCenter = { x: geo.codeBtn.x + geo.codeBtn.w / 2, y: geo.codeBtn.y + geo.codeBtn.h / 2 };
  const pop = getPopoverRect(geo.logo, isPortrait);
  const updateBtn = getUpdateButtonCenter(pop);
  const ddRight = badge.x + badge.w;
  const ddTop = badge.y + badge.h + 10;
  const targetOpt = Math.min(2, dropdownOptions.length - 1);

  /* ---------- camera ---------- */
  const zDock = isPortrait ? 1.18 : 1.9;
  const zLogo = isPortrait ? 1.8 : 2.4;
  const zBadge = isPortrait ? 1.6 : 2.0;
  const zFlip = isPortrait ? 0.72 : 0.86;
  const zGrid = isPortrait ? 0.16 : 0.14;
  const logoFocus = { x: geo.logo.x + (isPortrait ? 190 : 200), y: geo.logo.y + 110 };
  const badgeFocus = { x: ddRight - (isPortrait ? 150 : 140), y: badge.y + 110 };
  const winC = { x: geo.cx, y: geo.cy };
  const kf = (beat: number, p: { x: number; y: number }, scale: number, easing?: CameraKeyframe["easing"]): CameraKeyframe => ({ frame: b(beat), x: p.x, y: p.y, scale, easing });
  const cam = getCameraState(f, [
    kf(0, center, 1),
    kf(8, center, 1),
    kf(23, center, 1.08, Easing.inOut(Easing.sin)),
    kf(27.5, center, 1),
    kf(30.2, center, 1),
    kf(31.5, barD, zDock),
    kf(34.2, barD, zDock),
    kf(35.5, logoFocus, zLogo),
    kf(45, logoFocus, zLogo),
    kf(47, center, 1),
    kf(49.2, center, 1),
    kf(50.6, winC, zFlip),
    kf(61.5, winC, zFlip),
    kf(63.2, center, 1),
    kf(63.5, center, 1),
    kf(65, badgeFocus, zBadge),
    kf(68.8, badgeFocus, zBadge),
    kf(70.2, winC, 1),
    kf(78, winC, zGrid, Easing.in(Easing.cubic)),
  ]);

  /* ---------- shot 1: logo + hyperspace ---------- */
  const s1Scale = interpolate(bp(0, 2.6), [0, 1], [3.2, 1], CLAMP);
  const s1Fill = bp(1.6, 3);
  const s1Out = bp(3.3, 4);

  /* ---------- shot 2/3: hero + prompt ---------- */
  const heroIn = bp(4, 5);
  const barScale = bp(4.7, 5.3);
  const expand = bp(5, 6.6);
  const heroToWhite = bp(5.3, 6);
  const heroOut = bp(8, 8.8);
  const barContent = bp(6.2, 7.2);
  const reelOpacity = bp(8.5, 9.3) * (1 - bp(11.6, 12));
  const reelPos = reelPosition(f - b(9), b(1));
  const reelVel = reelPos - reelPosition(f - 1 - b(9), b(1));
  const lenA = Array.from(typedPrompts[0]).length;
  const fpcA = 3;
  const startB = fpcA * lenA + 24 + lenA + 8;
  const fpcB = Math.max(1, Math.min(3, Math.floor((b(20.5) - b(12) - startB) / Math.max(1, Array.from(typedPrompts[1]).length))));
  const sendFrame1 = b(22);
  const lenF = Array.from(followUpPrompt).length;
  const fpcF = Math.max(1, Math.min(3, Math.floor((b(32.6) - b(30.9)) / Math.max(1, lenF))));
  const sendFrame2 = b(33);
  const barTextAt = (fr: number): string => {
    if (fr >= b(30.9) && fr < sendFrame2 + 6) return runScript([{ action: "type", text: followUpPrompt, framesPerChar: fpcF }], fr - b(30.9));
    if (fr >= sendFrame1 + 6) return "";
    return runScript(
      [
        { action: "type", text: typedPrompts[0], framesPerChar: fpcA },
        { action: "wait", frames: 24 },
        { action: "delete", framesPerChar: 1 },
        { action: "wait", frames: 8 },
        { action: "type", text: typedPrompts[1], framesPerChar: fpcB },
      ],
      fr - b(12),
    );
  };
  const barText = barTextAt(f);
  const typing = (f >= b(12) && f < b(21)) || (f >= b(30.9) && f < b(32.8));
  const caret = typing || Math.floor(f / 18) % 2 === 0;
  // smooth caret blink (cosine, softened edges) – solid while typing
  const caretOpacity = typing ? 1 : interpolate(Math.cos((f / 40) * Math.PI * 2), [-0.35, 0.35], [0, 1], CLAMP);

  const dockP = bp(24.3, 27);
  const bar = {
    x: barC.x + (barD.x - barC.x) * dockP,
    y: barC.y + (barD.y - barC.y) * dockP,
    w: barC.w + (barD.w - barC.w) * dockP,
    h: barC.h + (barD.h - barC.h) * dockP,
    font: barC.font + (barD.font - barC.font) * dockP,
  };
  const worldBarOpacity = 1 - bp(70, 70.6);
  // horizontal scroll of the typed text: measured width → target offset → critically damped follow
  const barAt = (fr: number) => {
    const p = interpolate(fr, [b(24.3), b(27)], [0, 1], { ...CLAMP, easing: EASE });
    return { w: barC.w + (barD.w - barC.w) * p, h: barC.h + (barD.h - barC.h) * p, font: barC.font + (barD.font - barC.font) * p };
  };
  const scrollTarget = (fr: number) => {
    const txt = barTextAt(fr);
    if (!txt) return 0;
    const g = barAt(fr);
    const w = measureText({ text: txt, fontFamily: SANS, fontSize: g.font, letterSpacing: "-0.01em" }).width;
    return Math.max(0, w + 3 + 2.5 + g.font * 0.6 - getFieldWidth(g.w, g.h));
  };
  // empty field (placeholder) never scrolls; otherwise ease toward the target
  const scrollX = barText ? Math.max(0, smoothFollow(f, scrollTarget)) : 0;
  const sendPress = Math.max(pressCurve(f, sendFrame1), pressCurve(f, sendFrame2));

  /* ---------- shot 4: window ---------- */
  const winIn = bp(24.6, 26.6);
  const resolveT = f - b(25.8);
  const textScale = 1 + 0.16 * bp(33.3, 34.6);

  /* ---------- shot 6: edit ---------- */
  const selP = bp(36, 36.6) * (1 - bp(43.2, 44));
  const popP = bp(36.6, 37.4) * (1 - bp(43, 43.8));
  const editText = runScript([{ action: "type", text: editPrompt, framesPerChar: Math.max(1, Math.min(3, Math.floor((b(41) - b(37.6)) / Math.max(1, Array.from(editPrompt).length)))) }], f - b(37.6));
  const logoColor = interpolateColors(bp(42.2, 43.2), [0, 1], [C.ink, accentColor]);
  const updatePress = pressCurve(f, b(42));

  /* ---------- shot 7: code flip ---------- */
  const codePress = pressCurve(f, b(49));
  const flip = interpolate(bp(49.4, 51.6), [0, 1], [0, 180], CLAMP) + interpolate(bp(59, 61.4), [0, 1], [0, 180], CLAMP);

  /* ---------- shot 8: dropdown ---------- */
  const badgePress = pressCurve(f, b(65));
  const ddP = bp(65.2, 65.9) * (1 - bp(67.9, 68.5));
  const selected = f >= b(67) ? targetOpt : 0;
  const privacyLabel = dropdownOptions[selected];

  /* ---------- cursor (world keys → screen) ---------- */
  const k = (beat: number, p: { x: number; y: number }, dx = 0, dy = 0): CursorKey => ({ frame: b(beat), x: p.x + dx, y: p.y + dy });
  const sendC = sendOf(barC);
  const sendD = sendOf(barD);
  const o0 = getOptionCenter(ddRight, ddTop, 0);
  const oT = getOptionCenter(ddRight, ddTop, targetOpt);
  const cursorWorld = getCursorPos(f, [
    k(19, sendC, 420, 320),
    k(21.6, sendC, 4, 6),
    k(23, sendC, 4, 6),
    k(31.4, sendD, 260, 170),
    k(32.7, sendD, 4, 6),
    k(34, sendD, 4, 6),
    k(35.2, logoCenter, 280, 210),
    k(35.9, logoCenter, 10, 6),
    k(37.4, logoCenter, 60, 40),
    k(41.4, updateBtn, 6, 6),
    k(43.5, updateBtn, 40, 30),
    k(47.4, codeCenter, -300, 260),
    k(48.8, codeCenter, 4, 6),
    k(50, codeCenter, 4, 6),
    k(63.8, badgeCenter, -220, 220),
    k(64.9, badgeCenter, 6, 6),
    k(66, o0, 20, 6),
    k(66.9, oT, 20, 6),
    k(68.5, oT, 20, 6),
  ]);
  const cursorScreen = worldToScreen(cursorWorld, cam, W, H);
  const cursorOpacity = Math.max(
    fadeWindow(f, b(19.2), b(23)),
    fadeWindow(f, b(31.5), b(33.8)),
    fadeWindow(f, b(35.2), b(43.6)),
    fadeWindow(f, b(47.4), b(49.7)),
    fadeWindow(f, b(63.9), b(68.4)),
  );
  const hoverIdx = interpolate(cursorWorld.y, [o0.y, oT.y], [0, targetOpt], CLAMP);

  /* ---------- shot 9/10 ---------- */
  const gridT = f - b(70.3);
  const gridBarIn = bp(70.6, 71.4) * (1 - bp(77.4, 78.2));
  const gridReel = reelPosition(f - b(71), b(0.5));
  const gridVel = gridReel - reelPosition(f - 1 - b(71), b(0.5));
  const whiteOut = bp(77.4, 79);
  const urlP = bp(79.5, 81);
  const urlOut = interpolate(f, [b(83.75), b(84)], [0, 1], CLAMP);
  const logoIn = interpolate(f, [b(84), b(84) + 4], [0, 1], CLAMP);
  const morph = bp(85, 86.5);
  const wordmark = bp(86.5, 88.5);
  const finalWhite = bp(90.5, 92);

  const showWorld = f >= b(3.8) && f < b(79.5);
  const winScale = 0.55 + 0.45 * winIn;

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: SANS, overflow: "hidden" }}>
      {/* SHOT 1 */}
      {f < b(4.2) ? (
        <AbsoluteFill>
          <HyperspaceLines width={W} height={H} t={f} opacity={(1 - s1Out) * 0.9} />
          <div style={{ position: "absolute", left: W / 2 - 80, top: H / 2 - 80, width: 160, height: 160, transform: `scale(${s1Scale})`, opacity: 1 - s1Out }}>
            <BrandMark size={160} fill={s1Fill} strokeWidth={1.6} logoSrc={logoSrc} />
          </div>
        </AbsoluteFill>
      ) : null}

      {showWorld ? (
        <Camera state={cam} width={W} height={H}>
          {/* SHOT 9 grid (behind the window) */}
          {f >= b(70.2) ? (
            <InfiniteGrid cx={geo.cx} cy={geo.cy} tileW={geo.w} tileH={geo.h} gap={isPortrait ? 80 : 90} cols={isPortrait ? 7 : 11} rows={11} t={gridT} accent={accentColor} screenshots={screenshots} />
          ) : null}

          {/* App window with code flip */}
          {winIn > 0 ? (
            <div style={{ position: "absolute", left: geo.left, top: geo.top, width: geo.w, height: geo.h, opacity: interpolate(winIn, [0, 0.4], [0, 1], CLAMP), transform: `scale(${winScale})` }}>
              <FlipCard
                width={geo.w}
                height={geo.h}
                angle={flip}
                perspective={isPortrait ? 4600 : 3600}
                front={
                  <AppWindow geo={geo} isPortrait={isPortrait} resolveT={resolveT} accent={accentColor} logoColor={logoColor} textScale={textScale} appName={appName} privacyLabel={privacyLabel} font={SANS} codePressed={codePress} badgePressed={badgePress} logoSrc={logoSrc} />
                }
                back={<CodeEditor code={codeSnippet} width={geo.w} height={geo.h} font={SANS} mono={MONO} fontSize={isPortrait ? 20 : 19} />}
              />
            </div>
          ) : null}

          {/* SHOT 6 selection + popover */}
          {selP > 0 ? <SelectionBox rect={geo.logo} accent={accentColor} label={editTargetLabel} progress={selP} font={MONO} /> : null}
          {popP > 0 ? <EditPopover rect={pop} text={editText} caret={f < b(42) && (Math.floor(f / 18) % 2 === 0 || (f > b(37.6) && f < b(41.2)))} progress={popP} updatePressed={updatePress} accent={accentColor} font={SANS} targetLabel={`${appName} 标志`} /> : null}

          {/* SHOT 8 dropdown */}
          {ddP > 0 ? <Dropdown right={ddRight} top={ddTop} options={dropdownOptions} hover={hoverIdx} selected={selected} progress={ddP} font={SANS} /> : null}

          {/* hero question (inside the bar once it expands) */}
          {f < b(9) ? (
            <div
              style={{
                position: "absolute",
                left: 0,
                width: W,
                top: barC.y - barC.font,
                height: barC.font * 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 5,
                fontSize: barC.font * 1.25,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: interpolateColors(heroToWhite, [0, 1], ["#000000", "#FFFFFF"]),
                opacity: heroIn * (1 - heroOut),
                transform: `translateY(${(1 - heroIn) * 16 - heroOut * 34}px)`,
                filter: `blur(${(1 - heroIn) * 10}px)`,
              }}
            >
              {heroQuestion}
            </div>
          ) : null}

          {/* prompt bar */}
          {f >= b(4.6) && worldBarOpacity > 0 ? (
            <div style={{ opacity: worldBarOpacity, position: "absolute", inset: 0, transformOrigin: `${barC.x}px ${barC.y}px`, transform: `scale(${barScale})` }}>
              <PromptBar
                cx={bar.x}
                cy={bar.y}
                width={bar.w}
                height={bar.h}
                expand={expand}
                text={barText}
                caret={f >= b(8.6) && caret}
                caretOpacity={f >= b(8.6) ? caretOpacity : 0}
                scrollX={scrollX}
                placeholder={f >= b(12) ? "继续追问…" : undefined}
                reel={f < b(12) ? { items: suggestions, position: reelPos, velocity: reelVel, opacity: reelOpacity } : undefined}
                sendScale={1 - sendPress * 0.16}
                sendActive={barText.length > 0}
                fontSize={bar.font}
                fontFamily={SANS}
                contentOpacity={barContent}
                avatarLabel={brandName.slice(0, 1).toUpperCase()}
                accentColor={accentColor}
              />
            </div>
          ) : null}
        </Camera>
      ) : null}

      {/* SHOT 9 screen-space prompt bar cycling prompts */}
      {gridBarIn > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: gridBarIn, transform: `translateY(${(1 - gridBarIn) * 40}px)` }}>
          <PromptBar cx={W / 2} cy={isPortrait ? H - 200 : H - 120} width={barD.w} height={barD.h} text="" caret={false} reel={{ items: gridPrompts, position: gridReel, velocity: gridVel, opacity: 1 }} sendActive fontSize={barD.font} fontFamily={SANS} avatarLabel={brandName.slice(0, 1).toUpperCase()} accentColor={accentColor} />
        </div>
      ) : null}

      <Cursor x={cursorScreen.x} y={cursorScreen.y} size={isPortrait ? 46 : 40} opacity={cursorOpacity} clickFrames={[b(22), b(33), b(36), b(42), b(49), b(65), b(67)]} frame={f} />

      {/* SHOT 10 */}
      {whiteOut > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: whiteOut }} /> : null}
      {f >= b(79) ? (
        <LogoOutro width={W} height={H} url={url} brandName={brandName} urlP={urlP} urlOut={urlOut} logoIn={logoIn} morph={morph} wordmark={wordmark} font={SANS} mono={MONO} isPortrait={isPortrait} logoSrc={logoSrc} />
      ) : null}
      {finalWhite > 0 ? <AbsoluteFill style={{ background: "#fff", opacity: finalWhite }} /> : null}

      {bgmSrc ? <Audio src={isUrl(bgmSrc) ? bgmSrc : staticFile(bgmSrc)} volume={(fr) => interpolate(fr, [0, 30, b(TOTAL_BEATS) - 90, b(TOTAL_BEATS)], [0, 0.6, 0.6, 0], CLAMP)} /> : null}
    </AbsoluteFill>
  );
};

export const calculateLaunchMetadata: CalculateMetadataFunction<LaunchVideoProps> = ({ props }) => ({
  durationInFrames: beatToFrame(TOTAL_BEATS, props.bpm, LAUNCH_FPS),
  fps: LAUNCH_FPS,
});
