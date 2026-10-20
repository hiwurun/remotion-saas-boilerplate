import { interpolate } from "remotion";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";
import { isUrl, withAlpha } from "../shared/utils";

export { CLAMP, EASE, EASE_OUT, isUrl, withAlpha };

export const LAUNCH_FPS = 60;

/** Heavy in-out: leaves fast, settles slowly. */

export const C = {
  bg: "#FFFFFF",
  ink: "#000000",
  text2: "#666666",
  muted: "#8F8F8F",
  border: "#EAEAEA",
  border2: "#D9D9D9",
  subtle: "#FAFAFA",
  shadow: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06), 0 30px 80px rgba(0,0,0,0.08)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)",
};

/** beat index → frame (fps fixed at 60 for this template). */
export const beatToFrame = (beat: number, bpm: number, fps = LAUNCH_FPS) => Math.round((beat * 60 * fps) / bpm);

/** Eased 0→1 between two beats. */
export const beatProgress = (frame: number, bpm: number, fromBeat: number, toBeat: number, easing = EASE) =>
  interpolate(frame, [beatToFrame(fromBeat, bpm), beatToFrame(toBeat, bpm)], [0, 1], { ...CLAMP, easing });

/** Shot boundaries, in beats (4/4, key actions land on beats). */
export const SHOTS = {
  logo: 0,
  hero: 4,
  prompt: 8,
  generate: 24,
  followUp: 30,
  edit: 34,
  code: 46,
  dropdown: 64,
  grid: 70,
  outro: 78,
  end: 92,
} as const;

export const TOTAL_BEATS = SHOTS.end;



export type Step = { action: "type" | "delete" | "wait"; text?: string; framesPerChar?: number; frames?: number };

/** Deterministic typing script → visible text at local frame t. */
export const runScript = (steps: Step[], t: number): string => {
  let cur: string[] = [];
  let rest = t;
  if (rest < 0) return "";
  for (const s of steps) {
    if (s.action === "type") {
      const chars = Array.from(s.text ?? "");
      const fpc = s.framesPerChar ?? 2;
      const dur = chars.length * fpc;
      if (rest < dur) return cur.concat(chars.slice(0, Math.floor(rest / fpc))).join("");
      cur = cur.concat(chars);
      rest -= dur;
    } else if (s.action === "delete") {
      const fpc = s.framesPerChar ?? 1;
      const dur = cur.length * fpc;
      if (rest < dur) return cur.slice(0, cur.length - Math.floor(rest / fpc)).join("");
      cur = [];
      rest -= dur;
    } else {
      const dur = s.frames ?? 0;
      if (rest < dur) return cur.join("");
      rest -= dur;
    }
  }
  return cur.join("");
};
