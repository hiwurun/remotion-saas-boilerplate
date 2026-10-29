import React from "react";

/** macOS-style pointer; (x,y) is the tip. `press` 0..1 squashes it slightly. */
export const Cursor: React.FC<{ x: number; y: number; opacity?: number; press?: number; size?: number }> = ({ x, y, opacity = 1, press = 0, size = 44 }) => (
  <svg
    width={size}
    height={size * 1.4}
    viewBox="0 0 24 34"
    style={{ position: "absolute", left: x, top: y, opacity, transform: `scale(${1 - press * 0.12})`, transformOrigin: "2px 2px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.6))" }}
  >
    <path d="M2 2 L2 26 L8.2 20.4 L12.4 30 L16 28.4 L11.8 19 L20 18.6 Z" fill="#fff" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
  </svg>
);
