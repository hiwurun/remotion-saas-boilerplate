import React from "react";
import { SANS } from "../../shared/fonts";
import { fill } from "../data";
import { WIN } from "../layout";
import { QuadrantChart } from "../components/QuadrantChart";
import type { MarketTimeline } from "../timeline";

/** Shot 8: 全景图 quadrant chart (window back face). */
export const QuadrantScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, model, T, f, bp, dur, tipProduct, popT, labelsP, groupUp, groupDown, tipP } = tl;
  return (
    <QuadrantChart
      width={WIN.w}
      height={WIN.h}
      points={model.quad.points}
      domain={model.quad.domain}
      summary={model.summary}
      font={SANS}
      accent={accent}
      popT={popT}
      popDur={dur(4)}
      labelsP={labelsP}
      groupUp={groupUp}
      groupDown={groupDown}
      upLabel={fill(copy.quadrantUpLabel, T)}
      downLabel={fill(copy.quadrantDownLabel, T)}
      tip={{ product: tipProduct, p: tipP }}
      frame={f}
      bgP={bp(64.4, 65.4)}
    />
  );
};
