import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, CLAMP, EASE_OUT, blurOf } from "../openvlab-market/theme";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { MONO, SANS } from "../shared/fonts";
import { SurfaceCanvas } from "./components/SurfaceCanvas";
import { SlicePanel, HoverTooltip } from "./components/SlicePanel";
import { VolChartCard, renderVolChart } from "./components/VolChart2D";
import { createLegendGradient, VOLATILITY_STOPS } from "./constants";
import { DATASET, EXPIRIES, LAST_TIME, NEAR, PRODUCT, PRODUCT_NAME, PROTECT_FAR, PROTECT_NEAR, PROTECT_STRIKE, TERM_FIRST, fmt, rawExpiry } from "./data";
import { buildSurfaceSliceData, getSurfaceVolAt } from "./model/surface-model";
import { FPS, H, TOTAL, W, cameraAt, cameraKeys, fadeWin, prog, sec } from "./timeline";
import type { SceneState } from "./surface3d";
import { projectWith } from "./surface3d";

const M = DATASET.mappings;
const NEAR_Z = M.daysToZ(NEAR.days);
const COL_X = M.strikeToX(PROTECT_STRIKE);
const PEAK_PT = new THREE.Vector3(COL_X, M.volToY(PROTECT_NEAR.vol), NEAR_Z);
const KEYS = cameraKeys(NEAR_Z, COL_X, PEAK_PT);
const RAW = rawExpiry(NEAR.exp);
const ATM_NEAR = TERM_FIRST.vol;
const IVC = "#B98AE6"; // --vlab-iv (dark) oklch(0.74 0.12 300)
const AMBER = "#F7931A"; // openvlab.cn brand amber
const AMBER_HI = "#FFB454";
const GAP = PROTECT_NEAR.vol - PROTECT_FAR.vol;

/* ---- the one idea: the 2D「今日波动率」curve IS the surface's nearest-expiry row ---- */
const CW = 1000;
const CH = 400;
const CARD_H = 536; // card box height (padding + title + header + chart + border), scaled from its bottom edge
const CARD_SCALE = 1.2;
const CARD_BOTTOM = 800; // card spans ~157–800 → clear of the product label (top-left) and the caption
const CARD_TOP = CARD_BOTTOM - CARD_H;
const CHART_CAP_Y = 860;
const LINE_CHART = renderVolChart(RAW, { today: 1, yday: 1, fwd: 1, oi: 1, quotes: 1 }, CW, CH, true);
const [DISP_LO, DISP_HI] = RAW.display_strike;
const LINE_PTS = RAW.theovol_tday.filter(([k]) => k >= DISP_LO && k <= DISP_HI);
const NEAR_ROW = DATASET.rows.find((r) => r.days === NEAR.days)!;
const ROW_LO = NEAR_ROW.strikes[0]!;
const ROW_HI = NEAR_ROW.strikes[NEAR_ROW.strikes.length - 1]!;
const EDGE_FRAC = Math.min(1, Math.max(0, (Math.min(DISP_HI, ROW_HI) - ROW_LO) / Math.max(1, ROW_HI - ROW_LO)));
const LAND_AT = 15.95;

/* ---- example: virtual hover cursor path (strike, days) ---- */
const EX = { appear: 28.6, toStrike: [29.0, 30.4] as const, toFar: [33.8, 37.2] as const, out: 40.8 };
const DAYS = DATASET.days;
const hoverAt = (f: number) => {
  const a = prog(f, EX.toStrike[0], EX.toStrike[1]);
  const b = prog(f, EX.toFar[0], EX.toFar[1]);
  const strike = NEAR.forward + (PROTECT_STRIKE - NEAR.forward) * a;
  const days = NEAR.days + (PROTECT_FAR.days - NEAR.days) * b;
  return { strike, days, vol: getSurfaceVolAt(strike, days, DATASET), b };
};
/** fraction of the term tube (polyline through the expiries) reached at `days` */
const termFrac = (days: number) => {
  const i = DAYS.findIndex((d) => d >= days);
  if (i <= 0) return 0;
  return (i - 1 + (days - DAYS[i - 1]!) / (DAYS[i]! - DAYS[i - 1]!)) / (DAYS.length - 1);
};

/* ---- ending: surface silhouette → V of the logo ---- */
const MARK = 240;
const MARK_CX = W / 2;
const MARK_CY = 360;
const V_PATH =
  "M665.6 393.846154c-19.692308-3.938462-39.384615-3.938462-59.076923 7.876923-19.692308 7.876923-35.446154 19.692308-47.261539 31.507692-3.938462 7.876923-7.876923 11.815385-11.815384 19.692308-3.938462 7.876923 0 15.753846 7.876923 15.753846h3.938461c7.876923 0 15.753846 0 23.63077 7.876923 11.815385 11.815385 15.753846 27.569231 7.876923 43.323077-7.876923 19.692308-15.753846 35.446154-27.569231 55.138462-15.753846 19.692308-23.630769 27.569231-31.507692 31.507692-7.876923 3.938462-11.815385-3.938462-15.753846-11.815385-7.876923-15.753846-11.815385-31.507692-15.753847-47.261538-7.876923-27.569231-15.753846-70.892308-19.692307-98.461539 0-15.753846-7.876923-31.507692-15.753846-43.323077-7.876923-11.815385-23.630769-15.753846-35.446154-11.815384-23.630769 7.876923-43.323077 19.692308-59.076923 35.446154-15.753846 15.753846-31.507692 27.569231-47.261539 43.323077-3.938462 3.938462-3.938462 11.815385 0 15.753846 3.938462 3.938462 11.815385 7.876923 15.753846 3.938461 3.938462-3.938462 11.815385-3.938462 15.753846-7.876923 3.938462-3.938462 19.692308-11.815385 27.569231 7.876923s11.815385 43.323077 23.630769 78.769231c11.815385 43.323077 19.692308 63.015385 27.569231 86.646154 3.938462 19.692308 15.753846 39.384615 31.507693 55.138461 15.753846 11.815385 35.446154 15.753846 55.138461 7.876924 23.630769-15.753846 47.261538-35.446154 66.953846-55.138462 43.323077-39.384615 78.769231-90.584615 102.4-145.723077 15.753846-27.569231 19.692308-59.076923 15.753846-90.584615-3.938462-11.815385-19.692308-31.507692-39.384615-35.446154z";
const N_MORPH = 240;
type P = { x: number; y: number };
const resample = (pts: P[], n: number): P[] => {
  const seg: number[] = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i % pts.length]!;
    seg.push(seg[i - 1]! + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = seg[seg.length - 1]!;
  const out: P[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (k / n) * total;
    while (j < pts.length - 1 && seg[j + 1]! < t) j++;
    const a = pts[j]!;
    const b = pts[(j + 1) % pts.length]!;
    const u = (t - seg[j]!) / Math.max(1e-9, seg[j + 1]! - seg[j]!);
    out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  }
  return out;
};
let vCache: P[] | null = null;
/** V glyph sampled in screen pixels at its final place inside the logo mark (logo.svg: translate(-18 -42) scale(1.07) · scale(0.5)) */
const vPoints = (): P[] => {
  if (vCache) return vCache;
  if (typeof document === "undefined") return [];
  const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
  el.setAttribute("d", V_PATH);
  const len = el.getTotalLength();
  const k = MARK / 512;
  const raw: P[] = [];
  for (let i = 0; i < 600; i++) {
    const p = el.getPointAtLength((i / 600) * len);
    raw.push({ x: MARK_CX - MARK / 2 + (1.07 * 0.5 * p.x - 18) * k, y: MARK_CY - MARK / 2 + (1.07 * 0.5 * p.y - 42) * k });
  }
  vCache = resample(raw, N_MORPH);
  return vCache;
};
/** split the V outline at its left-most and right-most points into two edges, each resampled to one point per strike column */
const openResample = (pts: P[], n: number): P[] => {
  const seg: number[] = [0];
  for (let i = 1; i < pts.length; i++) seg.push(seg[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  const total = seg[seg.length - 1]!;
  const out: P[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const t = (k / (n - 1)) * total;
    while (j < pts.length - 2 && seg[j + 1]! < t) j++;
    const u = (t - seg[j]!) / Math.max(1e-9, seg[j + 1]! - seg[j]!);
    out.push({ x: pts[j]!.x + (pts[j + 1]!.x - pts[j]!.x) * u, y: pts[j]!.y + (pts[j + 1]!.y - pts[j]!.y) * u });
  }
  return out;
};
let vShapeCache: SceneState["vShape"] = null;
const vShape = (): SceneState["vShape"] => {
  if (vShapeCache) return vShapeCache;
  const ring = vPoints();
  if (!ring.length) return null;
  let iL = 0;
  let iR = 0;
  ring.forEach((p, i) => {
    if (p.x < ring[iL]!.x) iL = i;
    if (p.x > ring[iR]!.x) iR = i;
  });
  const walk = (a: number, b: number) => {
    const out: P[] = [];
    for (let i = a; ; i = (i + 1) % ring.length) {
      out.push(ring[i]!);
      if (i === b) break;
    }
    return out;
  };
  const e1 = walk(iL, iR);
  const e2 = walk(iR, iL).reverse();
  const n = DATASET.strikes.length;
  const avgY = (e: P[]) => e.reduce((m, p) => m + p.y, 0) / e.length;
  // row 0 (nearest expiry, the surface's lower edge from the front) takes the lower edge of the ribbon
  const [lo, hi] = avgY(e1) > avgY(e2) ? [e1, e2] : [e2, e1];
  vShapeCache = { lo: openResample(lo, n), hi: openResample(hi, n), w: W, h: H };
  return vShapeCache;
};

const END = { morph: [41.6, 44.5] as const, color: [43.0, 44.5] as const, disc: [43.6, 44.4] as const, mark: [44.35, 44.75] as const, glOut: [44.65, 44.95] as const, word: [44.7, 45.5] as const, take: 45.7, tag: 46.7 };

const sceneState = (f: number): SceneState => {
  // opening macro uses the finished surface; it then hides until the chart curve lands on it
  const opening = f < sec(4.8);
  const surf = opening ? 1 - prog(f, 3.9, 4.6) : (f >= sec(LAND_AT) ? 1 : 0) * (1 - prog(f, END.glOut[0], END.glOut[1]));
  const fan = opening ? 1 : prog(f, 15.7, 18.8, (x) => x);
  const vm = prog(f, END.morph[0], END.morph[1]);
  // one bright thing per shot: in the example the surface steps back behind the cursor + slices
  const dim = 0.7 * fadeWin(f, 28.2, 41.2, 0.8);
  const h = hoverAt(f);
  return {
    camera: cameraAt(f, KEYS),
    fan,
    hookDays: NEAR.days,
    surfaceOpacity: surf * (1 - 0.4 * dim),
    // no wire until rows actually exist (the collapsed grid would read as a stray hairline)
    wireOpacity: surf * Math.min(1, fan * 4) * (1 - 0.75 * dim) * (1 - prog(f, END.morph[0], END.morph[0] + 1.2)),
    colorSweep: 1,
    dim,
    axisStrike: fadeWin(f, 19.7, 22.0, 0.4),
    axisDays: fadeWin(f, 22.2, 25.0, 0.4),
    axisVol: fadeWin(f, 25.2, 28.0, 0.4),
    axisOi: 0,
    grid: (opening ? 0.6 : prog(f, 16.5, 18.5)) * (1 - prog(f, 40.6, 42.0)),
    vMorph: vm,
    vColor: prog(f, END.color[0], END.color[1]),
    vShape: vm > 0 ? vShape() : null,
    smileDays: NEAR.days,
    smileDraw: 0,
    smileAlpha: 0,
    // thin slice along the protection strike, drawn exactly as far as the cursor has travelled
    termDraw: termFrac(h.days),
    termAlpha: fadeWin(f, EX.toFar[0], EX.out, 0.4),
    hookAlpha: opening ? 0 : surf * (1 - prog(f, 18.4, 19.2)),
    // the edge only extends past the chart window together with the surface growing under it
    edgeDraw: EDGE_FRAC + (1 - EDGE_FRAC) * prog(f, 15.8, 17.2),
    peak: 0,
    oiGrow: 0,
    glow: 0,
  };
};

const Headline: React.FC<{ f: number; a: number; b: number; text: React.ReactNode; sub?: string; y?: number; size?: number }> = ({ f, a, b, text, sub, y = 900, size = 64 }) => {
  const p = prog(f, a, a + 0.6, EASE_OUT);
  const out = prog(f, b - 0.4, b);
  const o = p * (1 - out);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, width: W, top: y, transform: `translateY(${(1 - p) * 18 - out * 14}px)`, opacity: o, filter: blurOf((1 - p) * 10 + out * 6), display: "flex", flexDirection: "column", alignItems: "center", gap: 18, fontFamily: SANS }}>
      <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap" }}>{text}</div>
      {sub ? <div style={{ fontSize: 30, fontWeight: 400, color: C.muted, whiteSpace: "nowrap", letterSpacing: "0.01em" }}>{sub}</div> : null}
    </div>
  );
};

const smoothPath = (pts: P[]) => {
  if (pts.length < 2) return "";
  let d = `M${pts[0]!.x.toFixed(2)},${pts[0]!.y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!;
    const k = 0.25 / 1.5;
    d += ` C${(p1.x + (p2.x - p0.x) * k).toFixed(2)},${(p1.y + (p2.y - p0.y) * k).toFixed(2)} ${(p2.x - (p3.x - p1.x) * k).toFixed(2)},${(p2.y - (p3.y - p1.y) * k).toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
};

/** persistent brand-style product label, top-left */
const ProductLabel: React.FC<{ o: number }> = ({ o }) =>
  o <= 0 ? null : (
    <div style={{ position: "absolute", left: 64, top: 44, display: "flex", alignItems: "center", gap: 22, opacity: o, transform: `translateY(${(1 - o) * -10}px)`, fontFamily: SANS }}>
      <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.03em", color: C.ink, lineHeight: 1 }}>{PRODUCT}</div>
      <div style={{ width: 2, height: 56, background: `linear-gradient(${AMBER_HI}, ${AMBER})`, borderRadius: 1 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 28, fontWeight: 600, color: C.ink, lineHeight: 1 }}>{PRODUCT_NAME}</div>
        <div style={{ fontSize: 19, color: C.muted, fontFamily: MONO, lineHeight: 1 }}>{`${EXPIRIES.length} 个到期月 · ${NEAR.days}–${EXPIRIES[EXPIRIES.length - 1]!.days}天 · ${LAST_TIME.slice(0, 16)}`}</div>
      </div>
    </div>
  );

export const OpenVlabSurfVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (useCurrentFrame() * FPS) / fps;
  const state = useMemo(() => sceneState(f), [f]);
  const proj = (p: THREE.Vector3) => projectWith(state.camera, p, W, H);

  /* ---- 1 · hook: macro on the real surface (the 6000 / near-month ridge), slow dolly, shallow focus ---- */
  const hookOut = prog(f, 4.0, 4.6);
  const eyebrow = prog(f, 0.9, 1.6, EASE_OUT);
  const l1 = prog(f, 1.2, 2.0, EASE_OUT);
  const l2 = prog(f, 1.6, 2.4, EASE_OUT);
  const count = prog(f, 1.7, 3.0, EASE_OUT);
  const lift = prog(f, 0, 1.4, EASE_OUT);

  /* ---- 2 · product chart, 1:1 ---- */
  const cardIn = prog(f, 4.6, 5.5, EASE_OUT);
  const handoff = prog(f, 14.4, 15.1);
  const cardO = cardIn * (1 - handoff);
  const reveal = { today: prog(f, 6.8, 8.4), yday: prog(f, 8.8, 9.6), fwd: prog(f, 10.0, 10.6), oi: prog(f, 11.2, 12.2), quotes: prog(f, 12.8, 13.4) };
  const chart = cardO > 0 ? renderVolChart(RAW, reveal, CW, CH) : null;
  const cardScale = CARD_SCALE * interpolate(f, [sec(4.5), sec(14.67)], [0.985, 1.02], CLAMP);
  const cardTilt = interpolate(f, [sec(4.5), sec(10)], [6, 0], CLAMP);
  const morph = prog(f, 15.0, LAND_AT);
  const lineOn = f >= sec(14.4) && f < sec(LAND_AT);
  const cardLeft = W / 2 - (CW + 32) / 2;
  const curvePath = lineOn
    ? smoothPath(
        LINE_PTS.map(([k, v]) => {
          const [cx, cy] = LINE_CHART.px(k, v);
          const a = { x: W / 2 + cardScale * (cardLeft + 16 + cx - W / 2), y: CARD_BOTTOM - cardScale * (16 + CH - cy) };
          const b = proj(new THREE.Vector3(M.strikeToX(k), M.volToY(v) + 0.002, NEAR_Z));
          return { x: a.x + (b.x - a.x) * morph, y: a.y + (b.y - a.y) * morph };
        }),
      )
    : "";

  /* ---- 5 · example: hover cursor + the product's two slice panels ---- */
  const hv = hoverAt(f);
  const hoverO = fadeWin(f, EX.appear, EX.out, 0.4);
  const panelO = fadeWin(f, EX.appear + 0.3, EX.out, 0.5);
  const hoverInfo = { x: 0, y: 0, strike: hv.strike, daysToExpiry: hv.days, vol: hv.vol, putOi: null, callOi: null };
  const slice = hoverO > 0 ? buildSurfaceSliceData(DATASET, hoverInfo) : null;
  const hs = proj(new THREE.Vector3(M.strikeToX(hv.strike), M.volToY(hv.vol), M.daysToZ(hv.days)));

  /* ---- 7 · ending morph ---- */
  const disc = prog(f, END.disc[0], END.disc[1], EASE_OUT);
  const mark = prog(f, END.mark[0], END.mark[1]);
  const word = prog(f, END.word[0], END.word[1], EASE_OUT);
  const take = prog(f, END.take, END.take + 0.7, EASE_OUT);
  const tag = prog(f, END.tag, END.tag + 0.7, EASE_OUT);
  const labelO = fadeWin(f, 4.8, 41.4, 0.6);

  return (
    <AbsoluteFill style={{ background: "#050608", fontFamily: SANS, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(176,113,232,0.06) 0%, rgba(5,6,8,0) 70%)" }} />
      {/* logo disc (logo.svg minus the V) rises behind the canvas; the V itself is the surface */}
      {disc > 0 && f < sec(END.glOut[1]) ? (
        <div style={{ position: "absolute", left: MARK_CX - MARK / 2, top: MARK_CY - MARK / 2, opacity: disc, transform: `scale(${0.86 + 0.14 * disc})` }}>
          {/* glow hands over to the final mark's own glow so the two never stack */}
          <BrandMark size={MARK} src="openvlab-surf/logo-disc.svg" glow={disc * (1 - mark)} />
        </div>
      ) : null}
      {(f < sec(4.8) || f >= sec(15)) && f < sec(END.glOut[1]) ? <SurfaceCanvas state={state} width={W} height={H} /> : null}
      <AbsoluteFill style={{ pointerEvents: "none", background: "radial-gradient(ellipse 90% 85% at 50% 45%, rgba(5,6,8,0) 62%, rgba(5,6,8,0.6) 100%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 300, background: "linear-gradient(to bottom, rgba(5,6,8,0) 0%, rgba(5,6,8,0.8) 50%, rgba(5,6,8,0.95) 100%)" }} />

      {/* 1 · hook */}
      {f < sec(4.7) ? (
        <AbsoluteFill style={{ opacity: 1 - hookOut }}>
          {/* lens: fade up from black, shallow depth of field (blurred top + bottom bands), heavy vignette */}
          <AbsoluteFill style={{ background: "#050608", opacity: 1 - lift }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 380, backdropFilter: "blur(14px)", WebkitMaskImage: "linear-gradient(#000 0%, #000 35%, transparent 100%)", maskImage: "linear-gradient(#000 0%, #000 35%, transparent 100%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 420, backdropFilter: "blur(18px)", WebkitMaskImage: "linear-gradient(transparent 0%, #000 60%)", maskImage: "linear-gradient(transparent 0%, #000 60%)" }} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 70% at 58% 42%, rgba(5,6,8,0) 40%, rgba(5,6,8,0.85) 100%)" }} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(5,6,8,0.88) 0%, rgba(5,6,8,0.55) 32%, rgba(5,6,8,0) 58%)" }} />
          <div style={{ position: "absolute", left: 140, top: 560, display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "0.32em", color: AMBER_HI, opacity: eyebrow, transform: `translateY(${(1 - eyebrow) * 10}px)`, marginBottom: 34 }}>{`${PRODUCT} · ${PROTECT_STRIKE} 看跌`}</div>
            <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12, color: C.ink, opacity: l1, transform: `translateY(${(1 - l1) * 22}px)`, filter: blurOf((1 - l1) * 10) }}>同一份保护，</div>
            <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12, color: C.ink, opacity: l2, transform: `translateY(${(1 - l2) * 22}px)`, filter: blurOf((1 - l2) * 10), whiteSpace: "nowrap" }}>
              隐波差 <span style={{ fontFamily: MONO, fontWeight: 500, color: AMBER_HI }}>{(GAP * count).toFixed(2)}</span> 个点。
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      <ProductLabel o={labelO} />

      {/* 2 · the real product chart */}
      {chart && cardO > 0 ? (
        <div style={{ position: "absolute", inset: 0, perspective: 2200, perspectiveOrigin: "50% 20%" }}>
          <div style={{ position: "absolute", left: cardLeft, top: CARD_TOP, transformOrigin: "50% 100%", transform: `rotateX(${cardTilt}deg) scale(${cardScale})`, opacity: cardO, filter: blurOf((1 - cardIn) * 10 + handoff * 4), boxShadow: "0 40px 140px rgba(0,0,0,0.7)" }}>
            <VolChartCard d={RAW} title={`${PRODUCT} - 波动率曲线`} chart={chart} width={CW + 32} chartHeight={CH} />
          </div>
        </div>
      ) : null}
      {curvePath ? (
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <path d={curvePath} fill="none" stroke="#a21caf" strokeWidth={2.2 * cardScale} strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      ) : null}
      <Headline f={f} a={5.2} b={6.8} text="这是一条波动率曲线" y={CHART_CAP_Y} />
      <Headline f={f} a={6.9} b={8.7} text="紫线：今天的隐波" sub="越高，期权越贵" y={CHART_CAP_Y} />
      <Headline f={f} a={8.8} b={10.0} text="灰线：昨天的隐波" y={CHART_CAP_Y} />
      <Headline f={f} a={10.0} b={11.2} text={`蓝线：期货价格 ${RAW.forward_td}`} y={CHART_CAP_Y} />
      <Headline f={f} a={11.2} b={12.8} text="柱子：持仓量" sub="绿 = 看跌　红 = 看涨" y={CHART_CAP_Y} />
      <Headline f={f} a={12.8} b={14.3} text="C / P：真实的买卖报价" y={CHART_CAP_Y} />
      <Headline f={f} a={14.4} b={15.9} text="但这只是一个到期月。" y={CHART_CAP_Y} />

      {/* 3 · lift */}
      <Headline f={f} a={15.9} b={19.0} text={`${EXPIRIES.length} 个到期月依次铺开，就是一张曲面。`} />

      {/* 4 · axes */}
      <Headline f={f} a={19.2} b={22.0} text="左右：行权价" sub={`${DATASET.domain.minStrike} – ${DATASET.domain.maxStrike}`} />
      <Headline f={f} a={22.2} b={25.0} text="前后：到期时间" sub={`${DATASET.domain.minDays} – ${DATASET.domain.maxDays} 天`} />
      <Headline f={f} a={25.2} b={28.0} text="高度和颜色：隐波" />
      {(() => {
        const p = fadeWin(f, 25.4, 28.0, 0.4);
        return p > 0 ? <div style={{ position: "absolute", left: W / 2 - 220, top: 1010, width: 440, height: 6, borderRadius: 3, background: createLegendGradient(VOLATILITY_STOPS, "to right"), opacity: p, clipPath: `inset(0 ${(1 - prog(f, 23.6, 24.6)) * 100}% 0 0 round 3px)` }} /> : null;
      })()}

      {/* 5 · worked example: hover the surface like in the product */}
      {hoverO > 0 && slice ? (
        <>
          <div style={{ position: "absolute", left: hs.x - 9, top: hs.y - 9, width: 18, height: 18, borderRadius: 9, background: "#fff", boxShadow: `0 0 0 5px ${IVC}55, 0 0 24px ${IVC}`, opacity: hoverO }} />
          <svg width={30} height={40} viewBox="0 0 30 40" style={{ position: "absolute", left: hs.x + 6, top: hs.y + 6, opacity: hoverO, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))" }}>
            <path d="M2 2 L2 31 L9.5 24 L14.5 36 L19.5 34 L14.5 22.5 L25 22.5 Z" fill="#fff" stroke="#111" strokeWidth={1.6} strokeLinejoin="round" />
          </svg>
          <HoverTooltip x={hs.x + 44} y={hs.y - 150} o={hoverO} vol={hv.vol} strike={hv.strike} days={hv.days} color={IVC} scale={1.6} />
          <SlicePanel o={panelO} left={64} top={160} scale={1.9} color={IVC} title={`波动率微笑（固定期限 = ${Math.round(hv.days)}天）`} points={slice.smileSlice} xMin={slice.strikeMin} xMax={slice.strikeMax} yMin={slice.volMin} yMax={slice.volMax} hx={hv.strike} hy={hv.vol} xf={(v) => String(Math.round(v))} />
          <SlicePanel o={panelO} left={W - 64 - 240 * 1.9} top={160} scale={1.9} color={IVC} title={`期限结构（行权价 = ${Math.round(hv.strike)}）`} points={slice.termSlice} xMin={slice.daysMin} xMax={slice.daysMax} yMin={slice.volMin} yMax={slice.volMax} hx={hv.days} hy={hv.vol} xf={(v) => `${Math.round(v)}天`} />
        </>
      ) : null}
      <Headline f={f} a={28.2} b={30.6} text={`你持有 ${PRODUCT} 多头，想买 ${PROTECT_STRIKE} 看跌做保护。`} size={56} />
      <Headline f={f} a={30.6} b={33.6} text="近月，很贵。" sub={`比平值高 ${fmt(PROTECT_NEAR.vol - ATM_NEAR)} 个点`} />
      <Headline f={f} a={33.6} b={37.6} text="同一个行权价，往远月走。" />
      <Headline f={f} a={37.6} b={40.8} text={<>远月便宜 <span style={{ color: AMBER_HI, fontFamily: MONO }}>{fmt(GAP)}</span> 个点。</>} sub="用时间，换便宜的保护" />

      {mark > 0 ? (
        <div style={{ position: "absolute", left: MARK_CX - MARK / 2, top: MARK_CY - MARK / 2, opacity: mark }}>
          <BrandMark size={MARK} src="openvlab-market/logo.svg" glow={mark} />
        </div>
      ) : null}
      {word > 0 ? <div style={{ position: "absolute", left: 0, width: W, top: MARK_CY + MARK / 2 + 28, textAlign: "center", fontSize: 112, fontWeight: 700, letterSpacing: "-0.045em", color: C.ink, lineHeight: "124px", opacity: word, transform: `translateY(${(1 - word) * 16}px)`, filter: blurOf((1 - word) * 8) }}>OpenVlab</div> : null}
      {take > 0 ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 700, textAlign: "center", fontSize: 48, fontWeight: 600, color: C.ink, opacity: take, transform: `translateY(${(1 - take) * 14}px)`, filter: blurOf((1 - take) * 6) }}>
          看懂曲面，就知道保护该买在哪里。
        </div>
      ) : null}
      {tag > 0 ? (
        <div style={{ position: "absolute", left: 0, width: W, top: 790, textAlign: "center", fontSize: 28, color: C.muted, opacity: tag, letterSpacing: "0.04em" }}>
          专业、极简、跨平台的期权行情与风险分析工具 · <span style={{ color: AMBER_HI }}>openvlab.cn</span>
        </div>
      ) : null}
      <Audio src={staticFile("openvlab-market/audio/bgm.mp3")} volume={(fr) => interpolate(fr, [0, sec(1), TOTAL - sec(3), TOTAL - sec(0.13)], [0, 0.5, 0.5, 0], CLAMP)} />
    </AbsoluteFill>
  );
};
