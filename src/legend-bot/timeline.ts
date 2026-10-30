import { interpolate } from "remotion";
import { CLAMP, EASE } from "../shared/motion";

/** Composition fps. Author timing in seconds and convert with s(). */
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const s = (sec: number) => Math.round(sec * FPS);

/** Shot 1: public/legend-bot/flyover.mp4 — 1440x1152 (5:4), 60 fps, 4.8 s = 288 frames, no audio stream. */
export const FLYOVER = { src: "legend-bot/flyover.mp4", w: 1440, h: 1152, frames: 288 } as const;
export const SHOT1 = [0, FLYOVER.frames] as const;

const S2 = SHOT1[1];
/** Last list item settles at S2 + 0.8 s + 2*9 + 0.6 s = 390; it stays fully readable for 2.5 s (to 540). */
const LIST_READ_END = S2 + s(0.8) + 2 * 9 + s(0.6) + s(2.5);
/** Shot 3: public/legend-bot/api.mp4 — replaced 2026-10-29 17:43: h264 3840x2156 (~16:9), 60 fps, 9.417 s = 565 frames, no audio. */
export const APICLIP = { src: "legend-bot/api-1743.mp4", w: 3840, h: 2156, frames: 565 } as const;
/** List -> api.mp4: item 1 gets a white pill while the rest dims (0.5 s), then the pill opens into the clip (0.8 s). */
export const B3 = {
  emphStart: LIST_READ_END,
  emphEnd: LIST_READ_END + s(0.5),
  revealStart: LIST_READ_END + s(0.5),
  revealEnd: LIST_READ_END + s(0.5) + s(0.8),
} as const;
/** Shot 2: 「你需要准备什么？」 unordered list, from the end of the flyover until the clip has fully opened. */
export const SHOT2 = [S2, B3.revealEnd] as const;
/** Shot 3 = api.mp4 playing from its frame 0 at revealStart, full length. */
export const SHOT3 = [B3.revealStart, B3.revealStart + APICLIP.frames] as const;
/** Beats inside shot 2 (absolute frames). */
export const B2 = {
  /** Flyover frozen on its last frame (its final ~26 frames are already static) settles + dissolves into the canvas. */
  outStart: S2,
  outEnd: S2 + s(0.8),
  /** Title rises out of its mask line, overlapping the second half of the dissolve. */
  titleStart: S2 + s(0.4),
  titleEnd: S2 + s(0.4) + s(0.8),
  /** Three items, 9-frame stagger; each rise + fade lasts itemDur. */
  itemStart: S2 + s(0.8),
  stagger: 9,
  itemDur: s(0.6),
  /** Small brand mark top-left fades in after the list. */
  brandStart: S2 + s(1.2),
} as const;

export const TOTAL = SHOT3[1];

/** BGM: public/legend-bot/bgm-dark-synthwave.mp3 — 183.3 s, 48 kHz stereo, -10.5 LUFS integrated, true peak -0.3 dBFS, starts at full level. */
export const BGM = { src: "legend-bot/bgm-dark-synthwave.mp3", volume: 0.5, fadeIn: s(0.5), fadeOut: s(0.8) } as const;

/** Clamped 0..1 ramp between frames a and b. */
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = EASE) => interpolate(f, [a, b], [0, 1], { ...CLAMP, easing });
