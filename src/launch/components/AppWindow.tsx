import React from "react";
import { interpolate } from "remotion";
import { C, CLAMP, EASE, withAlpha } from "../theme";
import { BrandMark } from "./BrandMark";

export type Rect = { x: number; y: number; w: number; h: number };
export type WindowGeometry = {
  left: number;
  top: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  header: number;
  logo: Rect;
  privateBadge: Rect;
  codeBtn: Rect;
};

export const getWindowGeometry = (W: number, H: number, isPortrait: boolean): WindowGeometry => {
  const w = isPortrait ? 940 : 1400;
  const h = isPortrait ? 1360 : 800;
  const cx = W / 2;
  const cy = isPortrait ? 860 : 480;
  const left = cx - w / 2;
  const top = cy - h / 2;
  const header = isPortrait ? 84 : 76;
  const codeW = 124;
  const badgeW = 136;
  const bh = 40;
  return {
    left, top, w, h, cx, cy, header,
    logo: { x: left + 20, y: top + header / 2 - 22, w: 168, h: 44 },
    codeBtn: { x: left + w - 24 - codeW, y: top + header / 2 - bh / 2, w: codeW, h: bh },
    privateBadge: { x: left + w - 24 - codeW - 12 - badgeW, y: top + header / 2 - bh / 2, w: badgeW, h: bh },
  };
};

/** One dashboard block that resolves from a blue wireframe skeleton into real UI. */
const Block: React.FC<{ p: number; accent: string; style?: React.CSSProperties; radius?: number; children: React.ReactNode; bare?: boolean }> = ({ p, accent, style, radius = 14, children, bare }) => {
  const skel = 1 - p;
  return (
    <div style={{ position: "relative", borderRadius: radius, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          opacity: p,
          background: bare ? "transparent" : "#fff",
          border: bare ? "none" : `1px solid ${C.border}`,
          overflow: "hidden",
          transform: `scale(${0.985 + 0.015 * p})`,
        }}
      >
        {children}
      </div>
      {skel > 0.001 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            opacity: skel,
            border: `1.5px dashed ${withAlpha(accent, 0.55)}`,
            background: withAlpha(accent, 0.04),
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            overflow: "hidden",
          }}
        >
          <div style={{ width: "38%", height: 12, borderRadius: 6, background: withAlpha(accent, 0.18) }} />
          <div style={{ width: "62%", height: 12, borderRadius: 6, background: withAlpha(accent, 0.12) }} />
          <div style={{ flex: 1, borderRadius: 8, background: withAlpha(accent, 0.07), minHeight: 0 }} />
        </div>
      ) : null}
    </div>
  );
};

const STATS = [
  { label: "总收入", value: "¥328,450", delta: "+20.1%" },
  { label: "订阅数", value: "2,350", delta: "+18.2%" },
  { label: "当前在线", value: "573", delta: "+201" },
  { label: "转化率", value: "3.42%", delta: "+0.4%" },
];
const ORDERS = [
  { name: "王晓雨", status: "已支付", amount: "¥12,999" },
  { name: "李嘉明", status: "待处理", amount: "¥299" },
  { name: "陈思远", status: "已支付", amount: "¥1,980" },
  { name: "张一帆", status: "已退款", amount: "¥699" },
  { name: "刘子涵", status: "已支付", amount: "¥3,450" },
  { name: "赵乐", status: "已支付", amount: "¥860" },
];
const BARS = [42, 58, 47, 66, 52, 74, 61, 83, 70, 92, 78, 88];
const NAV = ["概览", "订单", "产品", "客户", "数据分析", "设置"];

export const AppWindow: React.FC<{
  geo: WindowGeometry;
  isPortrait: boolean;
  /** frames since components started resolving (≤0 = all skeleton) */
  resolveT: number;
  accent: string;
  logoColor: string;
  textScale: number;
  appName: string;
  privacyLabel: string;
  font: string;
  codePressed?: number;
  badgePressed?: number;
  logoSrc?: string;
}> = ({ geo, isPortrait, resolveT, accent, logoColor, textScale, appName, privacyLabel, font, codePressed = 0, badgePressed = 0, logoSrc }) => {
  const P = (i: number) => interpolate(resolveT, [i * 7, i * 7 + 26], [0, 1], { ...CLAMP, easing: EASE });
  const pad = isPortrait ? 28 : 32;
  const gap = isPortrait ? 20 : 20;
  const nOrders = 5;

  const header = (
    <div style={{ height: geo.header, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
      <Block p={P(0)} accent={accent} bare radius={10} style={{ width: geo.logo.w, height: geo.logo.h, marginLeft: -4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, height: "100%", paddingLeft: 4 }}>
          <BrandMark size={28} color={logoColor} logoSrc={logoSrc} />
          <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.02em", color: logoColor }}>{appName}</span>
        </div>
      </Block>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Block p={P(1)} accent={accent} radius={20} style={{ width: geo.privateBadge.w, height: geo.privateBadge.h, transform: `scale(${1 - badgePressed * 0.06})` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: "100%", fontSize: 16, fontWeight: 500, color: C.ink }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={2.2} strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            {privacyLabel}
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth={2.4} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </Block>
        <Block p={P(1.5)} accent={accent} radius={10} bare style={{ width: geo.codeBtn.w, height: geo.codeBtn.h, transform: `scale(${1 - codePressed * 0.08})` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: "100%", borderRadius: 10, background: "#000", color: "#fff", fontSize: 16, fontWeight: 500 }}>
            代码 <span style={{ fontFamily: "monospace", fontSize: 15, opacity: 0.8 }}>{"</>"}</span>
          </div>
        </Block>
      </div>
    </div>
  );

  const sidebar = isPortrait ? null : (
    <Block p={P(2)} accent={accent} bare radius={0} style={{ width: 232, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
      <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 12px 10px" }}>工作区</div>
        {NAV.map((n, i) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, background: i === 0 ? "#F2F2F2" : "transparent", fontSize: 16, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.ink : C.text2 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${i === 0 ? "#000" : C.border2}` }} />
            {n}
          </div>
        ))}
      </div>
    </Block>
  );

  const stats = (
    <div style={{ display: "grid", gridTemplateColumns: isPortrait ? "1fr 1fr" : "repeat(4, 1fr)", gap, flexShrink: 0 }}>
      {STATS.map((s, i) => (
        <Block key={s.label} p={P(3 + i * 0.6)} accent={accent} style={{ height: isPortrait ? 150 : 128 }}>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div style={{ fontSize: 15, color: C.text2 }}>{s.label}</div>
            <div style={{ fontSize: 30 * textScale, fontWeight: 600 + (textScale > 1.05 ? 100 : 0), letterSpacing: "-0.03em", color: C.ink, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              <span style={{ color: C.ink, fontWeight: 500 }}>{s.delta}</span> 较上月
            </div>
          </div>
        </Block>
      ))}
    </div>
  );

  const chart = (
    <Block p={P(6)} accent={accent} style={{ flex: isPortrait ? "0 0 380px" : "1.5 1 0", minWidth: 0, minHeight: 0 }}>
      <div style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 18 * Math.min(textScale, 1.12), fontWeight: 600, color: C.ink }}>营收趋势</div>
          <div style={{ fontSize: 13, color: C.muted }}>1 月 – 12 月</div>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 10, paddingTop: 18, minHeight: 0 }}>
          {BARS.map((b, i) => {
            const grow = interpolate(resolveT, [60 + i * 2, 100 + i * 2], [0.15, 1], { ...CLAMP, easing: EASE });
            return <div key={i} style={{ flex: 1, height: `${b * grow}%`, borderRadius: 6, background: i === BARS.length - 3 ? "#000" : "#E6E6E6" }} />;
          })}
        </div>
      </div>
    </Block>
  );

  const table = (
    <Block p={P(7)} accent={accent} style={{ flex: "1 1 0", minWidth: 0, minHeight: 0 }}>
      <div style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 18 * Math.min(textScale, 1.12), fontWeight: 600, color: C.ink, marginBottom: 10 }}>最近订单</div>
        {ORDERS.slice(0, nOrders).map((o, i) => (
          <div key={o.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 17, background: "#F2F2F2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: C.text2 }}>
              {Array.from(o.name)[0]}
            </div>
            <div style={{ flex: 1, fontSize: 15, color: C.ink, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.name}</div>
            <div style={{ fontSize: 12, color: C.text2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "3px 10px" }}>{o.status}</div>
            <div style={{ fontSize: 15, color: C.ink, fontWeight: 500, width: 92, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{o.amount}</div>
          </div>
        ))}
      </div>
    </Block>
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: geo.w,
        height: geo.h,
        borderRadius: 22,
        background: "#fff",
        border: `1px solid ${C.border}`,
        boxShadow: C.shadow,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: font,
      }}
    >
      {header}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {sidebar}
        <div style={{ flex: 1, padding: pad, display: "flex", flexDirection: "column", gap, minWidth: 0 }}>
          <Block p={P(2.5)} accent={accent} bare radius={8} style={{ flexShrink: 0, height: 74 }}>
            <div style={{ fontSize: 34 * textScale, fontWeight: textScale > 1.05 ? 700 : 600, letterSpacing: "-0.035em", color: C.ink, lineHeight: 1.1 }}>数据看板</div>
            <div style={{ fontSize: 16, color: C.text2, marginTop: 6 }}>欢迎回来，这是今天的业务概况。</div>
          </Block>
          {stats}
          <div style={{ flex: 1, display: "flex", flexDirection: isPortrait ? "column" : "row", gap, minHeight: 0 }}>
            {chart}
            {table}
          </div>
        </div>
      </div>
    </div>
  );
};
