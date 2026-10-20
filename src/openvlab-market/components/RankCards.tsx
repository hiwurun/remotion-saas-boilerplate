import React from "react";
import { C, signColor } from "../theme";
import { CARD_W, CARDS, RANK_SPANS } from "../layout";
import { formatNumber, formatPct, previewOf, type MarketRow, type Rankings } from "../data";
import { RankCard, type RankColumn } from "./RankCard";
import { LineSvg, NumberRoll } from "./ui";

/** 涨幅% / 隐波变化 / 分时预览 columns (MarketHeaderDesktop.tsx atmvColumns; 分时预览 = LineSvg 75×17, no time labels; real 分时 data). */
export const atmvColumns = (big = false): RankColumn[] => [
  { label: "名称", span: RANK_SPANS[0], render: () => null },
  { label: "涨幅%", span: RANK_SPANS[1], render: (r) => <span style={{ fontWeight: 500, color: signColor(r.ctn), fontVariantNumeric: "tabular-nums" }}>{formatPct(r.ctn)}</span> },
  {
    label: "隐波变化",
    span: RANK_SPANS[2],
    render: (r, t, isTop) => <NumberRoll text={formatNumber(r.atmvChg, 2, 2)} t={t} fontSize={isTop && big ? 18 : 16} weight={isTop && big ? 700 : 500} color={signColor(r.atmvChg)} />,
  },
  {
    label: "分时预览",
    span: RANK_SPANS[3],
    render: (r) => {
      const s = previewOf(r);
      return <LineSvg id={`rk-${r.product}`} data={s.price} indicator={s.vol} width={52} height={18} lineColor={signColor(r.ctn)} strokeWidth={1.3} />;
    },
  },
];

/** RankCards: 隐波最大上升 / 隐波最大下降 (cards 0 and 1 of the header grid). */
export const RankCards: React.FC<{
  rankings: Rankings;
  alt?: Rankings;
  altMix?: number;
  rollT?: number;
  highlight?: number;
  accent: string;
  font: string;
}> = ({ rankings, alt, altMix, rollT, highlight, accent, font }) => (
  <div style={{ display: "flex", gap: CARDS.gap }}>
    <RankCard width={CARD_W} height={CARDS.h} title="隐波最大" coloredText="上升" titleColor={C.up} columns={atmvColumns(true)} rows={rankings.topAtmvs} altRows={alt?.topAtmvs} altMix={altMix} rollT={rollT} highlight={highlight} accent={accent} font={font} />
    <RankCard width={CARD_W} height={CARDS.h} title="隐波最大" coloredText="下降" titleColor={C.down} columns={atmvColumns(true)} rows={rankings.bottomAtmvs} altRows={alt?.bottomAtmvs} altMix={altMix} rollT={rollT} highlight={highlight} accent={accent} font={font} />
  </div>
);

export type { MarketRow };
