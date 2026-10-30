import React from "react";
import { AbsoluteFill, Audio, Easing, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { SANS } from "../shared/fonts";
import { CLAMP } from "../shared/motion";
import { APICLIP, B2, B3, BGM, FLYOVER, FPS, H, SHOT1, SHOT2, SHOT3, TOTAL, W, ramp, s } from "./timeline";

export { FPS, H, TOTAL, W };

/** The flyover's own page background (sampled from its edges), used for the side bars and as the shot-2 canvas. */
const FLY_BG = "#f1f2f5";
/** Transition curve requested for this video: cubic-bezier(.45,0,.15,1). */
const TR = Easing.bezier(0.45, 0, 0.15, 1);
const YELLOW = "#FED600";
const INK = "#16181d";
/** 5:4 source in 16:9: contain (scale 1080/1152 = 0.9375 -> 1350x1080, 285 px bars each side) so nothing is cropped;
 *  the left/right 48 px of the video fade into the bar colour so content touching the edges has no hard seam. */
const FLY_W = Math.round((FLYOVER.w * H) / FLYOVER.h);
const EDGE = 48;
/** Centre of the 「OpenVLab 市场快报」 title in the flyover's last frame (source y 376-425 -> 1080-frame y ~375). Shot 2's title sits on the same line. */
const TITLE_Y = 375;
/** Bullet dot grow duration (frames). */
const DOT_DUR = 24;

/** Solid opaque canvas. Put under every layer so no frame ever has a transparent pixel. */
const Canvas: React.FC = () => <AbsoluteFill style={{ backgroundColor: FLY_BG, opacity: 1 }} />;

const Flyover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: FLY_BG, alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        width: FLY_W,
        height: H,
        WebkitMaskImage: `linear-gradient(90deg, transparent 0, #000 ${EDGE}px, #000 calc(100% - ${EDGE}px), transparent 100%)`,
        maskImage: `linear-gradient(90deg, transparent 0, #000 ${EDGE}px, #000 calc(100% - ${EDGE}px), transparent 100%)`,
      }}
    >
      <OffthreadVideo src={staticFile(FLYOVER.src)} muted style={{ width: "100%", height: "100%", objectFit: "contain" }} />
    </div>
  </AbsoluteFill>
);

/** Shot 1 -> 2 handoff: the flyover's (already static) last frame eases back a touch, drifts up and dissolves into the matching grey canvas,
 *  while the list title rises on the exact line where 「OpenVLab 市场快报」 was. Rendered in absolute frames. */
const FlyoverOut: React.FC = () => {
  const f = useCurrentFrame() + SHOT2[0];
  const t = ramp(f, B2.outStart, B2.outEnd, TR);
  if (t >= 1) return null;
  const scale = interpolate(t, [0, 1], [1, 0.96]);
  // radial dissolve: transparent hole grows from the edges inward so the white card melts into the grey from outside in
  const inner = interpolate(t, [0, 1], [120, 0]);
  const outer = interpolate(t, [0, 1], [180, 40]);
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(t, [0, 0.35, 1], [1, 0.85, 0]),
        transform: `translateY(${interpolate(t, [0, 1], [0, -36])}px) scale(${scale})`,
        transformOrigin: `50% ${TITLE_Y}px`,
        filter: `blur(${interpolate(t, [0.2, 1], [0, 6], CLAMP)}px)`,
        WebkitMaskImage: `radial-gradient(ellipse 70% 75% at 50% ${TITLE_Y}px, #000 ${inner}%, transparent ${outer}%)`,
        maskImage: `radial-gradient(ellipse 70% 75% at 50% ${TITLE_Y}px, #000 ${inner}%, transparent ${outer}%)`,
      }}
    >
      <Freeze frame={FLYOVER.frames - 1}>
        <Flyover />
      </Freeze>
    </AbsoluteFill>
  );
};

const ITEMS: { text: string; optional?: boolean }[] = [
  { text: "OpenVLab 的 API Key" },
  { text: "一个 Agent" },
  { text: "一个邮箱账号", optional: true },
];

const ListShot: React.FC = () => {
  const f = useCurrentFrame() + SHOT2[0];
  const title = ramp(f, B2.titleStart, B2.titleEnd, TR);
  const line = ramp(f, B2.titleStart - 6, B2.titleStart + 30, TR);
  const brand = ramp(f, B2.brandStart, B2.brandStart + 36, TR);
  // hand-off to shot 3: everything but item 1 dims, then all of it clears in the first ~45% of the reveal
  const emph = ramp(f, B3.emphStart, B3.emphEnd, TR);
  const exit = ramp(f, B3.revealStart, B3.revealStart + s(0.36), TR);
  const rest = interpolate(emph, [0, 1], [1, 0.2]) * (1 - exit);
  return (
    <AbsoluteFill style={{ fontFamily: SANS, color: INK }}>
      {/* title: rises out of a mask whose bottom edge is a thin hairline */}
      <div style={{ position: "absolute", left: 0, right: 0, top: TITLE_Y - 62, display: "flex", flexDirection: "column", alignItems: "center", opacity: rest }}>
        <div style={{ overflow: "hidden", padding: "0 12px" }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: "124px",
              transform: `translateY(${(1 - title) * 112}%)`,
              opacity: interpolate(title, [0, 0.4], [0, 1], CLAMP),
            }}
          >
            你需要准备什么？
          </div>
        </div>
        <div style={{ width: 72, height: 4, borderRadius: 2, background: YELLOW, marginTop: 18, transform: `scaleX(${line})`, opacity: line }} />
      </div>

      {/* list: centred column, left-aligned items */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 44 }}>
          {ITEMS.map((it, i) => {
            const a = B2.itemStart + i * B2.stagger;
            const p = ramp(f, a, a + B2.itemDur, TR);
            const dot = ramp(f, a + 2, a + 2 + DOT_DUR, TR);
            const tone = (it.optional ? 0.62 : 1) * (i === 0 ? 1 - exit : rest);
            return (
              <li key={it.text} style={{ display: "flex", alignItems: "center", gap: 32, height: 64, opacity: p * tone, transform: `translateY(${(1 - p) * 22}px)` }}>
                <span style={{ width: 18, height: 18, borderRadius: 9, background: YELLOW, transform: `scale(${dot})`, opacity: it.optional ? 0.75 : 1, flex: "none" }} />
                <span style={{ fontSize: 52, fontWeight: it.optional ? 500 : 600, letterSpacing: "-0.005em" }}>{it.text}</span>
                {it.optional ? (
                  <span style={{ fontSize: 26, fontWeight: 500, color: "#5b616e", border: "1.5px solid #c9ccd3", borderRadius: 999, padding: "4px 16px", lineHeight: "34px", marginLeft: -4 }}>
                    可选
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      {/* quiet brand mark */}
      <div style={{ position: "absolute", left: 80, top: 64, display: "flex", alignItems: "center", gap: 14, opacity: brand * 0.9 * rest }}>
        <Img src={staticFile("legend-bot/logo.svg")} style={{ width: 40, height: 40 }} />
        <span style={{ fontSize: 24, fontWeight: 600, color: "#2a2d34" }}>OpenVLab</span>
      </div>
    </AbsoluteFill>
  );
};


/** Item 1 「OpenVLab 的 API Key」 row in the settled list (dot + text measured from a still: x 684-1244, y 566-617), padded into a pill. */
const PILL = { x: 652, y: 550, w: 624, h: 84 };

/** Shot 3 opener: a white pill fades in behind item 1 (the clip's topic), then widens into the full frame as a window onto api.mp4.
 *  The window is a clip-path on a full-frame layer: the clip is always 1920x1080 at 0,0 — no scale/translate on it or its parents.
 *  Fit = fill: the whole source frame is shown edge to edge (no crop, no bars). Source is 3648x2160 (1.689), so 1920x1080 is a
 *  5.3 % horizontal stretch; use "contain" (48 px side bars) or "cover" (28 px cropped top/bottom) instead if that matters. */
const ApiShot: React.FC = () => {
  const f = useCurrentFrame() + B3.emphStart;
  const pill = ramp(f, B3.emphStart, B3.emphEnd, TR);
  const t = ramp(f, B3.revealStart, B3.revealEnd, TR);
  const x = interpolate(t, [0, 1], [PILL.x, 0]);
  const y = interpolate(t, [0, 1], [PILL.y, 0]);
  const w = interpolate(t, [0, 1], [PILL.w, W]);
  const h = interpolate(t, [0, 1], [PILL.h, H]);
  const radius = interpolate(t, [0, 1], [PILL.h / 2, 0]);
  const video = interpolate(t, [0.05, 0.55], [0, 1], CLAMP);
  const window = `inset(${y}px ${W - x - w}px ${H - y - h}px ${x}px round ${radius}px)`;
  return (
    <AbsoluteFill>
      {/* soft shadow under the pill, fades out as it opens (sibling, not a parent of the clip) */}
      <div
        style={{
          position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius, opacity: pill * (1 - t),
          boxShadow: "0 1px 2px rgba(20,24,33,0.06), 0 8px 24px rgba(20,24,33,0.06)",
        }}
      />
      <AbsoluteFill style={{ clipPath: window, opacity: pill }}>
        <AbsoluteFill style={{ backgroundColor: "#ffffff" }} />
        <AbsoluteFill style={{ opacity: video }}>
          <Sequence from={B3.revealStart - B3.emphStart} durationInFrames={APICLIP.frames} name="api-clip" layout="none">
            <OffthreadVideo
              src={staticFile(APICLIP.src)}
              muted
              style={{ position: "absolute", left: 0, top: 0, width: W, height: H, objectFit: "fill", display: "block" }}
            />
          </Sequence>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Legend Bot. Shot 1 = OpenVLab flyover; shot 2 = 「你需要准备什么？」 list; shot 3 = api.mp4; BGM spans the whole composition. */
export const LegendBotVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: FLY_BG }}>
    <Canvas />
    <Audio
      src={staticFile(BGM.src)}
      volume={(f) => BGM.volume * interpolate(f, [0, BGM.fadeIn, TOTAL - BGM.fadeOut, TOTAL - 1], [0, 1, 1, 0], CLAMP)}
    />
    <Sequence from={SHOT1[0]} durationInFrames={SHOT1[1] - SHOT1[0]} name="shot1-flyover">
      <Flyover />
    </Sequence>
    {/* shot 2's own opaque canvas, until the clip window starts opening (after that the window sits between it and the list) */}
    <Sequence from={SHOT2[0]} durationInFrames={B3.emphStart - SHOT2[0]} name="shot2-canvas">
      <Canvas />
    </Sequence>
    {/* shot 3 window sits under the (transparent) list layer so item 1 stays readable on its pill until it fades */}
    <Sequence from={B3.emphStart} durationInFrames={SHOT3[1] - B3.emphStart} name="shot3-api">
      <ApiShot />
    </Sequence>
    <Sequence from={SHOT2[0]} durationInFrames={SHOT2[1] - SHOT2[0]} name="shot2-list">
      <ListShot />
      <FlyoverOut />
    </Sequence>
  </AbsoluteFill>
);
