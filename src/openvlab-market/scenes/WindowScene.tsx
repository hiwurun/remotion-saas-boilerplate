import React from "react";
import { interpolate } from "remotion";
import { CLAMP } from "../theme";
import { SANS } from "../../shared/fonts";
import { CARDS, WIN, WIN_LEFT, WIN_TOP } from "../layout";
import { pressCurve } from "../components/Cursor";
import { FlipCard } from "../components/FlipCard";
import { MarketShell } from "../components/MarketShell";
import { RankScene } from "./RankScene";
import { PremiumScene } from "./PremiumScene";
import { TableScene } from "./TableScene";
import { QuadrantScene } from "./QuadrantScene";
import type { MarketTimeline } from "../timeline";

/** Rank + premium cards row (shots 5/6). */
export const CardsRow: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  return (
    <div style={{ display: "flex", gap: CARDS.gap }}>
      <RankScene tl={tl} />
      <PremiumScene tl={tl} />
    </div>
  );
};

/** App window front face: MarketShell (filter bar, toolbar, 数值筛选 UI) with the cards row and the table. */
export const WindowFront: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { brandName, logoSrc, accent, model, T, f, bp, focusIdx, ml, mlp, mc, mLabel, mApplied, mChips, resolveT, notesOut, viewPress, viewP, optPress, sectorP, hoverOpt } = tl;
  return (
    <MarketShell
      resolveT={resolveT}
      brandName={brandName}
      logoSrc={logoSrc}
      accent={accent}
      font={SANS}
      sectors={model.sectors}
      total={model.rows.length}
      activeSector={focusIdx}
      sectorP={sectorP}
      hoverOpt={hoverOpt}
      optPress={optPress}
      viewP={viewP}
      toolbarDim={bp(51.6, 52.2) * (1 - notesOut)}
      metricUi={{ badge: mApplied, count: 1, quickField: mc.label, activeLabel: mLabel, active: mApplied, chipsP: mChips, hidden: model.tableRows.length - model.metricRows.length, press: pressCurve(f, ml(1.5)), clearHover: mlp(8.3, 8.4) }}
      viewPress={viewPress}
      asOf={T.asOf}
      cards={<CardsRow tl={tl} />}
      table={<TableScene tl={tl} />}
    />
  );
};

/** Shot 4 → 9: the app window (scale-in, FlipCard front = market page, back = 全景图). */
export const WindowScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { winIn, winScale, flip } = tl;
  return (
    <>
    {winIn > 0 ? (
      <div style={{ position: "absolute", left: WIN_LEFT, top: WIN_TOP, width: WIN.w, height: WIN.h, opacity: interpolate(winIn, [0, 0.4], [0, 1], CLAMP), transform: `scale(${winScale})` }}>
        <FlipCard width={WIN.w} height={WIN.h} angle={flip} perspective={3600} front={<WindowFront tl={tl} />} back={<QuadrantScene tl={tl} />} />
      </div>
    ) : null}
    </>
  );
};
