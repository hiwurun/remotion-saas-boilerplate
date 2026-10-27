import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";
import { CHART_MOUNT_AT, LogoCurveMorph, MORPH_BG } from "../openvlab-logo-curve/OpenVlabLogoCurve";
import { buildCurveTarget } from "../openvlab-logo-curve/vMark";
import {
  CHART_COLORS_DARK,
  ChartStageFrame,
  StrategyChartCanvas,
  type ChartColors,
} from "../openvlab-logo-curve/strategy-chart/StrategyChartView";
import { STAGE_LEFT, STAGE_SCALE, STAGE_TOP } from "../openvlab-logo-curve/strategy-chart/model";
import { ProfitTablePanel, tableCellCenter } from "./components/ProfitTablePanel";
import { RULER_HEIGHT, StrikeRulerStrip } from "./components/StrikeRulerStrip";
import { NOW_DTE, PRETTY_DTE, SPREAD, TABLE_COLUMNS, buildTable } from "./data";
import {
  H,
  INSERT_FROM,
  INSERT_TO,
  SOFT,
  W,
  cameraAt,
  ghostDteAt,
  ghostOpacityAt,
  ramp,
  solidDteAt,
  window4,
} from "./timeline";

/**
 * OpenVlab strategy promo — 别被一张「到期很好看」的图骗进去.
 *
 * One continuous world: the mark unbends onto the near-expiry PnL line of a bull call spread, the product chart
 * assembles around it, and time scrubs back to today in-camera so the pretty shape sags. Lines are recomputed
 * from the product chart pipeline every frame. Dark product theme throughout, no glow / ring / blur / flash.
 */
export { FPS, H, TOTAL, W } from "./timeline";

const LINE = "#F4EFE4";
const COLORS: ChartColors = { ...CHART_COLORS_DARK, surface: MORPH_BG };
const RULER_TOP = STAGE_TOP - RULER_HEIGHT * STAGE_SCALE - 6;
const MORPH_TARGET = buildCurveTarget(SPREAD.screenPoints(PRETTY_DTE));

const TABLE = buildTable(SPREAD);
const MAX_LOSS_ROW = 13;
const EXPIRY_COL = TABLE_COLUMNS.length - 1;
const MAX_LOSS_CELL = tableCellCenter(TABLE, MAX_LOSS_ROW, EXPIRY_COL);

/** S2 micro word, parked just above the "now" line's right shoulder (world px). */
const NOW_WORD_AT = (() => {
  const p = SPREAD.pointAt(7000, NOW_DTE);
  return { x: STAGE_LEFT + STAGE_SCALE * p.x, y: STAGE_TOP + STAGE_SCALE * p.y };
})();

const NowWord: React.FC<{ t: number }> = ({ t }) => {
  const o = window4(t, 19.9, 20.6, 21.3, 21.9);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: NOW_WORD_AT.x,
        top: NOW_WORD_AT.y - 46,
        transform: "translateX(-50%)",
        fontFamily: SANS,
        fontSize: 20,
        fontWeight: 500,
        letterSpacing: "0.3em",
        paddingLeft: "0.3em",
        color: COLORS.foreground,
        opacity: 0.82 * o,
        whiteSpace: "nowrap",
      }}
    >
      现在
    </div>
  );
};

/** Sub-second ProfitTable beauty cut: the expiry column's max-loss cell, macro, drifting. */
const TableInsert: React.FC<{ t: number }> = ({ t }) => {
  if (t < INSERT_FROM || t >= INSERT_TO) return null;
  const p = (t - INSERT_FROM) / (INSERT_TO - INSERT_FROM);
  const z = 4.2 + 0.18 * p;
  const sx = 1560 - 26 * p;
  const sy = 560 + 6 * p;
  return (
    <AbsoluteFill style={{ backgroundColor: MORPH_BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${sx}px, ${sy}px) scale(${z}) translate(${-MAX_LOSS_CELL.x}px, ${-MAX_LOSS_CELL.y}px)`,
        }}
      >
        <ProfitTablePanel table={TABLE} colors={COLORS} />
      </div>
    </AbsoluteFill>
  );
};

const Lockup: React.FC<{ t: number }> = ({ t }) => {
  const enter = ramp(t, 33.0, 34.4, SOFT);
  const o = enter * (1 - ramp(t, 35.3, 36.0, SOFT));
  if (o <= 0) return null;
  const spacing = 0.56 - 0.16 * enter;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, opacity: o }}>
      <BrandMark size={88} src="openvlab-market/logo.svg" glow={0} />
      <div style={{ marginTop: 28, fontSize: 42, fontWeight: 500, color: LINE, letterSpacing: `${spacing}em`, paddingLeft: `${spacing}em` }}>
        OpenVlab
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 20,
          color: "rgba(244,239,228,0.56)",
          letterSpacing: "0.32em",
          paddingLeft: "0.32em",
          opacity: ramp(t, 33.6, 34.6, SOFT),
        }}
      >
        到期好看，不够。
      </div>
    </AbsoluteFill>
  );
};

export const OpenVlabStrategyOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cam = cameraAt(t);
  const worldOpacity = 1 - ramp(t, 32.2, 33.4, SOFT);

  const solidDte = solidDteAt(t);
  const ghostOpacity = ghostOpacityAt(t);
  const ghost =
    ghostOpacity > 0 ? { line: SPREAD.buildLine({ lineDte: ghostDteAt(t), index: 1, idBase: "strat-ghost-ovl" }), opacity: ghostOpacity } : null;
  const rulerIn = ramp(t, 4.2, 5.0, SOFT);

  return (
    <AbsoluteFill style={{ backgroundColor: MORPH_BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`,
          opacity: worldOpacity,
        }}
      >
        {rulerIn > 0 ? (
          <div
            style={{
              position: "absolute",
              left: STAGE_LEFT,
              top: RULER_TOP,
              transformOrigin: "0 0",
              transform: `scale(${STAGE_SCALE}) translateY(${-24 * (1 - rulerIn)}px)`,
              opacity: rulerIn,
            }}
          >
            <StrikeRulerStrip m={SPREAD} colors={COLORS} legOpacity={ramp(t, 4.7, 5.3)} />
          </div>
        ) : null}

        {t >= CHART_MOUNT_AT ? (
          <ChartStageFrame>
            <StrategyChartCanvas
              model={SPREAD}
              colors={COLORS}
              lines={[SPREAD.buildLine({ lineDte: solidDte, index: 0, idBase: "strat-graph-0-ovl" })]}
              ghost={ghost}
              areaPath={SPREAD.buildArea(solidDte)}
              areaGradientIdBase="strat-graph-0-ovl"
              area={ramp(t, 4.3, 4.9)}
              zeroLine={ramp(t, 3.5, 4.1)}
              axes={ramp(t, 3.55, 3.95)}
              ticks={ramp(t, 3.65, 4.35)}
              currentPrice={ramp(t, 4.4, 4.9)}
              currentPriceLabel={0}
              breakEven={SPREAD.liveBreakEven(solidDte)}
              breakEvenDraw={ramp(t, 6.6, 7.8, SOFT)}
              breakEvenOpacity={0.6}
              breakEvenLabel={0}
              legend={[]}
              legendOpacity={[]}
            />
          </ChartStageFrame>
        ) : null}

        <NowWord t={t} />
        <LogoCurveMorph t={t} target={MORPH_TARGET} />
      </div>

      <TableInsert t={t} />
      <Lockup t={t} />
    </AbsoluteFill>
  );
};
