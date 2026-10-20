import React from "react";
import { SlotReel } from "../../shared/components/SlotReel";
import { BrandMark } from "./BrandMark";
import { C } from "../theme";

/** Width of the text field inside a fully expanded bar (same maths as launch). */
export const getFieldWidth = (width: number, height: number) => {
  const pad = height * 0.16;
  const av = height - pad * 2;
  return width - pad * 2 - av * 2 - pad * 1.1 * 2;
};

/** Dark search/prompt pill (launch PromptBar re-skinned to the OpenVLab dark theme). */
export const PromptBar: React.FC<{
  cx: number;
  cy: number;
  width: number;
  height: number;
  expand?: number;
  text: string;
  caret: boolean;
  placeholder?: string;
  reel?: { items: string[]; position: number; opacity: number; velocity?: number };
  scrollX?: number;
  caretOpacity?: number;
  sendScale?: number;
  sendActive?: boolean;
  fontSize: number;
  fontFamily: string;
  contentOpacity?: number;
  logoSrc: string;
  accentColor: string;
}> = ({ cx, cy, width, height, expand = 1, text, caret, placeholder, reel, scrollX = 0, caretOpacity, sendScale = 1, sendActive, fontSize, fontFamily, contentOpacity = 1, logoSrc, accentColor }) => {
  const w = height + (width - height) * expand;
  const pad = height * 0.16;
  const av = height - pad * 2;
  const showText = text.length > 0;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - w / 2,
        top: cy - height / 2,
        width: w,
        height,
        borderRadius: height / 2,
        background: "linear-gradient(180deg, #17191D 0%, #101114 100%)",
        border: `1px solid ${C.border}`,
        boxShadow: `0 0 0 1px rgba(255,255,255,0.03) inset, 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(175,243,62,0.06)`,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: pad,
        gap: pad * 1.1,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: pad * 1.1, flex: 1, minWidth: 0, opacity: contentOpacity, height: "100%" }}>
        <div style={{ width: av, height: av, borderRadius: av / 2, background: "#0A0A0A", border: `1px solid ${C.border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BrandMark size={av * 0.74} src={logoSrc} />
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "center", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)", maskImage: "linear-gradient(to bottom, transparent 0%, #000 30%, #000 70%, transparent 100%)" }}>
          {reel && !showText ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", opacity: reel.opacity }}>
              <SlotReel items={reel.items} position={reel.position} velocity={reel.velocity} lineHeight={fontSize * 1.5} visibleLines={3} fontSize={fontSize} fontFamily={fontFamily} color="#4A4E55" activeColor={C.ink} />
            </div>
          ) : null}
          <div style={{ position: "relative", width: "100%", overflow: "hidden", height: fontSize * 1.6, display: "flex", alignItems: "center" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", display: "flex", alignItems: "center", whiteSpace: "pre", color: C.ink, fontSize, fontFamily, letterSpacing: "-0.01em", transform: `translate3d(${-scrollX}px, 0, 0)`, willChange: "transform" }}>
              {showText ? text : placeholder && !reel ? <span style={{ color: C.dim }}>{placeholder}</span> : null}
              <span style={{ display: "inline-block", width: 2.5, height: fontSize * 1.15, background: accentColor, marginLeft: 3, opacity: caretOpacity ?? (caret ? 1 : 0), borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: av, height: av, borderRadius: av / 2, background: sendActive ? accentColor : "#24272C", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sendScale})`, opacity: contentOpacity, boxShadow: sendActive ? `0 0 24px ${accentColor}55` : "none" }}>
        <svg width={av * 0.42} height={av * 0.42} viewBox="0 0 24 24" fill="none" stroke={sendActive ? "#000" : "#7A7F87"} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    </div>
  );
};
