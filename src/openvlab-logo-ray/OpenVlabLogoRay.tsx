import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BrandMark } from "../openvlab-market/components/BrandMark";
import { CLAMP, EASE, EASE_OUT } from "../shared/motion";
import {
  ARM_ANGLE,
  ARM_LEN,
  LEFT_CLIP,
  LOGO_CENTER,
  LOGO_SIZE,
  PIVOT,
  PIVOT_PATH,
  RIGHT_CLIP,
  V_PATH,
  V_PATH_TRANSFORM,
} from "./vMark";

/**
 * Single trial shot: the OpenVlab mark settles, its amber disc drains into the V, the V's two arms hinge open
 * around the bottom vertex, and the opened V projects as a cone of light (transition-ready end state).
 */
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const TOTAL = Math.round(3.75 * FPS);

const LOGO_SRC = "openvlab-market/logo.svg";
const BG = "#050608";
const GOLD = "#FED600";
const WARM = "#FFF6D2";
const AMBER = "#FFA63D";

const OPEN_DEG = 22;
/** Rotating the world by this makes the opened V's bisector point straight up. */
const LIFT_DEG = -((ARM_ANGLE.left + ARM_ANGLE.right) / 2 + 90);
/** Where the V's vertex lands once the cone is open (screen px). */
const VERTEX_END = { x: W / 2, y: 930 };
/** Local length the ray reaches; with the end scale this overshoots the frame on every side of the cone. */
const RAY_REACH = 2600;
const UNIT = 1000;

const INNER_RAYS = [
  { f: 0.16, len: 0.82, w: 2.2, o: 0.22, d: 0.0 },
  { f: 0.31, len: 0.64, w: 1.4, o: 0.16, d: 0.06 },
  { f: 0.44, len: 0.95, w: 3.0, o: 0.2, d: 0.02 },
  { f: 0.57, len: 0.7, w: 1.6, o: 0.14, d: 0.1 },
  { f: 0.69, len: 0.88, w: 2.4, o: 0.2, d: 0.04 },
  { f: 0.84, len: 0.6, w: 1.4, o: 0.15, d: 0.08 },
];

const SOFT_IN = Easing.bezier(0.33, 0, 0.2, 1);
const RAY_OUT = Easing.bezier(0.22, 0.75, 0.18, 1);

const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (deg: number, r: number) => `${(Math.cos(rad(deg)) * r).toFixed(2)} ${(Math.sin(rad(deg)) * r).toFixed(2)}`;
const wedgePath = (a1: number, a2: number) => `M0 0 L${polar(a1, UNIT)} A${UNIT} ${UNIT} 0 0 1 ${polar(a2, UNIT)} Z`;

/** Static gradients/clips: memoised so per-frame renders only touch transforms and opacities. */
const RayDefs = React.memo(() => (
  <defs>
    <clipPath id="ovr-left" clipPathUnits="userSpaceOnUse">
      <polygon points={LEFT_CLIP} />
    </clipPath>
    <clipPath id="ovr-right" clipPathUnits="userSpaceOnUse">
      <polygon points={RIGHT_CLIP} />
    </clipPath>
    <radialGradient id="ovr-vlit" gradientUnits="userSpaceOnUse" cx={PIVOT_PATH.x} cy={PIVOT_PATH.y} r={420}>
      <stop offset="0%" stopColor="#FFFDF4" />
      <stop offset="45%" stopColor="#FFEB8A" />
      <stop offset="100%" stopColor={GOLD} />
    </radialGradient>
    <radialGradient id="ovr-wedge" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={UNIT}>
      <stop offset="0%" stopColor={WARM} stopOpacity={0.95} />
      <stop offset="7%" stopColor="#FFE6B0" stopOpacity={0.7} />
      <stop offset="26%" stopColor="#FFCB6E" stopOpacity={0.3} />
      <stop offset="58%" stopColor={AMBER} stopOpacity={0.1} />
      <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="ovr-blade" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={UNIT} y2={0}>
      <stop offset="0%" stopColor="#FFFEF6" />
      <stop offset="28%" stopColor="#FFE680" stopOpacity={0.9} />
      <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="ovr-flare">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="18%" stopColor="#FFF4C4" stopOpacity={0.8} />
      <stop offset="55%" stopColor={GOLD} stopOpacity={0.18} />
      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
    </radialGradient>
    <linearGradient id="ovr-streak" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={GOLD} stopOpacity={0} />
      <stop offset="50%" stopColor="#FFF8DC" />
      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
    </linearGradient>
    <radialGradient id="ovr-bloom">
      <stop offset="0%" stopColor={AMBER} stopOpacity={0.32} />
      <stop offset="45%" stopColor={AMBER} stopOpacity={0.08} />
      <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
    </radialGradient>
  </defs>
));

/** One arm of the V, lit: halo strokes under the asset's own path, clipped to its side of the split line. */
const LitArm = React.memo(({ side }: { side: "left" | "right" }) => (
  <g clipPath={`url(#ovr-${side})`}>
    <g transform={V_PATH_TRANSFORM}>
      <path d={V_PATH} fill="none" stroke={AMBER} strokeOpacity={0.08} strokeWidth={46} strokeLinejoin="round" />
      <path d={V_PATH} fill="none" stroke={GOLD} strokeOpacity={0.2} strokeWidth={18} strokeLinejoin="round" />
      <path d={V_PATH} fill="url(#ovr-vlit)" />
    </g>
  </g>
));

/** A tapered light blade along +x, `len` local units long. */
const Blade: React.FC<{ angle: number; len: number; w: number; opacity: number }> = ({ angle, len, w, opacity }) => (
  <g transform={`rotate(${angle}) scale(${len / UNIT} 1)`} opacity={opacity}>
    <polygon points={`0,${-w} ${UNIT},${-w * 0.08} ${UNIT},${w * 0.08} 0,${w}`} fill="url(#ovr-blade)" />
  </g>
);

export const OpenVlabLogoRay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // Phase envelopes (seconds).
  const intro = interpolate(t, [0, 1.45], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const fadeIn = interpolate(t, [0, 0.75], [0, 1], { ...CLAMP, easing: SOFT_IN });
  const ignite = interpolate(t, [1.0, 1.42], [0, 1], { ...CLAMP, easing: EASE });
  const discOut = interpolate(t, [1.1, 1.62], [0, 1], { ...CLAMP, easing: EASE });
  const ring = interpolate(t, [1.12, 1.95], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const open = interpolate(t, [1.45, 2.4], [0, 1], { ...CLAMP, easing: EASE });
  const stretch = interpolate(t, [1.6, 2.6], [0, 1], { ...CLAMP, easing: EASE });
  const ray = interpolate(t, [1.72, 2.8], [0, 1], { ...CLAMP, easing: RAY_OUT });
  const wedgeOn = interpolate(t, [1.62, 2.15], [0, 1], { ...CLAMP, easing: EASE });
  const armsOut = interpolate(t, [2.15, 2.8], [0, 1], { ...CLAMP, easing: EASE });
  const flare = interpolate(t, [1.6, 2.25, 3.75], [0, 1, 0.78], { ...CLAMP, easing: EASE });
  const bloom = interpolate(t, [1.8, 2.9], [0, 1], { ...CLAMP, easing: EASE });
  const shimmer = Math.sin(t * 2.4);

  // World transform: logo space -> screen, hinged on the V's vertex.
  const k = 0.84 + 0.08 * intro + 0.14 * open;
  const restX = W / 2 + (PIVOT.x - LOGO_CENTER) * k;
  const restY = H / 2 + (PIVOT.y - LOGO_CENTER) * k;
  const px = restX + (VERTEX_END.x - restX) * open;
  const py = restY + (VERTEX_END.y - restY) * open;
  const rot = LIFT_DEG * open;
  const world = `translate(${px} ${py}) rotate(${rot}) scale(${k}) translate(${-PIVOT.x} ${-PIVOT.y})`;
  const worldCss = `translate(${px}px, ${py}px) rotate(${rot}deg) scale(${k}) translate(${-PIVOT.x}px, ${-PIVOT.y}px)`;

  const alpha = OPEN_DEG * open;
  const aL = ARM_ANGLE.left - alpha;
  const aR = ARM_ANGLE.right + alpha;
  const reach = interpolate(ray, [0, 1], [ARM_LEN.left, RAY_REACH]);
  // Each half of the V lengthens along its own arm and thins, so the logo strokes become the cone's edge rays.
  const sx = 1 + 5 * stretch;
  const sy = 1 - 0.6 * stretch;
  const armXform = (side: "left" | "right") =>
    `rotate(${side === "left" ? -alpha : alpha} ${PIVOT.x} ${PIVOT.y}) translate(${PIVOT.x} ${PIVOT.y}) rotate(${ARM_ANGLE[side]}) scale(${sx} ${sy}) rotate(${-ARM_ANGLE[side]}) translate(${-PIVOT.x} ${-PIVOT.y})`;
  const discOpacity = fadeIn * (1 - discOut);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,214,0,0.05) 0%, rgba(5,6,8,0) 70%)",
          opacity: fadeIn * (1 - bloom),
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          transformOrigin: "0 0",
          transform: worldCss,
          opacity: discOpacity,
          visibility: discOpacity > 0.001 ? "visible" : "hidden",
        }}
      >
        <BrandMark size={LOGO_SIZE} src={LOGO_SRC} glow={0.9 * (1 - discOut * 0.6)} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <RayDefs />

        <ellipse cx={px} cy={py - 380} rx={1300} ry={900} fill="url(#ovr-bloom)" opacity={bloom * (0.9 + 0.1 * shimmer)} />

        <g transform={world}>
          <circle
            cx={LOGO_CENTER}
            cy={LOGO_CENTER}
            r={206 + 120 * ring}
            fill="none"
            stroke="#FFE9A0"
            strokeWidth={2.5 / k}
            opacity={0.55 * (1 - ring) * Math.min(1, ring * 6)}
          />

          <g transform={`translate(${PIVOT.x} ${PIVOT.y})`}>
            <g opacity={wedgeOn}>
              <g transform={`scale(${reach / UNIT})`}>
                <path d={wedgePath(aL - 10, aR + 10)} fill="url(#ovr-wedge)" opacity={0.05} />
                <path d={wedgePath(aL - 6, aR + 6)} fill="url(#ovr-wedge)" opacity={0.08} />
                <path d={wedgePath(aL - 3, aR + 3)} fill="url(#ovr-wedge)" opacity={0.12} />
                <path d={wedgePath(aL - 1.2, aR + 1.2)} fill="url(#ovr-wedge)" opacity={0.18} />
                <path d={wedgePath(aL, aR)} fill="url(#ovr-wedge)" opacity={0.8 + 0.05 * shimmer} />
              </g>
              {INNER_RAYS.map((r, i) => {
                const on = interpolate(ray, [0.18 + r.d, 0.6 + r.d], [0, 1], CLAMP);
                const drift = 0.8 * Math.sin(t * 1.3 + i * 1.7);
                return (
                  <Blade key={i} angle={aL + (aR - aL) * r.f + drift} len={reach * r.len * on + 1} w={r.w} opacity={r.o * on} />
                );
              })}
            </g>
            <Blade angle={aL} len={reach} w={22} opacity={0.2 * wedgeOn} />
            <Blade angle={aR} len={reach * 1.04} w={22} opacity={0.2 * wedgeOn} />
            <Blade angle={aL} len={reach} w={5} opacity={wedgeOn} />
            <Blade angle={aR} len={reach * 1.04} w={5} opacity={wedgeOn} />
          </g>

          <g opacity={ignite * (1 - armsOut)}>
            <g transform={armXform("left")}>
              <LitArm side="left" />
            </g>
            <g transform={armXform("right")}>
              <LitArm side="right" />
            </g>
          </g>
        </g>

        <g opacity={flare}>
          <circle cx={px} cy={py} r={150 + 12 * shimmer} fill="url(#ovr-flare)" opacity={0.75} />
          <rect x={px - 520} y={py - 2} width={1040} height={4} rx={2} fill="url(#ovr-streak)" opacity={0.55} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
