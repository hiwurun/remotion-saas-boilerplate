import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { SANS } from "../shared/fonts";
import { Card, Mode, Reveal, StaticCard } from "./Card";
import { CARD_H, cellCenter, GRID, L, Placed } from "./data";
import { D, withA } from "./styles";

/** Shots 5–13 of the 58s cut. Every value drawn comes from data/*.json. */
export const W = 1920, H = 1080;
const jb = loadFont("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
const MONO = `${jb}, "PingFang SC", "Noto Sans SC", monospace`;
export const T = { s5: 15.44, s6: 19.41, s7: 23.36 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (t: number, a: number, b: number) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const io = (t: number, a: number, b: number) => { const x = clamp01((t - a) / (b - a)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpLog = (a: number, b: number, k: number) => Math.exp(lerp(Math.log(a), Math.log(b), k));

/* ---------------- shared wall (real product cards on a camera) ---------------- */
type CamS = { cx: number; cy: number; z: number; aperture?: number };
type WallCard = { pl: Placed; op?: number; mode?: Mode; borders?: number; desc?: boolean; ring?: number; reveal?: Reveal; dx?: number; dy?: number };
const BQ = [0, 1.5, 3.5, 7];
const q = (b: number) => BQ.reduce((best, v) => (Math.abs(v - b) < Math.abs(best - b) ? v : best), 0);
const Wall: React.FC<{ cam: CamS; cards: WallCard[]; overlay?: React.ReactNode; dim?: number }> = ({ cam, cards, overlay, dim = 0 }) => {
  const { cx, cy, z, aperture = 0 } = cam;
  return (
    <AbsoluteFill style={{ opacity: 1 - dim }}>
      <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, perspective: 1700 }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${-cx * z}px, ${-cy * z}px)` }}>
          <div style={{ position: "absolute", left: 0, top: 0, zoom: z } as React.CSSProperties}>
            {cards.map((c) => {
              const x = c.pl.x + (c.dx ?? 0), y = c.pl.y + (c.dy ?? 0);
              const sx = (x + c.pl.w / 2 - cx) * z, sy = (y + CARD_H / 2 - cy) * z;
              if (Math.abs(sx) - (c.pl.w * z) / 2 > W * 0.62 || Math.abs(sy) - (CARD_H * z) / 2 > H * 0.7) return null;
              if ((c.op ?? 1) <= 0.01) return null;
              const b = q(Math.min(7, (aperture * Math.max(0, Math.hypot(sx, sy) - 260)) / 400));
              const local: Placed = { ...c.pl, x: 0, y: 0 };
              return (
                <div key={c.pl.p.code} style={{ position: "absolute", left: x, top: y, width: c.pl.w, height: CARD_H, opacity: c.op ?? 1 }}>
                  {c.reveal ? <Card pl={local} reveal={c.reveal} mode={c.mode} borders={c.borders} desc={c.desc} ring={c.ring} /> : <StaticCard pl={local} mode={c.mode} borders={c.borders} desc={c.desc} ring={c.ring} />}
                  {b ? <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#000", opacity: 1 - 1 / (1 + 0.11 * b) }} /> : null}
                </div>
              );
            })}
            {overlay}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};


const allCards = (f?: (g: Placed) => Partial<WallCard>): WallCard[] => GRID.map((g) => ({ pl: g, ...(f ? f(g) : {}) }));

/* ---------------- facts derived from the data ---------------- */
const GW = Math.max(...GRID.map((g) => g.x + g.w)), GH = Math.max(...GRID.map((g) => g.y + CARD_H));
const mainM = (p: Placed["p"]) => p.months.find((m) => m.exp === p.exp) ?? p.months[0];
const FALL_DIFF = GRID.map((g) => mainM(g.p)?.diff[3]).filter((v): v is number => Number.isFinite(v));
const FALLING = new Set(GRID.filter((g) => (mainM(g.p)?.diff[3] ?? 0) < 0).map((g) => g.p.code));
const N_ALL = FALL_DIFF.length;
type Hot = { g: Placed; mi: number; row: number; a: number };
const HOT: Hot[] = GRID.flatMap((g) => g.p.months.flatMap((m, mi) => m.alpha.map((a, j) => ({ g, mi, row: j + 1, a })))).filter((h) => Number.isFinite(h.a)).sort((x, y) => Math.abs(y.a) - Math.abs(x.a)).slice(0, 6);
const TOP = HOT[0];
const ROWNAME = ["偏度", "20P", "30P", "40P", "50", "40C", "30C", "20C"];
/* ---------------- A · 哪些品种隐波下跌？ ---------------- */
const FALL_LIST = GRID.filter((g) => FALLING.has(g.p.code)).map((g) => ({ code: g.p.code, name: g.p.name, d: mainM(g.p).diff[3] })).sort((a, b) => a.d - b.d);
const FALL_T0 = 15.9, FALL_DT = 0.075; // item i lights at FALL_T0 + i * FALL_DT (≈ 2.4s for 32)
const fallAt = new Map(FALL_LIST.map((f, i) => [f.code, FALL_T0 + i * FALL_DT]));
export const ShotFall: React.FC<{ t: number }> = ({ t }) => {
  const k = io(t, T.s5, T.s6);
  const dimK = sm(t, 15.5, 15.9);
  const n = FALL_LIST.filter((f) => t >= fallAt.get(f.code)!).length;
  const rows = Math.ceil(FALL_LIST.length / 2);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: "translateX(-372px)" }}>
        <Wall cam={{ cx: GW * 0.5, cy: GH * 0.5, z: lerpLog(0.38, 0.4, k), aperture: 0 }}
          cards={allCards((g) => { const ta = fallAt.get(g.p.code); return { borders: 0, op: ta === undefined ? 1 - 0.8 * dimK : 1 - 0.8 * dimK + 0.8 * sm(t, ta - 0.05, ta + 0.2) }; })} />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 1250, top: 210, width: 600, fontFamily: MONO, color: D.fg, opacity: sm(t, 15.5, 15.9) }}>
        <div style={{ fontSize: 40, letterSpacing: 2, whiteSpace: "pre" }}>隐波下跌  <span style={{ color: "#2ee59d" }}>{String(n).padStart(2, "0")}</span> / {N_ALL}</div>
        <div style={{ height: 1, background: D.border, margin: "26px 0 18px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: `repeat(${rows}, 34px)`, gridAutoFlow: "column", columnGap: 40 }}>
          {FALL_LIST.map((f) => {
            const o = sm(t, fallAt.get(f.code)!, fallAt.get(f.code)! + 0.2);
            return (
              <div key={f.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 21, opacity: o, transform: `translateX(${(1 - o) * 10}px)` }}>
                <span style={{ fontFamily: SANS, color: withA(D.fg, 0.85) }}>{f.name}</span>
                <span style={{ color: "#2ee59d", fontVariantNumeric: "tabular-nums" }}>{f.d.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- B · 哪里变化最快？(涨速边框) — single card ---------------- */
export const ShotSpeed: React.FC<{ t: number }> = ({ t }) => {
  const pl: Placed = { ...TOP.g, x: 0, y: 0 };
  const sc = Math.min(1150 / pl.w, 640 / CARD_H);
  const enter = io(t, T.s6, T.s6 + 0.8);
  const push = sm(t, T.s6, T.s7);
  const on = sm(t, 20.6, 21.2);
  const isTop = (mi: number, row: number) => mi === TOP.mi && row === TOP.row;
  const reveal: Reveal = { cell: (mi, row) => (isTop(mi, row) ? 1 : 1 - 0.65 * on), outline: (mi, row) => (isTop(mi, row) ? on : 0) };
  const c = cellCenter(pl, TOP.mi, TOP.row);
  const lab = sm(t, 21.3, 21.8);
  const S = sc * lerp(0.96, 1, enter) * lerp(1, 1.05, push);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <div style={{ position: "absolute", left: W / 2, top: H / 2 - 40, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -pl.w / 2, top: -CARD_H / 2, width: pl.w, height: CARD_H, transformOrigin: "50% 50%", transform: `translateY(${(1 - enter) * 40}px) scale(${S})`, opacity: enter }}>
          <Card pl={pl} reveal={reveal} />
          <div style={{ position: "absolute", left: c.x - L.col / 2 - 2, top: c.y - L.row / 2 - 2, width: L.col + 4, height: L.row + 4, borderRadius: 3, border: "1px solid #fff", opacity: sm(t, 21.0, 21.4), boxShadow: "0 0 6px rgba(255,255,255,0.6)" }} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, width: W, top: H / 2 + (CARD_H * sc * 1.05) / 2 + 10, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 2, color: D.fg, opacity: lab, transform: `translateY(${(1 - lab) * 10}px)`, whiteSpace: "pre" }}>
        {`${TOP.g.p.name} ${TOP.g.p.months[TOP.mi].exp.slice(2)} ${ROWNAME[TOP.row]}   涨速 `}<span style={{ color: TOP.a > 0 ? "#3b82f6" : "#ef4444" }}>{(TOP.a > 0 ? "+" : "") + TOP.a.toFixed(2)}</span>
      </div>
    </AbsoluteFill>
  );
};

