import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { SANS } from "../shared/fonts";
import { Card, Mode, Reveal, StaticCard } from "./Card";
import { CARD_H, cellCenter, GRID, L, Placed } from "./data";
import { INTRADAY } from "./extra-data";
import { DARK, FONT, PillTabs, rawExpiry, renderTerm, renderVolChart, SmileCard, TERM, TERM_HI, TermTable } from "./VolPopup";
import { D } from "./styles";

/** Shots 5–13 of the 58s cut. Every value drawn comes from data/*.json. */
export const W = 1920, H = 1080;
const jb = loadFont("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
const MONO = `${jb}, "PingFang SC", "Noto Sans SC", monospace`;
export const T = { s5: 15.44, s6: 19.41, s7: 23.36, s8: 27.32, s9: 32.95, s10: 38.77, s11: 42.73 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (t: number, a: number, b: number) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const io = (t: number, a: number, b: number) => { const x = clamp01((t - a) / (b - a)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpLog = (a: number, b: number, k: number) => Math.exp(lerp(Math.log(a), Math.log(b), k));
/** click = brief highlight pulse on the target, no cursor */
const pulse = (t: number, at: number) => sm(t, at - 0.08, at + 0.06) * (1 - sm(t, at + 0.25, at + 0.75));

/* ---------------- shared wall (real product cards on a camera) ---------------- */
type CamS = { cx: number; cy: number; z: number; tilt?: number; rz?: number; aperture?: number };
type WallCard = { pl: Placed; op?: number; mode?: Mode; borders?: number; desc?: boolean; ring?: number; reveal?: Reveal; dx?: number; dy?: number };
const BQ = [0, 1.5, 3.5, 7];
const q = (b: number) => BQ.reduce((best, v) => (Math.abs(v - b) < Math.abs(best - b) ? v : best), 0);
const Wall: React.FC<{ cam: CamS; cards: WallCard[]; overlay?: React.ReactNode; dim?: number }> = ({ cam, cards, overlay, dim = 0 }) => {
  const { cx, cy, z, tilt = 0, rz = 0, aperture = 0 } = cam;
  return (
    <AbsoluteFill style={{ opacity: 1 - dim }}>
      <div style={{ position: "absolute", left: W / 2, top: H / 2, width: 0, height: 0, perspective: 1700 }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `rotateX(${tilt}deg) rotateZ(${rz}deg) translate(${-cx * z}px, ${-cy * z}px)` }}>
          <div style={{ position: "absolute", left: 0, top: 0, zoom: z } as React.CSSProperties}>
            {cards.map((c) => {
              const x = c.pl.x + (c.dx ?? 0), y = c.pl.y + (c.dy ?? 0);
              const sx = (x + c.pl.w / 2 - cx) * z, sy = (y + CARD_H / 2 - cy) * z;
              if (Math.abs(sx) - (c.pl.w * z) / 2 > W * 0.62 || Math.abs(sy) - (CARD_H * z) / 2 > H * 0.7) return null;
              if ((c.op ?? 1) <= 0.01) return null;
              const b = q(Math.min(7, (aperture * Math.max(0, Math.hypot(sx, sy) - 260)) / 400));
              const local: Placed = { ...c.pl, x: 0, y: 0 };
              return (
                <div key={c.pl.p.code} style={{ position: "absolute", left: x, top: y, width: c.pl.w, height: CARD_H, opacity: c.op ?? 1, filter: b ? `blur(${b / z}px)` : undefined }}>
                  {c.reveal ? <Card pl={local} reveal={c.reveal} mode={c.mode} borders={c.borders} desc={c.desc} ring={c.ring} /> : <StaticCard pl={local} mode={c.mode} borders={c.borders} desc={c.desc} ring={c.ring} />}
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

const IM = GRID.find((g) => g.p.code === "MO")!;
const IMc = { x: IM.x + IM.w / 2, y: IM.y + CARD_H / 2 };
const PILL = { x: IM.x + IM.w - L.pad - 6 - 26, y: IM.y + L.pad + 14, w: 56, h: 20 };
const m0 = IM.p.months[0];

/* floating controls replica (FloatingControls.tsx, dark mode: white/90 round buttons) */
const U = 1.6;
const Floating: React.FC<{ op: number; label: string; borders: boolean; ring?: [number, number] }> = ({ op, label, borders, ring = [-1, 0] }) => {
  const btn = (i: number, child: React.ReactNode) => (
    <div key={i} style={{ width: 40 * U, height: 40 * U, borderRadius: "50%", background: "rgba(255,255,255,0.9)", border: "2px solid rgba(255,255,255,0.2)", color: "#1f2937", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: ring[0] === i ? `0 0 0 ${6 * ring[1]}px rgba(255,255,255,${0.35 * ring[1]})` : "0 10px 30px rgba(0,0,0,0.5)", transform: `scale(${ring[0] === i ? 1 - 0.08 * ring[1] : 1})` }}>
      {child}
    </div>
  );
  if (op <= 0.01) return null;
  return (
    <div style={{ position: "absolute", right: 16 * U, bottom: 16 * U, display: "flex", flexDirection: "column", gap: 8 * U, opacity: op }}>
      {btn(0, <span style={{ fontFamily: SANS, fontSize: 12 * U, fontWeight: 700 }}>{label}</span>)}
      {btn(1, (
        <svg width={20 * U} height={20 * U} viewBox="0 0 24 24" fill="currentColor">
          {[[2, 2, 0.3], [9, 2, 0.6], [16, 2, 0.9], [2, 9, 0.6], [9, 9, 0.9], [16, 9, 0.4], [2, 16, 0.9], [9, 16, 0.5], [16, 16, 0.7]].map(([x, y, o], i) => <rect key={i} x={x} y={y} width={5} height={5} opacity={o} />)}
        </svg>
      ))}
      {btn(2, (
        <svg width={20 * U} height={20 * U} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          {borders ? (<><rect x={4} y={4} width={16} height={16} strokeWidth={2.5} /><line x1={4} y1={12} x2={20} y2={12} strokeWidth={2} /><line x1={12} y1={4} x2={12} y2={20} strokeWidth={2} /></>) : (<><rect x={4} y={4} width={16} height={16} strokeWidth={1.5} opacity={0.5} /><line x1={6} y1={6} x2={18} y2={18} strokeWidth={2} /></>)}
        </svg>
      ))}
    </div>
  );
};
const allCards = (f?: (g: Placed) => Partial<WallCard>): WallCard[] => GRID.map((g) => ({ pl: g, ...(f ? f(g) : {}) }));

/* ---------------- facts derived from the data ---------------- */
const GW = Math.max(...GRID.map((g) => g.x + g.w)), GH = Math.max(...GRID.map((g) => g.y + CARD_H));
const mainM = (p: Placed["p"]) => p.months.find((m) => m.exp === p.exp) ?? p.months[0];
const FALL_DIFF = GRID.map((g) => mainM(g.p)?.diff[3]).filter((v): v is number => Number.isFinite(v));
const FALLING = new Set(GRID.filter((g) => (mainM(g.p)?.diff[3] ?? 0) < 0).map((g) => g.p.code));
const N_FALL = FALLING.size, N_ALL = FALL_DIFF.length;
type Hot = { g: Placed; mi: number; row: number; a: number };
const HOT: Hot[] = GRID.flatMap((g) => g.p.months.flatMap((m, mi) => m.alpha.map((a, j) => ({ g, mi, row: j + 1, a })))).filter((h) => Number.isFinite(h.a)).sort((x, y) => Math.abs(y.a) - Math.abs(x.a)).slice(0, 6);
const TOP = HOT[0];
const ROWNAME = ["偏度", "20P", "30P", "40P", "50", "40C", "30C", "20C"];
const Label: React.FC<{ op: number; children: React.ReactNode }> = ({ op, children }) => (
  <div style={{ position: "absolute", left: 96, bottom: 84, fontFamily: MONO, fontSize: 30, letterSpacing: 2, color: D.fg, opacity: op, transform: `translateY(${(1 - op) * 10}px)`, whiteSpace: "pre" }}>{children}</div>
);

/* ---------------- A · 哪些品种隐波下跌？ ---------------- */
export const ShotFall: React.FC<{ t: number }> = ({ t }) => {
  const k = io(t, T.s5, T.s6);
  const dimK = sm(t, 16.0, 16.8);
  const n = Math.round(N_FALL * sm(t, 16.0, 17.2));
  return (
    <AbsoluteFill>
      <Wall cam={{ cx: GW * 0.5, cy: lerp(GH * 0.46, GH * 0.5, k), z: lerpLog(0.86, 0.66, k), tilt: lerp(18, 10, k), rz: lerp(-2, 0, k), aperture: 0.3 }}
        cards={allCards((g) => ({ borders: 0, op: FALLING.has(g.p.code) ? 1 : 1 - 0.8 * dimK }))} />
      <Label op={sm(t, 16.0, 16.5)}>
        隐波下跌  <span style={{ color: "#2ee59d" }}>{String(n).padStart(2, "0")}</span> / {N_ALL}
      </Label>
    </AbsoluteFill>
  );
};

/* ---------------- B · 哪里变化最快？(涨速边框) ---------------- */
export const ShotSpeed: React.FC<{ t: number }> = ({ t }) => {
  const on = sm(t, 19.8, 20.5);
  const kc = io(t, 20.8, 22.6);
  const tc = cellCenter(TOP.g, TOP.mi, TOP.row);
  const hotOf = (g: Placed) => HOT.filter((h) => h.g === g);
  const cards = allCards((g) => {
    const hs = hotOf(g);
    if (!hs.length) return { borders: 0, op: 1 - 0.75 * on };
    const isHot = (mi: number, row: number) => hs.some((h) => h.mi === mi && h.row === row);
    return { reveal: { cell: (mi, row) => (isHot(mi, row) ? 1 : 1 - 0.75 * on), outline: (mi, row) => (isHot(mi, row) ? on : 0), chrome: 1 - 0.5 * on } };
  });
  return (
    <AbsoluteFill>
      <Wall cam={{ cx: lerp(GW * 0.5, tc.x, kc), cy: lerp(GH * 0.5, tc.y, kc), z: lerpLog(0.7, 4.2, kc), tilt: lerp(10, 3, kc), aperture: 0.5 * kc }} cards={cards}
        overlay={<div style={{ position: "absolute", left: tc.x - L.col / 2 - 3, top: tc.y - L.row / 2 - 3, width: L.col + 6, height: L.row + 6, borderRadius: 4, border: "1.5px solid #fff", opacity: sm(t, 22.5, 22.9), boxShadow: "0 0 10px rgba(255,255,255,0.6)" }} />} />
      <Label op={sm(t, 22.4, 22.9)}>
        {`${TOP.g.p.name} ${TOP.g.p.months[TOP.mi].exp.slice(2)} ${ROWNAME[TOP.row]}   涨速 `}<span style={{ color: TOP.a > 0 ? "#3b82f6" : "#ef4444" }}>{(TOP.a > 0 ? "+" : "") + TOP.a.toFixed(2)}</span>
      </Label>
    </AbsoluteFill>
  );
};

/* ---------------- C · 中证1000：隐波现在高还是低？ ---------------- */
export const ShotIM: React.FC<{ t: number }> = ({ t }) => {
  const click = 24.2;
  const k = io(t, T.s7, T.s8);
  const atmC = cellCenter(IM, 0, 4);
  const focus = sm(t, 25.0, 25.6);
  const reveal: Reveal = {
    modeAt: () => (t > click + 0.05 ? "tday" : "diff"),
    cell: (_mi, row) => (row === 4 ? 1 : 1 - 0.7 * focus),
    outline: () => 0,
  };
  const ad = m0.diff[3];
  return (
    <AbsoluteFill>
      <Wall cam={{ cx: lerp(IMc.x - 120, IMc.x + 20, k), cy: lerp(IMc.y + 10, IMc.y, k), z: 3.4, tilt: 3, rz: lerp(-0.8, 0, k), aperture: 1.0 }}
        cards={allCards((g) => (g === IM ? { reveal } : { borders: 0, op: 0.35, mode: (t > click ? "tday" : "diff") as Mode }))}
        overlay={<div style={{ position: "absolute", left: atmC.x - L.col / 2 - 2, top: atmC.y - L.row / 2 - 2, width: L.col + 4, height: L.row + 4, borderRadius: 3, border: "1.5px solid #fff", opacity: focus, boxShadow: "0 0 10px rgba(255,255,255,0.6)" }} />} />
      <Floating op={1 - sm(t, 24.9, 25.4)} label={t > click ? "今" : "差"} borders={false} ring={[0, pulse(t, click)]} />
      <Label op={sm(t, 25.5, 26.0)}>
        {`${IM.p.name} ${m0.exp.slice(2)} 平值  ${m0.tday[3].toFixed(2)}   日差 `}<span style={{ color: ad > 0 ? "#ff5964" : "#2ee59d" }}>{ad.toFixed(2)}</span>
      </Label>
    </AbsoluteFill>
  );
};

/* ---------------- 8 · 标的及平值隐波分时走势 (CtnPopoverPanel → UnderlyingSeriesContent) ---------------- */
const IP = (() => {
  const px = INTRADAY.map((r) => r.price), iv = INTRADAY.map((r) => r.atmv).filter((v): v is number => v !== null), oi = INTRADAY.map((r) => r.oi);
  return { pMin: Math.min(...px), pMax: Math.max(...px), vMin: Math.min(...iv), vMax: Math.max(...iv), oMin: Math.min(...oi), oMax: Math.max(...oi) };
})();
const LegendItem: React.FC<{ c: string; l: string }> = ({ c, l }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, marginRight: 22 }}>
    <span style={{ width: 22, height: 3, background: c, borderRadius: 2 }} />
    <span style={{ color: D.mutedFg }}>{l}</span>
  </span>
);
export const ShotIntraday: React.FC<{ t: number }> = ({ t }) => {
  const click = 27.75;
  const open = io(t, 28.0, 28.6);
  const draw = io(t, 28.55, 31.2);
  const PW = 1500, PH = 800, cw = 1300, ch = 560, x0 = 110, y0 = 150;
  const n = INTRADAY.length;
  const X = (i: number) => x0 + (cw * i) / (n - 1);
  const band = (v: number, a: number, b: number, top: number, bot: number) => bot - ((v - a) / (b - a || 1)) * (bot - top);
  const pY = (v: number) => band(v, IP.pMin, IP.pMax, y0 + 10, y0 + ch - 20);
  const vY = (v: number) => band(v, IP.vMin, IP.vMax, y0 + 10, y0 + ch - 20);
  const path = (f: (i: number) => number | null) => {
    let d = "";
    let pen = false;
    for (let i = 0; i < n; i++) { const y = f(i); if (y === null) { pen = false; continue; } d += `${pen ? "L" : "M"}${X(i).toFixed(1)},${y.toFixed(1)}`; pen = true; }
    return d;
  };
  const pricePath = path((i) => pY(INTRADAY[i].price));
  const ivPath = path((i) => (INTRADAY[i].atmv === null ? null : vY(INTRADAY[i].atmv as number)));
  const last = INTRADAY[n - 1];
  const ticksX = [0, 60, 120, 180, n - 1];
  const tickP = [0, 1, 2, 3].map((j) => IP.pMin + ((IP.pMax - IP.pMin) * j) / 3);
  const tickV = [0, 1, 2, 3].map((j) => IP.vMin + ((IP.vMax - IP.vMin) * j) / 3);
  const push = io(t, 29.0, T.s9);
  return (
    <AbsoluteFill>
      <Wall cam={{ cx: IMc.x + 40, cy: IMc.y - 20, z: lerpLog(3.0, 2.6, sm(t, T.s8, 28.6)), tilt: 4, aperture: 0.8 }} cards={allCards((g) => ({ mode: "tday" as Mode, op: g === IM ? 1 : 0.6 }))} dim={0.55 * open}
        overlay={<div style={{ position: "absolute", left: PILL.x - PILL.w / 2 - 3, top: PILL.y - PILL.h / 2 - 3, width: PILL.w + 6, height: PILL.h + 6, borderRadius: 14, border: "2px solid #fff", opacity: pulse(t, click), boxShadow: "0 0 16px rgba(255,255,255,0.7)" }} />} />
      {open > 0.01 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", perspective: 1800 }}>
          <div style={{ width: PW, height: PH, background: "#0a0a0a", border: `1px solid ${D.border}`, borderRadius: 16, opacity: open, transform: `translateY(${(1 - open) * 30}px) rotateX(${lerp(8, 2, push)}deg) scale(${lerp(0.94, 1, open) * lerp(1, 1.08, push)})`, boxShadow: "0 40px 120px rgba(0,0,0,0.8)", position: "relative", fontFamily: SANS }}>
            <div style={{ position: "absolute", top: 34, width: "100%", textAlign: "center", fontSize: 26, fontWeight: 600, color: D.fg }}>{IM.p.name} {m0.exp.slice(2)}</div>
            <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center", fontSize: 19 }}>
              <LegendItem c="#47B3FF" l="标的价格" /><LegendItem c="#A259FF" l="平值隐波" />
            </div>
            <svg width={PW} height={PH} style={{ position: "absolute", inset: 0 }}>
              <defs><clipPath id="drawclip"><rect x={0} y={0} width={x0 + cw * draw + 1} height={PH} /></clipPath></defs>
              {tickP.map((v, j) => <line key={j} x1={x0} x2={x0 + cw} y1={pY(v)} y2={pY(v)} stroke={D.border} strokeDasharray="4 4" />)}
              {tickP.map((v, j) => <text key={`p${j}`} x={x0 - 12} y={pY(v) + 6} fill={D.mutedFg} fontSize={17} textAnchor="end" fontFamily={MONO}>{v.toFixed(0)}</text>)}
              {tickV.map((v, j) => <text key={`v${j}`} x={x0 + cw + 12} y={vY(v) + 6} fill={D.mutedFg} fontSize={17} fontFamily={MONO}>{v.toFixed(2)}</text>)}
              {ticksX.map((i) => <text key={`x${i}`} x={X(i)} y={y0 + ch + 34} fill={D.mutedFg} fontSize={17} textAnchor="middle" fontFamily={MONO}>{INTRADAY[i].time.slice(11, 16)}</text>)}
              <line x1={x0} x2={x0 + cw} y1={y0 + ch} y2={y0 + ch} stroke={D.mutedFg} strokeOpacity={0.6} />
              <g clipPath="url(#drawclip)">
                <path d={`${pricePath}L${X(n - 1)},${y0 + ch}L${X(0)},${y0 + ch}Z`} fill="#47B3FF" fillOpacity={0.1} />
                <path d={pricePath} fill="none" stroke="#47B3FF" strokeWidth={3} />
                <path d={ivPath} fill="none" stroke="#A259FF" strokeWidth={3} />
              </g>
              {draw > 0.995 ? (
                <g opacity={sm(t, 31.2, 31.7)} fontFamily={MONO} fontSize={20}>
                  <circle cx={X(n - 1)} cy={pY(last.price)} r={5} fill="#47B3FF" />
                  <circle cx={X(n - 1)} cy={vY(last.atmv ?? IP.vMin)} r={5} fill="#A259FF" />
                  <text x={X(n - 1) - 14} y={pY(last.price) - 14} fill="#47B3FF" textAnchor="end">{last.price.toFixed(1)}  {last.change}</text>
                  {last.atmv !== null ? <text x={X(n - 1) - 14} y={vY(last.atmv) + 30} fill="#A259FF" textAnchor="end">{last.atmv.toFixed(2)}</text> : null}
                </g>
              ) : null}
            </svg>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

/* ---------------- E/F · 波动率曲面详情 (VolatilityPopoverPanel, real echarts UI) ---------------- */
const NW = 820; // native popup width (px in the product), scaled up as a whole
const TCW = NW - 2 * 12 - 2 * 8, TCH = 190, SCH = 230;
const RAW0 = rawExpiry(m0.exp);
const SMAX = RAW0.theovol_tday.filter(([k]) => k >= RAW0.display_strike[0] && k <= RAW0.display_strike[1]).reduce((b, p) => (p[1] > b[1] ? p : b), [0, -Infinity] as [number, number]);
const SMILE_FULL = renderVolChart(RAW0, { today: 1, yday: 1, fwd: 1, oi: 1, quotes: 0 }, NW - 24 - 2, SCH, true);
const qz = (v: number) => Math.round(v * 30) / 30;
const Ring: React.FC<{ x: number; y: number; op: number; text: string; color: string }> = ({ x, y, op, text, color }) => (
  <div style={{ position: "absolute", left: 0, top: 0, opacity: op, pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: x - 9, top: y - 9, width: 18, height: 18, borderRadius: "50%", border: "1.5px solid #fff", boxShadow: "0 0 8px rgba(255,255,255,0.6)" }} />
    <div style={{ position: "absolute", left: x + 14, top: y - 26, fontFamily: FONT, fontSize: 13, fontWeight: 600, color, whiteSpace: "nowrap", background: "rgba(24,24,24,0.85)", padding: "1px 5px", borderRadius: 4 }}>{text}</div>
  </div>
);
export const ShotSurface: React.FC<{ t: number }> = ({ t }) => {
  const click = 33.35;
  const open = io(t, 33.55, 34.1);
  const tDraw = qz(io(t, 34.1, 35.1)), tOi = qz(sm(t, 34.4, 35.2));
  const hk = sm(t, 35.5, 36.0);
  const term = renderTerm(tDraw, tOi, qz(hk), TCW, TCH);
  const push = io(t, T.s10, 39.7);
  const sr = { today: qz(io(t, 39.3, 40.5)), yday: qz(io(t, 39.5, 40.6)), fwd: qz(sm(t, 39.4, 39.9)), oi: qz(sm(t, 39.6, 40.4)), quotes: 0 };
  const smile = renderVolChart(RAW0, sr, NW - 24 - 2, SCH);
  const sk = sm(t, 40.9, 41.4);
  const isSmile = t >= T.s10;
  const [hx, hy] = term.px(TERM[TERM_HI].dte, TERM[TERM_HI].tday);
  const [sx, sy] = SMILE_FULL.px(SMAX[0], SMAX[1]);
  const SC = isSmile ? lerp(1.5, 1.72, push) : 1.72;
  const drift = sm(t, 33.55, T.s10);
  return (
    <AbsoluteFill>
      <Wall cam={{ cx: IMc.x, cy: IMc.y + 30, z: 2.6, tilt: 4, aperture: 0.8 }} cards={allCards((g) => ({ mode: "tday" as Mode, op: g === IM ? 1 : 0.6 }))} dim={0.65 * open}
        overlay={<div style={{ position: "absolute", left: IM.x + L.pad + L.label - 3, top: IM.y + L.pad + L.head + 5 + L.header - 3, width: IM.p.months.length * L.col + 6, height: 8 * L.row + 6, borderRadius: 4, border: "2px solid #fff", opacity: pulse(t, click), boxShadow: "0 0 16px rgba(255,255,255,0.7)" }} />} />
      {open > 0.01 ? (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div style={{ width: NW - 24, boxSizing: "border-box", fontFamily: FONT, color: DARK.text, opacity: open, transformOrigin: "50% 50%", transform: `translateY(${(1 - open) * 20}px) scale(${SC * lerp(0.96, 1, open) * (isSmile ? 1 : lerp(1, 1.04, drift))})`, }}>
            {/* TermStructurePanel */}
            {!isSmile ? (<div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, background: DARK.popover, padding: "8px 8px" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}><PillTabs items={["期货", "平值隐波", "偏度"]} active={1} /></div>
              <TermTable hl={TERM_HI} hk={hk} />
              <div style={{ position: "relative", height: TCH, marginTop: 6 }}>
                <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: term.svg }} />
                <Ring x={hx} y={hy} op={hk} text={`${TERM[TERM_HI].exp.slice(2)}  ${TERM[TERM_HI].tday.toFixed(2)}`} color={DARK.ivText} />
              </div>
            </div>) : null}
            {isSmile ? (<div>
              <SmileCard d={RAW0} chart={smile} width={NW - 24} chartHeight={SCH}>
                <Ring x={sx} y={sy} op={sk} text={`${SMAX[0].toFixed(0)}  ${SMAX[1].toFixed(2)}`} color={DARK.ivText} />
              </SmileCard>
            </div>) : null}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
