import React from "react";
import { Easing } from "remotion";
import { CameraState, worldToScreen } from "../../shared/components/Camera";
import { EASE, EASE_OUT } from "../../shared/motion";
import { MONO } from "../../shared/fonts";
import { Caption } from "../components/Caption";
import { Cursor } from "../components/Cursor";
import { DateSlider } from "../components/DateSlider";
import { MetricsBar } from "../components/MetricsBar";
import { Panel } from "../components/Panel";
import { CellFx, ProfitTable } from "../components/ProfitTable";
import { StrategyChart, X_DOMAIN_END, X_DOMAIN_START, contentToWorld, makeScales } from "../components/StrategyChart";
import { ATM_ROW, MODEL } from "../data";
import { CONTENT, TABLE, TOGGLE, colW, colX, nativeToWorld, rowY } from "../layout";
import { C, THIN } from "../tokens";
import { DTE0 } from "../model/model";
import { easeIO, fadeWin, lerp, ramp } from "../timeline";
import { B, HOOK, HOPS, mo } from "../beats";

/**
 * v6 app stage (GLOBAL frames, HOOK..B.lift): table walk on the 6550 row -> two brackets -> conclusion ->
 * 表格/曲线 morph -> slider sweep -> seller flip -> 1-day band push-in -> question -> unflip (End.tsx takes the V from B.lift).
 */

const T = MODEL.timeline;
const ROW = MODEL.table[ATM_ROW];
const FIRST = 2; // first date column
const W = 1920;
const H = 1080;
const PX = 1.5; // native -> world

/* ---------------------------------------------------------------- data (all from the model) */
const R = ROW.map((v) => Math.round(v));
const FIRST_WEEK = R[0] - R[5]; // 7,617
const LAST3 = R[13] - R[17]; // 11,027
const P_DROP = 6550 * 0.99; // 6484.5 (−1 %)
const P_UP = 6550 * 1.01; // 6615.5
const SELL_1D = -MODEL.profit(6550, 1); // +32,718
const SELL_1D_DROP = -MODEL.profit(P_DROP, 1); // +29,150
const SELL_0 = -MODEL.profit(6550, 0); // +37,260
const LAST_DAY = SELL_0 - SELL_1D; // 4,542
const DROP = SELL_1D - SELL_1D_DROP; // 3,568

const fmt = (v: number) => Math.abs(Math.round(v)).toLocaleString("en-US");
/** signed with a true minus sign */
const fmtS = (v: number) => {
  const r = Math.round(v);
  return r === 0 ? "0" : `${r < 0 ? "\u2212" : "+"}${fmt(r)}`;
};
const pnlColor = (v: number) => (v > 0.5 ? C.red : v < -0.5 ? C.green : C.mutedFg);

/* ---------------------------------------------------------------- slider / curve state */
/** dte at a fractional timeline index (piecewise linear between the table columns) */
const idxToDte = (x: number) => {
  const i = Math.max(0, Math.min(T.length - 1.000001, x));
  const k = Math.floor(i);
  return lerp(T[k].dte, T[Math.min(T.length - 1, k + 1)].dte, i - k);
};
const SWEEP_E = Easing.bezier(0.3, 0, 0.7, 1);
export const dteAt = (f: number) => {
  if (f < B.sweep[0]) return DTE0;
  if (f < B.sweep[1]) return idxToDte((T.length - 1) * mo(f, B.sweep, SWEEP_E));
  if (f < B.back1d[0]) return 0;
  if (f < B.unflip[0]) return lerp(0, 1, mo(f, B.back1d));
  return lerp(1, 0, mo(f, B.unflip));
};
/** seller sign: 1 = buyer view, −1 = mirrored about zero */
export const signAt = (f: number) => 1 - 2 * mo(f, B.flip) + 2 * mo(f, B.unflip);
const domAt = (f: number) => {
  const p = mo(f, [B.sweep[0], B.sweep[0] + 128]);
  return [lerp(X_DOMAIN_START[0], X_DOMAIN_END[0], p), lerp(X_DOMAIN_START[1], X_DOMAIN_END[1], p)] as const;
};
const SC_END = makeScales(X_DOMAIN_END[0], X_DOMAIN_END[1]);

/* ---------------------------------------------------------------- camera (world, 1:1 = {960,540,1}) */
const ONE: CameraState = { x: 960, y: 540, scale: 1 };
const ROW_Y = rowY(ATM_ROW) + TABLE.rowH / 2; // content-native
const ATM_WORLD_Y = nativeToWorld(0, CONTENT.y + ROW_Y).y;
const TABLE_CAM: CameraState = { x: 960, y: ATM_WORLD_Y + 6, scale: 1.2 };
const PUSH_CAM: CameraState = (() => {
  const p = contentToWorld({ x: SC_END.x(6545), y: SC_END.y(31500) });
  return { x: p.x, y: p.y, scale: 3.3 };
})();
const camLerp = (a: CameraState, b: CameraState, t: number): CameraState => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), t)),
});
export const stageCamera = (f: number): CameraState => {
  if (f < B.camOut[0]) return camLerp(ONE, TABLE_CAM, mo(f, B.camIn));
  if (f < B.push[0]) return camLerp(TABLE_CAM, ONE, mo(f, B.camOut));
  if (f < B.pull[0]) return camLerp(ONE, PUSH_CAM, mo(f, B.push));
  return camLerp(PUSH_CAM, ONE, mo(f, B.pull));
};
const toScreen = (nx: number, ny: number, cam: CameraState) => worldToScreen(contentToWorld({ x: nx, y: ny }), cam, W, H);

/* ---------------------------------------------------------------- table walk */
const cellCX = (c: number) => colX(c) + colW(c) / 2;
const ROW_X0 = cellCX(FIRST);
const ROW_X1 = cellCX(FIRST + T.length - 1);
const FROM_PTS = Array.from({ length: 181 }, (_, i) => ({ x: lerp(ROW_X0, ROW_X1, i / 180), y: ROW_Y }));

const hopProgress = (f: number) => {
  let h = 0;
  for (let k = 1; k < HOPS.length; k++) h += ramp(f, HOPS[k] - Math.min(9, HOPS[k] - HOPS[k - 1]), HOPS[k], EASE);
  return h;
};
/** walk decorations leave together with the table when 曲线 is clicked */
const walkOut = (f: number) => 1 - ramp(f, B.click - 6, B.click + 16, easeIO);

const BR_Y = rowY(ATM_ROW + 1) + 6; // bracket line (content-native)
const BR_FS = 20; // bracket label font (native)
const BR_LABEL_Y = BR_Y + 14; // label top
const BR_LABEL_H = 30;
const BRACKETS = [
  { a: 0, b: 5, w: B.br1, head: "第一周：少了 ", v: FIRST_WEEK },
  { a: 13, b: 17, w: B.br2, head: "最后三天：少了 ", v: LAST3 },
] as const;
const BR_LABEL_W = [218, 236]; // approx label widths (native) for clamping
const brLabelCX = (i: number) => {
  const br = BRACKETS[i];
  const cx = (cellCX(FIRST + br.a) + cellCX(FIRST + br.b)) / 2;
  return Math.min(CONTENT.w - BR_LABEL_W[i] / 2 - 4, Math.max(BR_LABEL_W[i] / 2 + 4, cx));
};
/** label centre in content-native */
const brLabelC = (i: number) => ({ x: brLabelCX(i), y: BR_LABEL_Y + BR_LABEL_H / 2 });

const WalkOverlay: React.FC<{ f: number }> = ({ f }) => {
  const out = walkOut(f);
  const dimIn = mo(f, B.dim);
  const dim = 0.6 * dimIn * out;
  if (dim <= 0.001) return null;
  const top0 = rowY(0);
  const atmTop = rowY(ATM_ROW);
  const atmBot = rowY(ATM_ROW + 1);
  const end = rowY(MODEL.rows.length);
  const stripH = TABLE.rowH;
  const stripOp = dimIn * out;
  const brFade = 1 - ramp(f, B.conc[0], B.conc[0] + 14, easeIO); // labels hand over to the screen copies
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: end + 60, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, top: top0, width: CONTENT.w, height: atmTop - top0, background: `rgba(0,0,0,${dim})` }} />
      <div style={{ position: "absolute", left: 0, top: atmBot, width: CONTENT.w, height: end - atmBot, background: `rgba(0,0,0,${dim})` }} />
      {/* diff strip over the (dimmed) row above */}
      <div style={{ position: "absolute", left: 0, top: atmTop - stripH, width: CONTENT.w, height: stripH, background: `rgba(9,10,12,${0.95 * stripOp})`, borderTop: `1px solid rgba(42,46,52,${stripOp})` }} />
      <div style={{ position: "absolute", left: 0, top: atmTop - stripH, width: colX(FIRST), height: stripH, lineHeight: `${stripH}px`, textAlign: "right", paddingRight: 5, boxSizing: "border-box", fontSize: 11, color: C.mutedFg, opacity: stripOp, whiteSpace: "nowrap" }}>较前一格</div>
      {T.map((_, k) => {
        if (k === 0) return null;
        const e = ramp(f, HOPS[k] - 4, HOPS[k] + 6, EASE_OUT);
        if (e <= 0.001) return null;
        const v = R[k] - R[k - 1];
        const c = FIRST + k;
        return (
          <div key={k} style={{ position: "absolute", left: colX(c) - 2, top: atmTop - stripH, width: colW(c) + 4, height: stripH, lineHeight: `${stripH}px`, textAlign: "center", fontSize: 13, fontWeight: 700, color: pnlColor(v), fontVariantNumeric: "tabular-nums", letterSpacing: -0.5, whiteSpace: "nowrap", opacity: e * out, transform: `translateY(${(1 - e) * 5}px)` }}>
            {fmtS(v)}
          </div>
        );
      })}
      {/* brackets under the row */}
      {BRACKETS.map((br, i) => {
        const p = mo(f, br.w);
        if (p <= 0.001) return null;
        const x0 = cellCX(FIRST + br.a);
        const x1 = cellCX(FIRST + br.b);
        const xm = (x0 + x1) / 2;
        const half = ((x1 - x0) / 2) * Math.min(1, p / 0.7);
        const lab = ramp(p, 0.35, 1, easeIO);
        const lineOp = out * (1 - 0.5 * ramp(f, B.conc[0], B.conc[1], easeIO));
        return (
          <React.Fragment key={i}>
            <svg width={CONTENT.w} height={40} style={{ position: "absolute", left: 0, top: BR_Y - 8, overflow: "visible", opacity: lineOp }}>
              <path d={`M${xm - half},${8 - 7} L${xm - half},${8} L${xm + half},${8} L${xm + half},${8 - 7}`} fill="none" stroke={C.green} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
              <line x1={xm} x2={xm} y1={8} y2={14} stroke={C.green} strokeWidth={1.6} opacity={lab} />
            </svg>
            <div style={{ position: "absolute", left: brLabelCX(i), top: BR_LABEL_Y, height: BR_LABEL_H, transform: `translateX(-50%) translateY(${(1 - lab) * 6}px)`, opacity: lab * brFade * out, padding: "0 10px", borderRadius: 5, background: "rgba(9,10,12,0.94)", border: `1px solid ${C.border}`, display: "flex", alignItems: "center", whiteSpace: "nowrap", fontSize: BR_FS, color: C.fg, fontWeight: 500 }}>
              {br.head}
              <span style={{ color: C.green, fontWeight: 700, fontVariantNumeric: "tabular-nums", margin: "0 4px" }}>{fmt(br.v)}</span>元
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- chart annotations (content-native, inside the panel) */
const ChartMarks: React.FC<{ f: number; cam: CameraState; x0: number; x1: number; s: number; dte: number }> = ({ f, cam, x0, x1, s, dte }) => {
  const sc = makeScales(x0, x1);
  const k = 1 / (PX * cam.scale); // screen px -> native
  const fs = 30 * k;
  const label = (x: number, y: number, text: string, color: string, anchor: "l" | "r", op: number, key: string, sub?: string) =>
    op > 0.001 ? (
      <div key={key} style={{ position: "absolute", left: x, top: y, transform: `translate(${anchor === "l" ? "0" : "-100%"},-50%)`, opacity: op, padding: `${3 * k}px ${10 * k}px`, borderRadius: 6 * k, background: "rgba(9,10,12,0.92)", border: `${1 * k}px solid ${C.border}`, whiteSpace: "nowrap", lineHeight: 1.2, textAlign: anchor === "l" ? "left" : "right" }}>
        {sub ? <div style={{ fontSize: 20 * k, color: C.mutedFg }}>{sub}</div> : null}
        <div style={{ fontFamily: MONO, fontSize: fs, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}>{text}</div>
      </div>
    ) : null;
  const markOut = 1 - ramp(f, B.pull[0], B.pull[0] + 24, easeIO);
  /* 6550 dot */
  const v = s * MODEL.profit(6550, dte);
  const dotOp = ramp(f, B.morph[1] + 4, B.morph[1] + 22) * markOut;
  const labOp = dotOp * (1 - ramp(f, B.flip[0] - 6, B.flip[0] + 6) + ramp(f, B.flip[1] - 2, B.flip[1] + 10));
  const dx = sc.x(6550);
  const dy = sc.y(v);
  /* gap marker: 1-day curve vs expiry line at 6550 */
  const gapOp = mo(f, B.gap) * (1 - ramp(f, B.push[0] + 4, B.push[0] + 24, easeIO));
  const yExp = sc.y(SELL_0);
  /* band + drop */
  const bandOp = mo(f, B.push) * markOut;
  const dropP = mo(f, B.drop);
  const ddx = sc.x(P_DROP);
  const ddy = sc.y(-MODEL.profit(P_DROP, 1));
  const r = 6 * k;
  const sellerChip = mo(f, B.flip) * (1 - mo(f, B.unflip));
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: 440, pointerEvents: "none" }}>
      {sellerChip > 0.001 && (
        <div style={{ position: "absolute", right: 28, top: 2, opacity: sellerChip * markOut, padding: "2px 10px", borderRadius: 4, background: "rgba(234,57,67,0.14)", border: `1px solid rgba(234,57,67,0.5)`, color: C.red, fontSize: 15, fontWeight: 600 }}>卖方视角</div>
      )}
      <svg width={CONTENT.w} height={440} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {bandOp > 0.001 && (
          <g opacity={bandOp}>
            <rect x={sc.x(P_DROP)} y={34} width={sc.x(P_UP) - sc.x(P_DROP)} height={380} fill="rgba(255,255,255,0.055)" />
            <line x1={sc.x(P_DROP)} x2={sc.x(P_DROP)} y1={34} y2={414} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5 * k} strokeDasharray={`${5 * k},${4 * k}`} />
            <line x1={sc.x(P_UP)} x2={sc.x(P_UP)} y1={34} y2={414} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5 * k} strokeDasharray={`${5 * k},${4 * k}`} />
          </g>
        )}
        {gapOp > 0.001 && (
          <g opacity={gapOp}>
            <line x1={dx} x2={dx} y1={yExp} y2={dy} stroke={C.red} strokeWidth={2 * k} />
            <line x1={dx - 6 * k} x2={dx + 6 * k} y1={yExp} y2={yExp} stroke={C.red} strokeWidth={2 * k} />
          </g>
        )}
        {dropP > 0.001 && (
          <g opacity={dropP * markOut}>
            <line x1={dx} x2={ddx} y1={dy} y2={dy} stroke="rgba(255,255,255,0.55)" strokeWidth={1.5 * k} strokeDasharray={`${4 * k},${3 * k}`} />
            <line x1={ddx} x2={ddx} y1={dy} y2={lerp(dy, ddy, dropP)} stroke={C.green} strokeWidth={2.5 * k} />
            <circle cx={ddx} cy={lerp(dy, ddy, dropP)} r={r} fill={C.green} stroke="#0b0c0e" strokeWidth={2 * k} />
          </g>
        )}
        {dotOp > 0.001 && <circle cx={dx} cy={dy} r={r} fill={pnlColor(v)} stroke="#0b0c0e" strokeWidth={2 * k} opacity={dotOp} />}
      </svg>
      {label(dx + 14 * k, dy - 34 * k, fmtS(v), pnlColor(v), "l", labOp * (1 - ramp(f, B.push[0], B.push[0] + 16)), "v")}
      {label(dx + 14 * k, lerp(yExp, dy, 0.5), `+${fmt(LAST_DAY)}`, C.red, "l", gapOp, "gap", "最后一天")}
      {/* push-in: the two seller values + the drop */}
      {label(dx + 14 * k, dy - 30 * k, fmtS(SELL_1D), C.red, "l", ramp(f, B.push[0] + 10, B.push[1]) * markOut, "s1", "6550 · 剩 1 天")}
      {label(ddx - 14 * k, ddy + 50 * k, fmtS(SELL_1D_DROP), C.red, "r", ramp(dropP, 0.6, 1) * markOut, "s2", "跌 1% → 6484.5")}
      {label(ddx - 14 * k, lerp(dy, ddy, 0.5), `\u2212${fmt(DROP)}`, C.green, "r", ramp(dropP, 0.5, 1) * markOut, "drop")}
      {bandOp > 0.001 && (
        <>
          <div style={{ position: "absolute", left: sc.x(P_DROP), top: 414 - 30 * k, transform: "translateX(-50%)", fontSize: 20 * k, color: C.mutedFg, opacity: bandOp, whiteSpace: "nowrap" }}>−1%</div>
          <div style={{ position: "absolute", left: sc.x(P_UP), top: 414 - 30 * k, transform: "translateX(-50%)", fontSize: 20 * k, color: C.mutedFg, opacity: bandOp, whiteSpace: "nowrap" }}>+1%</div>
        </>
      )}
    </div>
  );
};

/* ---------------------------------------------------------------- the stage (inside the camera) */
export const AppStage: React.FC<{ f: number; cam: CameraState }> = ({ f, cam }) => {
  const h = hopProgress(f);
  const out = walkOut(f);
  const focusOn = ramp(f, HOOK + 16, HOPS[0]) * out;
  const colOn = mo(f, B.dim) * out;
  const scatter = mo(f, [B.click, B.click + 42]);
  const atmFade = ramp(f, B.morph[0] + 2, B.morph[0] + 16);
  const tableOn = f < B.morph[1] + 10;

  const cellFx = (r: number, c: number): CellFx => {
    const isAtm = r === ATM_ROW;
    const sc = isAtm ? 0 : scatter;
    const colW_ = c >= FIRST ? Math.max(0, 1 - Math.abs(c - FIRST - h)) : 0;
    const light = Math.max(isAtm ? out : 0, colW_ * colOn);
    const focus = isAtm && c >= FIRST ? colW_ * focusOn : 0;
    const trail = isAtm && c >= FIRST ? Math.min(1, Math.max(0, h - (c - FIRST) + 0.2)) * focusOn : 0;
    const hs = (k: number) => {
      const x = Math.sin(r * 127.1 + c * 311.7 + k * 74.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      op: isAtm ? 1 - atmFade : 1 - sc,
      dx: (hs(1) - 0.5) * 220 * sc,
      dy: (hs(2) - 0.5) * 160 * sc,
      s: 1 - 0.35 * sc,
      focus,
      light,
      trail,
      text: 1,
    };
  };
  const headerOp = () => 1 - ramp(f, B.click, B.click + 20);
  const lineP = 1 - ramp(f, B.click, B.click + 14);

  const chartOn = f >= B.morph[0];
  const [x0, x1] = domAt(f);
  const dte = dteAt(f);
  const s = signAt(f);
  const model = s === 1 ? MODEL : { ...MODEL, profit: (p: number, d: number) => s * MODEL.profit(p, d) };
  const morph = f < B.morph[1] + 30 ? { from: FROM_PTS, lime: 1 - ramp(f, B.morph[1] - 18, B.morph[1] + 4), p: () => mo(f, B.morph) } : undefined;
  const view = ramp(f, B.click + 1, B.click + 17, EASE);
  const press = Math.max(0, 1 - Math.abs(f - (B.click + 1)) / 7);
  const panelOp = 1 - ramp(f, B.lift[0], B.lift[0] + 30, easeIO);
  const clean = 1 - mo(f, B.unflip); // markers / legend leave for the ending

  return (
    <Panel op={panelOp} titleOp={1} view={view} togglePress={press} toggleOp={1}>
      <MetricsBar model={MODEL} reveal={() => 1} count={1} beSep=" · " staticKeys={["be"]} />
      {tableOn ? <ProfitTable model={MODEL} fx={cellFx} headerOp={headerOp} lineP={lineP} /> : null}
      {f < B.click + 24 ? <WalkOverlay f={f} /> : null}
      {chartOn ? (
        <>
          <StrategyChart
            model={model}
            dte={dte}
            x0={x0}
            x1={x1}
            axesOp={ramp(f, B.morph[0] + 16, B.morph[1] + 4)}
            legendOp={ramp(f, B.morph[1] - 2, B.morph[1] + 28) * (1 - ramp(f, B.sweep[1] - 22, B.sweep[1] + 8))}
            markerOp={ramp(f, B.morph[1] - 8, B.morph[1] + 22) * clean}
            beOp={1 - ramp(f, B.flip[0], B.flip[0] + 20)}
            fillOp={ramp(f, B.morph[0] + 30, B.morph[1] + 22) * (1 - ramp(f, B.lift[0], B.lift[0] + 14, easeIO))}
            lineOp={f >= B.lift[0] ? 0 : 1 /* from the lift the End overlay V is the only V */}
            draw={1}
            morph={morph}
            secondaryOp={ramp(f, B.morph[1] - 2, B.morph[1] + 28)}
          />
          <ChartMarks f={f} cam={cam} x0={x0} x1={x1} s={s} dte={dte} />
          <DateSlider model={MODEL} dte={dte} op={ramp(f, B.morph[1] - 8, B.morph[1] + 22) * (1 - ramp(f, B.unflip[1] - 10, B.lift[0] + 10, easeIO))} />
        </>
      ) : null}
    </Panel>
  );
};

/* ---------------------------------------------------------------- screen-space overlays (outside the camera) */
const TOGGLE_W = nativeToWorld(TOGGLE.chartX + TOGGLE.w / 2 - 6, TOGGLE.y + TOGGLE.h / 2 + 2);
const BIG = [
  { x: 640, label: "第一周 少了", v: FIRST_WEEK, i: 0 },
  { x: 1280, label: "最后三天 少了", v: LAST3, i: 1 },
];

export const StageOverlay: React.FC<{ f: number }> = ({ f }) => {
  const conc = mo(f, B.conc);
  const concOut = mo(f, B.concOut);
  const concDim = 0.8 * conc * (1 - concOut);
  const lineP = mo(f, B.concLine) * (1 - concOut);
  const qDim = 0.62 * mo(f, B.pull) * (1 - mo(f, B.undim));
  const qP = mo(f, B.q) * (1 - mo(f, B.qOut));
  /* cursor to 曲线 (screen space, tracking the toggle while the camera pulls back) */
  const cam = stageCamera(f);
  const tgt = worldToScreen(TOGGLE_W, cam, W, H);
  const cu = mo(f, B.curIn);
  const curX = lerp(1560, tgt.x, cu);
  const curY = lerp(760, tgt.y, cu);
  const curOp = ramp(f, B.curIn[0], B.curIn[0] + 12) * (1 - ramp(f, B.click + 12, B.click + 36));
  const press = Math.max(0, 1 - Math.abs(f - (B.click + 1)) / 7);
  return (
    <>
      {concDim > 0.001 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${concDim})` }} />}
      {conc > 0.001 && concOut < 0.999 &&
        BIG.map((b) => {
          const from = toScreen(brLabelC(b.i).x, brLabelC(b.i).y, TABLE_CAM);
          const x = lerp(from.x, b.x, conc);
          const y = lerp(from.y, 470, conc);
          const size = lerp(36, 112, conc);
          return (
            <div key={b.i} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) translateY(${-concOut * 30}px)`, textAlign: "center", opacity: ramp(conc, 0, 0.25) * (1 - concOut), whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: THIN, fontSize: lerp(18, 34, conc), color: "rgba(230,232,236,0.85)", letterSpacing: "0.12em", opacity: ramp(conc, 0.4, 1), marginBottom: 6 }}>{b.label}</div>
              <div style={{ fontFamily: MONO, fontSize: size, fontWeight: 600, color: C.green, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(b.v)}</div>
            </div>
          );
        })}
      {lineP > 0.001 && (
        <div style={{ position: "absolute", left: 0, width: W, top: 610, height: 90, overflow: "hidden" }}>
          <div style={{ textAlign: "center", fontFamily: THIN, fontWeight: 400, fontSize: 56, lineHeight: "90px", letterSpacing: "0.08em", color: C.fg, transform: `translateY(${(1 - lineP) * 80}px)`, opacity: Math.min(1, lineP * 1.6) }}>
            最后 3 天，比第一周亏得还多。
          </div>
        </div>
      )}
      {qDim > 0.001 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${qDim})` }} />}
      {qP > 0.001 &&
        ["每天多收的那几千块，", "够不够赔一次 1% 的波动？"].map((t, i) => (
          <div key={i} style={{ position: "absolute", left: 0, width: W, top: 400 + i * 112, height: 104, overflow: "hidden" }}>
            <div style={{ textAlign: "center", fontFamily: THIN, fontWeight: 400, fontSize: 72, lineHeight: "104px", letterSpacing: "0.06em", color: "#fff", transform: `translateY(${(1 - ramp(qP, i * 0.12, 1)) * 96}px)`, opacity: Math.min(1, ramp(qP, i * 0.12, 1) * 1.6) }}>{t}</div>
          </div>
        ))}
      {curOp > 0.001 && <Cursor x={curX} y={curY} opacity={curOp} press={press} />}
    </>
  );
};

export const StageCaptions: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Caption text="损耗在临近到期时会不断加速。" p={fadeWin(f, B.capTable[0], B.capTable[1], 18)} />
    <Caption text="每过一天往下压一截，越往后压得越深。" p={fadeWin(f, B.capSweep[0], B.capSweep[1], 18)} />
    <Caption text={`反过来看：这些钱进了卖方口袋。最后一天就有 ${fmt(LAST_DAY)} 元。`} p={fadeWin(f, B.capSeller[0], B.capSeller[1], 18)} />
    <Caption text={`只剩 1 天：价格跌 1%（约 65 点），卖方就要赔 ${fmt(DROP)} 元。`} p={fadeWin(f, B.capBand[0], B.capBand[1], 18)} />
  </>
);

/** the expiry V of the chart at 1:1 (world == screen), for the End overlay */
export const CHART_V = (() => {
  const pt = (p: number) => contentToWorld({ x: SC_END.x(p), y: SC_END.y(MODEL.profit(p, 0)) });
  return { a: pt(X_DOMAIN_END[0]), v: pt(6600), b: pt(X_DOMAIN_END[1]), zeroY: contentToWorld({ x: 0, y: SC_END.y(0) }).y, top: contentToWorld({ x: 0, y: 34 }).y, bottom: contentToWorld({ x: 0, y: 414 }).y };
})();
