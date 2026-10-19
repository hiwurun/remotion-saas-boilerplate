import React from "react";
import { Img, interpolate, random, staticFile } from "remotion";
import { C, CLAMP, EASE, isUrl } from "../theme";

const bar = (w: number | string, h: number, bg = "#EDEDED", r = 8): React.CSSProperties => ({ width: w, height: h, background: bg, borderRadius: r, flexShrink: 0 });

/** Vector UI mock used as a grid tile (no images needed). */
export const MockTile: React.FC<{ variant: number; w: number; h: number; accent: string }> = ({ variant, w, h, accent }) => {
  const v = variant % 6;
  const box: React.CSSProperties = { width: w, height: h, background: "#fff", borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: C.shadowSm, overflow: "hidden", display: "flex", flexDirection: "column" };
  const nav = (
    <div style={{ height: 70, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 18, flexShrink: 0 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#000" }} />
      <div style={bar(110, 14, "#D9D9D9")} />
      <div style={{ flex: 1 }} />
      <div style={bar(70, 12)} />
      <div style={bar(70, 12)} />
      <div style={bar(110, 38, "#000", 10)} />
    </div>
  );
  if (v === 0)
    return (
      <div style={box}>
        {nav}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22 }}>
          <div style={bar("8%", 26, "#F2F2F2", 13)} />
          <div style={bar("62%", 58, "#111", 14)} />
          <div style={bar("44%", 58, "#111", 14)} />
          <div style={bar("38%", 18, "#E0E0E0")} />
          <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
            <div style={bar(170, 52, "#000", 12)} />
            <div style={{ ...bar(170, 52, "#fff", 12), border: `1px solid ${C.border2}` }} />
          </div>
        </div>
      </div>
    );
  if (v === 1)
    return (
      <div style={{ ...box, flexDirection: "row" }}>
        <div style={{ width: "26%", borderRight: `1px solid ${C.border}`, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={bar("100%", 44, "#000", 10)} />
          {new Array(8).fill(0).map((_, i) => <div key={i} style={bar(`${60 + ((i * 17) % 35)}%`, 14, i === 1 ? "#D9D9D9" : "#EFEFEF")} />)}
        </div>
        <div style={{ flex: 1, padding: 36, display: "flex", flexDirection: "column", gap: 22, justifyContent: "flex-end" }}>
          <div style={{ alignSelf: "flex-end", ...bar("46%", 64, "#F2F2F2", 18) }} />
          <div style={{ ...bar("62%", 110, "#fff", 18), border: `1px solid ${C.border}` }} />
          <div style={{ alignSelf: "flex-end", ...bar("34%", 64, "#F2F2F2", 18) }} />
          <div style={{ ...bar("100%", 72, "#000", 36) }} />
        </div>
      </div>
    );
  if (v === 2)
    return (
      <div style={box}>
        {nav}
        <div style={{ flex: 1, display: "flex", gap: 24, padding: 40, alignItems: "stretch" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ flex: 1, borderRadius: 18, border: i === 1 ? "2px solid #000" : `1px solid ${C.border}`, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={bar("40%", 16, "#D9D9D9")} />
              <div style={bar("55%", 48, "#111", 10)} />
              {new Array(4).fill(0).map((_, k) => <div key={k} style={bar(`${70 - k * 8}%`, 12)} />)}
              <div style={{ flex: 1 }} />
              <div style={bar("100%", 48, i === 1 ? "#000" : "#F2F2F2", 10)} />
            </div>
          ))}
        </div>
      </div>
    );
  if (v === 3)
    return (
      <div style={box}>
        {nav}
        <div style={{ flex: 1, display: "flex", gap: 20, padding: 30 }}>
          {[3, 2, 4, 1].map((n, i) => (
            <div key={i} style={{ flex: 1, background: C.subtle, borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={bar("50%", 14, "#CFCFCF")} />
              {new Array(n).fill(0).map((_, k) => (
                <div key={k} style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={bar("80%", 12, "#DDD")} />
                  <div style={bar("50%", 10)} />
                  {i === 2 && k === 0 ? <div style={bar(60, 20, accent, 10)} /> : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  if (v === 4)
    return (
      <div style={box}>
        {nav}
        <div style={{ flex: 1, padding: 32, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", gap: 20 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ flex: 1, height: 120, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={bar("40%", 12)} />
                <div style={bar("60%", 34, "#111", 8)} />
              </div>
            ))}
          </div>
          <div style={{ flex: 1, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
            <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
              <path d="M0 120 C40 110 60 70 100 80 S160 40 200 55 S270 20 310 30 S370 10 400 14" fill="none" stroke="#000" strokeWidth={3} vectorEffect="non-scaling-stroke" />
              <path d="M0 130 C50 125 80 110 120 112 S200 95 240 100 S330 80 400 84" fill="none" stroke="#CFCFCF" strokeWidth={3} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        </div>
      </div>
    );
  return (
    <div style={{ ...box, alignItems: "center", justifyContent: "center", background: C.subtle }}>
      <div style={{ width: "40%", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, display: "flex", flexDirection: "column", gap: 18, boxShadow: C.shadowSm }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#000", alignSelf: "center" }} />
        <div style={{ ...bar("60%", 22, "#111"), alignSelf: "center" }} />
        <div style={{ ...bar("100%", 50, "#fff", 10), border: `1px solid ${C.border2}` }} />
        <div style={{ ...bar("100%", 50, "#fff", 10), border: `1.5px solid ${accent}` }} />
        <div style={bar("100%", 50, "#000", 10)} />
      </div>
    </div>
  );
};

/** Dense grid of tiles around a centre cell (the centre cell is left empty for the live window). */
export const InfiniteGrid: React.FC<{
  cx: number;
  cy: number;
  tileW: number;
  tileH: number;
  gap: number;
  cols: number;
  rows: number;
  t: number;
  accent: string;
  screenshots?: string[];
}> = ({ cx, cy, tileW, tileH, gap, cols, rows, t, accent, screenshots }) => {
  const tiles: React.ReactNode[] = [];
  const hc = Math.floor(cols / 2);
  const hr = Math.floor(rows / 2);
  let k = 0;
  for (let r = -hr; r <= hr; r++) {
    for (let c = -hc; c <= hc; c++) {
      if (r === 0 && c === 0) continue;
      const d = Math.hypot(c, r * 1.2);
      const p = interpolate(t, [d * 7, d * 7 + 40], [0, 1], { ...CLAMP, easing: EASE });
      if (p <= 0) {
        k++;
        continue;
      }
      const x = cx + c * (tileW + gap) - tileW / 2;
      const y = cy + r * (tileH + gap) - tileH / 2;
      const shot = screenshots && screenshots.length > 0 ? screenshots[k % screenshots.length] : null;
      tiles.push(
        <div key={`${r}-${c}`} style={{ position: "absolute", left: x, top: y, width: tileW, height: tileH, opacity: p, transform: `translateY(${(1 - p) * 60}px)` }}>
          {shot ? (
            <Img src={isUrl(shot) ? shot : staticFile(shot)} style={{ width: tileW, height: tileH, objectFit: "cover", borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: C.shadowSm }} />
          ) : (
            <MockTile variant={Math.floor(random(`tile-${r}-${c}`) * 6)} w={tileW} h={tileH} accent={accent} />
          )}
        </div>,
      );
      k++;
    }
  }
  return <>{tiles}</>;
};
