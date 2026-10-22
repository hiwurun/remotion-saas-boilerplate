import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { SANS } from "../shared/fonts";
import { Card, Mode, Reveal, StaticCard } from "./Card";
import { CARD_H, cardW, cellCenter, GRID, L, parseProducts, Placed } from "./data";
import { D, withA } from "./styles";
import * as echarts from "echarts";
import { buildVolChartOption, DARK, type RawExpiry } from "../openvlab-surf/model/vol-chart";
import imSurfaceClose from "./data/volatility-surface-IM-close.json";
import cloudClose from "./data/surfacemap-close.json";

/** Shots 5–13 of the 58s cut. Every value drawn comes from data/*.json. */
export const W = 1920, H = 1080;
const jb = loadFont("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
const MONO = `${jb}, "PingFang SC", "Noto Sans SC", monospace`;
export const T = { s4: 10.66, s5: 15.44, s6: 20.65, s7: 31.28, end: 33.98 };

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
export const GW = Math.max(...GRID.map((g) => g.x + g.w)), GH = Math.max(...GRID.map((g) => g.y + CARD_H));
const mainM = (p: Placed["p"]) => p.months.find((m) => m.exp === p.exp) ?? p.months[0];
const FALL_DIFF = GRID.map((g) => mainM(g.p)?.diff[3]).filter((v): v is number => Number.isFinite(v));
const FALLING = new Set(GRID.filter((g) => (mainM(g.p)?.diff[3] ?? 0) < 0).map((g) => g.p.code));
const N_ALL = FALL_DIFF.length;
/* ---------------- A · 哪些品种隐波下跌？ ---------------- */
const FALL_LIST = GRID.filter((g) => FALLING.has(g.p.code)).map((g) => ({ code: g.p.code, name: g.p.name, d: mainM(g.p).diff[3] })).sort((a, b) => a.d - b.d);
const FALL_T0 = 15.9, FALL_DT = 0.07; // item i lights at FALL_T0 + i * FALL_DT (≈ 2.4s for 32)
const fallAt = new Map(FALL_LIST.map((f, i) => [f.code, FALL_T0 + i * FALL_DT]));
/** frozen end-state of the wall (all 84 lit/dimmed as at the end of the list), IM excluded; rendered once, moved by one transform */
const FROZEN_Z = 0.4;
const FrozenWall = React.memo(() => (
  <div style={{ position: "absolute", left: 0, top: 0, zoom: FROZEN_Z } as React.CSSProperties}>
    {GRID.filter((g) => g.p.code !== "MO").map((g) => (
      <div key={g.p.code} style={{ position: "absolute", left: g.x, top: g.y, width: g.w, height: CARD_H, opacity: FALLING.has(g.p.code) ? 1 : 0.2 }}>
        <StaticCard pl={{ ...g, x: 0, y: 0 }} borders={0} />
      </div>
    ))}
  </div>
));
const IM_WALL = GRID.find((g) => g.p.code === "MO")!;
const ImPair = React.memo(({ xf }: { xf: number }) => (
  <>
    <div style={{ position: "absolute", left: -IM_WALL.w / 2, top: -CARD_H / 2, width: IM_WALL.w, height: CARD_H }}><StaticCard pl={{ ...IM_WALL, x: 0, y: 0 }} borders={0} /></div>
    {xf > 0 ? <div style={{ position: "absolute", left: -LH.w / 2, top: -CARD_H / 2, width: LH.w, height: CARD_H, opacity: xf }}><StaticCard pl={{ ...LH, x: 0, y: 0 }} borders={0} /></div> : null}
  </>
));
export const ShotFall: React.FC<{ t: number }> = ({ t }) => {
  const PUSH = T.s6 - 2.1; // slow push-in onto the IM card, lands on ShotSpeed's opening frame
  const k = io(t, T.s5, PUSH);
  const dimK = sm(t, 15.5, 15.9);
  const im = IM_WALL;
  const imC = { x: im.x + im.w / 2, y: im.y + CARD_H / 2 };
  const zEnd = Math.min(1150 / LH.w, 600 / CARD_H); // = ShotSpeed sc0
  const z0 = lerpLog(0.38, FROZEN_Z, k);
  const n = FALL_LIST.filter((f) => t >= fallAt.get(f.code)!).length;
  const rows = Math.ceil(FALL_LIST.length / 2);
  let wall: React.ReactNode;
  if (t < PUSH) {
    wall = (
      <AbsoluteFill style={{ transform: "translateX(-372px)" }}>
        <Wall cam={{ cx: GW * 0.5, cy: GH * 0.5, z: z0, aperture: 0 }}
          cards={allCards((g) => { const ta = fallAt.get(g.p.code); return { borders: 0, op: ta === undefined ? 1 - 0.8 * dimK : 1 - 0.8 * dimK + 0.8 * sm(t, ta - 0.05, ta + 0.2) }; })} />
      </AbsoluteFill>
    );
  } else {
    const e = io(t, PUSH, T.s6); // in-out cubic: soft start, gentle settle
    const z = lerpLog(FROZEN_Z, zEnd, e);
    const s0 = { x: (imC.x - GW * 0.5) * FROZEN_Z - 372, y: (imC.y - GH * 0.5) * FROZEN_Z };
    const o = { x: s0.x * (1 - e), y: s0.y * (1 - e) }; // IM screen offset from centre: straight path
    const others = 1 - sm(t, PUSH, PUSH + 1.0);
    const xf = Math.round(sm(t, PUSH + 0.35, PUSH + 0.95) * 20) / 20; // quantised → ImPair memo re-renders ≤20×
    wall = (
      <AbsoluteFill>
        {others > 0.005 ? (
          <div style={{ position: "absolute", left: 0, top: 0, opacity: others, transformOrigin: "0 0", willChange: "transform, opacity", transform: `translate(${W / 2 + o.x - imC.x * z}px, ${H / 2 + o.y - imC.y * z}px) scale(${z / FROZEN_Z})` }}>
            <FrozenWall />
          </div>
        ) : null}
        <div style={{ position: "absolute", left: W / 2 + o.x, top: H / 2 + o.y, width: 0, height: 0, transformOrigin: "0 0", transform: `scale(${z})` }}>
          <ImPair xf={xf} />
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      {wall}
      <div style={{ position: "absolute", left: 1250, top: 210, width: 600, fontFamily: MONO, color: D.fg, opacity: sm(t, 15.5, 15.9) * (1 - sm(t, PUSH - 0.1, PUSH + 0.3)) }}>
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

/* ---------------- B · IM 2611: 7 cells → 2D smile (yesterday, then today) ---------------- */
/** swap point for new data: the surface JSON (/api/volatility-surface/<product> shape, {result:{[exp]:{...}}}) + expiry */
const SMILE_SRC: unknown = imSurfaceClose; // IM 2611 close snapshot (16:31:52)
/** card for this shot: closing cloud-map snapshot (15:29) — same parser as the main wall */
const CARD_SRC: unknown = cloudClose;
const SMILE_EXP = "202611";
const LH_P = parseProducts(CARD_SRC).find((p) => p.code === "MO")!;
const LH: Placed = { p: LH_P, x: 0, y: 0, w: cardW(LH_P), idx: 0 }; // 中证1000期货 (IM), closing card
const LH_M = LH.p.months[0];
const SMILE_X = ["20P", "30P", "40P", "50", "40C", "30C", "20C"];
/* IM 2611 surface (data/volatility-surface-IM.json = /api/volatility-surface/IM) */
type LhE = Record<string, unknown>;
const LH_E = (SMILE_SRC as { result: Record<string, LhE> }).result[SMILE_EXP];
const jp = (v: unknown): unknown => (typeof v === "string" ? JSON.parse(v.replace(/NaN/g, "null")) : v);
const prs = (k: string) => ((jp(LH_E[k]) as [number, number | string | null][]) ?? []).map(([a, b]) => [Number(a), b === "" || b == null ? NaN : Number(b)] as [number, number]).filter(([, b]) => Number.isFinite(b));
const LH_RAW: RawExpiry = {
  theovol_tday: prs("theovol_tday"), theovol_yday: prs("theovol_yday"),
  mktvol_tday_call_bid: [], mktvol_tday_call_ask: [], mktvol_tday_put_bid: [], mktvol_tday_put_ask: [],
  strike_poi_c: {}, strike_poi_p: {}, strike_oid_c: {}, strike_oid_p: {},
  display_strike: [6200, 7300], // zoomed to the 7 delta strikes (file display range is 6000–7700)
  forward_td: Number(LH_E.forward_td), forward_yd: Number(LH_E.forward_yd ?? (CARD_SRC as { result: Record<string, { exps: Record<string, { forward_yd?: string }> }> }).result.MO.exps[SMILE_EXP].forward_yd),
  atmvol_tday: Number(LH_E.atmvol_tday), atmvol_yday: Number(LH_E.atmvol_yday),
  days: Number(LH_E.days_to_expiry), expiry: "202611",
};
const lin = (pts: [number, number][], x: number) => {
  for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if ((x - x0) * (x - x1) <= 0 && x1 !== x0) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0); }
  return NaN;
};
/** strike for each card row: put rows from delta_tday_put (−0.2/−0.3/−0.4), 50 from call 0.5, call rows from delta_tday_call (0.4/0.3/0.2); monotone segment only */
const deltaPts = (k: string) => (k === "delta_tday_call" && LH_E.delta_tday_call == null ? prs("delta_tday_put").map(([x, d]) => [x, 1 + d] as [number, number]) : prs(k));
const strikeAtDelta = (k: string, d: number) => {
  const pts = deltaPts(k);
  for (let i = pts.length - 2; i >= 0; i--) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1]; if ((d - y0) * (d - y1) <= 0 && y1 !== y0) return x0 + ((x1 - x0) * (d - y0)) / (y1 - y0); }
  return NaN;
};
const ROW_K = [strikeAtDelta("delta_tday_put", -0.2), strikeAtDelta("delta_tday_put", -0.3), strikeAtDelta("delta_tday_put", -0.4), strikeAtDelta("delta_tday_call", 0.5), strikeAtDelta("delta_tday_call", 0.4), strikeAtDelta("delta_tday_call", 0.3), strikeAtDelta("delta_tday_call", 0.2)];
const CHW = 800, CHH = 560;
const SMILE = (() => {
  const opt = buildVolChartOption(LH_RAW, { today: 1, yday: 1, fwd: 1, oi: 0, quotes: 0 });
  opt.series = opt.series.slice(0, 2); // no OI bars, no quote markers
  opt.yAxis[1].show = false;
  const inX = (pp: [number, number][]) => pp.filter(([k]) => k >= 6200 && k <= 7300).map(([, v]) => v);
  const vs = [...inX(LH_RAW.theovol_tday), ...inX(LH_RAW.theovol_yday)];
  opt.yAxis[0].min = Math.floor((Math.min(...vs) - 0.3) * 2) / 2;
  opt.yAxis[0].max = Math.ceil((Math.max(...vs) + 0.3) * 2) / 2;
  opt.yAxis[0].scale = false;
  opt.yAxis[0].axisLabel = { ...opt.yAxis[0].axisLabel, formatter: (v: number) => `${v}%` };
  opt.grid = { ...opt.grid, right: "24px", top: "44px" };
  opt.legend.itemStyle = { opacity: 1 };
  const layer = (show: "axes" | "yday" | "tday") => {
    const o = JSON.parse(JSON.stringify(opt, (_k, v) => (typeof v === "function" ? undefined : v)));
    o.yAxis[0].axisLabel.formatter = opt.yAxis[0].axisLabel.formatter;
    o.legend.formatter = opt.legend.formatter;
    const hideAxes = () => { o.legend.show = false; o.xAxis[0].axisLabel.show = false; o.yAxis[0].axisLabel.show = false; o.yAxis[0].name = ""; };
    const off = (i: number) => { o.series[i].lineStyle.opacity = 0; o.series[i].showSymbol = false; }; // markers ride with their line
    if (show === "axes") { off(0); off(1); }
    if (show === "yday") { hideAxes(); off(0); delete o.series[0].markLine; }
    if (show === "tday") { hideAxes(); off(1); delete o.series[0].markLine; }
    const cc = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: CHW, height: CHH });
    cc.setOption(o);
    const out = cc.renderToSVGString();
    cc.dispose();
    return out;
  };
  const c = echarts.init(null, undefined, { renderer: "svg", ssr: true, width: CHW, height: CHH });
  c.setOption(opt);
  const svg = { axes: layer("axes"), yday: layer("yday"), tday: layer("tday") };
  const px = (k: number, v: number) => c.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [k, v]) as unknown as [number, number];
  const pts = ROW_K.map((k) => {
    const vt = lin(LH_RAW.theovol_tday, k), vy = lin(LH_RAW.theovol_yday, k);
    return { k, vt, vy, t: px(k, vt), y: Number.isFinite(vy) ? px(k, vy) : null };
  });
  c.dispose();
  return { svg, pts };
})();
const braceD = (p: { t: [number, number]; y: [number, number] | null }) => (p.y ? Math.min(10, Math.max(6, Math.abs(p.y[1] - p.t[1]) * 0.45)) : 0);
const brace = (x: number, y1: number, y2: number, d = 9) => {
  const ym = (y1 + y2) / 2;
  if (Math.abs(y2 - y1) < 16) { y1 = ym - 8; y2 = ym + 8; } // minimum visual size
  return `M${x},${y1} C${x - d},${y1} ${x},${ym} ${x - d},${ym} C${x},${ym} ${x - d},${y2} ${x},${y2}`;
};
export const ShotSpeed: React.FC<{ t: number }> = ({ t }) => {
  const t0 = T.s6;
  const pl: Placed = { ...LH, x: 0, y: 0 };
  const enter = 1; // no entrance: the card arrives via the push-in at the end of ShotFall (match cut)
  const fadeOut = sm(t, T.s7 - 1.45, T.s7 - 0.95); // chart, braces, connectors, highlights leave
  const back = io(t, T.s7 - 1.15, T.s7 - 0.1); // card returns to centre → ShotPull picks it up
  const slide = io(t, t0 + 2.55, t0 + 3.4) * (1 - back);
  const sc0 = Math.min(1150 / pl.w, 600 / CARD_H), sc1 = Math.min(560 / pl.w, 560 / CARD_H);
  const S = lerp(sc0 * lerp(0.96, 1, enter), sc1, slide);
  const ccx = lerp(W / 2, 400, slide), ccy = H / 2;
  const hiAt = (row: number) => t0 + 0.95 + (row - 1) * 0.22; // 20P..20C one by one
  const lit = (row: number) => sm(t, hiAt(row), hiAt(row) + 0.18);
  const reveal: Reveal = { cell: (mi, row) => (mi === 0 && row > 0 ? Math.min(1, 1 - 0.65 * sm(t, t0 + 0.35, t0 + 0.85) + 0.65 * lit(row)) : 1 - 0.8 * sm(t, t0 + 0.9, t0 + 1.3) * (1 - back)), outline: () => 0 };
  // chart panel (right)
  const PS = 1.28, PX = W - 60 - (CHW + 2) * PS, PY = (H - (CHH + 70) * PS) / 2;
  const chartIn = io(t, t0 + 2.9, t0 + 3.6);
  const drawY = io(t, t0 + 3.4, t0 + 4.2), drawT = io(t, t0 + 4.2, t0 + 5.0);
  const braceAt = (i: number) => t0 + 5.0 + i * 0.09;
  const lineAt = (i: number) => t0 + 5.4 + i * 0.29;
  const cellScreen = (row: number) => { const c = cellCenter(pl, 0, row); return { x: ccx + (c.x + L.col / 2 - pl.w / 2) * S, y: ccy + (c.y - CARD_H / 2) * S }; }; // start at the 2611 cell's right edge
  const conn = SMILE.pts.map((p, i) => {
    const a = cellScreen(i + 1);
    const bx = PX + PS * (1 + p.t[0] - (p.y ? 10 + braceD(p) : 8)), by = PY + PS * (58 + (p.y ? (p.t[1] + p.y[1]) / 2 : p.t[1]));
    const k = io(t, lineAt(i), lineAt(i) + 0.72);
    const mx = (a.x + bx) / 2;
    return { d: `M${a.x},${a.y} C${mx},${a.y} ${mx},${by} ${bx - 2},${by}`, k, a };
  });
  return (
    <AbsoluteFill>
      {/* card */}
      <div style={{ position: "absolute", left: ccx, top: ccy, width: 0, height: 0 }}>
        <div style={{ position: "absolute", left: -pl.w / 2, top: -CARD_H / 2, width: pl.w, height: CARD_H, transformOrigin: "50% 50%", transform: `translateY(${(1 - enter) * 40}px) scale(${S})`, opacity: enter }}>
          <Card pl={pl} reveal={reveal} borders={0} />
          {SMILE_X.map((_, i) => { const c = cellCenter(pl, 0, i + 1); const o = lit(i + 1) * (1 - fadeOut); return o > 0.01 ? <div key={i} style={{ position: "absolute", left: c.x - L.col / 2, top: c.y - L.row / 2, width: L.col, height: L.row, borderRadius: 3, border: "1px solid rgba(255,255,255,0.9)", opacity: o, boxSizing: "border-box" }} /> : null; })}
        </div>
      </div>
      {/* smile panel: VolChartCard-style surface */}
      {chartIn * (1 - fadeOut) > 0.01 ? (
        <div style={{ position: "absolute", left: PX, top: PY, width: CHW + 2, opacity: chartIn * (1 - fadeOut), transformOrigin: "0 0", transform: `translateX(${(1 - chartIn) * 40 + fadeOut * 30}px) scale(${PS})`, background: DARK.popover, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontFamily: SANS, color: DARK.text }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "16px 20px 0", height: 46, boxSizing: "border-box" }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>{LH.p.name} <span style={{ textDecoration: "underline", textUnderlineOffset: 3, fontWeight: 500 }}>{LH_M.exp.slice(2)}</span></span>
            <span style={{ fontSize: 13, color: DARK.muted }}>{String(LH_E.last_time)}</span>
          </div>
          <div style={{ position: "relative", height: CHH, marginTop: 12 }}>
            <div style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: SMILE.svg.axes }} />
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - drawY) * 100}% 0 0)` }} dangerouslySetInnerHTML={{ __html: SMILE.svg.yday }} />
            <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - drawT) * 100}% 0 0)` }} dangerouslySetInnerHTML={{ __html: SMILE.svg.tday }} />
          </div>
          <svg width={CHW} height={CHH} style={{ position: "absolute", left: 0, top: 58 }}>
            {SMILE.pts.map((p, i) => p.y ? <g key={i} opacity={sm(t, braceAt(i), braceAt(i) + 0.3)}><path d={brace(p.t[0] - 10, p.t[1] + 2, p.y[1] - 2, braceD(p))} fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /><path d={brace(p.t[0] - 10, p.t[1] + 2, p.y[1] - 2, braceD(p))} fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></g> : <circle key={i} cx={p.t[0]} cy={p.t[1]} r={8} fill="none" stroke="#fff" strokeOpacity={0.85} strokeWidth={1.4} opacity={sm(t, braceAt(i), braceAt(i) + 0.3)} />)}
          </svg>
        </div>
      ) : null}
      {/* connectors */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 1 - fadeOut }}>
        {conn.map((c, i) => c.k > 0 ? (
          <g key={i}>
            <path d={c.d} fill="none" stroke="#ffffff" strokeOpacity={0.14} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={`${c.k} 1`} />
            <path d={c.d} fill="none" stroke="#ffffff" strokeOpacity={0.95} strokeWidth={2.2} strokeLinecap="round" pathLength={1} strokeDasharray={`${c.k} 1`} />
            <circle cx={c.a.x} cy={c.a.y} r={7} fill="#fff" opacity={0.18} />
            <circle cx={c.a.x} cy={c.a.y} r={3.5} fill="#fff" />
          </g>
        ) : null)}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------------- C · pull back from the IM card to the whole cloud map (30.03 →): reverse of ShotFall's push-in ---------------- */
const PULL_Z = Math.min(1780 / GW, 1000 / GH); // whole wall, centred
const PULL_DUR = 1.6;
const imCtr = { x: IM_WALL.x + IM_WALL.w / 2, y: IM_WALL.y + CARD_H / 2 };
const pullState = (t: number) => {
  const e = io(t, T.s7, T.s7 + PULL_DUR);
  const z = lerpLog(Math.min(1150 / LH.w, 600 / CARD_H), PULL_Z, e);
  const o = { x: (imCtr.x - GW / 2) * PULL_Z * e, y: (imCtr.y - GH / 2) * PULL_Z * e }; // IM screen offset from centre: straight path to its slot
  return { e, z, o };
};
/** all 83 other cards, rendered once at the panorama scale (layer only ever scales ≤ 1 → crisp), premounted before the cut */
const PANO = GRID.filter((g) => g.p.code !== "MO").map((g) => ({ g, local: { ...g, x: 0, y: 0 } })); // stable props → StaticCard memo holds
const PanoWall = React.memo(({ n }: { n: number }) => (
  <div style={{ position: "absolute", left: 0, top: 0, zoom: PULL_Z } as React.CSSProperties}>
    {PANO.slice(0, n).map(({ g, local }) => (
      <div key={g.p.code} style={{ position: "absolute", left: g.x, top: g.y, width: g.w, height: CARD_H }}>
        <StaticCard pl={local} borders={0} />
      </div>
    ))}
  </div>
));
export const PullWallLayer: React.FC<{ t: number }> = ({ t }) => {
  const { z, o } = pullState(t);
  const op = sm(t, T.s7 + 0.25, T.s7 + 1.25);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: op, visibility: op > 0 ? "visible" : "hidden", transformOrigin: "0 0", willChange: "transform, opacity", transform: `translate(${W / 2 + o.x - imCtr.x * z}px, ${H / 2 + o.y - imCtr.y * z}px) scale(${z / PULL_Z})` }}>
      <PanoWall n={Math.max(0, Math.min(PANO.length, Math.floor((t - (T.s7 - 2.6)) * 120)))} />
    </div>
  );
};
/** IM card (closing data, as in ShotSpeed) shrinking into its slot; wall stays clear, then fades to black into the lockup */
export const ShotPull: React.FC<{ t: number }> = ({ t }) => {
  const { z, o } = pullState(t);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: W / 2 + o.x, top: H / 2 + o.y, width: 0, height: 0, transformOrigin: "0 0", transform: `scale(${z})` }}>
        <ImPair xf={1} />
      </div>
      <AbsoluteFill style={{ background: "#000", opacity: sm(t, T.end - 0.55, T.end) }} />
    </AbsoluteFill>
  );
};
