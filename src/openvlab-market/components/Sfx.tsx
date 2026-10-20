import React from "react";
import { Audio, Sequence, staticFile } from "remotion";
import { OV_FPS } from "../theme";

/**
 * Sound effects (Mixkit Sound Effects Free License, see public/openvlab/audio/CREDITS.md).
 * `lead` = seconds from file start to the audible onset/peak, so the hit lands exactly on `at`.
 */
export const SFX = {
  click: { src: "openvlab-market/audio/sfx-click.wav", lead: 0, len: 0.2 },
  // "Hard single key press in a laptop" (#2542), peak-normalized to -3 dBFS
  key: { src: "openvlab-market/audio/sfx-key.wav", lead: 0.11, len: 0.31 },
  whoosh: { src: "openvlab-market/audio/sfx-whoosh.wav", lead: 0.71, len: 1.76 },
  sweep: { src: "openvlab-market/audio/sfx-sweep.wav", lead: 0.46, len: 0.61 },
} as const;
export type SfxName = keyof typeof SFX;
export type SfxEvent = { at: number; name: SfxName; volume: number; rate?: number };

export const SfxTrack: React.FC<{ events: SfxEvent[] }> = ({ events }) => (
  <>
    {events.map((e, i) => {
      const s = SFX[e.name];
      const rate = e.rate ?? 1;
      const from = Math.round(e.at - (s.lead / rate) * OV_FPS);
      return (
        <Sequence key={`${e.name}-${i}`} from={from} durationInFrames={Math.ceil((s.len / rate) * OV_FPS) + 2} layout="none" name={`sfx:${e.name}@${e.at}`}>
          <Audio src={staticFile(s.src)} volume={e.volume} playbackRate={rate} />
        </Sequence>
      );
    })}
  </>
);
