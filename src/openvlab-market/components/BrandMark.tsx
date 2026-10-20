import React from "react";
import { Img, staticFile } from "remotion";
import { isUrl } from "../theme";

/** OpenVLab logo (public/openvlab/logo.svg, copied from vlab-frontend/apps/openvlab-web/public/logo.svg). */
export const BrandMark: React.FC<{ size: number; src: string; opacity?: number; glow?: number }> = ({ size, src, opacity = 1, glow = 0 }) => (
  <div style={{ width: size, height: size, position: "relative", opacity }}>
    {glow > 0 ? (
      <div style={{ position: "absolute", inset: -size * 0.35, borderRadius: "50%", background: `radial-gradient(circle, rgba(254,214,0,${0.28 * glow}) 0%, rgba(254,214,0,0) 62%)` }} />
    ) : null}
    <Img src={isUrl(src) ? src : staticFile(src)} style={{ position: "absolute", inset: 0, width: size, height: size, objectFit: "contain" }} />
  </div>
);
