import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/JetBrainsMono";
import { SANS } from "../shared/fonts";
import { CLAMP } from "../openvlab-market/theme";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { CARD_H, GRID, L, Placed, Product, PRODUCTS } from "./data";
import { D, diffBg } from "./styles";
import { StaticCard } from "./Card";
import { GW, GH, ShotFall, ShotSpeed, T } from "./scenes";

/**
 * Shot-for-shot structure of Linear "Introducing Linear Releases" (29.0s).
 * Hard cuts snapped to BGM onsets measured from bgm-vlog-beat.mp3 (energy-flux peaks):
 * 8.78 · 10.66 · 15.44 · 22.11 · (text swap 23.36) · 26.69
 */
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const TOTAL = Math.round(35.49 * FPS);
const BGM = "openvlab-surf/bgm-vlog-beat.mp3";
const S = { s2: 4.78, s3: 8.78, s4: 10.66, s5: 15.44, s6: 30.03, s7: 32.74 };

const jb = loadFont("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;
const MONO = `${jb}, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", monospace`;
const WHITE = "#f5f5f5";
const GREEN = "#16c784", RED = "#ea3943", BLUE = "#60a5fa";

const outCubic = (t: number, a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return 1 - Math.pow(1 - x, 3); };
const io3 = (t: number, a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const smooth = (t: number, a: number, b: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const rnd = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
type V3 = { x: number; y: number; z: number };

/* ---------------- camera + depth of field ---------------- */
type Cam = { eye: V3; target: V3; f: number; aperture: number; focus?: number; az?: number; band?: number };
const mkProj = (c: Cam) => {
  const fw = norm(sub(c.target, c.eye));
  const r = c.az !== undefined ? { x: -Math.sin(c.az), y: 0, z: Math.cos(c.az) } : norm(cross(fw, { x: 0, y: 1, z: 0 }));
  const band = c.band ?? 0;
  const u = cross(r, fw);
  const zf = c.focus ?? len(sub(c.target, c.eye));
  return (p: V3) => {
    const d = sub(p, c.eye);
    const z = dot(d, fw);
    const s = c.f / Math.max(z, 1);
    return { X: W / 2 + dot(d, r) * s, Y: H / 2 - dot(d, u) * s, z, s, blur: Math.min(22, c.aperture * Math.max(0, Math.abs(z - zf) / Math.max(z, 1) - band)) };
  };
};
const sub = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V3, b: V3): V3 => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const len = (a: V3) => Math.sqrt(dot(a, a));
const norm = (a: V3): V3 => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l, z: a.z / l }; };
/** depth cue without filters: brightness (opacity) + slight size falloff */
const fo = (b: number) => 1 / (1 + 0.11 * b);
const fs_ = (b: number) => Math.max(0.82, 1 - 0.012 * b);

/* ---------------- flow-graph cards (local units, lie flat on y=0) ---------------- */
const CW = 1400, CH = 820, TB = 430, MERGE = 960, EXIT = 1170;
type Item = { label: string; col: string };
type CardDef = { id: string; ox: number; oz: number; title: string; tag: { dot: string; text: string }; exit: { label: string; sub: string }; lines: Item[][]; speed: number; grid?: boolean };

const tint = (v: number) => (v > 0 ? RED : v < 0 ? GREEN : WHITE);
const mainMonth = (p: Product) => p.months.find((m) => m.exp === p.exp) ?? p.months[0];
const atm = (p: Product) => mainMonth(p);

const atmIV = (p: Product) => atm(p)?.tday[3];
const prodItem = (p: Product): Item => {
  const v = atmIV(p);
  return { label: Number.isFinite(v) ? `${p.name} ${v.toFixed(2)}` : p.name, col: tint(atm(p)?.diff[3] ?? 0) };
};
/** interleave so neighbouring lines carry different sectors */
const MARKET_ITEMS: Item[] = PRODUCTS.map((p, i) => ({ p, k: rnd(i * 3 + 1) })).sort((a, b) => a.k - b.k).map(({ p }) => prodItem(p));
const chunk = (items: Item[], n: number) => Array.from({ length: n }, (_, l) => items.filter((_, i) => i % n === l));

const MKT_ATM = PRODUCTS.map(atmIV).filter(Number.isFinite);
const MKT_DIFF = PRODUCTS.map((p) => atm(p)?.diff[3]).filter((v): v is number => Number.isFinite(v));
const MARKET_CARD: CardDef = {
  id: "MKT", ox: 0, oz: 0, title: `全市场 · ${PRODUCTS.length} 个品种`,
  tag: { dot: BLUE, text: `隐波下跌 ${MKT_DIFF.filter((v) => v < 0).length}/${MKT_DIFF.length}` },
  exit: { label: "", sub: `ATM 均 ${(MKT_ATM.reduce((a, b) => a + b, 0) / MKT_ATM.length).toFixed(2)}` },
  lines: chunk(MARKET_ITEMS, 18), speed: 0.07, grid: true,
};
/* compact cloud-map grid on the right of the market card (real ATM IV, diff-coloured) */
const GX0 = 1010, GX1 = 1370, GY0 = 96, GY1 = 784, GC = 6;
const GR = Math.ceil(PRODUCTS.length / GC);
const GRID_CELLS = PRODUCTS.map((p, i) => {
  const cw = (GX1 - GX0) / GC, ch = (GY1 - GY0) / GR;
  const m = atm(p);
  return { a: GX0 + (i % GC) * cw, b: GY0 + Math.floor(i / GC) * ch, cw, ch, name: p.name, v: m?.tday[3], d: m?.diff[3] ?? NaN };
});
/** line l: bezier from the left edge into the merge point, then the shared trunk. */
const lineB0 = (l: number, n: number) => 90 + ((CH - 180) * (l + 0.5)) / n + (rnd(l + n) - 0.5) * 30;
const pathPt = (l: number, n: number, u: number) => {
  const b0 = lineB0(l, n);
  const ua = 0.8;
  if (u > ua) { const k = (u - ua) / (1 - ua); return { a: MERGE + (EXIT - MERGE) * k, b: TB }; }
  const s = u / ua, v = 1 - s;
  const P = [{ a: 70, b: b0 }, { a: 520, b: b0 }, { a: 700, b: TB + (b0 - TB) * 0.12 }, { a: MERGE, b: TB }];
  return { a: v * v * v * P[0].a + 3 * v * v * s * P[1].a + 3 * v * s * s * P[2].a + s * s * s * P[3].a, b: v * v * v * P[0].b + 3 * v * v * s * P[1].b + 3 * v * s * s * P[2].b + s * s * s * P[3].b };
};

type LayerOpts = { cardOp?: number; titleOp?: number; exitOp?: number };
/** plane-space flow-line samples are constant per card: build once */
const GEO = new Map<string, { lines: { a: number; b: number; g: number }[][]; trunk: { a: number; b: number; g: number }[] }>();
const lineGeo = (c: CardDef) => {
  let g = GEO.get(c.id);
  if (!g) {
    const n = c.lines.length, tEnd = c.grid ? GX0 - 8 : EXIT - 40;
    g = {
      lines: Array.from({ length: n }, (_, l) => Array.from({ length: 41 }, (_, i) => ({ ...pathPt(l, n, (i / 40) * 0.8), g: (i / 40) ** 1.5 * 0.85 }))),
      trunk: Array.from({ length: 21 }, (_, i) => ({ a: MERGE + ((tEnd - MERGE) * i) / 20, b: TB, g: 1 })),
    };
    GEO.set(c.id, g);
  }
  return g;
};
/** static market-grid tiles (84 × rect/rect/text/text): memoized so per-frame camera changes only touch the parent transform */
const GridTiles = React.memo(({ pad, gap, part }: { pad: number; gap: number; part: "bg" | "text" }) => {
  const cw = (GX1 - GX0) / GC, ch = (GY1 - GY0) / GR;
  return (
    <>
      {GRID_CELLS.map((g, i) => {
        const x = pad + (i % GC) * cw + gap / 2, y = pad + Math.floor(i / GC) * ch + gap / 2, w = cw - gap, h = ch - gap;
        if (part === "bg") {
          const k = Number.isFinite(g.d) ? Math.pow(Math.min(1, Math.abs(g.d) / 3), 0.7) : 0;
          const tint = !Number.isFinite(g.d) || g.d === 0 ? "#ffffff" : g.d > 0 ? "#ff5a64" : "#2fd88f";
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={h} rx={5} fill="#ffffff" fillOpacity={0.025} />
              <rect x={x} y={y} width={w} height={h} rx={5} fill={tint} fillOpacity={k ? 0.04 + 0.16 * k : 0} />
            </g>
          );
        }
        const units = [...g.name].reduce((n, c2) => n + (/[\u3000-\u9fff]/.test(c2) ? 1 : 0.62), 0);
        const fs = 12 * Math.min(1, 4.4 / units);
        return (
          <g key={i}>
            <text x={x + w / 2} y={y + h * 0.46} textAnchor="middle" fontFamily={SANS} fontWeight={500} fontSize={fs} fill="#f4f5f7" fillOpacity={0.94}>{g.name}</text>
            {Number.isFinite(g.v) ? <text x={x + w / 2} y={y + h * 0.46 + 15} textAnchor="middle" fontFamily={MONO} fontSize={10.5} fill="#ffffff" fillOpacity={0.5} style={{ fontVariantNumeric: "tabular-nums" }}>{(g.v as number).toFixed(2)}</text> : null}
          </g>
        );
      })}
    </>
  );
});
type Aff = [number, number, number, number, number, number];
const mulAff = (p: Aff, q: Aff): Aff => [p[0] * q[0] + p[2] * q[1], p[1] * q[0] + p[3] * q[1], p[0] * q[2] + p[2] * q[3], p[1] * q[2] + p[3] * q[3], p[0] * q[4] + p[2] * q[5] + p[4], p[1] * q[4] + p[3] * q[5] + p[5]];
const invAff = ([a, b, c, d, e, f]: Aff): Aff => { const k = a * d - b * c; return [d / k, -b / k, -c / k, a / k, (c * f - d * e) / k, (b * e - a * f) / k]; };
let GRID_END: Aff | null = null;
const gridEnd = (f: () => Aff) => (GRID_END ??= f());
const GridPanel = React.memo(({ m, bw, bh, pad, idx, exitQ }: { m: string; bw: number; bh: number; pad: number; idx: number; exitQ: number }) => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <g transform={`matrix(${m})`}>
      <defs><linearGradient id={`gp${idx}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#17181b" /><stop offset="1" stopColor="#0e0f11" /></linearGradient></defs>
      <rect width={bw} height={bh} rx={14} fill={`url(#gp${idx})`} stroke="#ffffff" strokeOpacity={0.1} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <line x1={14} x2={bw - 14} y1={0.75} y2={0.75} stroke="#ffffff" strokeOpacity={0.12} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <GridTiles pad={pad} gap={1.5} part="bg" />
      <g opacity={exitQ}><GridTiles pad={pad} gap={1.5} part="text" /></g>
    </g>
  </svg>
));
const CardLayer: React.FC<{ c: CardDef; cam: Cam; t: number; enter?: number; idx: number; o?: LayerOpts }> = ({ c, cam, t, enter = 1, idx, o = {} }) => {
  const { cardOp = 1, titleOp = 1, exitOp = 1 } = o;
  const P = mkProj(cam);
  const ox = c.ox - (1 - enter) * 2200, oz = c.oz + (1 - enter) * 1600;
  const W3 = (a: number, b: number): V3 => ({ x: ox + a, y: 0, z: oz + b });
  const op = Math.min(1, enter * 1.6);
  const bins: Record<number, React.ReactNode[]> = {};
  const push = (k: number, n: React.ReactNode) => { (bins[k] ??= []).push(n); };
  // card plane: one matte polygon (no blur → no murky bands)
  if (cardOp > 0.01) {
    const q = [W3(0, 0), W3(CW, 0), W3(CW, CH), W3(0, CH)].map(P);
    if (q.every((p) => p.z > 20)) push(0, <polygon key="card" points={q.map((p) => `${p.X},${p.Y}`).join(" ")} fill="#111111" fillOpacity={cardOp} />);
  }
  // lines: 2–4px core, faint glow, grey→white toward the convergence; chunked by blur level
  const n = c.lines.length;
  const drawPath = (pts: { a: number; b: number; g: number }[], w: number, key: string) => {
    const pr = pts.map((p) => ({ ...P(W3(p.a, p.b)), g: p.g }));
    let ri = 0;
    for (let i = 0; i + 1 < pr.length; i += 8) {
      const run = pr.slice(i, Math.min(pr.length, i + 9));
      if (run.some((p) => p.z < 20)) continue;
      const blur = run.reduce((a, p) => a + p.blur, 0) / run.length;
      const g = run.reduce((a, p) => a + p.g, 0) / run.length;
      const sw = Math.max(1.6, Math.min(w, (w * run.reduce((a, p) => a + p.s, 0)) / run.length));
      const d = run.map((p, j) => `${j ? "L" : "M"}${p.X.toFixed(1)},${p.Y.toFixed(1)}`).join("");
      const alpha = (0.3 + 0.7 * g) * (1 - smooth(blur, 6, 16) * 0.6) * fo(blur); // continuous depth cue (no bin steps / regrouping)
      push(0, <g key={`${key}-${ri++}`}><path d={d} fill="none" stroke="#ffffff" strokeOpacity={0.07 * alpha} strokeWidth={sw * 3} strokeLinecap="round" /><path d={d} fill="none" stroke="#ffffff" strokeOpacity={alpha} strokeWidth={sw} strokeLinecap="round" /></g>);
    }
  };
  const geo = lineGeo(c);
  geo.lines.forEach((pts, l) => drawPath(pts, 2.4, `l${l}`));
  drawPath(geo.trunk, 4, "trunk");
  let gridNode: React.ReactNode = null;
  if (c.grid) {
    // always mounted (opacity 0 before it fades in): mounting 84 tiles + text on the fade-in frame (~3.99s) caused a one-frame hitch
    // refined minimal grid: one panel (single vertical gradient, hairline edge) + flat tiles with hairline gaps; text in the same affine group → pixel-aligned
    const pad = 8, bw = GX1 - GX0 + 2 * pad, bh = GY1 - GY0 + 2 * pad;
    const affM = (PP: typeof P): Aff | null => {
      const o = PP(W3(GX0 - pad, GY0 - pad)), u = PP(W3(GX0 - pad + bw, GY0 - pad)), v = PP(W3(GX0 - pad, GY0 - pad + bh));
      if ([o, u, v].some((pp) => pp.z < 20)) return null;
      return [(u.X - o.X) / bw, (u.Y - o.Y) / bw, (v.X - o.X) / bh, (v.Y - o.Y) / bh, o.X, o.Y];
    };
    const m = affM(P);
    const mEnd = gridEnd(() => affM(mkProj(pullCam(8)))!);
    if (m) {
      // the grid is rasterised once at its final (top-down) screen geometry in its own GPU layer; each frame only the layer's
      // 2D transform (current affine ∘ final⁻¹) changes, so 84 tiles of text are not re-rasterised on every frame of the rotation
      const rel = mulAff(m, invAff(mEnd));
      const blur = P(W3(GX0 - pad + bw / 2, GY0 - pad + bh / 2)).blur;
      gridNode = (
        <div key="grid" style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", willChange: "transform", transform: `matrix(${rel.join(",")})`, opacity: cardOp * fo(blur), display: cardOp < 0.004 ? "none" : undefined }}>
          <GridPanel m={mEnd.join(",")} bw={bw} bh={bh} pad={pad} idx={idx} exitQ={Math.round(exitOp * 40) / 40} />
        </div>
      );
    }
  }

  // nodes + labels with greedy collision avoidance (sharpest first), title, tag, exit label
  const divs: React.ReactNode[] = [];
  const at = (a: number, b: number) => P(W3(a, b));
  const on = (p: ReturnType<typeof at>) => p.z > 30 && p.X > -300 && p.X < W + 300 && p.Y > -200 && p.Y < H + 200;
  type Cand = { key: string; p: ReturnType<typeof at>; label: string; col: string; o: number };
  const cands: Cand[] = [];
  c.lines.forEach((items, l) => {
    const K = 2;
    for (let j = 0; j < K; j++) {
      const raw = t * c.speed + j / K + rnd(l * 7 + idx) * 0.45;
      const u = raw - Math.floor(raw);
      const it = items[(Math.floor(raw) * K + j) % items.length];
      const q = pathPt(l, n, u * 0.8);
      const p = at(q.a, q.b);
      const oo = smooth(u, 0, 0.05) * (1 - smooth(u, 0.62, 0.78)) * (1 - smooth(p.blur, 5, 12));
      if (oo > 0.02 && on(p)) cands.push({ key: `q${l}-${j}`, p, label: it.label, col: it.col, o: oo });
    }
  });
  cands.sort((a, b) => a.p.blur - b.p.blur || a.key.localeCompare(b.key));
  const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
  const hit = (b: (typeof boxes)[number]) => boxes.some((o2) => b.x0 < o2.x1 && b.x1 > o2.x0 && b.y0 < o2.y1 && b.y1 > o2.y0);
  for (const cd of cands) {
    const { p } = cd;
    const sz = Math.max(4, Math.min(6, 5 * p.s * 0.8));
    const fs = Math.max(11, Math.min(17, 11 * p.s)) * fs_(p.blur);
    const tw = [...cd.label].reduce((a, ch) => a + (/[\u3000-\u9fff]/.test(ch) ? 1 : 0.62), 0) * fs;
    const sq = `color-mix(in srgb, ${cd.col} 18%, #ffffff)`;
    const dk = fo(p.blur);
    divs.push(<div key={cd.key} style={{ position: "absolute", left: p.X - sz / 2, top: p.Y - sz / 2, width: sz, height: sz, background: sq, opacity: cd.o * dk, boxShadow: "0 0 6px rgba(255,255,255,0.35)" }} />);
    // try right, top-right, upper, then give up (no overlaps)
    const tries = [{ dx: sz + 6, dy: -fs * 0.55 }, { dx: sz + 4, dy: -fs * 1.45 }, { dx: sz + 4, dy: -fs * 2.4 }];
    for (const tr of tries) {
      const b = { x0: p.X + tr.dx - 2, y0: p.Y + tr.dy - 2, x1: p.X + tr.dx + tw + 2, y1: p.Y + tr.dy + fs * 1.15 + 2 };
      if (!hit(b)) {
        boxes.push(b);
        divs.push(<div key={`${cd.key}t`} style={{ position: "absolute", left: b.x0 + 2, top: b.y0 + 2, fontFamily: MONO, fontSize: fs, lineHeight: 1.1, color: "#f5f5f5", opacity: 0.8 * cd.o * dk, whiteSpace: "nowrap" }}>{cd.label}</div>);
        break;
      }
    }
  }
  const tp = at(56, 66);
  if (titleOp > 0.01 && on(tp)) {
    const ts = Math.max(12, Math.min(34, 30 * tp.s));
    divs.push(
      <div key="title" style={{ position: "absolute", left: tp.X, top: tp.Y, opacity: titleOp * fo(tp.blur), display: "flex", alignItems: "center", gap: ts * 0.6, transform: "translateY(-50%)", whiteSpace: "nowrap" }}>
        <span style={{ fontFamily: MONO, fontStyle: "italic", fontSize: ts, color: "#8a8a8a", letterSpacing: ts * 0.06 }}>{c.title.toUpperCase()}</span>
        <span style={{ display: "flex", alignItems: "center", gap: ts * 0.3, border: "1px solid #2a2a2a", borderRadius: ts, padding: `${ts * 0.15}px ${ts * 0.45}px`, fontFamily: MONO, fontSize: ts * 0.62, color: "#d4d4d4" }}>
          <span style={{ width: ts * 0.28, height: ts * 0.28, borderRadius: "50%", background: c.tag.dot, boxShadow: `0 0 ${ts * 0.3}px ${c.tag.dot}` }} />
          {c.tag.text}
        </span>
      </div>,
    );
  }
  const ep = at(EXIT + 4, TB);
  if (!c.grid && exitOp > 0.01 && on(ep)) {
    const es = Math.max(12, Math.min(26, 22 * ep.s));
    divs.push(
      <div key="exit" style={{ position: "absolute", left: ep.X, top: ep.Y, opacity: exitOp * fo(ep.blur), transform: "translateY(-50%)", whiteSpace: "nowrap", fontFamily: MONO }}>
        <div style={{ fontSize: es, color: WHITE, letterSpacing: es * 0.05 }}>{c.exit.label}</div>
        <div style={{ fontSize: es * 0.68, color: "#8a8a8a", marginTop: es * 0.25 }}>{c.exit.sub}</div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <g>{bins[0]}</g>
      </svg>
      {gridNode}
      {divs}
    </AbsoluteFill>
  );
};

/* ---------------- shot cameras ---------------- */
const F0 = 1150;
type K = { t: number; x: number; y: number; z: number; rx: number; ry: number; rz: number };
const makeCam = (keys: K[]) => (t: number) => {
  const n = keys.length - 1;
  const at = (f: (k: K) => number) => {
    if (t <= keys[0].t) return f(keys[0]);
    if (t >= keys[n].t) return f(keys[n]);
    let i = 0;
    while (keys[i + 1].t < t) i++;
    const a = keys[i], b = keys[i + 1], dt = b.t - a.t;
    const sl = (j: number) => (f(keys[j + 1]) - f(keys[j])) / (keys[j + 1].t - keys[j].t);
    const tan = (j: number) => {
      if (j <= 0 || j >= n) return 0;
      const d0 = sl(j - 1), d1 = sl(j);
      if (d0 * d1 <= 0) return 0; // local extremum / flat neighbour → stop there
      return (2 * d0 * d1) / (d0 + d1); // harmonic mean → monotone, never overshoots
    };
    const s = (t - a.t) / dt, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * f(a) + (s3 - 2 * s2 + s) * dt * tan(i) + (-2 * s3 + 3 * s2) * f(b) + (s3 - s2) * dt * tan(i + 1);
  };
  return { x: at((k) => k.x), y: at((k) => k.y), z: Math.exp(at((k) => Math.log(k.z))), rx: at((k) => k.rx), ry: at((k) => k.ry), rz: at((k) => k.rz) };
};
/** Shots 1–2: one continuous pullback. Target (card-local a,b), distance (log), elevation, azimuth via Hermite keys. */
const PULL = makeCam([
  { t: 0, x: 300, y: 450, z: 230, rx: 16, ry: -16, rz: 46 },
  { t: 2.5, x: 520, y: 440, z: 330, rx: 21, ry: -22, rz: 30 },
  { t: 4.5, x: 640, y: 428, z: 540, rx: 46, ry: -58, rz: 9 },
  { t: 6.3, x: 682, y: 418, z: 833, rx: 88.5, ry: -90, rz: 0 },
  { t: 8.0, x: 682, y: 418, z: 833, rx: 88.5, ry: -90, rz: 0 },
]);
const pullCam = (t: number): Cam => {
  const k = PULL(Math.min(t, 8.0));
  const el = (k.rx * Math.PI) / 180, az = (k.ry * Math.PI) / 180;
  const fw = { x: Math.cos(el) * Math.cos(az), y: -Math.sin(el), z: Math.cos(el) * Math.sin(az) };
  const target = { x: k.x, y: 0, z: k.y };
  const eye = { x: target.x - fw.x * k.z, y: -fw.y * k.z, z: target.z - fw.z * k.z };
  return { eye, target, f: F0, aperture: Math.max(0, k.rz), band: 0.1, az };
};
/* ---------------- shots 4–5: real cloud-map product cards (Card.tsx = VolatilityGrid replica) ---------------- */
const BLUR_Q = [0, 1.5, 3.5, 7, 12];
const qBlur = (b: number) => BLUR_Q.reduce((best, v) => (Math.abs(v - b) < Math.abs(best - b) ? v : best), 0);
const STREAM = PRODUCTS.slice(0, 40).map((p, i): Placed => ({ p, x: 0, y: 0, w: GRID.find((g) => g.p === p)!.w, idx: i }));
const SF = 1300, ZF = 1150;
/** far-away LOD: same card silhouette + heat cells, no text (text is illegible at this size and is the main raster cost) */
const LodCard = React.memo(({ pl }: { pl: Placed }) => (
  <svg width={pl.w} height={CARD_H} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={0.5} y={0.5} width={pl.w - 1} height={CARD_H - 1} rx={6} fill={D.card} stroke={D.border} />
    <rect x={L.pad} y={L.pad} width={pl.w - 2 * L.pad} height={28} rx={4} fill={D.muted} fillOpacity={0.2} />
    <rect x={L.pad + 6} y={L.pad + 9} width={Math.min(60, pl.w * 0.3)} height={10} rx={2} fill={D.fg} fillOpacity={0.5} />
    {pl.p.months.map((m, mi) => m.diff.slice(0, 7).map((v, k) => (
      <rect key={`${mi}-${k}`} x={L.pad + L.label + mi * L.col + 1} y={L.pad + L.head + 5 + L.header + (k + 1) * L.row + 1} width={L.col - 2} height={L.row - 2} rx={2} fill={m.ready ? diffBg(v) : D.notReadyBg} />
    )))}
  </svg>
));
/** opening stream unchanged; from TILE_T each card gradually flattens into its wall tile, then the tiled wall shrinks onto ShotFall's layout (z 0.38, shifted −372px) at S.s5 */
const TILE_T = 12.9;
const GRID_OF = new Map(GRID.map((g) => [g.p.code, g]));
const IN_STREAM = new Set(STREAM.map((s) => s.p.code));
const CardStream: React.FC<{ t: number }> = ({ t }) => {
  const zk = io3(t, TILE_T + 0.7, S.s5 - 0.1);
  const zW = Math.exp(Math.log(0.62) + (Math.log(0.38) - Math.log(0.62)) * zk), shift = -372 * zk;
  const tile = (code: string) => { const g = GRID_OF.get(code)!; return { X: W / 2 + shift + (g.x + g.w / 2 - GW / 2) * zW, Y: H / 2 + (g.y + CARD_H / 2 - GH / 2) * zW }; };
  const items: React.ReactNode[] = [];
  // wall cards that were never in the stream fade in at their tiles (behind)
  const others = io3(t, TILE_T + 0.3, TILE_T + 1.3);
  if (others > 0) for (const g of GRID) {
    if (IN_STREAM.has(g.p.code)) continue;
    const { X, Y } = tile(g.p.code);
    if (X + g.w * zW < 0 || X - g.w * zW > W || Y + CARD_H * zW < 0 || Y - CARD_H * zW > H) continue;
    items.push(
      <div key={g.p.code} style={{ position: "absolute", left: 0, top: 0, opacity: others, transform: `translate(${X}px, ${Y}px) scale(${zW}) translate(-50%, -50%)`, transformOrigin: "0 0", width: g.w, height: CARD_H }}>
        <StaticCard pl={{ ...g, x: 0, y: 0 }} borders={0} />
      </div>,
    );
  }
  for (let i = STREAM.length - 1; i >= 0; i--) {
    const te = S.s4 + 0.05 + i * 0.07;
    const k = outCubic(t, te, te + 0.95);
    if (k <= 0) continue;
    const dz = (t - S.s4) * 55;
    const x = -300 + i * 92 - (1 - k) * 260, y = -110 + i * 52 - (1 - k) * 160, z = 520 + i * 95 - (1 - k) * 380 - dz;
    const pl = STREAM[i];
    const bt = TILE_T + (i / STREAM.length) * 0.6; // gradual: front cards first
    const b = io3(t, bt, bt + 1.1);
    if (b <= 0 && z < 120) continue;
    const sc0 = SF / Math.max(z, 120);
    const X0 = W / 2 + x * sc0, Y0 = H / 2 - y * sc0;
    const tt = tile(pl.p.code);
    const sc = Math.exp(Math.log(sc0) + (Math.log(zW) - Math.log(sc0)) * b);
    const X = X0 + (tt.X - X0) * b, Y = Y0 + (tt.Y - Y0) * b;
    if (sc < 0.15 || X + pl.w * sc < -100 || X - pl.w * sc > W + 100 || Y - CARD_H * sc > H + 100 || Y + CARD_H * sc < -100) continue;
    const bl = qBlur(Math.min(12, (1.7 * Math.max(0, ZF - z)) / Math.max(z, 120))) * (1 - b);
    const rot = 1 - b;
    items.push(
      <div key={pl.p.code} style={{ position: "absolute", left: 0, top: 0, opacity: b > 0 ? 1 : Math.min(1, k * 2), transform: `translate(${X}px, ${Y}px) scale(${sc}) perspective(1400px) rotateX(${10 * rot}deg) rotateY(${-9 * rot}deg) translate(-50%, -50%)`, transformOrigin: "0 0", willChange: "transform", width: pl.w, height: CARD_H }}>
        {sc < 0.75 && b < 0.5 ? <LodCard pl={pl} /> : <StaticCard pl={pl} borders={b > 0 ? 0 : undefined} />}
        {bl > 0.05 ? <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#000", opacity: 1 - fo(bl) }} /> : null}
      </div>,
    );
  }
  return <AbsoluteFill>{items}</AbsoluteFill>;
};
/** zero-width caret slot so the line width never changes */
const Caret: React.FC<{ o: number }> = ({ o }) => (
  <span style={{ display: "inline-block", width: 0, height: 50, position: "relative" }}><span style={{ position: "absolute", left: 10, top: 0, width: 26, height: 50, background: WHITE, opacity: o }} /></span>
);
/* ---------------- shot 2 → 3: the market card turns away like a page (hinge on the left edge), revealing the title beneath ---------------- */
const FLIP = { t0: 8.78, t1: 9.4 };
const PageTurn: React.FC<{ t: number }> = ({ t }) => {
  const x = Math.max(0, Math.min(1, (t - FLIP.t0) / (FLIP.t1 - FLIP.t0)));
  const e = x * x * (2.2 - 1.2 * x); // lifts gently, then accelerates through the turn
  const ang = 100 * e;
  if (x >= 1 || ang >= 90) return null; // edge-on → gone (no back face); title is already flat underneath
  return (
    <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "0% 50%" }}>
      <AbsoluteFill style={{ transformOrigin: "0% 50%", transform: `rotateY(${ang}deg)`, backfaceVisibility: "hidden", background: "#000", willChange: "transform" }}>
        {/* page = the last frame of the market shot (camera is locked from 8s) */}
        <CardLayer c={MARKET_CARD} cam={pullCam(8)} t={FLIP.t0} idx={0} o={{ cardOp: 1, titleOp: 1, exitOp: 1 }} />
        <AbsoluteFill style={{ background: "#000", opacity: 0.65 * e }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
const Typed: React.FC<{ text: string; t: number; t0: number; cps: number; soft?: boolean }> = ({ text, t, t0, cps, soft }) => {
  const n = Math.min(text.length, Math.floor((t - t0) * cps) + 1);
  const on = n < text.length || Math.floor((t - t0) * 2.4) % 2 === 0;
  const cur = soft ? smooth(t, t0 - 0.35, t0) : 1; // cursor eases in before the first glyph
  return (
    <div style={{ fontFamily: MONO, fontSize: 46, color: WHITE, letterSpacing: 6, display: "flex", alignItems: "center", whiteSpace: "pre" }}>
      {soft ? null : text.slice(0, n)}
      {soft ? [...text].map((ch, i) => {
        // constant line width (no re-centring jumps): glyphs fade + rise in place, cursor rides after the last shown glyph
        const k = smooth(t, t0 + i / cps, t0 + i / cps + 0.28);
        const g = <span key={i} style={{ display: "inline-block", opacity: k, transform: `translateY(${(1 - k) * 8}px)` }}>{ch}</span>;
        return i === Math.max(0, n) ? [<Caret key="c" o={(on ? 1 : 0) * cur} />, g] : g;
      }) : null}
      {soft && n >= text.length ? <Caret o={(on ? 1 : 0) * cur} /> : null}
      {soft ? <span style={{ display: "inline-block", width: 36 }} /> : <span style={{ display: "inline-block", width: 26, height: 50, marginLeft: 6, background: WHITE, opacity: on ? 1 : 0 }} />}
    </div>
  );
};

export const OpenVlabCloudVideo: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  let body: React.ReactNode = null;
  if (t < S.s3) body = <CardLayer c={MARKET_CARD} cam={pullCam(t)} t={t} idx={0} o={{ cardOp: smooth(t, 3.9, 5.4), titleOp: smooth(t, 4.2, 5.2), exitOp: smooth(t, 4.8, 6.0) }} />;
  else if (t < S.s4)
    body = (
      <AbsoluteFill>
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}><div style={{ fontFamily: MONO, fontSize: 46, color: WHITE, letterSpacing: 8 }}>一屏看完全市场隐波</div></AbsoluteFill>
        <PageTurn t={t} />
      </AbsoluteFill>
    );
  else if (t < S.s5) body = <CardStream t={t} />;
  else if (t < T.s6) body = <ShotFall t={t} />;
  else if (t < T.s7) body = <AbsoluteFill style={{ opacity: 1 - smooth(t, T.s7 - 0.5, T.s7) }}><ShotSpeed t={t} /></AbsoluteFill>;
  else if (t < S.s7)
    body = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {Array.from({ length: 34 }).map((_, i) => {
          const x = (rnd(i) * W + (t - S.s6) * (6 + rnd(i + 9) * 10)) % W;
          const y = (rnd(i + 3) * H - (t - S.s6) * (3 + rnd(i + 5) * 6) + H) % H;
          const s = 1 + rnd(i + 2) * 1.6;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#fff", opacity: (0.18 + rnd(i + 4) * 0.35) * (1 - smooth(t, S.s7 - 0.45, S.s7)) }} />;
        })}
        <div style={{ opacity: 1 - smooth(t, S.s7 - 0.45, S.s7), transform: `translateY(${-6 * smooth(t, S.s7 - 0.45, S.s7)}px)` }}><Typed text="波动率云图" t={t} t0={S.s6 + 0.45} cps={6} soft /></div>
      </AbsoluteFill>
    );
  else
    body = (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 24, opacity: smooth(t, S.s7, S.s7 + 0.6), transform: `translateY(${8 * (1 - smooth(t, S.s7, S.s7 + 0.7))}px)` }}>
        <BrandMark size={66} src="openvlab-market/logo.svg" />
        <div style={{ fontFamily: SANS, fontSize: 54, fontWeight: 600, color: WHITE, letterSpacing: -0.5 }}>OpenVlab</div>
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill
      style={{
        background: "#000",
        overflow: "hidden",
        scale: 1.005
      }}
    >
      <Audio src={staticFile(BGM)} volume={(f) => interpolate(f, [0, 0.8 * FPS, TOTAL - 1.6 * FPS, TOTAL - 1], [0, 0.8, 0.8, 0], CLAMP)} />
      {body}
    </AbsoluteFill>
  );
};
