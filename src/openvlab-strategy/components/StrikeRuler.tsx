import React, { useMemo } from "react";
import { LEG, MAX_OI, OI_CALL, OI_PUT, PRODUCT, STRIKES } from "../data";
import { C, MONO, SANS } from "../theme";

/**
 * 1:1 remake of product StrikeSelector ruler strip
 * (shared-pages/.../strike-selector.tsx + OpenInterestBar + RulerTick + OptionLabel).
 *
 * Geometry notes (product Tailwind → px):
 * - outer: py-1.5 (6px)
 * - title: text-sm muted + info icon, mb-2
 * - ruler: h-10 (40px) px-2.5
 * - OI bar: w-[5px], inset top-1/bottom-1, call bottom-full (above) red,
 *   put top-full (below) green, height = oi/maxOi * 75%
 * - ticks: before/after primary #BFED5C h-1.5 top-1/bottom-1
 * - 最新价: dashed border-blue-500/70, -top-3.5 label
 * - OptionLabel long: -top-[30px], red tag, gray xN badge, down arrow
 */

type Props = {
  /** 0–1 leg label visibility (video); stills pass 1 */
  legVisible?: number;
  /** Current strike (animated during drag) */
  strike?: number;
  /** Leg selected / popover open (video only) */
  legOpen?: number;
  /** Ruler content width in CSS px — drives main-tick thinning */
  rulerWidth?: number;
};

const LABEL_WIDTH = 60;
const LABEL_SPACING = 10;

function getStrikePosition(strike: number, minStrike: number, maxStrike: number) {
  if (maxStrike === minStrike) return 50;
  return ((strike - minStrike) / (maxStrike - minStrike)) * 100;
}

function calculateVisibleMainTicks(
  strikes: readonly number[],
  rulerWidth: number,
  minStrike: number,
  maxStrike: number,
) {
  if (!rulerWidth || strikes.length === 0) return new Set<number>();
  const sorted = [...strikes].sort((a, b) => a - b);
  const maxLabels = Math.floor(rulerWidth / (LABEL_WIDTH + LABEL_SPACING));
  if (sorted.length <= maxLabels) return new Set(sorted);

  const step = Math.ceil(sorted.length / maxLabels);
  const visible = new Set<number>();
  visible.add(sorted[0]!);
  for (let i = step; i < sorted.length - 1; i += step) visible.add(sorted[i]!);

  const last = sorted[sorted.length - 1]!;
  const lastVisible = Array.from(visible).pop();
  if (
    lastVisible != null &&
    Math.abs(
      getStrikePosition(last, minStrike, maxStrike) -
        getStrikePosition(lastVisible, minStrike, maxStrike),
    ) >=
      ((LABEL_WIDTH + LABEL_SPACING) / rulerWidth) * 100
  ) {
    visible.add(last);
  }
  return visible;
}

function oiHeightPct(oi: number) {
  if (MAX_OI <= 0) return "0%";
  return `${(oi / MAX_OI) * 75}%`;
}

export const StrikeRuler: React.FC<Props> = ({
  legVisible = 1,
  strike = LEG.strike,
  legOpen = 0,
  rulerWidth = 1800,
}) => {
  const minStrike = STRIKES[0]!;
  const maxStrike = STRIKES[STRIKES.length - 1]!;
  const pct = (s: number) => getStrikePosition(s, minStrike, maxStrike);

  const visibleMainTicks = useMemo(
    () => calculateVisibleMainTicks(STRIKES, rulerWidth, minStrike, maxStrike),
    [rulerWidth, minStrike, maxStrike],
  );

  const underlying = PRODUCT.price; // IM2611 last 6604.8

  return (
    <div
      style={{
        fontFamily: SANS,
        paddingTop: 6,
        paddingBottom: 6,
        color: C.ink,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* 行权价 + info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 4,
          marginBottom: 8,
          color: C.uiMuted,
          fontSize: 14,
          lineHeight: 1.25,
        }}
      >
        <span>行权价</span>
        <span
          aria-hidden
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            border: `1.5px solid ${C.uiMuted}`,
            fontSize: 9,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.85,
            boxSizing: "border-box",
          }}
        >
          i
        </span>
      </div>

      {/* Ruler — product h-10; overflow visible for OI bars + OptionLabel */}
      <div
        style={{
          position: "relative",
          height: 40,
          paddingLeft: 10,
          paddingRight: 10,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            height: "100%",
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* RulerTick × N */}
          {STRIKES.map((s) => {
            const isFirst = s === minStrike;
            const isLast = s === maxStrike;
            const isMain = visibleMainTicks.has(s);
            const labelTransform = isLast
              ? "translate(-100%, -50%)"
              : isFirst
                ? "translate(0%, -50%)"
                : "translate(-50%, -50%)";
            return (
              <div
                key={`tick-${s}`}
                style={{
                  position: "absolute",
                  left: `${pct(s)}%`,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  transform: "translateX(-50%)",
                  zIndex: 2,
                }}
              >
                {/* before: top tick */}
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    left: 0,
                    width: 1,
                    height: 6,
                    background: C.primary,
                  }}
                />
                {/* after: bottom tick */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 0,
                    width: 1,
                    height: 6,
                    background: C.primary,
                  }}
                />
                {isMain ? (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: labelTransform,
                      fontSize: 12,
                      lineHeight: 1,
                      fontFamily: MONO,
                      color: C.ink,
                      whiteSpace: "nowrap",
                      userSelect: "none",
                    }}
                  >
                    {s}
                  </div>
                ) : null}
              </div>
            );
          })}

          {/* 最新价 marker — underlying last */}
          <div
            style={{
              position: "absolute",
              left: `${pct(underlying)}%`,
              top: 0,
              bottom: 0,
              transform: "translateX(-50%)",
              zIndex: 3,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                color: C.ink,
                lineHeight: 1,
              }}
            >
              最新价
            </div>
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: 0,
                borderLeft: "1px dashed rgba(59,130,246,0.7)", // border-blue-500/70
              }}
            />
          </div>

          {/* OpenInterestBar layer — pointer-events-none absolute inset-0 z-[1] */}
          <div
            style={{
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              zIndex: 1,
            }}
          >
            {STRIKES.map((s) => {
              const callH = oiHeightPct(OI_CALL[s] ?? 0);
              const putH = oiHeightPct(OI_PUT[s] ?? 0);
              return (
                <div
                  key={`oi-${s}`}
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    left: `${pct(s)}%`,
                    top: 4,
                    bottom: 4,
                    width: 5,
                    height: "calc(100% - 8px)",
                    transform: "translateX(-50%)",
                  }}
                >
                  {/* Put — top-full, grows downward, green */}
                  <div
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      width: "100%",
                      height: putH,
                      borderRadius: 2,
                      background:
                        "linear-gradient(to top, rgba(34,197,94,0.3), rgb(34,197,94))",
                      // product: bg-gradient-to-t from-green-500/30 to-green-500
                    }}
                  />
                  {/* Call — bottom-full, grows upward, red */}
                  <div
                    style={{
                      pointerEvents: "none",
                      position: "absolute",
                      bottom: "100%",
                      left: 0,
                      width: "100%",
                      height: callH,
                      borderRadius: 2,
                      background:
                        "linear-gradient(to bottom, rgb(239,68,68), rgba(239,68,68,0.3))",
                      // product: bg-gradient-to-b from-red-500 to-red-500/30
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* OptionLabel — long call 6600 C ×1 */}
          {legVisible > 0.01 ? (
            <div
              style={{
                position: "absolute",
                left: `${pct(strike)}%`,
                top: -30,
                zIndex: 5,
                display: "flex",
                minWidth: 70,
                // product getStrikeStyle overrides -translate-x-1/2 → translateX(0)
                transform: `translateX(0) translateY(0) scale(${0.88 + 0.12 * legVisible})`,
                opacity: legVisible,
                flexDirection: "column",
                alignItems: "center",
                willChange: "transform",
                userSelect: "none",
              }}
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                {/* quantity badge — absolute -left-3 -top-2 */}
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    left: -12,
                    top: -8,
                    zIndex: 10,
                    borderRadius: 4,
                    background: "rgba(107,114,128,0.9)", // bg-gray-500/90
                    color: C.white,
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    lineHeight: 1.2,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                    fontFamily: SANS,
                  }}
                >
                  x{LEG.qty}
                </div>
                {/* main tag */}
                <div
                  style={{
                    pointerEvents: "none",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 4,
                    padding: 4,
                    fontSize: 14,
                    fontWeight: 700,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                    color: C.white,
                    background: C.ashareRed, // --vlab-red #ea3943
                    marginBottom: 2,
                    fontFamily: SANS,
                    boxShadow:
                      legOpen > 0.3
                        ? `0 0 0 2px ${C.primary}, 0 4px 14px rgba(234,57,67,0.45)`
                        : undefined,
                    transform: legOpen > 0 ? `scale(${1 + legOpen * 0.06})` : undefined,
                  }}
                >
                  <span>{strike}</span>
                  <span style={{ marginLeft: 4 }}>{LEG.type}</span>
                </div>
              </div>
              {/* caret down — border-t-4 text-red-500 */}
              <div
                style={{
                  pointerEvents: "none",
                  width: 0,
                  height: 0,
                  borderLeft: "4px solid transparent",
                  borderRight: "4px solid transparent",
                  borderTop: "4px solid rgb(239,68,68)", // text-red-500
                  borderBottom: 0,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
