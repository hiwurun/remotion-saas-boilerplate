import React from "react";
import { spring } from "remotion";
import { BrandMark } from "../../openvlab-market/components/BrandMark";
import { SoftBg } from "../open/LightStage";
import { SANS } from "../../shared/fonts";
import { B, mo } from "../beats";
import { FPS } from "../timeline";

/**
 * Ending — elastic brand lockup (no logo fade-in, no final shrink).
 *
 * Motion:
 *   1. SoftBg washes over the fading chart (B.lift) — ground only, not the mark
 *   2. Final logo.svg drops from high center with a spring (B.logo) — opacity 1 from first frame
 *   3. Mark hops LEFT briefly (B.hop) — higher damping, 1–2 soft overshoots
 *   4. «OpenVlab» then the theme line right-slide in early (B.word / B.theme)
 *   5. Theme sits snug under the OpenVlab wordmark; hold through B.out
 *
 * Only public/openvlab-strategy/logo.svg. No disc / stroke / glyph proxy.
 */
const W = 1920;
const MARK = 240;
const LAND_CX = W / 2;
const LAND_CY = 420;
/** how far left of center the mark settles after the hop */
const LEFT_SHIFT = -300;
/** drop start offset (px above land Y) */
const DROP_FROM = -480;
const WORD = "OpenVlab";
const WORD_SIZE = 88;
const WORD_LH = 100;
const GAP = 40;
const THEME = "让每笔盈亏都可见";
const THEME_SIZE = 56;
const THEME_LH = 68;
/** gap between OpenVlab baseline block and the slogan under it */
const THEME_GAP = 10;

export const End: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.lift[0]) return null;

  const wash = mo(f, B.lift);

  // Full opacity the instant the mark exists — never a fade-in / never a shrink-out.
  const logoOn = f >= B.logo[0];
  const size = MARK;

  const drop = logoOn
    ? spring({
        frame: Math.max(0, f - B.logo[0]),
        fps: FPS,
        config: { damping: 13, stiffness: 170, mass: 0.9 },
      })
    : 0;
  // May slightly overshoot past 1 on impact — keep that bounce on Y.
  const dropY = DROP_FROM * (1 - drop);

  const hop =
    f < B.hop[0]
      ? 0
      : spring({
          frame: Math.max(0, f - B.hop[0]),
          fps: FPS,
          // Higher damping → short settle (about one soft overshoot), not a long wobble.
          config: { damping: 13, stiffness: 95, mass: 1 },
        });
  const shiftX = LEFT_SHIFT * hop;

  const wordP = mo(f, B.word);
  const themeP = mo(f, B.theme);

  const markCx = LAND_CX + shiftX;
  const markCy = LAND_CY + dropY;
  const markLeft = markCx - size / 2;
  const markTop = markCy - size / 2;

  // Copy anchors to the FINAL settled mark (not the live hop), so it does not wiggle with overshoot.
  const settledMarkLeft = LAND_CX + LEFT_SHIFT - size / 2;
  const copyLeft = settledMarkLeft + size + GAP;
  // 右滑入场：从最终位置右侧滑入
  const wordSlideX = (1 - wordP) * 120;
  const themeSlideX = (1 - themeP) * 120;
  const settledCy = LAND_CY;
  const wordTop = settledCy - WORD_LH / 2;
  // Slogan snug under the OpenVlab wordmark (brand lockup), not under the mark disc.
  const themeTop = wordTop + WORD_LH + THEME_GAP;

  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: SANS }}>
      {wash > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: wash }}>
          <SoftBg f={0} />
        </div>
      )}

      {logoOn && (
        <div
          style={{
            position: "absolute",
            left: markLeft,
            top: markTop,
            width: size,
            height: size,
            opacity: 1,
          }}
        >
          <BrandMark size={size} src="openvlab-strategy/logo.svg" glow={Math.min(1, drop) * 0.85} />
        </div>
      )}

      {wordP > 0.001 && logoOn && (
        <div
          style={{
            position: "absolute",
            left: copyLeft + wordSlideX,
            top: wordTop,
            fontSize: WORD_SIZE,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            color: "#0f1218",
            lineHeight: `${WORD_LH}px`,
            whiteSpace: "nowrap",
            opacity: wordP,
          }}
        >
          {WORD}
        </div>
      )}

      {themeP > 0.001 && logoOn && (
        <div
          style={{
            position: "absolute",
            left: copyLeft + themeSlideX,
            top: themeTop,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: THEME_SIZE,
            lineHeight: `${THEME_LH}px`,
            letterSpacing: "0.02em",
            color: "#0f1218",
            whiteSpace: "nowrap",
            opacity: themeP,
          }}
        >
          {THEME}
        </div>
      )}
    </div>
  );
};
