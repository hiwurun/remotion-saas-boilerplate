import React, { useMemo } from "react";
import { C, SANS } from "../theme";
import { FPS, W, fadeWin } from "../timeline";

export type CaptionSeg = {
  /** Plain text segment (no highlight). */
  text: string;
  /** If true, this word/phrase gets the lime pill when active. */
  key?: boolean;
};

type Props = {
  frame: number;
  /** Shot window [from, to] seconds. */
  from: number;
  to: number;
  /** Segments in reading order. Key segments light up in sequence. */
  segs: CaptionSeg[];
  /** Seconds after `from` when each key segment snaps on (relative). */
  keyTimes?: number[];
};

/**
 * Bottom caption bar — dark strip, white text, lime keyword pills.
 * Word-by-word: key segments snap highlight in narration rhythm.
 */
export const CaptionBar: React.FC<Props> = ({ frame, from, to, segs, keyTimes }) => {
  const opacity = fadeWin(frame, from, to, 0.4);
  const t = frame / FPS;
  const keys = useMemo(() => segs.map((s, i) => (s.key ? i : -1)).filter((i) => i >= 0), [segs]);
  const defaults = useMemo(() => keys.map((_, i) => 0.55 + i * 0.85), [keys]);
  const times = keyTimes && keyTimes.length === keys.length ? keyTimes : defaults;

  if (opacity <= 0.01) return null;

  let activeKeyIdx = -1;
  for (let i = 0; i < keys.length; i++) {
    if (t >= from + times[i]!) activeKeyIdx = i;
  }

  let keyCursor = 0;

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        bottom: 36,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
        zIndex: 40,
      }}
    >
      <div
        style={{
          background: C.captionBg,
          borderRadius: 12,
          padding: "14px 28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.06)",
          maxWidth: 1280,
          fontFamily: SANS,
          fontSize: 28,
          fontWeight: 500,
          color: C.white,
          lineHeight: 1.45,
          letterSpacing: "0.02em",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "0 2px",
        }}
      >
        {segs.map((seg, i) => {
          if (!seg.key) {
            return (
              <span key={i} style={{ whiteSpace: "pre-wrap" }}>
                {seg.text}
              </span>
            );
          }
          const myKey = keyCursor++;
          const on = myKey <= activeKeyIdx;
          const isCurrent = myKey === activeKeyIdx;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                margin: "0 3px",
                padding: on ? "2px 10px" : "2px 4px",
                borderRadius: 8,
                background: on ? C.lime : "transparent",
                color: on ? C.ink : C.white,
                fontWeight: 600,
                transform: isCurrent ? "scale(1.04)" : "scale(1)",
                boxShadow: isCurrent ? `0 0 18px ${C.limeDim}` : undefined,
              }}
            >
              {seg.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
