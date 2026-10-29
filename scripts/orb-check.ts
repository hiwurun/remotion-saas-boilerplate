import * as THREE from "three";
import { cameraAt, orbT, orbPos, O } from "../src/openvlab-strategy/open/timeline";
const cam = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 200);
const pts: { f: number; x: number; y: number }[] = [];
const from = O.orbStart, to = O.impact + 60;
for (let f = from - 2; f <= to; f++) {
  const c = cameraAt(f);
  cam.position.copy(c.pos); cam.quaternion.copy(c.quat); cam.fov = c.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
  const p = orbPos(orbT(f)).project(cam);
  pts.push({ f, x: (p.x * 0.5 + 0.5) * 1920, y: (0.5 - p.y * 0.5) * 1080 });
}
let max1 = 0, max2 = 0, f2 = 0, f1 = 0, sum2 = 0, n = 0;
const rows: string[] = [];
for (let i = 2; i < pts.length; i++) {
  const d1x = pts[i].x - pts[i - 1].x, d1y = pts[i].y - pts[i - 1].y;
  const d0x = pts[i - 1].x - pts[i - 2].x, d0y = pts[i - 1].y - pts[i - 2].y;
  const s1 = Math.hypot(d1x, d1y), s2 = Math.hypot(d1x - d0x, d1y - d0y);
  if (pts[i].f <= O.impact + 50) { if (s1 > max1) { max1 = s1; f1 = pts[i].f; } if (s2 > max2) { max2 = s2; f2 = pts[i].f; } sum2 += s2; n++; }
  if (pts[i].f % 20 === 0 || pts[i].f>=422 && pts[i].f<=452 || pts[i].f > 524 && pts[i].f < 540 || pts[i].f > O.impact - 3 && pts[i].f < O.impact + 3) rows.push(`f${pts[i].f} xy=(${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}) speed=${s1.toFixed(2)}px/f acc=${s2.toFixed(3)}`);
}
console.log(rows.join("\n"));
console.log(`pre-impact frames ${O.orbStart}..${O.impact - 1}: max speed ${max1.toFixed(2)} px/f @${f1}; max |2nd diff| ${max2.toFixed(3)} px/f^2 @${f2}; mean |2nd diff| ${(sum2 / n).toFixed(3)}`);
