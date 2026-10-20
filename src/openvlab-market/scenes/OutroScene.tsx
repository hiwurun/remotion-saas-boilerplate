import React from "react";
import { AbsoluteFill } from "remotion";
import { MONO, SANS } from "../../shared/fonts";
import { LogoOutro } from "../components/LogoOutro";
import type { MarketTimeline } from "../timeline";

/** Shot 11: URL → logo crossfade, wordmark, tagline, final fade. */
export const OutroScene: React.FC<{ tl: MarketTimeline }> = ({ tl }) => {
  const { brandName, url, tagline, logoSrc, accent, f, W, H, b, urlP, urlOut, logoIn, wordmark, tagP, finalDark } = tl;
  return (
    <>
    {f >= b(104) ? <LogoOutro width={W} height={H} url={url} brandName={brandName} tagline={tagline} urlP={urlP} urlOut={urlOut} logoIn={logoIn} wordmark={wordmark} tagP={tagP} font={SANS} mono={MONO} logoSrc={logoSrc} accent={accent} /> : null}
    {finalDark > 0 ? <AbsoluteFill style={{ background: "#000", opacity: finalDark }} /> : null}
    </>
  );
};
