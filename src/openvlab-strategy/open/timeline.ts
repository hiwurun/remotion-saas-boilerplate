import * as THREE from "three";
import { H, W } from "../timeline";
import { DEPTH, TABLE_BODY, TABLE_CENTER, X_HALF, ZC } from "./surface";
import { SceneState } from "./scene";

/**
 * Frame map of the opening (global frames @60fps).
 * v8.1: captions hold at ~6 字/秒 (tighter than v8's ~4). The block from `orbit`
 * through `chrome` is the v7 block shifted together, so dolly still lands on planeCam
 * and the f636-era alignment still applies at the same offset past handoff.
 * HOOK in beats.ts equals `out[1]`.
 */
export const O = {
  label: [4, 40],
  title: [8, 64],
  btnIn: [40, 96],
  cursorIn: [96, 170],
  hover: [156, 180],
  press: 196, // mouse down (click sfx here); the cursor rests on the pill first
  release: 204, // mouse up (lighter release tick ~110ms later)
  ring: [200, 238], // luminous ripple at the click position
  seam: [202, 226], // the tear starts inside the pill and runs up/down to the frame edges
  split: [210, 276], // the door: 66 frames = 1.1 s
  reveal: [162, 262],
  box: [208, 312], // the chart box (grids + axis edges) settles in behind the door
  axes: [288, 318], // tick numbers + axis titles (标的价格 / 剩余天数 / 盈亏)
  labelsOut: [588, 610], // tick labels + callouts fade out as the orbit starts
  callA: [318, 344], // start callout 「剩 23 天 · −739」
  callB: [374, 400], // end callout 「到期 · −37,260」
  cap1: [288, 460], // 「价格停在 6550，一动没动。」
  cap2: [474, 694], // 「这个组合却从 −739 亏到 −37,260。」
  orbit: [594, 678], // ONE eased yaw of ~170° to the opposite (expiry) side, then the yaw is frozen
  axesOut: [676, 696], // box grids fade as the camera starts to tilt up
  impact: 690, // anchor of the background fade in Opening.tsx
  rise: [672, 740], // pure pitch from the opposite-side view up to straight overhead (yaw frozen)
  dolly: [672, 751], // lands exactly on the table camera at 751
  flat: [680, 730], // the sheet flattens in place while the camera tilts up
  fit: [690, 748], // price-axis stretch + full price range across the flatten
  linesOut: [698, 728], // hero lines fade before the table colours arrive
  heat: [718, 748], // cyan glow -> the table's own cell colours
  handoff: [752, 766],
  pull: [704, 823],
  chrome: [758, 792],
  cap3: [774, 950], // 「钱是哪几天亏掉的？回到第一天。」 the table is already still
  out: [950, 986], // == HOOK
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

/* ------------------------------------------------------------------ cameras */
export type CamPose = { pos: THREE.Vector3; quat: THREE.Quaternion; fov: number; viewOffset: [number, number] };
const _m = new THREE.Matrix4();
const look = (pos: THREE.Vector3, tgt: THREE.Vector3, up = new THREE.Vector3(0, 1, 0)) => {
  _m.lookAt(pos, tgt, up);
  return new THREE.Quaternion().setFromRotationMatrix(_m);
};
const deg = Math.PI / 180;
export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
/** v9: the approved front_axes camera (main.js: cam -4,3.6,-14.5 -> target 0,-1.6,4.5, fov 37), with one very slow eased drift through it
 *  (the exact still pose is the midpoint of the drift). World = the still's display world (chart group M(0) = diag(-1,1,1)). */
export const CAM = { from: [-4.7, 3.75, -14.85], to: [-3.3, 3.45, -14.15], tgt: [0, -1.6, 4.5], fov: 41, drift: [230, 444], lift: -110 } as const; // fov 41 (still: 37) + lift: frame the box slightly smaller and ~110px higher so the captions clear the price labels
export const view3d = (f: number): CamPose => {
  const u = ramp(f, CAM.drift[0], CAM.drift[1], easeInOutSine);
  const tgt = new THREE.Vector3(...CAM.tgt);
  const pos = new THREE.Vector3(...CAM.from).lerp(new THREE.Vector3(...CAM.to), u);
  return { pos, quat: look(pos, tgt), fov: CAM.fov, viewOffset: [0, CAM.lift] };
};

/** 2D (DOM) camera of the real app: starts framed on the table, pulls back to the default 1:1 stage. */
export const cam2d = (f: number) => {
  const u = ramp(f, O.pull[0], O.pull[1], easeInOutCubic);
  return { x: lerp(TABLE_CENTER.x, 960, u), y: lerp(TABLE_CENTER.y, 540, u), scale: Math.exp(lerp(Math.log(1.32), 0, u)) };
};

/** straight-down camera whose view of the y=0 plane coincides exactly with the DOM table seen through cam2d(f) */
/** v11: seen from the opposite (expiry) side: screen-right = +x world (price, mirrored chart), screen-up = -z (first day at the top). The date axis (DEPTH) spans the table height,
 *  the price axis is stretched by SX_END to span the table width; the heat texture is laid out for this view (scene.ts). */
export const SX_END = ((DEPTH * TABLE_BODY.w) / TABLE_BODY.h / (2 * X_HALF)) * ALIGN.k;
export const planeCam = (c: { x: number; y: number; scale: number }): CamPose => {
  const fov = 30;
  const vExtent = (DEPTH * H) / (TABLE_BODY.h * c.scale);
  const d = vExtent / 2 / Math.tan((fov / 2) * deg);
  const pos = new THREE.Vector3(0, d, ZC);
  const sx = (TABLE_CENTER.x - c.x) * c.scale + W / 2;
  const sy = (TABLE_CENTER.y - c.y) * c.scale + H / 2;
  return { pos, quat: look(pos, new THREE.Vector3(0, 0, ZC), new THREE.Vector3(0, 0, -1)), fov, viewOffset: [sx - W / 2 + ALIGN.x, sy - H / 2 + ALIGN.y] };
};

/**
 * v11: transition camera in spherical coordinates about a moving target: yaw psi (ONE eased sweep of ~170° to the opposite side, then frozen),
 * elevation theta (pure pitch up to 90°), log distance. Basis: h = horizontal offset dir, right = y x h (horizontal, constant once the yaw is frozen),
 * dir = cos(theta) h + sin(theta) y, up = dir x right. With psi = 0 (camera on the +z / expiry side) and theta = 90° this is exactly planeCam's
 * orientation (right = +x, up = -z), so after the orbit the sheet's on-screen orientation never rotates: the camera only tilts and dollies.
 */
const PSI_END = 0;
export const yawAt = (f: number) => {
  const dA = new THREE.Vector3(...CAM.to).sub(new THREE.Vector3(...CAM.tgt));
  const psi0 = Math.atan2(dA.x, dA.z); // ~ -170°
  return lerp(psi0, PSI_END, ramp(f, O.orbit[0], O.orbit[1], easeInOutSine)); // short way round: +170°
};
const spherePose = (f: number, a: CamPose): CamPose => {
  const tA = new THREE.Vector3(...CAM.tgt);
  const dA = a.pos.clone().sub(tA);
  const th0 = Math.atan2(dA.y, Math.hypot(dA.x, dA.z));
  const psi = yawAt(f);
  const r = ramp(f, O.rise[0], O.rise[1], easeInOutSine);
  const w = ramp(f, O.dolly[0], O.dolly[1], easeInOutSine);
  const t = planeCam(cam2d(f));
  const th = lerp(th0, Math.PI / 2, r);
  const tgt = tA.clone().lerp(new THREE.Vector3(0, 0, ZC), w);
  const d = Math.exp(lerp(Math.log(dA.length()), Math.log(t.pos.y), w));
  const h = new THREE.Vector3(Math.sin(psi), 0, Math.cos(psi));
  const right = new THREE.Vector3(0, 1, 0).cross(h).normalize();
  const dir = h.clone().multiplyScalar(Math.cos(th)).add(new THREE.Vector3(0, Math.sin(th), 0)).normalize();
  const up = dir.clone().cross(right).normalize();
  const pos = tgt.clone().add(dir.clone().multiplyScalar(d));
  const quat = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, dir));
  return { pos, quat, fov: lerp(a.fov, t.fov, w), viewOffset: [lerp(a.viewOffset[0], t.viewOffset[0], w), lerp(a.viewOffset[1], t.viewOffset[1], w)] };
};
export const cameraAt = (f: number): CamPose => {
  const a = view3d(f);
  if (f <= O.orbit[0]) return a;
  if (f >= O.dolly[1]) return planeCam(cam2d(f));
  return spherePose(f, a);
};

/* ------------------------------------------------------------------ scene state */
export const stateAt = (f: number): SceneState => {
  const cam = cameraAt(f);
  const flat = ramp(f, O.flat[0], O.flat[1], easeInOutCubic);
  const heat = ramp(f, O.heat[0], O.heat[1], easeInOutCubic);
  return {
    camPos: cam.pos,
    camQuat: cam.quat,
    fov: cam.fov,
    viewOffset: cam.viewOffset,
    reveal: ramp(f, O.reveal[0], O.reveal[1], easeOutCubic),
    flat,
    sz: 1,
    sx: 1 + (SX_END - 1) * ramp(f, O.fit[0], O.fit[1], easeInOutCubic),
    heat,
    turn: 0, // v10: no card flip; the chart keeps the still's handedness and the heat texture is laid out mirrored (scene.ts), so the flat sheet = the table
    crop: 1 - ramp(f, O.fit[0], O.fit[1], easeInOutCubic),
    box: ramp(f, O.box[0], O.box[1]) * (1 - ramp(f, O.axesOut[0], O.axesOut[1])),
    lines: ramp(f, O.split[0] + 20, O.split[0] + 110) * (1 - ramp(f, O.linesOut[0], O.linesOut[1])),
    bloom: 0.35 * (1 - heat),
    bg: 1 - ramp(f, O.impact + 16, O.impact + 72),
  };
};
export { DEPTH };
