import * as THREE from "three";
import { Easing, interpolate } from "remotion";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";
import type { CameraPose } from "./surface3d";

/** Composition fps. All timing below is authored in seconds and converted with sec(). */
export const FPS = 60;
export const W = 1920;
export const H = 1080;
const s = (sec: number) => Math.round(sec * FPS);

/** Shot list (seconds). One idea per shot. */
export const SHOTS = [
  { id: "hook", from: 0, to: 4.6 },
  { id: "chart", from: 4.6, to: 15.6 },
  { id: "lift", from: 15.6, to: 19.0 },
  { id: "axes", from: 19.0, to: 28.0 },
  { id: "example", from: 28.0, to: 30.6 },
  { id: "expensive", from: 30.6, to: 33.6 },
  { id: "term", from: 33.6, to: 37.6 },
  { id: "cheaper", from: 37.6, to: 40.8 },
  { id: "fold", from: 40.8, to: 44.8 },
  { id: "logo", from: 44.8, to: 51 },
] as const;
export const TOTAL = s(51);
export { s as sec };

export const prog = (frame: number, a: number, b: number, easing = EASE) => interpolate(frame, [s(a), s(b)], [0, 1], { ...CLAMP, easing });
export const fadeWin = (frame: number, a: number, b: number, d = 0.5) => prog(frame, a, a + d, EASE_OUT) * (1 - prog(frame, b - d, b, EASE));

type Key = { t: number; theta: number; phi: number; r: number; target: [number, number, number]; fov?: number; ease?: (x: number) => number };
const D = Math.PI / 180;
const slow = Easing.bezier(0.45, 0, 0.2, 1);

/**
 * Every move is motivated by the caption on screen. All views stay on the same side of the surface
 * (strike low → high reads left → right like the 2D chart).
 */
export const cameraKeys = (nearZ: number, colX: number, peak: THREE.Vector3): Key[] => [
  // hook: macro on the near-month 6000 ridge, slow push-in
  // (looking back along the near-month smile from behind it: the ridge sweeps across the frame up to the 6000 peak)
  { t: 0, theta: 158, phi: 13, r: 1.45, target: [peak.x + 0.75, peak.y - 0.3, peak.z + 0.1], fov: 32 },
  { t: 4.6, theta: 146, phi: 16, r: 1.15, target: [peak.x + 0.6, peak.y - 0.26, peak.z + 0.1], fov: 32, ease: slow },
  // chart + landing: frontal, matches the 2D chart's orientation (cut happens while the surface is hidden)
  { t: 4.65, theta: 0, phi: 4, r: 3.0, target: [0, 0.5, nearZ], fov: 38, ease: slow },
  { t: 15.6, theta: 0, phi: 4, r: 3.0, target: [0, 0.5, nearZ], fov: 38, ease: slow },
  // lift: rise and swing so the rows can be seen unrolling out of the landed curve
  { t: 19.0, theta: -28, phi: 30, r: 3.3, target: [0, 0.25, 0], fov: 42, ease: slow },
  // axes (v7 framing, retimed): one eased orbit from the unroll's end pose round to the near/front side –
  // strike labels along the front edge (9800 … 6000, put wing rising at right) –, then expiry side-on, then IV
  { t: 22.1, theta: -170, phi: 22, r: 2.7, target: [0, 0.14, -0.6], ease: slow },
  { t: 25.0, theta: -106, phi: 22, r: 2.8, target: [-0.6, 0.14, 0], ease: slow },
  { t: 28.0, theta: -140, phi: 14, r: 3.0, target: [-0.3, 0.42, -0.3], ease: slow },
  // example: overview (room for the two slice panels), push in on 6000 / near month, follow the cursor to the far month, pull back
  { t: 30.4, theta: -30, phi: 26, r: 3.4, target: [colX * 0.3, 0.45, 0], ease: slow },
  { t: 33.2, theta: -32, phi: 22, r: 2.4, target: [colX * 0.85, peak.y - 0.18, nearZ * 0.6], ease: slow },
  { t: 37.2, theta: -58, phi: 20, r: 2.6, target: [colX * 0.8, 0.38, 0.25], ease: slow },
  { t: 40.4, theta: -40, phi: 24, r: 3.3, target: [colX * 0.4, 0.42, 0], ease: slow },
  // fold: frontal, the surface becomes the V
  { t: 43.6, theta: 0, phi: 6, r: 2.9, target: [0, 0.46, 0], fov: 40, ease: slow },
  { t: 51.0, theta: 0, phi: 6, r: 2.9, target: [0, 0.46, 0], ease: slow },
];

export const cameraAt = (frame: number, keys: Key[]): CameraPose => {
  const t = frame / FPS;
  let a = keys[0]!;
  let b = keys[0]!;
  let u = 0;
  if (t >= keys[keys.length - 1]!.t) a = b = keys[keys.length - 1]!;
  else
    for (let i = 0; i < keys.length - 1; i++) {
      if (t >= keys[i]!.t && t < keys[i + 1]!.t) {
        a = keys[i]!;
        b = keys[i + 1]!;
        u = (b.ease ?? EASE)((t - a.t) / (b.t - a.t));
        break;
      }
    }
  const fovOf = (k: Key, idx: number) => {
    for (let i = idx; i >= 0; i--) if (keys[i]!.fov != null) return keys[i]!.fov!;
    return 42;
  };
  const ia = keys.indexOf(a);
  const ib = keys.indexOf(b);
  const L = (x: number, y: number) => x + (y - x) * u;
  const theta = L(a.theta, b.theta) * D;
  const phi = L(a.phi, b.phi) * D;
  const r = Math.exp(L(Math.log(a.r), Math.log(b.r)));
  const target = new THREE.Vector3(L(a.target[0], b.target[0]), L(a.target[1], b.target[1]), L(a.target[2], b.target[2]));
  const pos = new THREE.Vector3(Math.cos(phi) * Math.sin(theta), Math.sin(phi), Math.cos(phi) * Math.cos(theta)).multiplyScalar(r).add(target);
  return { pos, target, fov: L(fovOf(a, ia), fovOf(b, ib)) };
};
