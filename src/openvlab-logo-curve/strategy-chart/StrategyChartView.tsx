import React from "react";
import { SANS } from "../../shared/fonts";
import {
  AREA_PATH,
  CHART_LAYOUT,
  CONTAINER_HEIGHT,
  CONTAINER_WIDTH,
  LEGEND_ITEMS,
  LINE_SERIES,
  type LiveLine,
  OVERLAY_LABELS,
  STAGE_LEFT,
  STAGE_SCALE,
  STAGE_TOP,
  UNDERLYING_X,
  X_TICKS,
  Y_TICKS,
  ZERO_AXIS_Y,
  formatUnderlyingPrice,
  formatYAxisTickLabel,
  getGradientMiddleOffset,
} from "./model";

/**
 * Remotion port of vlab-frontend `strategy-chart/StrategyChartView.tsx` (non-small, legend on, no distribution,
 * no previous strategy, no target price). Element structure, draw order, offsets, stroke widths, dash patterns,
 * masks and gradients follow the source; CSS variables are resolved to the light theme. The hover layer is used
 * as a scripted read-out instead of following a pointer.
 */

/** StrategyChart.constants.ts colour variables, light theme. */
export const CHART_COLORS = {
  axis: "#9CA3AF", // --vlab-chart-axis
  up: "#dc0000", // --vlab-chart-up-color
  down: "#00ff00", // --vlab-chart-down-color
  brand: "#0078ff", // --vlab-brand (break-even, hover)
  zeroCross: "#f4b400", // --vlab-yellow-bright
  primary: "#AFF33E", // --primary oklch(0.8871 0.2122 128.5041)
  surface: "#FFFFFF", // --background
  foreground: "#020717", // --popover-foreground / --foreground
  muted: "#6B7280", // --muted-foreground
  border: "#E4E7EC", // --border
} as const;

export const CHART_SURFACE = CHART_COLORS.surface;

const SVG_TEXT_XS_FONT_SIZE_PX = 12;
const AXIS_TICK_OFFSET_Y_PX = 16;
const TOOLTIP_LARGE_WIDTH_PX = 100;
const TOOLTIP_SMALL_WIDTH_PX = 80;
const TOOLTIP_HEIGHT_PX = 16;
const TOOLTIP_RADIUS_PX = 2;
const TOOLTIP_TEXT_BASELINE_Y_PX = 12;
const CHART_ID = "ovl";

export type ChartLineInput = LiveLine & {
  /** Left-to-right draw-on, 0..1 (default 1). */
  draw?: number;
  /** Opacity multiplier on top of the product line opacity (default 1). */
  fade?: number;
};

export type ChartReadout = {
  opacity: number;
  /** Container-space x of the read-out line. */
  x: number;
  priceText: string;
  points: Array<{ y: number; text: string }>;
};

export type ChartCanvasProps = {
  lines: ChartLineInput[];
  ghost?: { line: LiveLine; opacity: number } | null;
  areaPath: string;
  areaGradientIdBase: string;
  area: number;
  zeroLine: number;
  axes: number;
  ticks: number;
  currentPrice: number;
  breakEven: { chartX: number; leftPercent: number; value: string } | null;
  /** Top-to-bottom draw-on of the break-even line, 0..1. */
  breakEvenDraw: number;
  breakEvenOpacity?: number;
  breakEvenLabel: number;
  legend: Array<{ key: string; label: string; dashArray?: string; opacity: number }>;
  legendOpacity: number[];
  readout?: ChartReadout | null;
};

/** Per-index stagger inside one monotonic progress value. */
export const stagger = (p: number, index: number, count: number, spread = 0.5) => {
  const start = count <= 1 ? 0 : (index / (count - 1)) * spread;
  return Math.max(0, Math.min(1, (p - start) / (1 - spread)));
};

const FixedSvgText: React.FC<
  Omit<React.SVGProps<SVGTextElement>, "children" | "fontSize" | "x" | "y"> & {
    children: React.ReactNode;
    x: number;
    y: number;
  }
> = ({ children, x, y, ...textProps }) => (
  // renderScaleX/Y are 1: the viewBox equals the container's CSS size and the stage zoom is a uniform transform.
  <g transform={`translate(${x}, ${y}) scale(1, 1)`}>
    <text x={0} y={0} fontSize={SVG_TEXT_XS_FONT_SIZE_PX} {...textProps}>
      {children}
    </text>
  </g>
);

const FixedSvgTooltip: React.FC<{
  text: string;
  textAnchor?: "start" | "middle" | "end";
  textFill: string;
  textFillOpacity?: number;
  textOffsetXPx: number;
  widthPx: number;
  x: number;
  y: number;
}> = ({ text, textAnchor = "middle", textFill, textFillOpacity, textOffsetXPx, widthPx, x, y }) => (
  <g transform={`translate(${x}, ${y}) scale(1, 1)`}>
    <rect
      x={0}
      y={0}
      width={widthPx}
      height={TOOLTIP_HEIGHT_PX}
      fill={CHART_COLORS.surface}
      fillOpacity={0.98}
      stroke={CHART_COLORS.border}
      strokeOpacity={0.85}
      rx={TOOLTIP_RADIUS_PX}
    />
    <text
      fill={textFill}
      fillOpacity={textFillOpacity}
      fontSize={SVG_TEXT_XS_FONT_SIZE_PX}
      fontWeight={500}
      x={textOffsetXPx}
      y={TOOLTIP_TEXT_BASELINE_Y_PX}
      textAnchor={textAnchor}
    >
      {text}
    </text>
  </g>
);

const OverlayTextLabel: React.FC<{
  bold?: boolean;
  children: React.ReactNode;
  color?: string;
  left: string;
  opacity: number;
  top: string;
  transform: string;
}> = ({ bold, children, color = CHART_COLORS.foreground, left, opacity, top, transform }) =>
  opacity <= 0 ? null : (
    <span
      style={{
        position: "absolute",
        zIndex: 10,
        fontSize: 12,
        lineHeight: 1,
        whiteSpace: "nowrap",
        fontWeight: bold ? 700 : 400,
        color,
        left,
        top,
        transform,
        opacity,
      }}
    >
      {children}
    </span>
  );

const SeriesGradients: React.FC<{ line: LiveLine }> = ({ line }) => {
  const middleOffset = getGradientMiddleOffset(line.extent);
  const lowerStrokeOffset = Math.max(0, middleOffset - 0.05);
  const upperStrokeOffset = Math.min(1, middleOffset + 0.05);
  return (
    <React.Fragment>
      <linearGradient id={`${line.gradientIdBase}-fill`} x1="0" x2="0" y1="0" y2="1">
        <stop offset={middleOffset} stopColor={CHART_COLORS.up} stopOpacity="1" />
        <stop offset={middleOffset} stopColor={CHART_COLORS.down} stopOpacity="1" />
      </linearGradient>
      <linearGradient id={`${line.gradientIdBase}-stroke`} x1="0" x2="0" y1="0" y2="1">
        <stop offset={lowerStrokeOffset} stopColor={CHART_COLORS.up} stopOpacity="1" />
        <stop offset={middleOffset} stopColor={CHART_COLORS.zeroCross} stopOpacity="0.5" />
        <stop offset={upperStrokeOffset} stopColor={CHART_COLORS.down} stopOpacity="1" />
      </linearGradient>
    </React.Fragment>
  );
};

const ChartDefs: React.FC<{ props: ChartCanvasProps }> = ({ props }) => {
  const { height, width } = CHART_LAYOUT;
  const zeroAxisY = ZERO_AXIS_Y;
  return (
    <defs>
      <mask id={`stratBoundsMask${CHART_ID}`}>
        <rect x="0" y="0" width={width} height={height} fill="#fff" />
      </mask>

      <mask id={`stratGraphMask${CHART_ID}`}>
        <rect x="0" y="0" width={width} height={Math.max(0, zeroAxisY)} fill={`url(#stratGraphGradient${CHART_ID})`} />
        <rect
          x="0"
          y={zeroAxisY}
          width={width}
          height={Math.max(0, height - zeroAxisY)}
          fill={`url(#stratGraphGradientRev${CHART_ID})`}
        />
      </mask>

      {/* Left-to-right draw-on per line (not in the product; drives the assemble-in only). */}
      {props.lines.map((line, index) => (
        <clipPath key={line.gradientIdBase} id={`stratRevealClip${CHART_ID}-${index}`}>
          <rect x={-4} y={-4} width={(width + 8) * (line.draw ?? 1)} height={height + 8} />
        </clipPath>
      ))}

      <linearGradient id={`stratGraphGradient${CHART_ID}`} x1="0" x2="0" y1="100%" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="0" />
        <stop offset="100%" stopColor="#fff" stopOpacity="1" />
      </linearGradient>

      <linearGradient id={`stratGraphGradientRev${CHART_ID}`} x1="0" x2="0" y1="100%" y2="0">
        <stop offset="0%" stopColor="#fff" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>

      {props.lines.map((line) => (
        <SeriesGradients key={line.gradientIdBase} line={line} />
      ))}
      {props.ghost ? <SeriesGradients line={props.ghost.line} /> : null}
    </defs>
  );
};

const ChartAxes: React.FC<{ props: ChartCanvasProps }> = ({ props }) => {
  const { height, left, top } = CHART_LAYOUT;
  return (
    <React.Fragment>
      <g transform={`translate(${left}, ${height + top})`}>
        {X_TICKS.map((tick, i) => (
          <g key={tick.value} transform={`translate(${tick.x}, 0)`} opacity={stagger(props.ticks, i, X_TICKS.length)}>
            <line y2="6" x1="0.5" x2="0.5" stroke={CHART_COLORS.axis} strokeOpacity={0.3} />
            <FixedSvgText fill={CHART_COLORS.axis} textAnchor="middle" x={0} y={AXIS_TICK_OFFSET_Y_PX}>
              {formatUnderlyingPrice(tick.value)}
            </FixedSvgText>
          </g>
        ))}
      </g>

      <g transform={`translate(${left - 6}, ${top})`}>
        {Y_TICKS.map((tick, i) => (
          <g key={tick.value} transform={`translate(0, ${tick.y})`} opacity={stagger(props.ticks, Y_TICKS.length - 1 - i, Y_TICKS.length)}>
            <line x2="6" y1="0.5" y2="0.5" stroke={CHART_COLORS.axis} strokeOpacity={0.3} />
            <FixedSvgText alignmentBaseline="middle" fill={CHART_COLORS.axis} textAnchor="end" x={-4} y={0}>
              {formatYAxisTickLabel(tick.value)}
            </FixedSvgText>
          </g>
        ))}
      </g>
    </React.Fragment>
  );
};

const ChartSeriesLayer: React.FC<{ props: ChartCanvasProps }> = ({ props }) => {
  const { height, left, top, width } = CHART_LAYOUT;
  const chartTransform = `translate(${left},${top})`;
  const be = props.breakEven;
  const beTop = top + 20;
  const beBottom = top + height;
  return (
    <React.Fragment>
      <line
        stroke={CHART_COLORS.primary}
        strokeWidth={0.5}
        y1={top + ZERO_AXIS_Y + 0.5}
        y2={top + ZERO_AXIS_Y + 0.5}
        x1={left}
        x2={left + (width + 6) * props.zeroLine}
        opacity={props.zeroLine > 0 ? 1 : 0}
      />

      {props.ghost && props.ghost.opacity > 0 ? (
        <path
          fill="none"
          stroke={`url(#${props.ghost.line.gradientIdBase}-stroke)`}
          strokeWidth="2"
          strokeDasharray={props.ghost.line.dashArray}
          strokeLinecap="round"
          opacity={props.ghost.line.opacity * props.ghost.opacity}
          mask={`url(#stratBoundsMask${CHART_ID})`}
          transform={chartTransform}
          d={props.ghost.line.path}
        />
      ) : null}

      {props.lines.map((line, index) =>
        (line.fade ?? 1) <= 0 || (line.draw ?? 1) <= 0 ? null : (
          <g key={line.gradientIdBase} clipPath={(line.draw ?? 1) < 1 ? `url(#stratRevealClip${CHART_ID}-${index})` : undefined} transform={chartTransform}>
            <path
              fill="none"
              stroke={`url(#${line.gradientIdBase}-stroke)`}
              strokeWidth="2"
              strokeDasharray={line.dashArray}
              strokeLinecap="round"
              opacity={line.opacity * (line.fade ?? 1)}
              mask={`url(#stratBoundsMask${CHART_ID})`}
              d={line.path}
            />
          </g>
        ),
      )}

      {props.area > 0 ? (
        <path
          fill={`url(#${props.areaGradientIdBase}-fill)`}
          mask={`url(#stratGraphMask${CHART_ID})`}
          opacity={0.8 * props.area}
          transform={chartTransform}
          d={props.areaPath}
        />
      ) : null}

      <g opacity={props.axes}>
        <line stroke={CHART_COLORS.axis} strokeOpacity={0.3} x1={0} x2={width} transform={`translate(${left}, ${height + top})`} />
        <line stroke={CHART_COLORS.axis} strokeOpacity={0.3} y1={0} y2={height} transform={`translate(${left}, ${top})`} />
      </g>

      {props.currentPrice > 0 ? (
        <line
          stroke={CHART_COLORS.primary}
          strokeWidth={0.5}
          y1={top + 8}
          y2={top + height}
          x1={left + UNDERLYING_X - 1}
          x2={left + UNDERLYING_X - 1}
          opacity={props.currentPrice}
        />
      ) : null}

      {be && props.breakEvenDraw > 0 ? (
        <line
          stroke={CHART_COLORS.brand}
          strokeWidth="0.5"
          strokeDasharray="4,4"
          y1={beTop}
          y2={beTop + (beBottom - beTop) * props.breakEvenDraw}
          x1={be.chartX}
          x2={be.chartX}
          opacity={props.breakEvenOpacity ?? 1}
        />
      ) : null}
    </React.Fragment>
  );
};

const ChartReadoutLayer: React.FC<{ readout: ChartReadout }> = ({ readout }) => {
  const { height, top } = CHART_LAYOUT;
  return (
    <g opacity={readout.opacity}>
      <line stroke={CHART_COLORS.muted} strokeWidth="2" y1={top} y2={top + height} x1={readout.x} x2={readout.x} />
      <FixedSvgTooltip
        text={readout.priceText}
        textFill={CHART_COLORS.brand}
        textOffsetXPx={TOOLTIP_LARGE_WIDTH_PX / 2}
        widthPx={TOOLTIP_LARGE_WIDTH_PX}
        x={readout.x - TOOLTIP_LARGE_WIDTH_PX / 2}
        y={top - 6}
      />
      {readout.points.map((point) => (
        <React.Fragment key={point.text.split(" ")[0]}>
          <circle fill={CHART_COLORS.brand} stroke={CHART_COLORS.surface} strokeWidth="2" r="4" cx={readout.x} cy={point.y} />
          <FixedSvgTooltip
            text={point.text}
            textAnchor="start"
            textFill={CHART_COLORS.foreground}
            textFillOpacity={0.95}
            textOffsetXPx={7}
            widthPx={TOOLTIP_SMALL_WIDTH_PX}
            x={readout.x + 8}
            y={point.y - 8}
          />
        </React.Fragment>
      ))}
    </g>
  );
};

const LegendPreview: React.FC<{ dashArray?: string; opacity: number }> = ({ dashArray, opacity }) => (
  <React.Fragment>
    <line x1={0} x2={25} y1={0} y2={0} stroke={CHART_COLORS.surface} strokeWidth="5" strokeLinecap="round" />
    <line
      x1={0}
      x2={25}
      y1={0}
      y2={0}
      stroke={CHART_COLORS.foreground}
      strokeWidth="3"
      strokeDasharray={dashArray}
      opacity={opacity}
      strokeLinecap="round"
    />
  </React.Fragment>
);

const ChartLegend: React.FC<{ props: ChartCanvasProps }> = ({ props }) => {
  const { left, top } = CHART_LAYOUT;
  return (
    <g transform={`translate(${left + 8}, ${top + 8})`}>
      {props.legend.map((item, index) =>
        (props.legendOpacity[index] ?? 0) <= 0 ? null : (
          <g key={item.key} transform={`translate(0, ${18 * index})`} opacity={props.legendOpacity[index]}>
            <LegendPreview dashArray={item.dashArray} opacity={item.opacity} />
            <FixedSvgText fill={CHART_COLORS.foreground} x={33} y={4}>
              {item.label}
            </FixedSvgText>
          </g>
        ),
      )}
    </g>
  );
};

const ChartOverlayLabels: React.FC<{ props: ChartCanvasProps }> = ({ props }) => {
  const be = props.breakEven;
  return (
    <React.Fragment>
      <OverlayTextLabel
        bold
        left={`${OVERLAY_LABELS.currentPriceLabelLeftPercent}%`}
        top={`calc(${OVERLAY_LABELS.currentPriceLabelTopPercent}% - 28px)`}
        transform="translateX(-50%)"
        opacity={props.currentPrice}
      >
        {OVERLAY_LABELS.currentPriceValue}
      </OverlayTextLabel>
      <OverlayTextLabel
        left={`${OVERLAY_LABELS.currentPriceLabelLeftPercent}%`}
        top={`calc(${OVERLAY_LABELS.currentPriceLabelTopPercent}% - 16px)`}
        transform="translateX(-50%)"
        opacity={props.currentPrice}
      >
        当前价格
      </OverlayTextLabel>

      {/* A single break-even point anchors 'middle' (getBreakEvenAnchor). */}
      {be ? (
        <React.Fragment>
          <OverlayTextLabel
            bold
            color={CHART_COLORS.brand}
            left={`${be.leftPercent}%`}
            top={`${OVERLAY_LABELS.breakEven.priceLabelTopPercent}%`}
            transform="translateX(-50%)"
            opacity={props.breakEvenLabel}
          >
            {be.value}
          </OverlayTextLabel>
          <OverlayTextLabel
            bold
            color={CHART_COLORS.brand}
            left={`${be.leftPercent}%`}
            top={`${OVERLAY_LABELS.breakEven.tagLabelTopPercent}%`}
            transform="translateX(-50%)"
            opacity={props.breakEvenLabel}
          >
            盈亏平衡
          </OverlayTextLabel>
        </React.Fragment>
      ) : null}
    </React.Fragment>
  );
};

/** The product chart container content (1400×380 CSS px). */
export const StrategyChartCanvas: React.FC<ChartCanvasProps> = (props) => (
  <div style={{ position: "relative", width: CONTAINER_WIDTH, height: CONTAINER_HEIGHT, overflow: "hidden", fontFamily: SANS }}>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CONTAINER_WIDTH} ${CONTAINER_HEIGHT}`}
      preserveAspectRatio="none"
      style={{ display: "block", overflow: "hidden" }}
    >
      <ChartDefs props={props} />
      <ChartAxes props={props} />
      <ChartSeriesLayer props={props} />
      {props.readout && props.readout.opacity > 0 ? <ChartReadoutLayer readout={props.readout} /> : null}
      <ChartLegend props={props} />
    </svg>
    <ChartOverlayLabels props={props} />
  </div>
);

/** Places a 1400×380 product container on the 1920×1080 frame at STAGE_SCALE (optionally shifted). */
export const ChartStageFrame: React.FC<{ children: React.ReactNode; dx?: number; dy?: number; opacity?: number }> = ({
  children,
  dx = 0,
  dy = 0,
  opacity = 1,
}) => (
  <div
    style={{
      position: "absolute",
      left: STAGE_LEFT + dx,
      top: STAGE_TOP + dy,
      width: CONTAINER_WIDTH,
      height: CONTAINER_HEIGHT,
      transformOrigin: "0 0",
      transform: `scale(${STAGE_SCALE})`,
      opacity,
    }}
  >
    {children}
  </div>
);

/** 0 → hidden, 1 → final product state. Every value must only increase over time. */
export type ChartReveal = {
  /** The T+0 series stroke (the morph line lands on it, so it is 1 as soon as the stage mounts). */
  primaryLine: number;
  zeroLine: number;
  axes: number;
  ticks: number;
  secondaryLines: number;
  area: number;
  markers: number;
  legend: number;
};

/** Static snapshot chart (the openvlab-logo-curve end state). */
export const StrategyChartStage: React.FC<{ reveal: ChartReveal }> = ({ reveal }) => (
  <ChartStageFrame>
    <StrategyChartCanvas
      lines={LINE_SERIES.map((series, index) =>
        index === 0 ? { ...series, fade: reveal.primaryLine } : { ...series, draw: reveal.secondaryLines },
      )}
      areaPath={AREA_PATH}
      areaGradientIdBase={LINE_SERIES[0].gradientIdBase}
      area={reveal.area}
      zeroLine={reveal.zeroLine}
      axes={reveal.axes}
      ticks={reveal.ticks}
      currentPrice={reveal.markers}
      breakEven={OVERLAY_LABELS.breakEven}
      breakEvenDraw={reveal.markers > 0 ? 1 : 0}
      breakEvenOpacity={reveal.markers}
      breakEvenLabel={reveal.markers}
      legend={LEGEND_ITEMS}
      legendOpacity={LEGEND_ITEMS.map((_, i) => stagger(reveal.legend, i, LEGEND_ITEMS.length, 0.4))}
    />
  </ChartStageFrame>
);
