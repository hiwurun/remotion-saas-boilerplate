import React from "react";
import { SlotReel } from "./SlotReel";

/** Width of the text field inside a fully expanded bar (used to compute the scroll offset). */
export const getFieldWidth = (width: number, height: number) => {
  const pad = height * 0.16;
  const av = height - pad * 2;
  return width - pad * 2 - av * 2 - pad * 1.1 * 2;
};

/** Black pill prompt input. Pure presentational: every state comes from props. */
export const PromptBar: React.FC<{
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** 0..1 horizontal expansion from the centre (0 = circle). */
  expand?: number;
  text: string;
  caret: boolean;
  placeholder?: string;
  reel?: { items: string[]; position: number; opacity: number; velocity?: number };
  /** Horizontal scroll of the text field in px (float, already smoothed by the caller). */
  scrollX?: number;
  /** Caret opacity 0..1 (smooth blink). */
  caretOpacity?: number;
  sendScale?: number;
  sendActive?: boolean;
  fontSize: number;
  fontFamily: string;
  contentOpacity?: number;
  avatarLabel?: string;
  accentColor: string;
}> = ({ cx, cy, width, height, expand = 1, text, caret, placeholder, reel, scrollX = 0, caretOpacity, sendScale = 1, sendActive, fontSize, fontFamily, contentOpacity = 1, avatarLabel = "A", accentColor }) => {
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
        background: "#000",
        boxShadow: "0 2px 4px rgba(0,0,0,0.08), 0 20px 50px rgba(0,0,0,0.18)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        padding: pad,
        gap: pad * 1.1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: pad * 1.1, flex: 1, minWidth: 0, opacity: contentOpacity, height: "100%" }}>
        <div
          style={{
            width: av,
            height: av,
            borderRadius: av / 2,
            background: "#fff",
            color: "#000",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontWeight: 600,
            fontSize: av * 0.42,
          }}
        >
          {avatarLabel}
        </div>
        <div style={{ position: "relative", flex: 1, minWidth: 0, height: "100%", display: "flex", alignItems: "center" }}>
          {reel && !showText ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", opacity: reel.opacity }}>
              <SlotReel items={reel.items} position={reel.position} velocity={reel.velocity} lineHeight={fontSize * 1.5} visibleLines={3} fontSize={fontSize} fontFamily={fontFamily} color="#5C5C5C" activeColor="#A1A1A1" />
            </div>
          ) : null}
          {/* text field: sub-pixel translate3d scroll, offset smoothed by the caller */}
          <div style={{ position: "relative", width: "100%", overflow: "hidden", height: fontSize * 1.6, display: "flex", alignItems: "center" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                whiteSpace: "pre",
                color: "#fff",
                fontSize,
                fontFamily,
                letterSpacing: "-0.01em",
                transform: `translate3d(${-scrollX}px, 0, 0)`,
                willChange: "transform",
              }}
            >
              {showText ? text : placeholder && !reel ? <span style={{ color: "#8F8F8F" }}>{placeholder}</span> : null}
              <span style={{ display: "inline-block", width: 2.5, height: fontSize * 1.15, background: accentColor, marginLeft: 3, opacity: caretOpacity ?? (caret ? 1 : 0), borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          width: av,
          height: av,
          borderRadius: av / 2,
          background: sendActive ? "#fff" : "#2E2E2E",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${sendScale})`,
          opacity: contentOpacity,
        }}
      >
        <svg width={av * 0.42} height={av * 0.42} viewBox="0 0 24 24" fill="none" stroke={sendActive ? "#000" : "#8F8F8F"} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    </div>
  );
};
