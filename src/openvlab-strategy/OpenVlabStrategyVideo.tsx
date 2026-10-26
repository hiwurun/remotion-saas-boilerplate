import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camera, getCameraState, worldToScreen } from "../shared/components/Camera";
import { EASE_OUT } from "../shared/motion";
import { AppWindow } from "./components/AppWindow";
import { CaptionBar } from "./components/CaptionBar";
import { Cursor, CursorKey, getCursorPos } from "./components/Cursor";
import { EndCard } from "./components/EndCard";
import { Stage } from "./components/Stage";
import { StrategyBuilderUI } from "./components/StrategyBuilderUI";
import { C, SERIF } from "./theme";
import {
  FPS,
  H,
  HIT,
  TOTAL,
  W,
  WIN,
  cameraKeys,
  demoStateAt,
  fadeWin,
  prog,
  sec,
} from "./timeline";

export { FPS, W, H, TOTAL };

/**
 * OpenVLab Strategy Builder promo — drawn UI (沪金 AU), Launch-style camera + cursor.
 * Demo: add → drag strike → click leg → template → table ↔ curve → sliders → backtest.
 */
export const OpenVlabStrategyVideo: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const state = demoStateAt(f);

  const cam = getCameraState(f, cameraKeys());

  /* ---- cursor keys (world) ---- */
  const k = (s: number, p: { x: number; y: number }, dx = 0, dy = 0): CursorKey => ({
    frame: sec(s),
    x: p.x + dx,
    y: p.y + dy,
  });

  const strikeAt = (strike: number) => ({ x: HIT.strikeX(strike), y: HIT.rulerY });
  const rangeAt = (pct: number) => HIT.rangeThumb(pct);
  const ivAt = (mult: number) => HIT.ivThumb(mult);

  const cursorKeys: CursorKey[] = [
    /* S2 add */
    k(10.2, HIT.addBtn, 180, 120),
    k(11.85, HIT.addBtn, 4, 4),
    k(12.6, HIT.addBtn, 4, 4),
    k(13.4, strikeAt(900), 20, 10),
    /* S3 drag strike 912 → 864 */
    k(18.4, strikeAt(912), 40, 60),
    k(19.4, strikeAt(912), 6, 4),
    k(24.2, strikeAt(864), 6, 4),
    k(25.4, strikeAt(864), 30, 40),
    /* S4 click leg */
    k(26.4, strikeAt(864), 80, 70),
    k(27.5, strikeAt(864), 4, 4),
    k(29.5, strikeAt(864), 20, 40),
    k(31.2, strikeAt(864), 60, 80),
    /* S5 template */
    k(32.4, HIT.menuItem, 120, 100),
    k(34.0, HIT.menuItem, 10, 6),
    k(36.2, HIT.menuItem, 6, 4),
    k(38.5, HIT.menuItem, 40, 50),
    /* S6 table overview — idle low */
    k(40.5, { x: WIN.cx, y: WIN.cy + 80 }, 0, 0),
    k(46.5, { x: WIN.cx + 80, y: WIN.cy + 40 }, 0, 0),
    /* S7 curve toggle */
    k(48.4, HIT.curveToggle, 100, 80),
    k(49.85, HIT.curveToggle, 4, 4),
    k(52.5, { x: WIN.cx, y: WIN.cy + 20 }, 0, 0),
    /* S8 range then IV */
    k(56.4, rangeAt(4.2), 80, 60),
    k(57.3, rangeAt(4.2), 4, 4),
    k(60.2, rangeAt(8.4), 4, 4),
    k(61.4, ivAt(1), 40, 30),
    k(62.0, ivAt(1), 4, 4),
    k(64.0, ivAt(1.55), 4, 4),
    k(65.2, ivAt(1), 20, 20),
    /* S9 backtest */
    k(65.8, HIT.backtestBtn, 100, 80),
    k(66.7, HIT.backtestBtn, 4, 4),
    k(67.8, HIT.backtestBtn, 20, 30),
  ];

  const cursorWorld = getCursorPos(f, cursorKeys);
  const cursorScreen = worldToScreen(cursorWorld, cam, W, H);

  const cursorOpacity = Math.max(
    fadeWin(f, 10.1, 14.5, 0.35),
    fadeWin(f, 18.2, 25.6, 0.3),
    fadeWin(f, 26.3, 31.5, 0.3),
    fadeWin(f, 32.3, 39.0, 0.3),
    fadeWin(f, 48.2, 53.0, 0.3),
    fadeWin(f, 56.2, 65.4, 0.3),
    fadeWin(f, 65.6, 68.2, 0.3),
  );

  const clickFrames = [
    sec(12.0),
    sec(27.6),
    sec(36.4),
    sec(50.0),
    sec(66.8),
  ];

  const dragTarget: "range" | "iv" | null =
    t >= 57.2 && t < 61.5 ? "range" : t >= 61.8 && t < 65.4 ? "iv" : null;

  const winScale = 0.92 + 0.08 * state.winIn;
  const browserOp = state.winIn * (1 - prog(f, 67.6, 68.6));
  const hookOp = fadeWin(f, 0.1, 3.9, 0.5);
  const hookLine2 = prog(f, 1.2, 1.9, EASE_OUT);

  return (
    <AbsoluteFill style={{ background: C.stage }}>
      <Stage breathe={t < 4 ? 1 : 0.45}>
        {/* S0 hook */}
        {hookOp > 0.01 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: hookOp,
              zIndex: 20,
              pointerEvents: "none",
              padding: "0 120px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 56,
                color: C.white,
                lineHeight: 1.35,
                letterSpacing: "0.02em",
                transform: `translateY(${(1 - prog(f, 0.2, 1.0, EASE_OUT)) * 20}px)`,
              }}
            >
              仓位写好了。
            </div>
            <div
              style={{
                fontFamily: SERIF,
                fontSize: 52,
                fontStyle: "italic",
                color: C.lime,
                marginTop: 18,
                opacity: hookLine2,
                transform: `translateY(${(1 - hookLine2) * 14}px)`,
                textShadow: `0 0 40px ${C.limeDim}`,
              }}
            >
              盈亏怎么算？
            </div>
          </div>
        ) : null}

        <Camera state={cam} width={W} height={H}>
          {browserOp > 0.01 ? (
            <AppWindow opacity={browserOp} scale={winScale}>
              <StrategyBuilderUI state={state} dragTarget={dragTarget} contentW={WIN.w} contentH={WIN.h - 36} />
            </AppWindow>
          ) : null}
        </Camera>

        <Cursor
          x={cursorScreen.x}
          y={cursorScreen.y}
          size={40}
          opacity={cursorOpacity * browserOp}
          clickFrames={clickFrames}
          frame={f}
        />

        <EndCard frame={f} from={67.5} to={70} />

        {/* Captions */}
        <CaptionBar
          frame={f}
          from={4.2}
          to={9.6}
          segs={[{ text: "打开" }, { text: "策略构建", key: true }, { text: " · 沪金 AU" }]}
          keyTimes={[0.6]}
        />
        <CaptionBar
          frame={f}
          from={10.2}
          to={17.5}
          segs={[{ text: "点" }, { text: "添加合约", key: true }, { text: "，钉上 " }, { text: "864 C ×1", key: true }]}
          keyTimes={[0.5, 2.2]}
        />
        <CaptionBar
          frame={f}
          from={18.2}
          to={25.6}
          segs={[{ text: "拖动腿标签，改" }, { text: "行权价", key: true }]}
          keyTimes={[0.8]}
        />
        <CaptionBar
          frame={f}
          from={26.3}
          to={31.5}
          segs={[{ text: "点开合约，看" }, { text: "数量与细节", key: true }]}
          keyTimes={[0.6]}
        />
        <CaptionBar
          frame={f}
          from={32.3}
          to={39.5}
          segs={[{ text: "也能套" }, { text: "现成策略", key: true }, { text: "模板" }]}
          keyTimes={[0.7]}
        />
        <CaptionBar
          frame={f}
          from={40.3}
          to={47.5}
          segs={[{ text: "表格模式 · " }, { text: "日期×标的", key: true }, { text: "热力盈亏" }]}
          keyTimes={[0.8]}
        />
        <CaptionBar
          frame={f}
          from={48.3}
          to={55.5}
          segs={[{ text: "切到" }, { text: "曲线", key: true }, { text: "，同一仓位换种看法" }]}
          keyTimes={[0.5]}
        />
        <CaptionBar
          frame={f}
          from={56.3}
          to={65.5}
          segs={[
            { text: "拖" },
            { text: "标的范围", key: true },
            { text: "与" },
            { text: "隐波", key: true },
            { text: "，压力测试一眼可见" },
          ]}
          keyTimes={[0.4, 2.8]}
        />
        <CaptionBar
          frame={f}
          from={66.0}
          to={68.8}
          segs={[{ text: "结构看清，再" }, { text: "回测模拟", key: true }]}
          keyTimes={[0.5]}
        />

        {t > 4 && t < 67.5 ? (
          <div
            style={{
              position: "absolute",
              right: 48,
              top: 40,
              fontSize: 13,
              letterSpacing: "0.16em",
              color: "rgba(255,255,255,0.28)",
              opacity: browserOp,
              zIndex: 22,
            }}
          >
            OPENVLAB
          </div>
        ) : null}
      </Stage>
    </AbsoluteFill>
  );
};
