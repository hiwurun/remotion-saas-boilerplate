import React from "react";
import { C, SANS } from "../theme";
import { WIN } from "../timeline";

type Props = {
  opacity: number;
  scale?: number;
  children: React.ReactNode;
  url?: string;
};

/** macOS-style floating browser chrome wrapping the drawn product UI. */
export const AppWindow: React.FC<Props> = ({
  opacity,
  scale = 1,
  children,
  url = "openvlab.app/strategy-builder",
}) => {
  if (opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: WIN.left,
        top: WIN.top,
        width: WIN.w,
        height: WIN.h,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: C.shadow,
        background: C.browserChrome,
        fontFamily: SANS,
      }}
    >
      <div
        style={{
          height: 36,
          background: C.browserBar,
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.trafficRed }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.trafficYellow }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.trafficGreen }} />
        <div
          style={{
            marginLeft: 14,
            flex: 1,
            height: 20,
            borderRadius: 6,
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ width: "100%", height: WIN.h - 36, background: C.uiBg, overflow: "hidden", position: "relative" }}>
        {children}
      </div>
    </div>
  );
};
