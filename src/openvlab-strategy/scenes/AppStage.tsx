import React from "react";
import { CameraState, worldToScreen } from "../../shared/components/Camera";
import { EASE_OUT } from "../../shared/motion";
import { MONO } from "../../shared/fonts";
import { Caption } from "../components/Caption";
import { DateSlider } from "../components/DateSlider";
import { IvSlider } from "../components/IvSlider";
import { MetricsBar } from "../components/MetricsBar";
import { Panel } from "../components/Panel";
import { CellFx, ProfitTable } from "../components/ProfitTable";
import { StrategyChart, X_DOMAIN_END, X_DOMAIN_START, contentToWorld, curvePts, makeScales, toPath } from "../components/StrategyChart";
import { ATM_ROW, MODEL } from "../data";
import { CONTENT, TABLE, colW, colX, nativeToWorld, rowY } from "../layout";
import { C, THIN } from "../tokens";
import { easeIO, fadeWin, lerp, ramp } from "../timeline";
import { B, DIFF_IN, DIFF_STAGGER, DIFF_START, IV_CRUSH, IV_UP, mo } from "../beats";
import { dteAt, ghostScaleAt, sigmaAt, volScaleAt } from "../curve";
import { TV_CRUSH, TV_UP, TimeGap, TimeOverlay, thetaHotP, vegaHotP } from "./TimeValue";

/**
 * v9 app stage (GLOBAL frames, HOOK..B.lift):
 * ATM row lit on entry → fast「较前一格」cascade → brackets → conclusion →
 * auto morph → TV drain → restore today → IV up / IV crush → takeaway → SoftBg+logo End.tsx.
 * Seller flip / 2% shock / 不够赔 / Gamma question removed.
 */

const T = MODEL.timeline;
const ROW = MODEL.table[ATM_ROW];
const FIRST = 2; // first date column
const W = 1920;
const H = 1080;
const PX = 1.5; // native -> world
const S = 6550;

/* ---------------------------------------------------------------- data (all from the model) */
const R = ROW.map((v) => Math.round(v));
const FIRST_WEEK = R[0] - R[5]; // 7,617
const LAST3 = R[13] - R[17]; // 11,027

const fmt = (v: number) => Math.abs(Math.round(v)).toLocaleString("en-US");
/** signed with a true minus sign */
const fmtS = (v: number) => {
  const r = Math.round(v);
  return r === 0 ? "0" : `${r < 0 ? "\u2212" : "+"}${fmt(r)}`;
};
const pnlColor = (v: number) => (v > 0.5 ? C.red : v < -0.5 ? C.green : C.mutedFg);

/* ---------------------------------------------------------------- slider / curve state */
const domAt = (f: number) => {
  const p = mo(f, [B.sweep[0], B.sweep[0] + 180]);
  return [lerp(X_DOMAIN_START[0], X_DOMAIN_END[0], p), lerp(X_DOMAIN_START[1], X_DOMAIN_END[1], p)] as const;
};

/* ---------------------------------------------------------------- camera (world, 1:1 = {960,540,1}) */
const ONE: CameraState = { x: 960, y: 540, scale: 1 };
const ROW_Y = rowY(ATM_ROW) + TABLE.rowH / 2; // content-native
const ATM_WORLD_Y = nativeToWorld(0, CONTENT.y + ROW_Y).y;
const TABLE_CAM: CameraState = { x: 960, y: ATM_WORLD_Y + 6, scale: 1.2 };
const camLerp = (a: CameraState, b: CameraState, t: number): CameraState => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  scale: Math.exp(lerp(Math.log(a.scale), Math.log(b.scale), t)),
});
export const stageCamera = (f: number): CameraState => {
  if (f < B.camOut[0]) return camLerp(ONE, TABLE_CAM, mo(f, B.camIn));
  return camLerp(TABLE_CAM, ONE, mo(f, B.camOut));
};
const toScreen = (nx: number, ny: number, cam: CameraState) => worldToScreen(contentToWorld({ x: nx, y: ny }), cam, W, H);

/* ---------------------------------------------------------------- table (ATM + diff strip + brackets) */
const cellCX = (c: number) => colX(c) + colW(c) / 2;
const ROW_X0 = cellCX(FIRST);
const ROW_X1 = cellCX(FIRST + T.length - 1);
const FROM_PTS = Array.from({ length: 181 }, (_, i) => ({ x: lerp(ROW_X0, ROW_X1, i / 180), y: ROW_Y }));

/** table decorations leave with the table as the auto morph begins */
const walkOut = (f: number) => 1 - ramp(f, B.morph[0] - 36, B.morph[0] - 4, easeIO);

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
        const a = DIFF_START + (k - 1) * DIFF_STAGGER;
        const e = ramp(f, a, a + DIFF_IN, EASE_OUT);
        if (e <= 0.001) return null;
        const v = R[k] - R[k - 1];
        const c = FIRST + k;
        return (
          <div key={k} style={{ position: "absolute", left: colX(c) - 2, top: atmTop - stripH, width: colW(c) + 4, height: stripH, lineHeight: `${stripH}px`, textAlign: "center", fontSize: 13, fontWeight: 700, color: pnlColor(v), fontVariantNumeric: "tabular-nums", letterSpacing: -0.5, whiteSpace: "nowrap", opacity: e * out, transform: `translateY(${(1 - e) * 5}px) scale(${0.92 + 0.08 * e})` }}>
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
const ChartMarks: React.FC<{ f: number; cam: CameraState; x0: number; x1: number; dte: number; sigma: number }> = ({ f, cam, x0, x1, dte, sigma }) => {
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
  const markOut = 1 - ramp(f, B.dimIv[0], B.dimIv[0] + 24, easeIO);
  const v = MODEL.profit(S, dte, sigma);
  const dotOp = ramp(f, B.morph[1] + 4, B.morph[1] + 22) * markOut;
  const labOp = dotOp * (1 - ramp(f, B.ivUp[0] - 10, B.ivUp[0] + 16, easeIO)); // hide ATM PnL label once IV HUD takes over
  const dx = sc.x(S);
  const dy = sc.y(v);
  const r = 6 * k;
  const ivChip = ramp(f, B.ivHook[0], B.ivHook[1], easeIO) * markOut;
  const crushOn = f >= B.ivCrush[0];
  return (
    <div style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, width: CONTENT.w, height: 440, pointerEvents: "none" }}>
      {ivChip > 0.001 && (
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 2,
            opacity: ivChip,
            padding: "2px 10px",
            borderRadius: 4,
            background: crushOn ? "rgba(22,199,132,0.14)" : "rgba(22,199,132,0.14)",
            border: `1px solid rgba(22,199,132,0.55)`,
            color: C.vega,
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          {crushOn ? "IV crush" : f >= B.ivUp[0] ? "IV 抬升" : "隐含波动率"}
        </div>
      )}
      <svg width={CONTENT.w} height={440} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {dotOp > 0.001 && <circle cx={dx} cy={dy} r={r} fill={pnlColor(v)} stroke="#0b0c0e" strokeWidth={2 * k} opacity={dotOp} />}
      </svg>
      {label(dx + 14 * k, dy - 34 * k, fmtS(v), pnlColor(v), "l", labOp, "v")}
    </div>
  );
};

/** Ghost of the previous IV curve while vol is moving. */
const IvGhost: React.FC<{ f: number; x0: number; x1: number; dte: number }> = ({ f, x0, x1, dte }) => {
  const show = ramp(f, B.ivUp[0], B.ivUp[0] + 16, easeIO) * (1 - ramp(f, B.dimIv[0] - 6, B.dimIv[0] + 20, easeIO));
  if (show < 0.001) return null;
  const ghostSigma = MODEL.vol * ghostScaleAt(f);
  const liveSigma = sigmaAt(f);
  // only draw when it still differs from the live curve
  if (Math.abs(ghostSigma - liveSigma) < 1e-6) return null;
  const pts = curvePts(
    {
      ...MODEL,
      profit: (p: number, d: number) => MODEL.profit(p, d, ghostSigma),
      value: (p: number, d: number) => MODEL.value(p, d, ghostSigma),
      breakevens: (d: number) => MODEL.breakevens(d, ghostSigma),
    },
    dte,
    x0,
    x1,
  );
  return (
    <svg width={CONTENT.w} height={440} style={{ position: "absolute", left: CONTENT.x, top: CONTENT.y, overflow: "visible", opacity: 0.45 * show, pointerEvents: "none" }}>
      <path d={toPath(pts)} fill="none" stroke="rgba(230,232,236,0.55)" strokeWidth={2} strokeDasharray="7 6" strokeLinecap="round" />
    </svg>
  );
};

/* ---------------------------------------------------------------- the stage (inside the camera) */
export const AppStage: React.FC<{ f: number; cam: CameraState }> = ({ f, cam }) => {
  const out = walkOut(f);
  // ATM row fully lit from first AppStage frame (matches Opening handoff light=1); no day-by-day focus walk
  const scatter = mo(f, [B.morph[0], B.morph[0] + 42]);
  // Kill brand-lime wash + ATM cells before the stroke takes over — otherwise the handoff reads as a green flash then a red line
  const atmLight = 1 - ramp(f, B.morph[0] - 48, B.morph[0] - 12, easeIO);
  const atmFade = ramp(f, B.morph[0] - 6, B.morph[0] + 10);
  const tableOn = f < B.morph[1] + 10;

  const cellFx = (r: number, c: number): CellFx => {
    const isAtm = r === ATM_ROW;
    const sc = isAtm ? 0 : scatter;
    const hs = (k: number) => {
      const x = Math.sin(r * 127.1 + c * 311.7 + k * 74.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      op: isAtm ? 1 - atmFade : 1 - sc,
      dx: (hs(1) - 0.5) * 220 * sc,
      dy: (hs(2) - 0.5) * 160 * sc,
      s: 1 - 0.35 * sc,
      focus: 0,
      light: isAtm ? atmLight : 0,
      trail: 0,
      text: 1,
    };
  };
  const headerOp = () => 1 - ramp(f, B.morph[0], B.morph[0] + 20);
  const lineP = 1 - ramp(f, B.morph[0], B.morph[0] + 14);

  const chartOn = f >= B.morph[0];
  const [x0, x1] = domAt(f);
  const dte = dteAt(f);
  const sigma = sigmaAt(f);
  const model = {
    ...MODEL,
    profit: (p: number, d: number) => MODEL.profit(p, d, sigma),
    value: (p: number, d: number) => MODEL.value(p, d, sigma),
    breakevens: (d: number) => MODEL.breakevens(d, sigma),
  };
  const morph = f < B.morph[1] + 30 ? { from: FROM_PTS, lime: 1 - ramp(f, B.morph[1] - 18, B.morph[1] + 4), p: () => mo(f, B.morph) } : undefined;
  const panelOp = 1 - ramp(f, B.lift[0], B.lift[0] + 54, easeIO);
  const clean = 1 - ramp(f, B.dimIv[0], B.dimIv[0] + 28, easeIO);
  const thetaP = thetaHotP(f);
  const vegaP = vegaHotP(f);
  const hot = vegaP > 0.001 ? { key: "vega", p: vegaP } : thetaP > 0.001 ? { key: "theta", p: thetaP } : undefined;

  return (
    <Panel op={panelOp} titleOp={1}>
      <MetricsBar model={MODEL} reveal={() => 1} count={1} beSep=" · " staticKeys={["be"]} hot={hot} />
      {tableOn ? <ProfitTable model={MODEL} fx={cellFx} headerOp={headerOp} lineP={lineP} /> : null}
      {f < B.morph[0] + 24 ? <WalkOverlay f={f} /> : null}
      {chartOn ? (
        <>
          <StrategyChart
            model={model}
            dte={dte}
            x0={x0}
            x1={x1}
            axesOp={ramp(f, B.morph[0] + 16, B.morph[1] + 4)}
            legendOp={ramp(f, B.morph[1] - 2, B.morph[1] + 28) * (1 - ramp(f, B.sweep[1] - 30, B.sweep[1] + 10))}
            markerOp={ramp(f, B.morph[1] - 8, B.morph[1] + 22) * clean}
            beOp={1}
            midOp={1 - ramp(f, B.ivUp[0], B.ivUp[0] + 24, easeIO)}
            fillOp={ramp(f, B.morph[0] + 30, B.morph[1] + 22) * (1 - ramp(f, B.lift[0], B.lift[0] + 40, easeIO))}
            lineOp={1 - ramp(f, B.lift[0], B.lift[0] + 48, easeIO)}
            draw={1}
            morph={morph}
            secondaryOp={ramp(f, B.morph[1] - 2, B.morph[1] + 28) * (1 - ramp(f, B.ivUp[0], B.ivUp[0] + 24, easeIO))}
          />
          <IvGhost f={f} x0={x0} x1={x1} dte={dte} />
          <ChartMarks f={f} cam={cam} x0={x0} x1={x1} dte={dte} sigma={sigma} />
          <TimeGap f={f} dte={dte} />
          <DateSlider
            model={MODEL}
            dte={dte}
            op={ramp(f, B.morph[1] - 8, B.morph[1] + 22) * (1 - ramp(f, B.restore[1] - 16, B.ivHook[0] + 18, easeIO))}
          />
          <IvSlider
            baseVol={MODEL.vol}
            multiplier={volScaleAt(f)}
            op={ramp(f, B.ivHook[0], B.ivHook[1], easeIO) * (1 - ramp(f, B.dimIv[0] - 10, B.dimIv[0] + 18, easeIO))}
          />
        </>
      ) : null}
    </Panel>
  );
};

/* ---------------------------------------------------------------- screen-space overlays (outside the camera) */
const BIG = [
  { x: 640, label: "第一周 少了", v: FIRST_WEEK, i: 0 },
  { x: 1280, label: "最后三天 少了", v: LAST3, i: 1 },
];

export const StageOverlay: React.FC<{ f: number }> = ({ f }) => {
  const conc = mo(f, B.conc);
  const concOut = mo(f, B.concOut);
  const concDim = 0.88 * conc * (1 - concOut);
  const lineP = mo(f, B.concLine) * (1 - concOut);
  const qDim = mo(f, B.dimIv) * (1 - mo(f, B.ansOut)) * lerp(0.62, 0.78, mo(f, B.ans));
  return (
    <>
      {concDim > 0.001 && <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${concDim})` }} />}
      {conc > 0.001 &&
        concOut < 0.999 &&
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
      <TimeOverlay f={f} />
    </>
  );
};

export const StageCaptions: React.FC<{ f: number }> = ({ f }) => (
  <>
    <Caption text="损耗在临近到期时会不断加速。" p={fadeWin(f, B.capTable[0], B.capTable[1], 24)} />
    <Caption text="价格不动，少掉的这一截，叫时间价值。" p={fadeWin(f, B.capName[0], B.capName[1], 24)} />
    <Caption text="每过一天往下压一截，越往后压得越深。" p={fadeWin(f, B.capSweep[0], B.capSweep[1], 24)} />
    <Caption text="越近到期，掉得越快。到期那一刻，它是零。" p={fadeWin(f, B.capDrain[0], B.capDrain[1], 24)} />
    <Caption text="但时间价值不只听日历。隐含波动率一变，它也会变。" p={fadeWin(f, B.capIvHook[0], B.capIvHook[1], 24)} />
    <Caption text={`IV 抬升到 ${(MODEL.vol * IV_UP * 100).toFixed(1)}%，时间价值涨到 ${fmt(TV_UP)}。`} p={fadeWin(f, B.capIvUp[0], B.capIvUp[1], 24)} />
    <Caption text={`IV crush 到 ${(MODEL.vol * IV_CRUSH * 100).toFixed(1)}%：标的不动，时间价值只剩 ${fmt(TV_CRUSH)}。`} p={fadeWin(f, B.capIvCrush[0], B.capIvCrush[1], 24)} />
  </>
);
