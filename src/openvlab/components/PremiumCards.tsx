import React from "react";
import { C, signColor } from "../theme";
import { CARD_W, CARDS, PREMIUM_SPANS } from "../layout";
import { formatNumber, type Rankings } from "../data";
import { RankCard, type RankColumn } from "./RankCard";
import { NumberRoll } from "./ui";

/** 隐波 / 实波 / 溢价 columns (MarketHeaderDesktop.tsx carryColumns). 溢价 = the `carry` field. */
export const carryColumns: RankColumn[] = [
  { label: "名称", span: PREMIUM_SPANS[0], render: () => null },
  { label: "隐波", span: PREMIUM_SPANS[1], render: (r) => <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatNumber(r.atmv, 2, 2)}</span> },
  { label: "实波", span: PREMIUM_SPANS[2], render: (r) => <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{formatNumber(r.rv22, 2, 2)}</span> },
  { label: "溢价", span: PREMIUM_SPANS[3], render: (r, t, isTop) => <NumberRoll text={formatNumber(r.carry, 2, 2)} t={t} fontSize={isTop ? 17 : 16} weight={isTop ? 700 : 500} color={signColor(r.carry)} /> },
];

/** PremiumCards: 波动率溢价最高 / 最低 (cards 2 and 3 of the header grid). */
export const PremiumCards: React.FC<{
  rankings: Rankings;
  alt?: Rankings;
  altMix?: number;
  rollT?: number;
  highlightTop?: number;
  highlightBottom?: number;
  tagTop?: { text: string; p: number };
  tagBottom?: { text: string; p: number };
  accent: string;
  font: string;
}> = ({ rankings, alt, altMix, rollT, highlightTop, highlightBottom, tagTop, tagBottom, accent, font }) => (
  <div style={{ display: "flex", gap: CARDS.gap }}>
    <RankCard width={CARD_W} height={CARDS.h} title="波动率溢价" coloredText="最高" titleColor={C.up} columns={carryColumns} rows={rankings.topCarries} altRows={alt?.topCarries} altMix={altMix} rollT={rollT} highlight={highlightTop} accent={accent} font={font} tag={tagTop ? { ...tagTop, color: C.up } : undefined} />
    <RankCard width={CARD_W} height={CARDS.h} title="波动率溢价" coloredText="最低" titleColor={C.down} columns={carryColumns} rows={rankings.bottomCarries} altRows={alt?.bottomCarries} altMix={altMix} rollT={rollT} highlight={highlightBottom} accent={accent} font={font} tag={tagBottom ? { ...tagBottom, color: C.down } : undefined} />
  </div>
);
