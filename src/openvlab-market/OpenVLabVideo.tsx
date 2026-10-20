import React, { useMemo } from "react";
import { AbsoluteFill, Audio, CalculateMetadataFunction, Sequence, interpolate, staticFile } from "remotion";
import { OpenVLabProps } from "./schema";
import { C, CLAMP, INTRO_START, OV_FPS, TOTAL_BEATS, beatToFrame, isUrl, storyBeat } from "./theme";
import { buildModel } from "./data";
import { SfxTrack } from "./components/Sfx";
import { MarketScene } from "./scenes/MarketScene";
import { TitleScene } from "./scenes/TitleScene";

export const useMarketModel = (props: OpenVLabProps) => useMemo(() => buildModel(props.marketRows, props.focusSector, props.intraday, props.metricFilter), [props.marketRows, props.focusSector, props.intraday, props.metricFilter]);

export const OpenVLabVideo: React.FC<OpenVLabProps> = (props) => {
  const model = useMarketModel(props);
  if (!model.rows.length) return <AbsoluteFill style={{ background: C.bg }} />;
  const introFrames = beatToFrame(INTRO_START, props.bpm);
  const total = introFrames + beatToFrame(storyBeat(TOTAL_BEATS), props.bpm);
  // duck the BGM to ~0.35 while the prompt is being typed (same timing as the scene typewriter)
  const typeA = introFrames + beatToFrame(1.6, props.bpm);
  const typeZ = typeA + beatToFrame(0.32, props.bpm) * Array.from(props.copy.openPrompt).length;
  const { bgmSrc } = props;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence from={introFrames} layout="none">
        <AbsoluteFill>
          <MarketScene {...props} model={model} />
        </AbsoluteFill>
      </Sequence>
      <TitleScene {...props} />
      {/* BGM (120 BPM; trimBefore aligns its beat phase to the grid) – fade in 0.5s, fade out over the logo outro tail */}
      {bgmSrc ? <Audio loop src={isUrl(bgmSrc) ? bgmSrc : staticFile(bgmSrc)} trimBefore={props.bgmOffsetFrames} volume={(fr) => interpolate(fr, [0, 30, total - 150, total - 6], [0, 0.6, 0.6, 0], CLAMP) * interpolate(fr, [typeA - 10, typeA, typeZ, typeZ + 15], [1, 0.58, 0.58, 1], CLAMP)} /> : null}
      <SfxTrack events={[{ at: beatToFrame(0.35, props.bpm), name: "sweep", volume: 0.3 }]} />
    </AbsoluteFill>
  );
};

/** Loads public/<dataSrc> → props.marketRows and public/<intradaySrc> → props.intraday when not supplied inline. */
export const loadMarketRows = async (props: OpenVLabProps): Promise<OpenVLabProps> => {
  const load = async <T,>(p: string): Promise<T[]> => {
    const res = await fetch(isUrl(p) ? p : staticFile(p));
    const json = (await res.json()) as { result?: T[] } | T[];
    return Array.isArray(json) ? json : json.result ?? [];
  };
  const marketRows = props.marketRows && props.marketRows.length > 0 ? props.marketRows : await load<OpenVLabProps["marketRows"][number]>(props.dataSrc);
  const intraday = props.intraday && props.intraday.length > 0 ? props.intraday : props.intradaySrc ? await load<OpenVLabProps["intraday"][number]>(props.intradaySrc) : [];
  return { ...props, marketRows, intraday };
};

export const calculateOpenVLabMetadata: CalculateMetadataFunction<OpenVLabProps> = async ({ props }) => ({
  durationInFrames: beatToFrame(INTRO_START, props.bpm, OV_FPS) + beatToFrame(storyBeat(TOTAL_BEATS), props.bpm, OV_FPS),
  fps: OV_FPS,
  props: await loadMarketRows(props),
});
