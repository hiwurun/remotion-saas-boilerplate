import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Camera } from "../../shared/components/Camera";
import { Caption } from "../components/Caption";
import { ClickSfx } from "../components/ClickSfx";
import { MetricsBar } from "../components/MetricsBar";
import { Panel } from "../components/Panel";
import { ProfitTable } from "../components/ProfitTable";
import { ATM_ROW, MODEL } from "../data";
import { H, W } from "../timeline";
import { BTN, LightStage } from "./LightStage";
import { Labels3D } from "./Labels3D";
import { SceneGL } from "./scene";
import { O, cam2d, clamp01, doorE, easeOutCubic, ramp, smooth, stateAt } from "./timeline";


const GLCanvas: React.FC<{ f: number; on: boolean }> = ({ f, on }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneGL | null>(null);
  useLayoutEffect(() => {
    const s = new SceneGL(ref.current!, W, H);
    sceneRef.current = s;
    return () => {
      s.dispose();
      sceneRef.current = null;
    };
  }, []);
  useLayoutEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    const c = ref.current!;
    if (!on) {
      s.renderer.clear();
      return;
    }
    s.update(stateAt(f));
    s.render();
    void c;
  });
  return <canvas ref={ref} width={W} height={H} style={{ position: "absolute", inset: 0, width: W, height: H }} />;
};

/** The opening: light title card + liquid-glass Play -> click -> split -> 3D P&L surface -> impact -> flatten into the REAL table -> app shell. */
export const Opening: React.FC<{ f: number; debug?: string }> = ({ f, debug = "" }) => {
  const E = doorE(f); // 0..1 monotone, single-peak velocity
  const gap = E * 990;
  const tilt = 10 * 4 * E * (1 - E); // degrees of perspective, 0 at both ends
  const lightOn = f < O.split[1] + 4 && debug !== "3d" && debug !== "dom";
  const glOn = f >= O.press - 12 && debug !== "dom" && f < O.handoff[1] + 30 && debug !== "light";
  const shade = 0.14 * Math.pow(1 - E, 1.3);
  // v6: the tear starts at the pill's own seam and runs up and down to the frame edges; outside its reach the stage is still whole
  const seamU = ramp(f, O.seam[0], O.seam[1], (t) => t * t);
  const ext = seamU >= 1 ? H : 4 + (BTN.h / 2 + 8 - 4) * clamp01(seamU * 4) + Math.max(0, seamU - 0.25) / 0.75 * (H - BTN.h / 2);
  const sTop = Math.max(0, BTN.cy - ext);
  const sBot = Math.min(H, BTN.cy + ext);
  const seamOp = ramp(f, O.seam[0], O.seam[0] + 4);

  const vign = 0.9 * (1 - ramp(f, O.impact + 20, O.impact + 80));

  // real app (DOM) layer
  const ho = ramp(f, O.handoff[0], O.handoff[1]);
  const camS = cam2d(f);
  const textP = (r: number, c: number) => ramp(f, O.chrome[0] + (r + c) * 0.5, O.chrome[0] + 22 + (r + c) * 0.5);
  // no fade-out any more: the last frame is identical to the table walk-through's first frame (AppStage takes over at HOOK)
  const domOp = debug === "3d" || debug === "light" ? 0 : debug === "dom" ? 1 : ho;
  const canvasOp = debug === "dom" ? 0 : 1;

  return (
    <AbsoluteFill style={{ background: "#080a0f", overflow: "hidden" }}>
      {/* Play pill: mouse down at O.press */}
      <ClickSfx at={O.press} />

      {/* 3D layer (behind the halves) */}
      <div style={{ position: "absolute", inset: 0, opacity: canvasOp, transform: `scale(${1 + 0.08 * (1 - E)})`, transformOrigin: "50% 50%", filter: E < 1 ? `brightness(${0.85 + 0.15 * E})` : undefined }}>
        <AbsoluteFill style={{ background: "radial-gradient(70% 55% at 50% 48%, rgba(86,112,160,0.34), rgba(10,14,22,0.0) 74%)", opacity: 1 - ramp(f, O.impact + 16, O.impact + 72) }} />
        <GLCanvas f={f} on={glOn} />
        {vign > 0.01 && <AbsoluteFill style={{ background: `radial-gradient(75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,${vign * 0.55}) 100%)` }} />}
      </div>

      {/* before the door starts: ONE un-split light stage (two clipped halves would leave an anti-aliased dark hairline at x=960) */}
      {lightOn && f < O.split[0] && <LightStage f={f} />}
      {/* the seam itself, before the halves move: a fine light hairline growing out of the pill */}
      {lightOn && f >= O.seam[0] && f < O.split[0] && (
        <>
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 - 1.5, width: 3, background: "rgba(40,58,90,0.22)", opacity: seamOp }} />
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 - 0.75, width: 1.5, background: "rgba(250,252,255,0.98)", opacity: seamOp }} />
        </>
      )}
      {/* outside the seam's reach the stage is still whole: an un-split copy fills the opening gap there (beneath the halves) */}
      {lightOn && f >= O.split[0] && (sTop > 0 || sBot < H) && (
        <>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0px ${W / 2 - gap - 14}px ${H - sTop}px ${W / 2 - gap - 14}px)` }}>
            <LightStage f={f} />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(${sBot}px ${W / 2 - gap - 14}px 0px ${W / 2 - gap - 14}px)` }}>
            <LightStage f={f} />
          </div>
        </>
      )}

      {/* soft light in the crack + shadows cast by the two doors onto the 3D scene behind */}
      {lightOn && f >= O.split[0] && E < 0.999 && (
        <>
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 - gap, width: 170, background: `linear-gradient(90deg, rgba(0,0,0,${shade}), rgba(0,0,0,0))` }} />
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 + gap - 170, width: 170, background: `linear-gradient(270deg, rgba(0,0,0,${shade}), rgba(0,0,0,0))` }} />
        </>
      )}

      {/* the two light halves: spring-out slide with a slight perspective tilt */}
      {lightOn && f >= O.split[0] && (
        <div style={{ position: "absolute", inset: 0, perspective: 2600, perspectiveOrigin: "50% 50%" }}>
          <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 50% 0 0)", transformOrigin: "0% 50%", transform: `translateX(${-gap}px) rotateY(${tilt}deg) scale(${1 + 0.007 * tilt})`, filter: `brightness(${1 - 0.12 * E})`, willChange: "transform" }}>
            <LightStage f={f} />
          </div>
          <div style={{ position: "absolute", inset: 0, clipPath: "inset(0 0 0 50%)", transformOrigin: "100% 50%", transform: `translateX(${gap}px) rotateY(${-tilt}deg) scale(${1 + 0.007 * tilt})`, filter: `brightness(${1 - 0.12 * E})`, willChange: "transform" }}>
            <LightStage f={f} />
          </div>
        </div>
      )}

      {/* the crack itself: a luminous white-blue line (drawn above the halves so nothing can dim it) */}
      {lightOn && f >= O.split[0] && E < 0.999 && (
        <>
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 - gap - 1.5, width: 3, background: "rgba(246,250,255,0.95)", opacity: Math.pow(1 - E, 1.1) }} />
          <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 + gap - 1.5, width: 3, background: "rgba(246,250,255,0.95)", opacity: Math.pow(1 - E, 1.1) }} />
        <div style={{ position: "absolute", top: sTop, height: sBot - sTop, left: W / 2 - Math.max(0.75, gap), width: Math.max(1.5, 2 * gap), background: "rgba(246,250,255,0.96)", opacity: clamp01((0.04 - E) / 0.025) }} />
        </>
      )}

      {/* background settles to the app's pure black so the hand-off to the walk-through is seamless */}
      <AbsoluteFill style={{ background: "#000", opacity: ramp(f, O.chrome[0], O.out[1] - 6) }} />

      {/* the REAL app, sharing the exact camera of the flat 3D plane */}
      {domOp > 0.001 && (
        <div style={{ position: "absolute", inset: 0, opacity: domOp, }}>
          <Camera state={camS} width={W} height={H}>
            <Panel op={1} titleOp={ramp(f, O.chrome[0] + 30, O.chrome[0] + 70)} toggleOp={ramp(f, O.chrome[0] + 14, O.chrome[0] + 44)}>
              <MetricsBar model={MODEL} reveal={(i) => ramp(f, O.chrome[0] + 6 + i * 2, O.chrome[0] + 28 + i * 2, easeOutCubic)} count={ramp(f, O.chrome[0] + 8, O.chrome[0] + 56)} beSep=" · " staticKeys={["be"]} />
              <ProfitTable
                model={MODEL}
                fx={(r, c) => {
                  // current-underlying (ATM 6550) row lit like the walk-through (primary/20), swept in left→right, held into AppStage
                  const hl = r === ATM_ROW ? ramp(f, O.handoff[0] + 4 + c * 0.9, O.handoff[0] + 26 + c * 0.9) : 0;
                  return { op: 1, text: textP(r, c), light: hl }; // same look as the walk-through's lit ATM row
                }}
                headerOp={(c) => ramp(f, O.chrome[0] + c * 1.5, O.chrome[0] + 24 + c * 1.5)}
                lineP={ramp(f, O.chrome[0] + 20, O.chrome[0] + 70)}
              />
            </Panel>
          </Camera>
        </div>
      )}

      {/* v6: what the picture means — axes + the point's own number */}
      {debug !== "dom" && debug !== "light" && <Labels3D f={f} />}

      {/* captions */}
      <Caption text="价格停在 6550，一动没动。" p={ramp(f, O.cap1[0], O.cap1[0] + 26) * (1 - ramp(f, O.cap1[1] - 18, O.cap1[1]))} y={940} />
      <Caption text="这个组合却从 −739 亏到 −37,260。" p={ramp(f, O.cap2[0], O.cap2[0] + 26) * (1 - ramp(f, O.cap2[1] - 14, O.cap2[1]))} y={940} />
      <Caption text="钱是哪几天亏掉的？回到第一天。" p={ramp(f, O.cap3[0], O.cap3[0] + 26) * (1 - ramp(f, O.cap3[1] - 18, O.cap3[1]))} y={980} />

    </AbsoluteFill>
  );
};
export { clamp01, smooth };
