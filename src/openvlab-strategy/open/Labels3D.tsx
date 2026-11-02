import React from "react";
import * as THREE from "three";
import { MODEL } from "../data";
import { MONO } from "../../shared/fonts";
import { C, THIN } from "../tokens";
import { H, W } from "../timeline";
import { BOX, DTE0, P_MID, TICKS, surfY, tOfDays, xOfPrice, yOfPnl, zOf } from "./surface";
import { chartWorld } from "./scene";
import { O, cameraAt, ramp, stateAt } from "./timeline";

/** v9: the front_axes DOM labels (main.js), projected with the same camera + chart matrix as SceneGL. No cards. */
const cam = new THREE.PerspectiveCamera(37, W / H, 0.1, 200);
const M = new THREE.Matrix4();
const setCam = (f: number) => {
  const c = cameraAt(f);
  cam.position.copy(c.pos);
  cam.quaternion.copy(c.quat);
  cam.fov = c.fov;
  if (c.viewOffset[0] !== 0 || c.viewOffset[1] !== 0) cam.setViewOffset(W, H, -c.viewOffset[0], -c.viewOffset[1], W, H);
  else cam.clearViewOffset();
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
  const st = stateAt(f);
  chartWorld(st.turn, st.crop, M);
};
const proj = (x: number, y: number, z: number) => {
  const p = new THREE.Vector3(x, y, z).applyMatrix4(M).project(cam);
  return { x: ((p.x + 1) / 2) * W, y: ((1 - p.y) / 2) * H };
};
export const fmtPnl = (v: number) => `${v < 0 ? "\u2212" : v > 0 ? "+" : ""}${Math.abs(Math.round(v)).toLocaleString("en-US")}`;
const fmtTick = (v: number) => (v === 0 ? "0" : `${v < 0 ? "\u2212" : ""}${Math.abs(v).toLocaleString("en-US")}`);

type Cls = "tk" | "hi" | "tt";
const STYLE: Record<Cls, React.CSSProperties> = {
  tk: { fontSize: 22, color: "rgba(190,208,226,.78)", letterSpacing: "0.5px", fontWeight: 400 },
  hi: { fontSize: 24, color: "#fff", fontWeight: 600 },
  tt: { fontSize: 26, color: "rgba(214,226,238,.9)", letterSpacing: "2px", fontWeight: 400 },
};
const Lb: React.FC<{ p: { x: number; y: number }; text: string; cls: Cls; op: number; dx?: number; dy?: number; al?: "l" | "c" | "r" }> = ({ p, text, cls, op, dx = 0, dy = 0, al = "c" }) => (
  <div
    style={{
      position: "absolute",
      left: p.x + dx,
      top: p.y + dy,
      transform: `translate(${al === "r" ? "-100%" : al === "l" ? "0%" : "-50%"}, -50%)`,
      whiteSpace: "nowrap",
      fontFamily: THIN,
      fontVariantNumeric: "tabular-nums",
      textShadow: "0 0 6px #050912",
      opacity: op,
      ...STYLE[cls],
    }}
  >
    {text}
  </div>
);


/** v10: the v8 callout card (thin neutral border, small title, big loss number in the loss green) with a hairline leader + anchor dot */
const MARGIN = 24;
const Card: React.FC<{ ax: number; ay: number; cx: number; cy: number; op: number; color: string; title: string; value: string }> = ({ ax, ay, cx, cy, op, color, title, value }) => {
  if (op <= 0.001) return null;
  const CW = 214;
  const CH = 104;
  const left = Math.min(Math.max(cx - CW / 2, MARGIN), W - MARGIN - CW);
  const top = Math.min(Math.max(cy - CH / 2, MARGIN), H - MARGIN - CH);
  const ex = ax < left ? left : ax > left + CW ? left + CW : ax;
  const ey = ex === ax ? (ay < top ? top : top + CH) : Math.min(Math.max(ay, top + 18), top + CH - 18);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: op }}>
        <line x1={ax} y1={ay} x2={ex} y2={ey} stroke={color} strokeOpacity={0.7} strokeWidth={1.2} />
        <circle cx={ax} cy={ay} r={4} fill={color} />
      </svg>
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: CW,
          height: CH,
          boxSizing: "border-box",
          opacity: op,
          padding: "14px 20px",
          border: `1px solid ${color}`,
          borderRadius: 10,
          background: "rgba(8,12,18,0.72)",
          boxShadow: `0 0 24px ${color}22, inset 0 0 18px ${color}10`,
        }}
      >
        <div style={{ fontFamily: THIN, fontWeight: 300, fontSize: 21, letterSpacing: "0.08em", color }}>{title}</div>
        <div style={{ fontFamily: MONO, fontWeight: 500, fontSize: 40, lineHeight: 1.2, color: C.green, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      </div>
    </>
  );
};
/** REAL model values at the two ends of the 6550 path (23 days left / expiry) */
const PNL_START = MODEL.profit(P_MID, DTE0);
const PNL_END = MODEL.profit(P_MID, 0);
/** card centre offsets (px) from each anchor */
export const CALL_OFF = { a: [-250, -170] as [number, number], b: [250, 150] as [number, number] };
export const Labels3D: React.FC<{ f: number }> = ({ f }) => {
  if (f < O.axes[0] - 2 || f > O.labelsOut[1] + 2) return null;
  const out = 1 - ramp(f, O.labelsOut[0], O.labelsOut[1]);
  const op = ramp(f, O.axes[0], O.axes[1]) * out;
  if (op <= 0.001) return null;
  setCam(f);
  const { z0, z1, y0, y1 } = BOX;
  const x0 = xOfPrice(6250);
  const x1 = xOfPrice(6850);
  const sg = Math.sign(x0);
  const zD = (d: number) => zOf(tOfDays(d));
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {TICKS.price.map((v) => (
        <Lb key={`p${v}`} p={proj(xOfPrice(v), y0, z0 - 0.45)} text={String(v)} cls={v === 6550 ? "hi" : "tk"} op={op} dx={v === 6250 ? 6 : 0} dy={v === 6250 ? 18 : 10} />
      ))}
      <Lb p={proj(xOfPrice(P_MID), y0, z0 - 1.25)} text="标的价格" cls="tt" op={op} dy={22} />
      {TICKS.days.map((d) => (
        <Lb key={`d${d}`} p={proj(x0 + sg * 0.5, y0, zD(d))} text={d === 0 ? "到期" : String(d)} cls="tk" op={op} dx={d === 23 ? -16 : -8} dy={d === 0 ? -10 : d === 2 ? 8 : d === 23 ? -4 : 4} al="r" />
      ))}
      <Lb p={proj(x0 + sg * 1.9, y0, zD(11))} text="剩余天数" cls="tt" op={op} dx={-10} al="r" />
      {TICKS.pnl.map((v) => (
        <Lb key={`v${v}`} p={proj(x1 - sg * 0.35, yOfPnl(v), z1)} text={fmtTick(v)} cls="tk" op={op} dx={22} al="l" />
      ))}
      <Lb p={proj(x1, y1, z1)} text="盈亏" cls="tt" op={op} dy={-28} />
      {/* anchors = the exact spine end points (same surfY as the tube; the expiry point lies on the V line, which is sampled at 6550 too) */}
      {(() => {
        const a = proj(xOfPrice(P_MID), surfY(P_MID, 0), zOf(0));
        const b = proj(xOfPrice(P_MID), surfY(P_MID, 1), zOf(1));
        return (
          <>
            <Card ax={a.x} ay={a.y} cx={a.x + CALL_OFF.a[0]} cy={a.y + CALL_OFF.a[1]} op={ramp(f, O.callA[0], O.callA[1]) * out} color="#e6ebf0" title={`剩 ${Math.round(DTE0)} 天`} value={fmtPnl(PNL_START)} />
            <Card ax={b.x} ay={b.y} cx={b.x + CALL_OFF.b[0]} cy={b.y + CALL_OFF.b[1]} op={ramp(f, O.callB[0], O.callB[1]) * out} color="#e6ebf0" title="到期" value={fmtPnl(PNL_END)} />
          </>
        );
      })()}
    </div>
  );
};
