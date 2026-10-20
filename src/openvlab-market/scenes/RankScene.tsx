import React from "react";
import { SANS } from "../../shared/fonts";
import { RankCards } from "../components/RankCards";
import type { MarketTimeline } from "../timeline";

/** Shot 5: 隐波最大上升/下降 rank cards (number roll, #1 highlight, 能化 re-rank crossfade). */
export const RankScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, model, rankRoll, rankHL, altMix } = tl;
  return (
    <RankCards rankings={model.rankings} alt={model.focusRankings} altMix={altMix} rollT={rankRoll} highlight={rankHL} accent={accent} font={SANS} />
  );
};
