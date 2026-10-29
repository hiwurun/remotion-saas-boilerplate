import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * Button-click sfx (public/openvlab-strategy/sfx/button-click.mp3, 1.032 s file, 48 kHz).
 * Measured: onset ~0.029 s, transient peak at 0.032 s (= 1.92 f @60fps), audible tail ends ~0.071 s, rest is silence.
 * The Sequence starts PEAK_LEAD frames before `at`, so the peak lands on the press frame (0.08 f ≈ 1.3 ms early).
 * trimAfter cuts the silent tail at 9 f (0.15 s). Decoded peak is +0.9 dBFS, so volume must stay < 0.9; 0.25 -> ~-11 dBFS peak.
 */
const PEAK_LEAD = 2;
const LEN = 9;
export const CLICK_VOLUME = 0.25;

export const ClickSfx: React.FC<{ at: number; volume?: number }> = ({ at, volume = CLICK_VOLUME }) => (
  <Sequence from={at - PEAK_LEAD} durationInFrames={LEN} name="button-click">
    <Audio src={staticFile("openvlab-strategy/sfx/button-click.mp3")} volume={volume} trimAfter={LEN} />
  </Sequence>
);
