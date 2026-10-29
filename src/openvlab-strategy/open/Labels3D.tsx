import React from "react";
import * as THREE from "three";
import { MODEL } from "../data";
import { MONO } from "../../shared/fonts";
import { C, THIN } from "../tokens";
import { H, W } from "../timeline";
import { DEPTH, HEIGHT, NX, P_HI, P_LO, P_MID, X_HALF, lineY } from "./surface";
import { O, cameraAt, orbPos, orbT, ramp } from "./timeline";

/** v6: what the 3D picture means — axis labels (标的价格 / 剩余天数 / 盈亏) and the falling point's own P&L number. Projected with the SAME camera as SceneGL. */
const DTE0 = MODEL.timeline[0].dte;
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 160);
const proj = (f: number, v: THREE.Vector3) => {
  const c = cameraAt(f);
  cam.position.copy(c.pos);
  cam.quaternion.copy(c.quat);
  cam.fov = c.fov;
  if (c.viewOffset[0] !== 0 || c.viewOffset[1] !== 0) cam.setViewOffset(W, H, -c.viewOffset[0], -c.viewOffset[1], W, H);
  else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  const p = v.clone().project(cam);
  return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H, ok: p.z < 1 };
};
const xOfPrice = (p: number) => ((p - P_LO) / (P_HI - P_LO)) * 2 - 1;
const edgeY = (p: number) => HEIGHT(0, Math.round(((p - P_LO) / (P_HI - P_LO)) * (NX - 1)));
export const fmtPnl = (v: number) => `${v < 0 ? "\u2212" : v > 0 ? "+" : ""}${Math.abs(Math.round(v)).toLocaleString("en-US")}`;

const Tag: React.FC<{ x: number; y: number; op: number; children: React.ReactNode; size?: number; color?: string; align?: "l" | "c" | "r"; weight?: number }> = ({ x, y, op, children, size = 24, color = "rgba(232,238,248,0.92)", align = "c", weight = 300 }) =>
  op <= 0.001 ? null : (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(${align === "c" ? "-50%" : align === "r" ? "-100%" : "0"}, -50%)`,
        opacity: op,
        fontFamily: THIN,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: "0.08em",
        color,
        whiteSpace: "nowrap",
        textShadow: "0 1px 10px rgba(0,0,0,.85), 0 0 2px rgba(0,0,0,.9)",
      }}
    >
      {children}
    </div>
  );

export const Labels3D: React.FC<{ f: number }> = ({ f }) => {
  if (f < O.axes[0] - 2 || f > O.numOut[1] + 2) return null;
  const aOp = ramp(f, O.axes[0], O.axes[1]) * (1 - ramp(f, O.axesOut[0], O.axesOut[1]));
  const nOp = ramp(f, O.num[0], O.num[1]) * (1 - ramp(f, O.numOut[0], O.numOut[1]));
  const near = -0.15;
  // price axis: ticks along the near (first-day) edge of the sheet
  const ticks = [6250, 6550, 6850].map((p) => ({ p, s: proj(f, new THREE.Vector3(xOfPrice(p) * X_HALF, edgeY(p) - 0.42, near)) }));
  const pTitle = proj(f, new THREE.Vector3(xOfPrice(6400) * X_HALF, edgeY(6400) - 1.05, near));
  // days axis: along the right-hand (screen) side edge, from the near end (23 天) to the far end (到期)
  const sideX = xOfPrice(6180) * X_HALF;
  const d0 = proj(f, new THREE.Vector3(sideX, edgeY(6180) - 0.1, 0.3));
  const d1 = proj(f, new THREE.Vector3(sideX, edgeY(6180) - 0.1, DEPTH * 0.6));
  // P&L axis: a short vertical arrow above the 6550 point at the first day
  const pl0 = proj(f, new THREE.Vector3(xOfPrice(6720) * X_HALF, lineY(0) - 0.2, 0.6));
  const pl1 = proj(f, new THREE.Vector3(xOfPrice(6720) * X_HALF, lineY(0) + 1.5, 0.6));
  // the point itself
  const t = orbT(f);
  const o = proj(f, orbPos(t));
  const dte = DTE0 * (1 - t);
  const v = MODEL.profit(P_MID, Math.max(0, dte));
  const daysLeft = dte < 0.02 ? "到期" : `剩 ${Math.ceil(dte - 0.02)} 天`;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {aOp > 0.001 && (
        <>
          <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: aOp * 0.75 }}>
            <defs>
              <marker id="ax-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0,1 L9,5 L0,9" fill="none" stroke="rgba(232,238,248,0.9)" strokeWidth="1.4" />
              </marker>
            </defs>
            <line x1={pl0.x} y1={pl0.y} x2={pl1.x} y2={pl1.y} stroke="rgba(232,238,248,0.8)" strokeWidth={1.6} markerEnd="url(#ax-arrow)" />
            <line x1={d0.x} y1={d0.y} x2={d1.x} y2={d1.y} stroke="rgba(232,238,248,0.8)" strokeWidth={1.6} markerEnd="url(#ax-arrow)" />
          </svg>
          {ticks.map(({ p, s }) => s.ok && <Tag key={p} x={s.x} y={s.y} op={aOp * 0.95} size={26}>{p}</Tag>)}
          {pTitle.ok && <Tag x={pTitle.x} y={pTitle.y} op={aOp} size={30}>标的价格</Tag>}
          {d0.ok && <Tag x={d0.x - 8} y={d0.y + 36} op={aOp} size={30} align="r">剩余天数 23 → 0</Tag>}
          {pl1.ok && <Tag x={pl1.x} y={pl1.y - 26} op={aOp} size={30}>盈亏</Tag>}
        </>
      )}
      {nOp > 0.001 && o.ok && (
        <div style={{ position: "absolute", left: o.x + 44, top: o.y - 20, transform: "translateY(-50%)", opacity: nOp, whiteSpace: "nowrap", textShadow: "0 2px 14px rgba(0,0,0,.9), 0 0 3px rgba(0,0,0,.9)" }}>
          <div style={{ fontFamily: THIN, fontWeight: 300, fontSize: 24, letterSpacing: "0.08em", color: "rgba(232,238,248,0.9)" }}>6550 · {daysLeft}</div>
          <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 52, color: C.green, fontVariantNumeric: "tabular-nums", lineHeight: 1.15 }}>{fmtPnl(v)}</div>
        </div>
      )}
    </div>
  );
};
