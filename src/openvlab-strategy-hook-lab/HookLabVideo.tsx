import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { MONO, SANS } from "../shared/fonts";
import { S0, X_HALF } from "./data";
import { HookScene, HookState } from "./scene";
import { F, FPS, H, TOTAL, W, cameraAt, clamp01, ramp, smooth, stateAt } from "./timeline";

export { FPS, H, TOTAL, W };

const YELLOW = "#f4b400";
const THIN = '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC Light", "Noto Sans SC", "Noto Sans CJK SC", sans-serif';

const Canvas: React.FC<{ state: HookState }> = ({ state }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<HookScene | null>(null);
  useLayoutEffect(() => {
    const s = new HookScene(ref.current!, W, H);
    sceneRef.current = s;
    return () => {
      s.dispose();
      sceneRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    s.update(state);
    s.render();
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />;
};

const projectCam = new THREE.PerspectiveCamera(30, W / H, 0.1, 120);
const project = (f: number, p: THREE.Vector3) => {
  const c = cameraAt(f);
  projectCam.position.copy(c.pos);
  projectCam.quaternion.copy(c.quat);
  projectCam.fov = c.fov;
  projectCam.updateProjectionMatrix();
  projectCam.updateMatrixWorld();
  const v = p.clone().project(projectCam);
  return { x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H };
};

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const NOISE = (() => {
  if (typeof document === "undefined") return "";
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const d = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(hash(i + 1) * 255);
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v;
    d.data[i * 4 + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c.toDataURL("image/png");
})();

/** thin caption with an upward mask reveal */
const Caption: React.FC<{ f: number; a: number; b: number; children: string }> = ({ f, a, b, children }) => {
  const inP = ramp(f, a, a + 26, (t) => 1 - Math.pow(1 - t, 3));
  const outP = ramp(f, b - 18, b);
  if (inP <= 0 || outP >= 1) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 112, display: "flex", justifyContent: "center", opacity: 1 - outP }}>
      <div style={{ overflow: "hidden", padding: "6px 4px" }}>
        <div
          style={{
            fontFamily: THIN,
            fontWeight: 200,
            fontSize: 25,
            letterSpacing: `${0.46 - 0.06 * inP}em`,
            color: "rgba(236,238,242,0.86)",
            transform: `translateY(${(1 - inP) * 120}%)`,
            paddingLeft: "0.46em",
            textShadow: "0 0 18px rgba(0,0,0,0.85)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export const HookLabVideo: React.FC = () => {
  const { fps } = useVideoConfig();
  const f = (useCurrentFrame() * FPS) / fps;
  const state = useMemo(() => stateAt(f), [f]);

  /* hairline overlay (glow + label) lives at the projected line */
  const hl = project(f, new THREE.Vector3(0, 0, 0));
  const hairP = ramp(f, F.hairIn[0], F.hairIn[1], (t) => 1 - Math.pow(1 - t, 3));
  const hairFade = 1 - ramp(f, F.reveal[0] + 30, F.reveal[1] + 20) * 0.8;
  const hairGlow = f < F.reveal[1] + 40 ? hairP * hairFade : 0;
  const lx = project(f, new THREE.Vector3(-X_HALF, 0, 0));
  const labelO = ramp(f, F.label[0], F.label[1]) * (1 - ramp(f, F.reveal[0] + 20, F.reveal[0] + 70));

  const impactT = f - F.impact;
  const flash = impactT >= 0 ? Math.exp(-impactT / 7) * 0.38 + Math.exp(-impactT / 22) * 0.07 : 0;
  const whip = Math.sin(Math.PI * clamp01((f - F.whip[0]) / (F.whip[1] - F.whip[0])));
  const black = ramp(f, F.black[0], F.black[1]);
  const titleP = ramp(f, F.title[0], F.title[0] + 36, (t) => 1 - Math.pow(1 - t, 3));
  const fadeIn = ramp(f, 0, 6);

  const grainShift = Math.floor(f) * 37;
  const tilt = "linear-gradient(to bottom, #000 0%, transparent 16%, transparent 84%, #000 100%)";

  return (
    <AbsoluteFill style={{ background: "#000", fontFamily: SANS, overflow: "hidden" }}>
      {/* cold, very faint volumetric haze behind the glass */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 46% at 50% ${48 - 6 * smooth((f - 100) / 150)}%, rgba(120,128,140,${0.075 * ramp(f, 60, 180)}) 0%, rgba(60,66,76,${0.03 * ramp(f, 60, 180)}) 45%, transparent 75%), radial-gradient(40% 30% at 62% 64%, rgba(244,180,0,${0.028 * ramp(f, 100, 240)}) 0%, transparent 70%)`,
        }}
      />
      <div style={{ position: "absolute", inset: 0, filter: whip > 0.02 ? `blur(${whip * 9}px)` : undefined, opacity: fadeIn * (1 - black) }}>
        <Canvas state={state} />
      </div>

      {/* hairline glow + label */}
      {hairGlow > 0.01 && (
        <>
          <div
            style={{
              position: "absolute",
              left: W / 2 - 1100 * hairP,
              width: 2200 * hairP,
              top: hl.y - 1,
              height: 2,
              background: `linear-gradient(90deg, transparent, rgba(255,236,180,${0.9 * hairGlow}) 30%, rgba(255,246,220,${hairGlow}) 50%, rgba(255,236,180,${0.9 * hairGlow}) 70%, transparent)`,
              filter: "blur(1.5px)",
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: W / 2 - 700 * hairP,
              width: 1400 * hairP,
              top: hl.y - 26,
              height: 52,
              background: `radial-gradient(50% 50% at 50% 50%, rgba(244,180,0,${0.14 * hairGlow}), transparent 70%)`,
              filter: "blur(10px)",
            }}
          />
        </>
      )}
      {labelO > 0.01 && (
        <div
          style={{
            position: "absolute",
            left: Math.max(24, lx.x) + 6,
            top: hl.y + 16,
            fontFamily: MONO,
            fontSize: 12,
            letterSpacing: "0.22em",
            color: "rgba(214,218,224,0.62)",
            opacity: labelO,
          }}
        >
          {`IM2611  ${S0.toFixed(1)}`}
        </div>
      )}

      <Caption f={f} a={F.cap1[0]} b={F.cap1[1]}>
        价格，一动没动。
      </Caption>
      <Caption f={f} a={F.cap2[0]} b={F.cap2[1]}>
        它却一路往下。
      </Caption>

      {/* impact flash */}
      {flash > 0.005 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(55% 55% at 50% 52%, rgba(255,214,96,${flash}) 0%, rgba(244,180,0,${flash * 0.45}) 40%, transparent 78%)`,
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* depth-of-field stand-in: soft tilt-shift at the top/bottom edges */}
      <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(7px)", WebkitMaskImage: tilt, maskImage: tilt, pointerEvents: "none", opacity: 1 - black }} />
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
      {/* film grain */}
      {NOISE && (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${NOISE})`,
            backgroundPosition: `${(grainShift * 13) % 256}px ${(grainShift * 29) % 256}px`,
            opacity: 0.035,
            mixBlendMode: "overlay",
            pointerEvents: "none",
          }}
        />
      )}

      {/* title */}
      {titleP > 0.002 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div style={{ overflow: "hidden", padding: "14px 10px" }}>
            <div
              style={{
                fontFamily: THIN,
                fontWeight: 200,
                fontSize: 60,
                letterSpacing: `${0.34 - 0.1 * titleP - 0.02 * clamp01((f - F.title[0]) / 52)}em`,
                paddingLeft: "0.3em",
                color: "rgba(244,245,247,0.94)",
                opacity: titleP,
                transform: `translateY(${(1 - titleP) * 46}%)`,
                filter: titleP < 1 ? `blur(${(1 - titleP) * 6}px)` : undefined,
                whiteSpace: "nowrap",
              }}
            >
              一秒之后，不只是少了一秒。
            </div>
          </div>
          <div style={{ position: "absolute", left: W / 2 - 14 * titleP, width: 28 * titleP, top: H / 2 + 62, height: 1.5, background: YELLOW, opacity: 0.85 * titleP }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
