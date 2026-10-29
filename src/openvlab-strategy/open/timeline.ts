import * as THREE from "three";
import { H, W } from "../timeline";
import { DEPTH, Y_EXAG, TABLE_BODY, TABLE_CENTER, X_HALF, ZC, FLAT_SZ, lineY } from "./surface";
import { TRAIL_N, SceneState, zWorld } from "./scene";

/** Frame map of the new opening (global frames @60fps). */
export const O = {
  label: [4, 40],
  title: [8, 64],
  btnIn: [40, 96],
  cursorIn: [96, 170],
  hover: [156, 180],
  press: 184, // mouse down (click sfx here)
  release: 192, // mouse up (lighter release tick ~110ms later)
  ring: [188, 226], // luminous ripple at the click position
  seam: [190, 214], // v6: the tear starts inside the pill and runs up/down to the frame edges
  split: [198, 264], // the door: 66 frames = 1.1 s
  reveal: [150, 250],
  orbStart: 258, // the point + the 6550 line appear (camera settles behind the first day)
  axes: [276, 306], // v6: 3D axis labels in (标的价格 / 剩余天数 23→0 / 盈亏)
  axesOut: [400, 426],
  num: [282, 312], // v6: the orb's P&L number label
  run: 404, // v6: the point starts to fall (slow -> fast) ...
  impact: 540, // ... and comes to rest at expiry
  numOut: [580, 604],
  cap1: [270, 400], // 「价格停在 6550，一动没动。」
  cap2: [410, 552], // 「这个组合却从 −739 亏到 −37,260。」
  flat: [548, 601],
  blend: [545, 601],
  heat: [555, 596],
  handoff: [602, 616],
  pull: [554, 673],
  chrome: [608, 642],
  cap3: [556, 678], // 「钱是哪几天亏掉的？回到第一天。」
  out: [665, 684],
} as const;

/** measured sub-pixel calibration of the 3D plane vs the DOM table (stills diff at f636) */
const ALIGN = { x: 0, y: 2, k: 1.0025 };
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const ramp = (f: number, a: number, b: number, e: (t: number) => number = smooth) => e(clamp01((f - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------------------------------------------ the door: one smooth, single-peak velocity profile */
/** velocity ~ u^1.4 (1-u)^3.4 (zero at both ends, one early peak) -> displacement E(u) is its normalised integral (monotone, C1). */
const DOOR_TAB: number[] = (() => {
  const N = 600;
  const t = [0];
  for (let i = 1; i <= N; i++) {
    const u = (i - 0.5) / N;
    t.push(t[i - 1] + Math.pow(u, 1.4) * Math.pow(1 - u, 3.4));
  }
  return t.map((v) => v / t[N]);
})();
export const doorE = (f: number) => {
  const u = clamp01((f - O.split[0]) / (O.split[1] - O.split[0])) * (DOOR_TAB.length - 1);
  const i = Math.min(DOOR_TAB.length - 2, Math.floor(u));
  return DOOR_TAB[i] + (DOOR_TAB[i + 1] - DOOR_TAB[i]) * (u - i);
};

/* ------------------------------------------------------------------ the glow point: the SAME run as hook-lab's camera chase (slow motion -> accelerating fall) */
/** hook-lab's chaseS(u), u = progress through the run; C2, no seams. */
const chaseCurve = (u: number) => 0.025 * u + 0.975 * Math.pow(clamp01(u), 2.9);
/** run settle: at SETTLE[0] the fall hands over (cubic Hermite, same position+velocity) to an ease-out that comes to rest at the cliff foot at SETTLE[1] */
const SETTLE = [O.impact - 20, O.impact + 16] as const;
const runU = (f: number) => clamp01((f - O.run) / (O.impact - O.run));
/** 0..1 progress along the price line, shared by the glow point and the camera: slow start, accelerating fall, then a soft stop (no impact) */
export const orbT = (f: number) => {
  if (f <= SETTLE[0]) return chaseCurve(runU(f));
  const N = SETTLE[1] - SETTLE[0];
  const t = clamp01((f - SETTLE[0]) / N);
  const p0 = chaseCurve(runU(SETTLE[0]));
  const m0 = (chaseCurve(runU(SETTLE[0] + 0.5)) - chaseCurve(runU(SETTLE[0] - 0.5))) * N; // per-frame slope * N
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * 1;
};
export const orbPos = (t: number, flat = 0, sz = 1) => new THREE.Vector3(0, lineY(t) * (1 - flat) * Y_EXAG + 0.05, zWorld(t, flat, sz));

/* ------------------------------------------------------------------ cameras: copied from src/openvlab-strategy-hook-lab/timeline.ts */
export type CamPose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number; viewOffset: [number, number] };
type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number };
const _m = new THREE.Matrix4();
const look = (pos: THREE.Vector3, tgt: THREE.Vector3, up = new THREE.Vector3(0, 1, 0)) => {
  _m.lookAt(pos, tgt, up);
  return new THREE.Quaternion().setFromRotationMatrix(_m);
};
const deg = Math.PI / 180;
const pose = (pos: [number, number, number], tgt: [number, number, number], fov: number): Pose => {
  const p = new THREE.Vector3(...pos);
  return { pos: p, quat: look(p, new THREE.Vector3(...tgt)), fov };
};
const blendPose = (a: Pose, b: Pose, w: number): Pose => ({ pos: a.pos.clone().lerp(b.pos, w), quat: a.quat.clone().slerp(b.quat, w), fov: lerp(a.fov, b.fov, w) });
/** hook-lab frame of an opening frame: dolly [100,250] <-> reveal [150,250], chase [244,420] <-> [orbStart, impact] */
const hookF = (f: number) => (f < O.orbStart ? 100 + (f - 150) * (144 / 108) : 244 + ((f - O.orbStart) * 176) / (O.impact - O.orbStart));
const HK = { dolly: [100, 250], chase: [244, 420] } as const;
const POSE_A = (hf: number) => pose([0, 0, -14.6 + 0.5 * clamp01(hf / 100)], [0, 0, 3], 28);
const POSE_B = pose([0.7, 3.1, -10.6], [0, -1.1, 3.6], 32);
/** C2 polynomial smooth minimum */
const smin = (a: number, b: number, k: number) => {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * h * k) / 6;
};
const chasePose = (hf: number, s: number): Pose => {
  const back = 7.2 - 3.6 * Math.pow(s, 1.4);
  const lift = 2.9 - 0.9 * s;
  const zc = s * DEPTH - back;
  const y = 0.5 * lineY(s) + 0.5 * lineY(Math.max(0, s - 0.1)) + lift;
  const tt = smin(s + 3.4 / DEPTH, 1, 0.3); // hook-lab: min(1, .) -> its hard stop makes the look-at (and the glow point on screen) jolt; C2 smooth-min here
  const sway = Math.sin(hf * 0.021) * 0.12 * (1 - s);
  return pose([sway, y, zc], [0, lineY(tt) - 0.25 * s, tt * DEPTH], lerp(34, 42, s));
};

/** the hook-lab camera: dolly in behind the first day, then ride the price line down to the cliff and settle there (no impact shake) */
export const view3d = (f: number): CamPose => {
  const hf = hookF(Math.min(f, O.impact));
  const base = blendPose(POSE_A(hf), POSE_B, ramp(hf, HK.dolly[0], HK.dolly[1], easeInOutCubic));
  const p: Pose = hf < HK.chase[0] - 44 ? base : blendPose(base, chasePose(hf, orbT(f)), ramp(hf, HK.chase[0] - 44, HK.chase[0] + 26));
  return { ...p, viewOffset: [0, 0] };
};

/** 2D (DOM) camera of the real app: starts framed on the table, pulls back to the default 1:1 stage. */
export const cam2d = (f: number) => {
  const u = ramp(f, O.pull[0], O.pull[1], easeInOutCubic);
  return { x: lerp(TABLE_CENTER.x, 960, u), y: lerp(TABLE_CENTER.y, 540, u), scale: Math.exp(lerp(Math.log(1.32), 0, u)) };
};

/** straight-down camera whose view of the y=0 plane coincides exactly with the DOM table seen through cam2d(f) */
export const planeCam = (c: { x: number; y: number; scale: number }): CamPose => {
  const fov = 30;
  const vExtent = ((2 * X_HALF) * H) / (TABLE_BODY.h * c.scale);
  const d = vExtent / 2 / Math.tan((fov / 2) * deg);
  const pos = new THREE.Vector3(0, d, ZC);
  const sx = (TABLE_CENTER.x - c.x) * c.scale + W / 2;
  const sy = (TABLE_CENTER.y - c.y) * c.scale + H / 2;
  return { pos, quat: look(pos, new THREE.Vector3(0, 0, ZC), new THREE.Vector3(1, 0, 0)), fov, viewOffset: [sx - W / 2 + ALIGN.x, sy - H / 2 + ALIGN.y] };
};

export const cameraAt = (f: number): CamPose => {
  const a = view3d(f);
  const b = ramp(f, O.blend[0], O.blend[1], easeInOutCubic);
  if (b <= 0) return a;
  const t = planeCam(cam2d(f));
  return {
    pos: a.pos.clone().lerp(t.pos, b),
    quat: a.quat.clone().slerp(t.quat, b),
    fov: lerp(a.fov, t.fov, b),
    viewOffset: [t.viewOffset[0] * b, t.viewOffset[1] * b],
  };
};

/* ------------------------------------------------------------------ scene state */
export const stateAt = (f: number): SceneState => {
  const cam = cameraAt(f);
  const flat = ramp(f, O.flat[0], O.flat[1], easeInOutCubic);
  const headT = orbT(f);
  const orbAlpha = ramp(f, O.orbStart - 8, O.orbStart + 6) * (1 - ramp(f, O.impact + 8, O.impact + 34));
  const heat = ramp(f, O.heat[0], O.heat[1], easeInOutCubic);
  const glow = ramp(f, O.impact - 70, O.impact + 4, easeInOutCubic) * (1 - ramp(f, O.impact + 4, O.impact + 46));
  return {
    camPos: cam.pos,
    camQuat: cam.quat,
    fov: cam.fov,
    viewOffset: cam.viewOffset,
    reveal: ramp(f, O.reveal[0], O.reveal[1], easeOutCubic),
    flat,
    sz: 1 + (FLAT_SZ * ALIGN.k - 1) * flat,
    heat,
    headT,
    lineAlpha: ramp(f, O.orbStart - 10, O.orbStart + 6) * (1 - ramp(f, O.impact + 10, O.impact + 50)),
    glass: 1,
    layerAlpha: 0.55 * ramp(f, O.split[0] + 20, O.split[0] + 110),
    gridAlpha: 0.1 * ramp(f, O.split[0], O.split[0] + 70),
    orbAlpha,
    trailT: Array.from({ length: TRAIL_N }, (_, i) => orbT(f - (i + 1) * 0.6)),
    glow,
    fogNear: 22,
    fogFar: 75,
  };
};
export { DEPTH };
