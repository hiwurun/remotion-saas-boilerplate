import React from "react";
import { SANS } from "../../shared/fonts";
import { fill } from "../data";
import { Caption } from "../components/Caption";
import type { MarketTimeline } from "../timeline";

/** Screen-space shot captions (window, rank, premium, table, quadrant, 数值筛选, sector filter). */
export const ShotCaptions: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, T, W, bp, mlp, capY } = tl;
  return (
    <>
    <Caption text={copy.window} sub={fill(copy.windowSub, T)} p={bp(24.4, 25.2)} out={bp(29.2, 29.9)} y={capY - 20} width={W} font={SANS} accent={accent} />
    <Caption text={copy.rank} sub={fill(copy.rankSub, T)} p={bp(33.2, 34)} out={bp(39.2, 39.9)} y={capY - 90} width={W} font={SANS} accent={accent} />
    <Caption text={copy.premium} sub={fill(copy.premiumSub, T)} p={bp(43.2, 44)} out={bp(49.2, 49.9)} y={capY - 90} width={W} font={SANS} accent={accent} />
    <Caption text={copy.table} p={bp(51.8, 52.6)} out={bp(61.2, 61.9)} y={capY + 10} width={W} font={SANS} accent={accent} />
    <Caption text={fill(copy.quadrant, T)} sub={fill(copy.quadrantSub, T)} p={bp(66.4, 67.2)} out={bp(77, 77.8)} y={capY - 20} width={W} font={SANS} accent={accent} />
    <Caption text={copy.metric} sub={fill(copy.metricSub, T)} p={mlp(5.8, 6.6)} out={mlp(8.2, 8.8)} y={capY - 20} width={W} font={SANS} accent={accent} />
    <Caption text={copy.filter} sub={fill(copy.filterSub, T)} p={bp(86.4, 87.2)} out={bp(91.4, 92)} y={capY - 40} width={W} font={SANS} accent={accent} />
    </>
  );
};
