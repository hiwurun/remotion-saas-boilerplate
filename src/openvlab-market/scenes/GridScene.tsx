import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { SANS } from "../../shared/fonts";
import { WIN } from "../layout";
import { InfiniteGrid } from "../components/InfiniteGrid";
import { StatReel } from "../components/StatReel";
import { Caption } from "../components/Caption";
import type { MarketTimeline } from "../timeline";

/** Shot 10: infinite product grid around the window (world space, culled to the camera view). */
export const GridWorld: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, model, f, W, H, b, cam, gridT } = tl;
  return (
    <>
    {f >= b(93.2) ? <InfiniteGrid cx={WIN.cx} cy={WIN.cy} tileW={WIN.w} tileH={WIN.h} gap={90} cols={11} rows={11} t={gridT} accent={accent} font={SANS} products={model.gridRows} view={{ x0: cam.x - W / 2 / cam.scale, x1: cam.x + W / 2 / cam.scale, y0: cam.y - H / 2 / cam.scale, y1: cam.y + H / 2 / cam.scale }} /> : null}
    </>
  );
};

/** Shot 10: grid shading, 「每天都有新机会」 caption, stat reel, fade to dark (screen space). */
export const GridOverlay: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { accent, copy, f, W, H, b, bp, statIn, statItems, statPos, statVel, gridShade, darkOut } = tl;
  return (
    <>
    {gridShade > 0 && f < b(104.2) ? (
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(5,6,8,0.92) 0%, rgba(5,6,8,0) 30%, rgba(5,6,8,0) 66%, rgba(5,6,8,0.92) 100%)", opacity: gridShade * (1 - darkOut) }} />
    ) : null}
    <Caption text={copy.grid} p={bp(94.4, 95.2)} out={bp(101.6, 102.2)} y={150} width={W} font={SANS} accent={accent} size={76} scrim={false} />
    {statIn > 0 ? <StatReel cx={W / 2} cy={H - 140} width={980} items={statItems} position={statPos} velocity={statVel} opacity={statIn} font={SANS} accent={accent} fontSize={40} /> : null}
    {darkOut > 0 ? <AbsoluteFill style={{ background: C.bg, opacity: darkOut }} /> : null}
    </>
  );
};
