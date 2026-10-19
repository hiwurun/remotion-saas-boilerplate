import React from "react";
import { AbsoluteFill, CalculateMetadataFunction, useCurrentFrame } from "remotion";
import { OpenVLabProps } from "./schema";
import { C, CLAMP, EASE } from "./theme";
import { SANS } from "./fonts";
import { CARDS, WIN } from "./layout";
import { loadMarketRows, useMarketModel } from "./OpenVLabVideo";
import { RankCards } from "./components/RankCards";
import { PremiumCards } from "./components/PremiumCards";
import { QuadrantChart } from "./components/QuadrantChart";
import { interpolate } from "remotion";

/** Standalone QA composition: the four header cards (RankCards + PremiumCards) at 2× on the dark stage. */
export const OpenVLabRankCardsPart: React.FC<OpenVLabProps> = (props) => {
  const model = useMarketModel(props);
  const f = useCurrentFrame();
  const hl = interpolate(f, [40, 70], [0, 1], { ...CLAMP, easing: EASE });
  if (!model.rows.length) return <AbsoluteFill style={{ background: C.bg }} />;
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
      <div style={{ width: WIN.w - CARDS.pad * 2, transform: "scale(1.18)", display: "flex", gap: CARDS.gap }}>
        <RankCards rankings={model.rankings} rollT={f} highlight={hl} accent={props.accentColor} font={SANS} />
        <PremiumCards rankings={model.rankings} rollT={f} highlightTop={hl} highlightBottom={hl} tagTop={{ text: props.copy.premiumHighTag, p: hl }} tagBottom={{ text: props.copy.premiumLowTag, p: hl }} accent={props.accentColor} font={SANS} />
      </div>
    </AbsoluteFill>
  );
};

/** Standalone QA composition: 价波四象限 with all dots, labels and the IV-up group lit. */
export const OpenVLabQuadrantPart: React.FC<OpenVLabProps> = (props) => {
  const model = useMarketModel(props);
  const f = useCurrentFrame();
  if (!model.rows.length) return <AbsoluteFill style={{ background: C.bg }} />;
  const tip = model.rankings.topAtmvs[0]?.product ?? "";
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: "center", justifyContent: "center", fontFamily: SANS }}>
      <div style={{ transform: "scale(1.08)" }}>
        <QuadrantChart width={WIN.w} height={WIN.h} points={model.quad.points} domain={model.quad.domain} summary={model.summary} font={SANS} accent={props.accentColor} popT={f} popDur={120} labelsP={interpolate(f, [130, 150], [0, 1], CLAMP)} groupUp={interpolate(f, [160, 180], [0, 1], CLAMP)} upLabel={`隐波上升 ${model.summary.ivUpCount}`} tip={{ product: tip, p: interpolate(f, [170, 190], [0, 1], CLAMP) }} frame={f} />
      </div>
    </AbsoluteFill>
  );
};

export const calculatePartMetadata: CalculateMetadataFunction<OpenVLabProps> = async ({ props }) => ({
  durationInFrames: 240,
  fps: 60,
  props: await loadMarketRows(props),
});
