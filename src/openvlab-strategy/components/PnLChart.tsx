import React, { useMemo } from "react";
import { CHART, LEGEND, PRODUCT, expiryPayoff, processPayoff, sampleCurve } from "../data";
import { C, MONO, SANS } from "../theme";

type Props = {
  width?: number;
  height?: number;
  ivMorph?: number;
  rangePct?: number;
  opacity?: number;
};

/**
 * Remotion remake of StrategyChartView PnL curves (IM2611 long-call).
 * Stroke/fill use product CHART_UP (#dc0000) / CHART_DOWN (#00ff00) /
 * CHART_ZERO_CROSS (#f4b400) vertical gradients — see StrategyChartView ChartDefs.
 */
export const PnLChart: React.FC<Props> = ({
  width = 1600,
  height = 480,
  ivMorph = 1,
  rangePct = 6.1,
  opacity = 1,
}) => {
  const pad = { l: 56, r: 20, t: 30, b: 30 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const xMin = PRODUCT.price * (1 - rangePct / 100);
  const xMax = PRODUCT.price * (1 + rangePct / 100);
  const yMin = CHART.yMin;
  const yMax = CHART.yMax;

  const xOf = (x: number) => pad.l + ((x - xMin) / (xMax - xMin)) * iw;
  const yOf = (y: number) => pad.t + ((yMax - y) / (yMax - yMin)) * ih;

  // tRemain=1 → as-of (25 DTE); tRemain=6/25 → Nov 14 (6 calendar days left)
  const expiry = useMemo(() => sampleCurve((x) => expiryPayoff(x), 160, xMin, xMax), [xMin, xMax]);
  const procNear = useMemo(
    () => sampleCurve((x) => processPayoff(x, 1, ivMorph), 96, xMin, xMax),
    [ivMorph, xMin, xMax],
  );
  const procMid = useMemo(
    () => sampleCurve((x) => processPayoff(x, 6 / 25, ivMorph), 96, xMin, xMax),
    [ivMorph, xMin, xMax],
  );

  const beX = xOf(CHART.breakeven);
  const spotX = xOf(CHART.spot);
  const zeroY = yOf(0);

  // Product getGradientMiddleOffset(series.extent) — bbox-relative zero for gradient stroke/fill
  const { middleOffset, lowerStrokeOffset, upperStrokeOffset } = useMemo(() => {
    const ys = expiry.map((p) => p.y);
    const extentMax = Math.max(...ys, 0.0001);
    const extentMin = Math.min(...ys, -0.0001);
    const span = extentMax - extentMin;
    const mid = Math.max(0, Math.min(1, extentMax / span));
    return {
      middleOffset: mid,
      lowerStrokeOffset: Math.max(0, mid - 0.05),
      upperStrokeOffset: Math.min(1, mid + 0.05),
    };
  }, [expiry]);

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.x).toFixed(1)},${yOf(p.y).toFixed(1)}`).join(" ");

  const expiryPath = useMemo(() => toPath(expiry), [expiry, iw, ih, xMin, xMax]);
  const areaPath = useMemo(() => {
    if (expiry.length < 2) return "";
    return `${toPath(expiry)} L${xOf(expiry[expiry.length - 1]!.x)},${zeroY} L${xOf(expiry[0]!.x)},${zeroY} Z`;
  }, [expiry, iw, ih, xMin, xMax, zeroY]);

  const yTicks = [-20000, 0, 20000];
  const gid = "pnl";

  return (
    <svg width={width} height={height} style={{ display: "block", fontFamily: SANS, opacity }}>
      <defs>
        {/* Product ChartDefs: fill switches UP↔DOWN at zero */}
        <linearGradient id={`${gid}-fill`} x1="0" x2="0" y1="0" y2="1">
          <stop offset={middleOffset} stopColor={C.chartUp} stopOpacity={1} />
          <stop offset={middleOffset} stopColor={C.chartDown} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${gid}-stroke`} x1="0" x2="0" y1="0" y2="1">
          <stop offset={lowerStrokeOffset} stopColor={C.chartUp} stopOpacity={1} />
          <stop offset={middleOffset} stopColor={C.chartZero} stopOpacity={0.5} />
          <stop offset={upperStrokeOffset} stopColor={C.chartDown} stopOpacity={1} />
        </linearGradient>
        {/* Fade toward zero axis (stratGraphGradient / Rev) */}
        <linearGradient id={`${gid}-fade-up`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity={0} />
          <stop offset="100%" stopColor="#fff" stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`${gid}-fade-dn`} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity={1} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id={`${gid}-graphMask`}>
          <rect x={pad.l} y={pad.t} width={iw} height={Math.max(0, zeroY - pad.t)} fill={`url(#${gid}-fade-up)`} />
          <rect
            x={pad.l}
            y={zeroY}
            width={iw}
            height={Math.max(0, pad.t + ih - zeroY)}
            fill={`url(#${gid}-fade-dn)`}
          />
        </mask>
        <clipPath id={`${gid}-clip`}>
          <rect x={pad.l} y={pad.t} width={iw} height={ih} />
        </clipPath>
      </defs>

      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line
            x1={pad.l}
            x2={pad.l + iw}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke={C.chartGrid}
            strokeWidth={1}
          />
          <text
            x={pad.l - 8}
            y={yOf(v) + 4}
            textAnchor="end"
            fontSize={10}
            fill={C.uiMuted}
            fontFamily={MONO}
          >
            {v === 0 ? "0" : v > 0 ? `+${v / 1000}k` : `${v / 1000}k`}
          </text>
        </g>
      ))}

      {/* Zero axis — product uses primary 0.5px; we use yellow-bright like CHART_ZERO_CROSS cue */}
      <line
        x1={pad.l}
        x2={pad.l + iw}
        y1={zeroY + 0.5}
        y2={zeroY + 0.5}
        stroke={C.chartZero}
        strokeWidth={0.75}
        opacity={0.9}
      />

      <g clipPath={`url(#${gid}-clip)`}>
        {/* Area under expiry with product fade mask */}
        {areaPath ? (
          <path d={areaPath} fill={`url(#${gid}-fill)`} mask={`url(#${gid}-graphMask)`} opacity={0.8} />
        ) : null}
        {/* Process (pre-expiry) dashed lines — muted green */}
        <path
          d={toPath(procMid)}
          fill="none"
          stroke={C.chartDown}
          strokeWidth={1.5}
          strokeDasharray="2,2"
          opacity={0.45}
          strokeLinecap="round"
        />
        <path
          d={toPath(procNear)}
          fill="none"
          stroke={C.processStroke}
          strokeWidth={1.5}
          strokeDasharray="4,4"
          opacity={0.55}
          strokeLinecap="round"
        />
        {/* Expiry solid with UP/DOWN gradient stroke */}
        <path
          d={expiryPath}
          fill="none"
          stroke={`url(#${gid}-stroke)`}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>

      {/* Spot — brand dashed (product uses primary for underlying) */}
      <line
        x1={spotX}
        x2={spotX}
        y1={pad.t}
        y2={pad.t + ih}
        stroke={C.chartBrand}
        strokeWidth={1}
        strokeDasharray="4,4"
        opacity={0.85}
      />
      <text x={spotX} y={pad.t - 12} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.ink} fontFamily={MONO}>
        {CHART.spot}
      </text>
      <text x={spotX} y={pad.t - 1} textAnchor="middle" fontSize={10} fill={C.uiMuted}>
        当前价格
      </text>

      {/* Breakeven — CHART_BREAK_EVEN_COLOR = brand */}
      <line
        x1={beX}
        x2={beX}
        y1={pad.t + 20}
        y2={pad.t + ih}
        stroke={C.chartBrand}
        strokeWidth={0.75}
        strokeDasharray="4,4"
        opacity={0.9}
      />
      <text x={beX} y={zeroY + 16} textAnchor="middle" fontSize={11} fontWeight={700} fill={C.chartBrand} fontFamily={MONO}>
        {CHART.breakeven}
      </text>
      <text x={beX} y={zeroY + 30} textAnchor="middle" fontSize={10} fontWeight={700} fill={C.chartBrand}>
        盈亏平衡
      </text>

      <g transform={`translate(${pad.l + 8}, ${pad.t + 6})`}>
        {LEGEND.map((item, i) => (
          <g key={item.label} transform={`translate(0, ${18 * i})`}>
            <line
              x1={0}
              x2={22}
              y1={4}
              y2={4}
              stroke={i === 0 ? C.chartUp : C.uiMuted}
              strokeWidth={i === 0 ? 2.2 : 1.5}
              strokeDasharray={item.dash ?? undefined}
              opacity={i === 0 ? 1 : 0.7}
            />
            <text x={28} y={7} fontSize={11} fill={C.ink} fontFamily={SANS}>
              {item.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
