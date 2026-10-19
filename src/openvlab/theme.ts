import { Easing, interpolate } from "remotion";

/**
 * Beat-timing helpers copied from src/launch/theme.ts (same easing / beat maths),
 * re-skinned with OpenVLab dark-theme tokens taken from
 * vlab-frontend/packages/ui/src/globals.css (.dark block) and the real market page.
 */
export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const OV_FPS = 60;

/** Heavy in-out: leaves fast, settles slowly. */
export const EASE = Easing.bezier(0.7, 0, 0.12, 1);
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

export const C = {
  /** video stage background (theme-color dark #12161f darkened toward the app's pure black) */
  bg: "#050608",
  /** app page background: --background (dark) oklch(0 0 0) */
  page: "#000000",
  /** card surfaces seen on the real market page */
  card: "#121212",
  cardRow: "#1A1A1A",
  /** --foreground (dark) oklch(0.96 0.006 260) */
  ink: "#EFF2F6",
  /** --muted-foreground (dark) oklch(0.72 0.012 260) */
  muted: "#A0A5AC",
  dim: "#6B7078",
  /** --border (dark) oklch(0.3 0.012 260) */
  border: "#2A2E34",
  borderSoft: "#1E2126",
  /** --muted (dark) oklch(0.29 0 0) */
  mutedBg: "#2B2B2B",
  /** --primary oklch(0.8871 0.2122 128.5041) */
  primary: "#AFF33E",
  /** --vlab-red / --vlab-green: up = red, down = green (getColorByNumberSign) */
  up: "#EA3943",
  down: "#16C784",
  flat: "#9E9E9E",
  /** near-expiry ring in MarketPanoramaChart.tsx */
  nearExpiry: "#F59E0B",
  /** --vlab-pro / foreground (dark) – overseas badge */
  gold: "#FED600",
  shadow: "0 1px 2px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.45), 0 40px 120px rgba(0,0,0,0.55)",
  shadowSm: "0 1px 2px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.35)",
};

/** Sign colour exactly like shared-core getColorByNumberSign (style-values.ts:13). */
export const signColor = (v: number) => (v > 0 ? C.up : v < 0 ? C.down : C.flat);

/** beat index → frame (fps fixed at 60). */
export const beatToFrame = (beat: number, bpm: number, fps = OV_FPS) => Math.round((beat * 60 * fps) / bpm);

/** Eased 0→1 between two beats. */
export const beatProgress = (frame: number, bpm: number, fromBeat: number, toBeat: number, easing = EASE) =>
  interpolate(frame, [beatToFrame(fromBeat, bpm), beatToFrame(toBeat, bpm)], [0, 1], { ...CLAMP, easing });

/** Shot boundaries, in beats (120 BPM → 2 beats per second). */
export const SHOTS = {
  prompt: 0,
  window: 6.6,
  rank: 15.2,
  premium: 28.9,
  table: 41.8,
  quadrant: 53.4,
  metricFilter: 76.3,
  filter: 85.9,
  grid: 100.9,
  outro: 112.9,
  end: 129.6,
} as const;

/**
 * The scene body (window → outro) is authored on a reference beat grid ("story beats") and mapped
 * onto the real timeline here. Anchors only stretch HOLD regions (captions, table scroll, quadrant
 * read-out), so transitions keep their length. story beat → timeline beat.
 */
const STORY_ANCHORS: [number, number][] = [
  [21.8, 6.6],
  [33.2, 18],
  [39.9, 28.2],
  [42.6, 30.9],
  [49, 40.8],
  [51.8, 43.6],
  [61.6, 52.6],
  [69.2, 60.2],
  [77.6, 73.5],
  [86.4, 82.3],
  [92, 91.3],
  [93.4, 92.7],
  [112.6, 111.9],
  [118.4, 118.4],
  [120, 120],
];
/** A new shot (数值筛选) is inserted on the timeline right after story beat GAP_AT (window flipped back to the table). */
export const GAP_AT = 80.4;
export const GAP_BEATS = 9.6;
export const storyBeat = (s: number) => storyBeatBase(s) + (s > GAP_AT ? GAP_BEATS : 0);
/** timeline beat at which the inserted 数值筛选 shot starts */
/** Brand title card before the prompt opening; the whole scene starts INTRO_START beats in. */
export const INTRO_START = 3.0;
export const INTRO_END = 3.5;

export const metricShotStart = () => storyBeatBase(GAP_AT);
const storyBeatBase = (s: number) => {
  const A = STORY_ANCHORS;
  if (s <= A[0][0]) return Math.max(0, s + (A[0][1] - A[0][0]));
  for (let i = 0; i < A.length - 1; i++) {
    const [s0, t0] = A[i];
    const [s1, t1] = A[i + 1];
    if (s <= s1) return t0 + ((s - s0) / (s1 - s0)) * (t1 - t0);
  }
  return s;
};

/** story-grid length; the real timeline is storyBeat(TOTAL_BEATS) = 129.6 beats (64.8 s) */
export const TOTAL_BEATS = 120;

export const withAlpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export const isUrl = (s: string) => /^https?:\/\//.test(s);

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
