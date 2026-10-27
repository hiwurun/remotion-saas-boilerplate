import React from "react";
import { AbsoluteFill, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { SANS } from "../shared/fonts";
import { CHART_MOUNT_AT, LogoCurveMorph, MORPH_BG } from "../openvlab-logo-curve/OpenVlabLogoCurve";
import {
  CHART_COLORS,
  ChartStageFrame,
  StrategyChartCanvas,
  type ChartLineInput,
} from "../openvlab-logo-curve/strategy-chart/StrategyChartView";
import {
  STAGE_LEFT,
  STAGE_SCALE,
  STAGE_TOP,
  buildLiveArea,
  buildLiveBreakEven,
  buildLiveLine,
  chartPointAt,
  formatUnderlyingPrice,
  lineLabel,
} from "../openvlab-logo-curve/strategy-chart/model";
import { ProfitTablePanel } from "./components/ProfitTablePanel";
import { RULER_HEIGHT, StrikeRulerStrip } from "./components/StrikeRulerStrip";
import { ScenarioToolbar } from "./components/ScenarioToolbar";
import { formatProfitLoss, strikeX } from "./data";
import {
  CAPTIONS,
  H,
  MID_DTE,
  NEAR_EXPIRY_DTE,
  NOW_DTE,
  SOFT,
  SPOT_PRICE,
  W,
  cameraAt,
  ghostSplitAt,
  ghostVisible,
  ivMultAt,
  ramp,
  solidDteAt,
  tableSlideAt,
  window4,
} from "./timeline";

/**
 * OpenVlab strategy promo opening — 「到期好看，不等于现在好看」.
 *
 * One continuous world: the logo → curve morph lands on the product chart's T+0 line, and every later shot is a
 * camera move or a state change on that same layout (strike ruler above, scenario sliders below, table to the
 * right). Lines are recomputed from the product chart pipeline every frame, so date / IV changes morph in-camera.
 * No glow, no rim ring, no blur, no white flash; all fades are monotonic within their beat.
 */
export { FPS, H, TOTAL, W } from "./timeline";

const LINE = "#F4EFE4";
const RULER_TOP = STAGE_TOP - RULER_HEIGHT * STAGE_SCALE - 6;
const TOOLBAR_TOP = STAGE_TOP + 380 * STAGE_SCALE + 26;
const SLIDE_DISTANCE = W;

const signed = (v: number) => `${v >= 0 ? "+" : ""}${formatProfitLoss(v)}`;
const shortDate = (dte: number) => lineLabel(dte).split(" ")[1]?.replace("月", "/").replace("日", "") ?? "";

const Caption: React.FC<{ t: number }> = ({ t }) => (
  <>
    {CAPTIONS.map((c) => {
      const o = window4(t, c.from, c.from + 0.6, c.to - 0.6, c.to);
      if (o <= 0) return null;
      return (
        <div
          key={c.text}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 44,
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "0.06em",
            color: CHART_COLORS.foreground,
            opacity: 0.78 * o,
            transform: `translateY(${(1 - o) * 6}px)`,
          }}
        >
          {c.text}
        </div>
      );
    })}
  </>
);

const Lockup: React.FC<{ t: number }> = ({ t }) => {
  const enter = ramp(t, 53.8, 55.0, SOFT);
  const o = enter * (1 - ramp(t, 55.35, 56.0, SOFT));
  if (o <= 0) return null;
  const spacing = 0.62 - 0.2 * enter;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: SANS, opacity: o }}>
      <BrandMark size={92} src="openvlab-market/logo.svg" glow={0} />
      <div
        style={{
          marginTop: 30,
          fontSize: 44,
          fontWeight: 500,
          color: LINE,
          letterSpacing: `${spacing}em`,
          paddingLeft: `${spacing}em`,
        }}
      >
        OpenVlab
      </div>
      <div
        style={{
          marginTop: 22,
          fontSize: 19,
          color: "rgba(244,239,228,0.52)",
          letterSpacing: "0.36em",
          paddingLeft: "0.36em",
        }}
      >
        到期好看，不等于现在好看
      </div>
    </AbsoluteFill>
  );
};

export const OpenVlabStrategyOpening: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const cam = cameraAt(t);
  const bg =
    t < 20
      ? interpolateColors(t, [3.2, 4.2], [MORPH_BG, CHART_COLORS.surface])
      : interpolateColors(t, [52.6, 54.2], [CHART_COLORS.surface, MORPH_BG]);
  const worldOpacity = 1 - ramp(t, 52.6, 54.0, SOFT);

  /* ---- live strategy state ---- */
  const solidDte = solidDteAt(t);
  const ivMult = ivMultAt(t);
  const split = ghostSplitAt(t);
  const ghostDte = solidDte + (NOW_DTE - solidDte) * split;

  const secondaryFade = ramp(t, 20.0, 21.0) * (1 - 0.7 * ramp(t, 24.2, 24.9));
  const lines: ChartLineInput[] = [
    buildLiveLine({ lineDte: solidDte, ivMult, index: 0, idBase: "strat-graph-0-ovl" }),
    { ...buildLiveLine({ lineDte: MID_DTE, ivMult, index: 1, idBase: "strat-graph-1-ovl" }), fade: secondaryFade },
    { ...buildLiveLine({ lineDte: 0, ivMult, index: 2, idBase: "strat-graph-2-ovl" }), fade: secondaryFade },
  ];
  const ghostOpacity = 0.5;
  const ghost = ghostVisible(t)
    ? { line: buildLiveLine({ lineDte: ghostDte, ivMult, index: 0, idBase: "strat-ghost-ovl" }), opacity: ghostOpacity }
    : null;

  const legend = [
    ...lines.map((l) => ({ key: l.gradientIdBase, label: l.label, dashArray: l.dashArray, opacity: l.opacity })),
    { key: "ghost", label: lineLabel(NOW_DTE), dashArray: undefined, opacity: ghostOpacity },
  ];
  const secondaryLegend = ramp(t, 20.2, 21.0) * (1 - 0.6 * ramp(t, 24.2, 24.9));
  const legendOpacity = [ramp(t, 4.75, 5.25), secondaryLegend, secondaryLegend, ramp(t, 25.6, 26.4) * (1 - ramp(t, 50.2, 51.2))];

  const spot = chartPointAt(SPOT_PRICE, solidDte, ivMult);
  const spotNow = chartPointAt(SPOT_PRICE, ghostDte, ivMult);
  const readoutOpacity = window4(t, 27.6, 28.3, 50.0, 50.6);
  const readout =
    readoutOpacity > 0
      ? {
          opacity: readoutOpacity,
          x: strikeX(SPOT_PRICE),
          priceText: formatUnderlyingPrice(SPOT_PRICE),
          points: [
            { y: spotNow.y, text: `现在 ${signed(spotNow.value)}` },
            { y: spot.y, text: `${shortDate(NEAR_EXPIRY_DTE)} ${signed(spot.value)}` },
          ],
        }
      : null;

  /* ---- layout state ---- */
  const slide = tableSlideAt(t);
  const chartDx = -SLIDE_DISTANCE * slide;
  const rulerIn = ramp(t, 8.5, 9.5, SOFT);
  const dateIn = ramp(t, 13.8, 14.6, SOFT);
  const ivIn = ramp(t, 42.4, 43.2, SOFT);

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
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
              left: STAGE_LEFT + chartDx,
              top: RULER_TOP,
              transformOrigin: "0 0",
              transform: `scale(${STAGE_SCALE}) translateY(${-36 * (1 - rulerIn)}px)`,
              opacity: rulerIn,
            }}
          >
            <StrikeRulerStrip legOpacity={ramp(t, 9.2, 9.8)} />
          </div>
        ) : null}

        {t >= CHART_MOUNT_AT && slide < 1 ? (
          <ChartStageFrame dx={chartDx}>
            <StrategyChartCanvas
              lines={lines}
              ghost={ghost}
              areaPath={buildLiveArea(solidDte, ivMult)}
              areaGradientIdBase={lines[0].gradientIdBase}
              area={ramp(t, 4.3, 4.9)}
              zeroLine={ramp(t, 3.7, 4.3)}
              axes={ramp(t, 3.75, 4.15)}
              ticks={ramp(t, 3.85, 4.55)}
              currentPrice={ramp(t, 9.3, 9.9)}
              breakEven={buildLiveBreakEven(solidDte, ivMult)}
              breakEvenDraw={ramp(t, 7.0, 8.1, SOFT)}
              breakEvenLabel={ramp(t, 7.9, 8.4)}
              legend={legend}
              legendOpacity={legendOpacity}
              readout={readout}
            />
          </ChartStageFrame>
        ) : null}

        {slide > 0 ? (
          <ChartStageFrame dx={SLIDE_DISTANCE * (1 - slide)}>
            <ProfitTablePanel focus={window4(t, 36.7, 37.5, 39.3, 39.8)} />
          </ChartStageFrame>
        ) : null}

        {dateIn > 0 ? (
          <div style={{ position: "absolute", left: STAGE_LEFT, top: TOOLBAR_TOP, transformOrigin: "0 0", transform: `scale(${STAGE_SCALE})` }}>
            <ScenarioToolbar
              dateDte={solidDte}
              dateOpacity={dateIn * (1 - 0.45 * ramp(t, 42.4, 43.0))}
              dateDy={14 * (1 - dateIn)}
              dateActive={window4(t, 14.9, 15.2, 19.6, 20.0)}
              ivMult={ivMult}
              ivOpacity={ivIn}
              ivDy={14 * (1 - ivIn)}
              ivActive={window4(t, 43.3, 43.6, 46.2, 46.6)}
            />
          </div>
        ) : null}

        <LogoCurveMorph t={t} />
      </div>

      <Caption t={t} />
      <Lockup t={t} />
    </AbsoluteFill>
  );
};
