import React from "react";
import { interpolatePath } from "@remotion/paths";
import { CENTERLINE, LogoDisc, LogoGlyph, VStroke, glyphStrokeWidth, logoCenterline, logoToScreen, straightV, Pt } from "../logo-morph/logo";
import { SoftBg } from "../open/LightStage";
import { C, THIN } from "../tokens";
import { easeIO, lerp, ramp } from "../timeline";
import { B, irisR, mo } from "../beats";
import { CHART_V } from "./AppStage";

/**
 * v6 ending (global frames, from B.lift): the expiry V lifts off the chart into a straight V at the logo slot ->
 * logo centerline + disc -> the light world irises in (by area) onto the disc -> theme line -> the disc shrinks (by area) to 0,
 * leaving exactly the opening's first frame (SoftBg f=0).
 */
const W = 1920;
const H = 1080;
const END = { x: 960, y: 410, size: 340 };
const lp = (a: Pt, b: Pt, t: number) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });
const iconV = (cx: number, cy: number, size: number) => ({ a: logoToScreen(CENTERLINE[0], cx, cy, size), v: logoToScreen(CENTERLINE[3], cx, cy, size), b: logoToScreen(CENTERLINE[6], cx, cy, size) });
const ZERO_N = Math.min(1, Math.max(0, (CHART_V.zeroY - CHART_V.top) / (CHART_V.bottom - CHART_V.top)));

export const End: React.FC<{ f: number }> = ({ f }) => {
  if (f < B.lift[0]) return null;
  const k = Math.sqrt(1 - mo(f, B.out)); // area-eased shrink
  const size = END.size * k;
  const iv = iconV(END.x, END.y, END.size);

  /* V: chart V -> straight V at the logo -> logo centerline */
  const e1 = mo(f, B.lift);
  const e2 = mo(f, B.logo);
  const va = lp(CHART_V.a, iv.a, e1);
  const vv = lp(CHART_V.v, iv.v, e1);
  const vb = lp(CHART_V.b, iv.b, e1);
  const dV = f < B.logo[0] ? straightV(va, vv, vb) : interpolatePath(e2, straightV(iv.a, iv.v, iv.b), logoCenterline(END.x, END.y, END.size));
  const vW = f < B.logo[0] ? lerp(3, glyphStrokeWidth(END.size) * 0.9, e1) : lerp(glyphStrokeWidth(END.size) * 0.9, glyphStrokeWidth(END.size), e2);
  const ctop = Math.min(CHART_V.a.y, CHART_V.b.y);
  const itop = Math.min(iv.a.y, iv.b.y);
  const yMap = (y: number) => lerp(y, itop + ((y - ctop) / (CHART_V.v.y - ctop)) * (iv.v.y - itop), e1);
  const toDark = f < B.logo[0] ? 0 : ramp(e2, 0, 0.55, easeIO);
  const glyphIn = ramp(f, B.logo[1] - 14, B.logo[1], easeIO);
  const discIn = f < B.logo[0] ? 0 : ramp(e2, 0, 0.5, easeIO);
  const vOn = f < B.logo[1];

  /* iris + theme */
  const ei = mo(f, B.iris);
  const R0 = Math.hypot(Math.max(END.x, W - END.x), Math.max(END.y, H - END.y)) + 4;
  const core = (188 / 512) * size; // opaque core of the disc
  const irisRad = f < B.iris[1] ? irisR(R0, (188 / 512) * END.size, ei) : core;
  const themeP = mo(f, B.theme) * (1 - mo(f, B.out));
  const endOn = size > 0.05;
  const mask = endOn ? `radial-gradient(circle at ${END.x}px ${END.y}px, transparent ${Math.max(0, irisRad - 0.75)}px, #000 ${irisRad + 0.75}px)` : undefined;
  const light = ramp(ei, 0.55, 1, easeIO);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {f >= B.iris[0] && (
        <div style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask }}>
          <SoftBg f={0} />
        </div>
      )}
      {vOn ? (
        <>
          {discIn > 0 && <LogoDisc cx={END.x} cy={END.y} size={END.size} opacity={discIn * (1 - light)} scale={lerp(0.4, 1, discIn)} />}
          {discIn > 0 && light > 0 && <LogoDisc cx={END.x} cy={END.y} size={END.size} light opacity={discIn * light} scale={lerp(0.4, 1, discIn)} />}
          <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: (1 - toDark) * (1 - glyphIn) }}>
            <defs>
              <linearGradient id="endgrad" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={yMap(CHART_V.top)} y2={yMap(CHART_V.bottom)}>
                <stop offset={Math.max(0, ZERO_N - 0.03)} stopColor={C.chartUp} />
                <stop offset={ZERO_N} stopColor="#f2c200" stopOpacity={0.5} />
                <stop offset={Math.min(1, ZERO_N + 0.03)} stopColor={C.chartDown} />
              </linearGradient>
            </defs>
            <path d={dV} fill="none" stroke="url(#endgrad)" strokeWidth={vW} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {toDark > 0 && <VStroke d={dV} width={vW} color="#1d1816" opacity={toDark * (1 - glyphIn)} />}
          {glyphIn > 0 && <LogoGlyph cx={END.x} cy={END.y} size={END.size} opacity={glyphIn} />}
        </>
      ) : endOn ? (
        <>
          {light < 1 && <LogoDisc cx={END.x} cy={END.y} size={size} opacity={1 - light} />}
          {light > 0 && <LogoDisc cx={END.x} cy={END.y} size={size} light opacity={light} />}
          <LogoGlyph cx={END.x} cy={END.y} size={size} />
        </>
      ) : null}
      {themeP > 0.001 && (
        <div style={{ position: "absolute", left: 0, width: W, top: 640, height: 110, overflow: "hidden" }}>
          <div style={{ textAlign: "center", fontFamily: THIN, fontWeight: 400, fontSize: 68, lineHeight: "110px", letterSpacing: "0.06em", color: "#0f1218", transform: `translateY(${(1 - themeP) * 96}px)`, opacity: Math.min(1, themeP * 1.6) }}>一秒之后，不只是少了一秒。</div>
        </div>
      )}
    </div>
  );
};
