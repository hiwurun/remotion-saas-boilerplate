import React from "react";
import { SANS } from "../../shared/fonts";
import { PremiumCards } from "../components/PremiumCards";
import { SelectionBox } from "../components/SelectionBox";
import type { MarketTimeline } from "../timeline";

/** Shot 6: 波动率溢价 cards (number roll, top/bottom highlight + tags). */
export const PremiumScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, model, premRoll, premHLTop, premHLBot, tagTopP, tagBotP, altMix } = tl;
  return (
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
  );
};

/** Shot 6: selection box sweeping the 溢价 column (world space, above the window). */
export const PremiumSelection: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, selIn, selRect } = tl;
  return (
    <>
    {selIn > 0 ? <SelectionBox rect={selRect} accent={accent} label={copy.premiumFormula} progress={selIn} font={SANS} labelSize={17} labelBelow /> : null}
    </>
  );
};
