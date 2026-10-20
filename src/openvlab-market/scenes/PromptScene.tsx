import React from "react";
import { C, blurOf } from "../theme";
import { SANS } from "../../shared/fonts";
import { PromptBar } from "../components/PromptBar";
import type { MarketTimeline } from "../timeline";

/** Shot 1: 「今天我们来讲」 + input box with typewriter prompt → send. */
export const PromptScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { logoSrc, accent, copy, f, W, nb, barC, labelIn, barIn, typed, typingDone, caretOpacity, sendPress, openOut, barScale } = tl;
  return (
    <>
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
    </>
  );
};
