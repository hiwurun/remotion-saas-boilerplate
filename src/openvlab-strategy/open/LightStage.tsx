import React, { useMemo } from "react";
import { spring } from "remotion";
import { FPS } from "../timeline";
import { THIN } from "../tokens";
import { O, clamp01, easeInOutCubic, easeOutCubic, ramp } from "./timeline";

/** Light "title card" stage: soft background, thin title, liquid-glass Play capsule, hand cursor. Pure function of the global frame. */
export const BTN = { w: 424, h: 128, cx: 960, cy: 700 };
const BTN_LEFT = BTN.cx - BTN.w / 2;
const BTN_TOP = BTN.cy - BTN.h / 2;
const M = 60; // margin around the capsule inside the refraction layer

/** Cursor path: off-screen bottom-right -> button's lower right (tip). */
const P0 = { x: 2070, y: 1210 };
const P1 = { x: 1800, y: 960 };
const P2 = { x: 1290, y: 790 };
const P3 = { x: BTN.cx + 118, y: BTN.cy + 34 };
const bez = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * u * P0.x + 3 * u * u * t * P1.x + 3 * u * t * t * P2.x + t * t * t * P3.x,
    y: u * u * u * P0.y + 3 * u * u * t * P1.y + 3 * u * t * t * P2.y + t * t * t * P3.y,
  };
};
export const CLICK_AT = { x: P3.x, y: P3.y };
export const cursorAt = (f: number) => {
  const u = ramp(f, O.cursorIn[0], O.cursorIn[1], easeInOutCubic);
  // a tiny settle after arriving
  const p = bez(u);
  return { x: p.x, y: p.y, op: ramp(f, O.cursorIn[0] - 4, O.cursorIn[0] + 2) };
};
/** 0..1..overshoot: how pressed the capsule is (mouse down at O.press, spring back after O.release) */
export const pressAt = (f: number) => {
  if (f < O.press) return 0;
  if (f < O.release) return easeOutCubic(clamp01((f - O.press) / 4));
  // v5: smooth return, no spring / cosine overshoot
  return 1 - easeInOutCubic(clamp01((f - O.release) / 16));
};
export const hoverAt = (f: number) => ramp(f, O.hover[0], O.hover[1], easeInOutCubic);

/** displacement map of the capsule's bezel (R,G = outward normal * strength) - drives feDisplacementMap for real edge refraction */
let MAP = "";
const getMap = () => {
  if (MAP || typeof document === "undefined") return MAP;
  const W = BTN.w + M * 2;
  const H = BTN.h + M * 2;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  const R = BTN.h / 2;
  const bezel = 38;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = x - M;
      const py = y - M;
      const qx = Math.min(Math.max(px, R), BTN.w - R);
      const dx = px - qx;
      const dy = py - R;
      const d = Math.hypot(dx, dy);
      const inside = R - d;
      let vx = 0;
      let vy = 0;
      if (inside > 0 && inside < bezel && d > 0) {
        const s = 1 - inside / bezel;
        const mag = s * s * (3 - 2 * s) * 0.5 + s * s * s * 0.5;
        vx = (dx / d) * mag;
        vy = (dy / d) * mag;
      }
      const o = (y * W + x) * 4;
      img.data[o] = Math.round(128 + 127 * vx);
      img.data[o + 1] = Math.round(128 + 127 * vy);
      img.data[o + 2] = 128;
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  MAP = c.toDataURL("image/png");
  return MAP;
};

/** deterministic fine grain tile (very low contrast) */
let NOISE = "";
const getNoise = () => {
  if (NOISE || typeof document === "undefined") return NOISE;
  const n = 220;
  const c = document.createElement("canvas");
  c.width = n;
  c.height = n;
  const g = c.getContext("2d")!;
  const img = g.createImageData(n, n);
  let seed = 1234567;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < n * n; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = Math.round(rnd() * 15);
  }
  g.putImageData(img, 0, 0);
  NOISE = c.toDataURL("image/png");
  return NOISE;
};

/** Restrained light background: cool near-white gradient, two very faint low-saturation brand-blue glows, a hairline grid + concentric rings (something for the glass to refract), fine grain. */
export const SoftBg: React.FC<{ f: number; boost?: boolean }> = ({ f, boost = false }) => {
  const k = boost ? 3.4 : 1;
  const line = `rgba(24,44,84,${0.052 * k})`;
  const ringC = `rgba(24,44,84,${0.07 * k})`;
  const drift = Math.sin(f / 90) * 6;
  const vlines = Array.from({ length: 25 }, (_, i) => i * 80);
  const hlines = Array.from({ length: 14 }, (_, i) => i * 80 + 20);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, background: "linear-gradient(180deg, #f7f8fa 0%, #eef0f4 62%, #e9ecf1 100%)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 960 - 760 + drift, top: 700 - 520, width: 1520, height: 1040, background: "radial-gradient(closest-side, rgba(0,120,255,0.085), rgba(0,120,255,0.03) 55%, rgba(0,120,255,0) 100%)" }} />
      <div style={{ position: "absolute", left: 260 - 620 - drift, top: 130 - 420, width: 1240, height: 840, background: "radial-gradient(closest-side, rgba(70,110,200,0.05), rgba(70,110,200,0) 100%)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, WebkitMaskImage: "radial-gradient(ellipse 62% 66% at 50% 62%, #000 0%, rgba(0,0,0,0.55) 55%, transparent 100%)" }}>
        {vlines.map((x) => (
          <line key={"v" + x} x1={x + 0.5} y1={0} x2={x + 0.5} y2={1080} stroke={line} strokeWidth={1} />
        ))}
        {hlines.map((y) => (
          <line key={"h" + y} x1={0} y1={y + 0.5} x2={1920} y2={y + 0.5} stroke={line} strokeWidth={1} />
        ))}
        {[250, 420, 610, 820].map((r) => (
          <circle key={r} cx={960} cy={700} r={r + drift * 0.5} fill="none" stroke={ringC} strokeWidth={1.2} />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${getNoise()})`, backgroundSize: "220px 220px", opacity: boost ? 0.5 : 1 }} />
    </div>
  );
};

const Hand: React.FC<{ x: number; y: number; op: number; press: number }> = ({ x, y, op, press }) => (
  <svg
    width={58}
    height={66}
    viewBox="0 0 30 34"
    style={{ position: "absolute", left: x - 12.5 * (58 / 30), top: y - 2.6 * (58 / 30), opacity: op, transform: `scale(${1 - 0.1 * clamp01(press)})`, transformOrigin: `${12.5 * (58 / 30)}px ${2.6 * (58 / 30)}px`, filter: "drop-shadow(0 6px 8px rgba(40,55,90,.35))" }}
  >
    <path
      d="M12.5 2.6c-1.5 0-2.6 1.1-2.6 2.6v11.3l-1.7-1.6c-.9-.8-2.3-.8-3.1 0-.9.9-.8 2.2 0 3.1l6.2 7.4c1.3 1.5 3.1 2.4 5.1 2.4h4.7c3.1 0 5.6-2.5 5.6-5.6v-6.2c0-1.3-1-2.3-2.3-2.3-.6 0-1.1.2-1.5.5-.2-1.1-1.1-1.9-2.2-1.9-.7 0-1.3.3-1.7.8-.3-1-1.2-1.7-2.2-1.7-.4 0-.8.1-1.1.3V5.2c0-1.5-1.1-2.6-2.6-2.6z"
      fill="#fff"
      stroke="#1b2130"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M14.4 17.4v5M17.8 17.8v4.6M21.2 18.3v4.2" stroke="#1b2130" strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
  </svg>
);

export const LightStage: React.FC<{ f: number }> = ({ f }) => {
  const map = useMemo(getMap, []);
  const pop = spring({ frame: f - O.btnIn[0], fps: FPS, config: { damping: 11, stiffness: 120, mass: 0.85 } });
  const inOp = ramp(f, O.btnIn[0], O.btnIn[0] + 16);
  const hover = hoverAt(f);
  const press = pressAt(f);
  const breathe = 1 + 0.007 * Math.sin(f / 36);
  const scale = (0.55 + 0.45 * pop) * (1 + 0.055 * hover) * (1 - 0.085 * press) * breathe;
  const titleP = ramp(f, O.title[0], O.title[1], easeOutCubic);
  const labP = ramp(f, O.label[0], O.label[1], easeOutCubic);
  const cur = cursorAt(f);
  const bright = 1 + 0.07 * hover + 0.04 * Math.max(0, 1 - press);
  const glow = 0.8 + 0.2 * Math.sin(f / 30) + 0.35 * hover;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, overflow: "hidden" }}>
      <SoftBg f={f} />
      {/* eyebrow label + title (Apple-product-page style hierarchy: tiny mono label -> light, moderately tracked headline) */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 318, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, opacity: labP * 0.95, transform: `translateY(${(1 - labP) * 10}px)` }}>
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#0078ff", boxShadow: "0 0 10px rgba(0,120,255,0.55)" }} />
        <div style={{ fontFamily: '"SF Mono", "JetBrains Mono", Menlo, Consolas, monospace', fontSize: 21, fontWeight: 500, letterSpacing: `${0.4 - 0.08 * labP}em`, color: "rgba(26,34,50,0.55)", paddingLeft: "0.2em" }}>OPENVLAB · TIME VALUE</div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 366, display: "flex", justifyContent: "center" }}>
        <div style={{ overflow: "hidden", padding: "10px 40px 18px" }}>
          <div style={{ transform: `translateY(${(1 - titleP) * 118}%)`, opacity: clamp01(titleP * 2.5), fontFamily: THIN, fontWeight: 300, fontSize: 112, letterSpacing: "0.05em", paddingLeft: "0.05em", color: "#141922", whiteSpace: "nowrap", lineHeight: 1.18 }}>如何理解时间价值</div>
        </div>
      </div>

      {/* liquid-glass Play capsule */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="lg-refract" x={0} y={0} width={BTN.w + M * 2} height={BTN.h + M * 2} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feImage href={map} x={0} y={0} width={BTN.w + M * 2} height={BTN.h + M * 2} preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale={78} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <div style={{ position: "absolute", left: BTN_LEFT, top: BTN_TOP, width: BTN.w, height: BTN.h, opacity: inOp, transform: `scale(${scale})`, transformOrigin: "50% 50%", filter: `brightness(${bright})` }}>
        {/* soft drop shadow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: BTN.h / 2, boxShadow: `0 30px 54px -16px rgba(66,92,150,0.42), 0 10px 22px -6px rgba(80,100,150,0.22), 0 0 46px rgba(60,120,255,${0.1 * glow})` }} />
        {/* refracted + frosted backdrop (a copy of the background, bent at the bezel) */}
        <div style={{ position: "absolute", inset: 0, borderRadius: BTN.h / 2, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: -M, top: -M, width: BTN.w + M * 2, height: BTN.h + M * 2, overflow: "hidden", filter: "url(#lg-refract) blur(1.1px) saturate(1.3) brightness(1.03)" }}>
            <div style={{ position: "absolute", left: -(BTN_LEFT - M), top: -(BTN_TOP - M) }}>
              <SoftBg f={f} boost />
            </div>
          </div>
          {/* milky tint + vertical falloff */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.20) 46%, rgba(255,255,255,0.12) 62%, rgba(255,255,255,0.38) 100%)" }} />
          {/* blue light pooled inside on the left */}
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 190px 120px at 0% 52%, rgba(46,110,255,${0.46 * glow}) 0%, rgba(86,150,255,${0.2 * glow}) 46%, transparent 78%)` }} />
          {/* top gloss */}
          <div style={{ position: "absolute", left: 38, right: 38, top: 5, height: 40, borderRadius: 40, background: "linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0))", filter: "blur(2.5px)", opacity: 0.8 }} />
        </div>
        {/* bezel: inner highlights / inner shadow */}
        <div style={{ position: "absolute", inset: 0, borderRadius: BTN.h / 2, boxShadow: "inset 0 1.5px 1px rgba(255,255,255,0.95), inset 0 -2px 3px rgba(130,150,190,0.40), inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 -16px 26px -12px rgba(255,255,255,0.7), inset 0 14px 22px -14px rgba(90,110,160,0.25)" }} />
        {/* blue edge light (left rim) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: BTN.h / 2,
            padding: 3.2,
            background: `radial-gradient(ellipse 210px 150px at 0% 50%, rgba(18,92,255,${Math.min(1, 1.0 * glow)}) 0%, rgba(70,140,255,${0.7 * glow}) 34%, rgba(150,190,255,${0.22 * glow}) 62%, transparent 82%)`,
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div style={{ position: "absolute", left: -10, top: BTN.h * 0.22, width: 30, height: BTN.h * 0.56, borderRadius: 20, background: `rgba(40,110,255,${0.35 * glow})`, filter: "blur(14px)" }} />
        {/* content */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 26, paddingLeft: 6 }}>
          <svg width={40} height={44} viewBox="0 0 40 44">
            <path d="M9 6.5 L33 22 L9 37.5 Z" fill="#3a4251" stroke="#3a4251" strokeWidth={7} strokeLinejoin="round" />
          </svg>
          <div style={{ fontFamily: '"SF Pro Display", "Helvetica Neue", "PingFang SC", sans-serif', fontWeight: 500, fontSize: 50, letterSpacing: "0.02em", color: "#343b49", lineHeight: 1 }}>Play</div>
        </div>
      </div>
      <Hand x={cur.x} y={cur.y} op={cur.op} press={press} />
    </div>
  );
};
