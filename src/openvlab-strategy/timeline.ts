import { Easing, interpolate } from "remotion";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";
import { B, HOOK } from "./beats";

export const FPS = 60;
export const W = 1920;
export const H = 1080;

/** v6: one global timeline. Opening 0..HOOK (open/timeline.ts), then the app stage + ending (beats.ts). */
export { HOOK };
export const TOTAL = B.end;

/** Clamped 0..1 ramp between frames a and b. */
export const ramp = (f: number, a: number, b: number, easing: (t: number) => number = EASE) => interpolate(f, [a, b], [0, 1], { ...CLAMP, easing });
export const rampOut = (f: number, a: number, b: number) => ramp(f, a, b, EASE_OUT);
export const linear = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], CLAMP);
export const easeIO = Easing.bezier(0.45, 0, 0.55, 1);
/** Fade in at a, hold, fade out at b (frames). */
export const fadeWin = (f: number, a: number, b: number, d = 16) => rampOut(f, a, a + d) * (1 - ramp(f, b - d, b, easeIO));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
