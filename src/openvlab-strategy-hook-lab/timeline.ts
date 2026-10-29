import * as THREE from "three";
import { DEPTH, ZC, centerY } from "./data";
import type { HookState } from "./scene";

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const TOTAL = 600;

/** Frame map (60 fps). */
export const F = {
  hairIn: [14, 78], // hairline draws out from the centre
  label: [56, 96],
  reveal: [100, 240], // glass band + layers appear (1.67 s -> 4 s)
  dolly: [100, 250],
  brush: [226, 292], // price line brushed yellow along time
  chase: [244, 420], // camera slides along the line, slow-mo -> cliff
  cap1: [250, 322],
  cap2: [338, 414],
  impact: 420,
  roll: [426, 486], // roll to the top view, surface flattens into heat cells
  whip: [500, 516], // cut to the side slice
  scan: [512, 538],
  black: [534, 548],
  title: [548, 600],
} as const;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};
export const ramp = (f: number, a: number, b: number, ease: (t: number) => number = smooth) => ease(clamp01((f - a) / (b - a)));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Pose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number };
const _m = new THREE.Matrix4();
const look = (pos: THREE.Vector3, tgt: THREE.Vector3, up = new THREE.Vector3(0, 1, 0)): THREE.Quaternion => {
  _m.lookAt(pos, tgt, up);
  return new THREE.Quaternion().setFromRotationMatrix(_m);
};
const pose = (pos: [number, number, number], tgt: [number, number, number], fov: number, up?: [number, number, number]): Pose => {
  const p = new THREE.Vector3(...pos);
  return { pos: p, quat: look(p, new THREE.Vector3(...tgt), up ? new THREE.Vector3(...up) : undefined), fov };
};
const blend = (a: Pose, b: Pose, w: number): Pose => ({
  pos: a.pos.clone().lerp(b.pos, w),
  quat: a.quat.clone().slerp(b.quat, w),
  fov: lerp(a.fov, b.fov, w),
});

/** 0..1 progress along the price line while the camera rides it: slow motion -> accelerating fall */
export const chaseS = (f: number) => {
  const u = clamp01((f - F.chase[0]) / (F.chase[1] - F.chase[0]));
  return 0.025 * u + 0.975 * Math.pow(u, 2.9);
};

const chasePose = (f: number): Pose => {
  const s = chaseS(f);
  const back = 7.2 - 3.6 * Math.pow(s, 1.4);
  const lift = 2.9 - 0.9 * s;
  const zc = s * DEPTH - back;
  const y = 0.5 * centerY(s) + 0.5 * centerY(Math.max(0, s - 0.1)) + lift;
  const tt = Math.min(1, s + 3.4 / DEPTH);
  const sway = Math.sin(f * 0.021) * 0.12 * (1 - s);
  return pose([sway, y, zc], [0, centerY(tt) - 0.25 * s, tt * DEPTH], lerp(34, 42, s));
};

const POSE_A = (f: number) => pose([0, 0, -14.6 + 0.5 * clamp01(f / 100)], [0, 0, 3], 28);
const POSE_B = pose([0.7, 3.1, -10.6], [0, -1.1, 3.6], 32);
const POSE_TOP = (f: number) => pose([0, lerp(15.8, 14.7, clamp01((f - F.roll[1]) / 20)), ZC], [0, 0, ZC], 30, [1, 0, 0]);
const POSE_SLICE = (f: number) => pose([0, -1.35, lerp(-25, -23, clamp01((f - F.whip[1]) / 40))], [0, -1.35, 0], 20);

export const cameraAt = (f: number): Pose => {
  let p: Pose;
  if (f < F.chase[0] - 44) {
    p = blend(POSE_A(f), POSE_B, ramp(f, F.dolly[0], F.dolly[1], easeInOutCubic));
  } else if (f < F.roll[0]) {
    const base = blend(POSE_A(f), POSE_B, ramp(f, F.dolly[0], F.dolly[1], easeInOutCubic));
    p = blend(base, chasePose(f), ramp(f, F.chase[0] - 44, F.chase[0] + 26));
  } else {
    const end = chasePose(F.chase[1]);
    p = blend(end, POSE_TOP(f), ramp(f, F.roll[0], F.roll[1], easeInOutCubic));
    if (f >= F.whip[0]) p = blend(p, POSE_SLICE(f), ramp(f, F.whip[0], F.whip[1], easeInOutCubic));
  }
  // impact shake
  const dt = f - F.impact;
  if (dt >= 0 && dt < 36) {
    const a = 0.055 * Math.exp(-dt / 7);
    p = { ...p, pos: p.pos.clone().add(new THREE.Vector3(Math.sin(dt * 2.3) * a, Math.cos(dt * 3.1) * a * 1.2, Math.sin(dt * 1.7) * a * 0.4)) };
    const roll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(dt * 2.9) * 0.007 * Math.exp(-dt / 8));
    p.quat = p.quat.clone().multiply(roll);
  }
  return p;
};

/** pure per-frame scene state */
export const stateAt = (f: number): HookState => {
  const cam = cameraAt(f);
  const s = chaseS(f);
  const chaseOn = f >= F.chase[0] && f < F.roll[0];
  const slice = ramp(f, F.whip[0] + 6, F.whip[0] + 12);
  const scanT = f >= F.scan[0] ? ramp(f, F.scan[0], F.scan[1], (t) => Math.pow(t, 1.8)) : -1;
  const flat = ramp(f, F.roll[0] + 4, F.roll[1] - 6, easeInOutCubic) * (1 - ramp(f, F.whip[0], F.whip[0] + 12, easeInOutCubic));
  const heat = ramp(f, F.roll[0] + 14, F.roll[1] + 10) * (1 - ramp(f, F.whip[0], F.whip[0] + 10));
  const impactGlow = f >= F.impact ? Math.exp(-(f - F.impact) / 14) : 0;
  return {
    camPos: cam.pos,
    camQuat: cam.quat,
    fov: cam.fov,
    reveal: ramp(f, F.reveal[0], F.reveal[1], (t) => easeInOutCubic(t)),
    hairDraw: ramp(f, F.hairIn[0], F.hairIn[1], easeOutCubic),
    hairAlpha: ramp(f, F.hairIn[0], F.hairIn[0] + 30) * (1 - 0.12 * ramp(f, F.reveal[0], F.reveal[1])),
    flat,
    heat,
    lineDraw: ramp(f, F.brush[0], F.brush[1], (t) => 1 - Math.pow(1 - t, 2.2)),
    lineAlpha: ramp(f, F.brush[0], F.brush[0] + 24) * (1 - 0.5 * ramp(f, F.roll[0] + 20, F.roll[1])) * (1 - ramp(f, F.whip[0], F.whip[0] + 8)),
    glass: 1 - 0.78 * slice,
    layerAlpha: 0.2 * ramp(f, F.reveal[0] + 20, F.reveal[1]) + 0.1 * slice,
    scan: scanT,
    gridAlpha: 0.11 * ramp(f, F.reveal[0] + 30, F.reveal[1]),
    orbT: f < F.brush[1] ? ramp(f, F.brush[0], F.brush[1], (t) => 1 - Math.pow(1 - t, 2.2)) : s + 0.0,
    orbAlpha: (f >= F.brush[0] && f < F.roll[0] ? 1 : 0) * ramp(f, F.brush[0], F.brush[0] + 20) * (f >= F.impact ? Math.max(0, 1 - (f - F.impact) / 20) : 1),
    glow: 0.7 * impactGlow + (chaseOn ? 0.25 * s : 0),
    fogNear: chaseOn ? 8 : 13,
    fogFar: chaseOn ? 24 : 36,
  };
};
export { ZC };
